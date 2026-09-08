use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    env,
    io::{self, Read, Write},
    net::{IpAddr, Shutdown, TcpListener, TcpStream},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
    time::{Duration, Instant},
};
use tauri::Manager;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProxyTestRequest {
    protocol: String,
    host: String,
    port: u16,
    username: Option<String>,
    password: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProxyTestResult {
    ok: bool,
    ip: Option<String>,
    latency_ms: Option<u64>,
    error: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LaunchProfileRequest {
    profile_id: String,
    start_url: Option<String>,
    proxy: Option<ProxyTestRequest>,
    verify_ip: bool,
    block_direct_fallback: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LaunchProfileResult {
    browser: String,
    pid: u32,
    proxy_ip: Option<String>,
    warning: Option<String>,
}

struct BrowserProcess {
    child: Child,
    bridge_stop: Option<Arc<AtomicBool>>,
}

#[derive(Default)]
struct AppState {
    processes: Mutex<HashMap<String, BrowserProcess>>,
}

fn validate_proxy_request(request: &ProxyTestRequest) -> Result<(), String> {
    match request.protocol.as_str() {
        "http" | "https" | "socks5" => {}
        _ => return Err("Protocolo de proxy não suportado.".into()),
    }
    if request.host.trim().is_empty() || request.host.len() > 253 {
        return Err("Host de proxy inválido.".into());
    }
    if request.host.chars().any(|c| c.is_whitespace() || matches!(c, '/' | '\\' | '@')) {
        return Err("Host de proxy contém caracteres inválidos.".into());
    }
    if request.port == 0 {
        return Err("Porta de proxy inválida.".into());
    }
    Ok(())
}

fn validate_profile_id(value: &str) -> Result<(), String> {
    if value.is_empty() || value.len() > 80 || !value.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err("Identificador de perfil inválido.".into());
    }
    Ok(())
}

fn validated_start_url(value: Option<&str>) -> Result<String, String> {
    let value = value.unwrap_or("about:blank").trim();
    if value.is_empty() || value == "about:blank" {
        return Ok("about:blank".into());
    }
    if value.starts_with("https://") || value.starts_with("http://") {
        return Ok(value.to_string());
    }
    Err("A página inicial precisa usar http:// ou https://.".into())
}

fn parse_host_port(value: &str, default_port: u16) -> Result<(String, u16), String> {
    let value = value.trim();
    if let Some(rest) = value.strip_prefix('[') {
        let end = rest.find(']').ok_or("Endereço IPv6 inválido.")?;
        let host = &rest[..end];
        let tail = &rest[end + 1..];
        let port = if tail.is_empty() { default_port } else { tail.strip_prefix(':').ok_or("Endpoint inválido.")?.parse().map_err(|_| "Porta inválida.")? };
        return Ok((host.to_string(), port));
    }
    if let Some((host, port)) = value.rsplit_once(':') {
        if !host.contains(':') {
            let parsed = port.parse::<u16>().map_err(|_| "Porta inválida.")?;
            return Ok((host.to_string(), parsed));
        }
    }
    Ok((value.to_string(), default_port))
}

fn socks5_connect(proxy: &ProxyTestRequest, target_host: &str, target_port: u16) -> Result<TcpStream, String> {
    validate_proxy_request(proxy)?;
    let mut stream = TcpStream::connect((proxy.host.as_str(), proxy.port)).map_err(|e| format!("Não foi possível conectar à proxy SOCKS5: {e}"))?;
    let timeout = Some(Duration::from_secs(12));
    stream.set_read_timeout(timeout).map_err(|e| e.to_string())?;
    stream.set_write_timeout(timeout).map_err(|e| e.to_string())?;

    let has_auth = proxy.username.as_deref().is_some_and(|v| !v.is_empty());
    let greeting: &[u8] = if has_auth { &[0x05, 0x02, 0x00, 0x02] } else { &[0x05, 0x01, 0x00] };
    stream.write_all(greeting).map_err(|e| e.to_string())?;
    let mut choice = [0u8; 2];
    stream.read_exact(&mut choice).map_err(|e| e.to_string())?;
    if choice[0] != 0x05 || choice[1] == 0xff {
        return Err("A proxy SOCKS5 recusou os métodos de autenticação disponíveis.".into());
    }
    if choice[1] == 0x02 {
        let username = proxy.username.as_deref().unwrap_or("").as_bytes();
        let password = proxy.password.as_deref().unwrap_or("").as_bytes();
        if username.len() > 255 || password.len() > 255 {
            return Err("Credenciais SOCKS5 muito longas.".into());
        }
        let mut auth = Vec::with_capacity(username.len() + password.len() + 3);
        auth.extend([0x01, username.len() as u8]);
        auth.extend(username);
        auth.push(password.len() as u8);
        auth.extend(password);
        stream.write_all(&auth).map_err(|e| e.to_string())?;
        let mut response = [0u8; 2];
        stream.read_exact(&mut response).map_err(|e| e.to_string())?;
        if response[1] != 0x00 {
            return Err("Usuário ou senha da proxy SOCKS5 foram recusados.".into());
        }
    }

    let mut request = vec![0x05, 0x01, 0x00];
    match target_host.parse::<IpAddr>() {
        Ok(IpAddr::V4(ip)) => { request.push(0x01); request.extend(ip.octets()); }
        Ok(IpAddr::V6(ip)) => { request.push(0x04); request.extend(ip.octets()); }
        Err(_) => {
            let bytes = target_host.as_bytes();
            if bytes.is_empty() || bytes.len() > 255 { return Err("Destino SOCKS5 inválido.".into()); }
            request.extend([0x03, bytes.len() as u8]);
            request.extend(bytes);
        }
    }
    request.extend(target_port.to_be_bytes());
    stream.write_all(&request).map_err(|e| e.to_string())?;

    let mut head = [0u8; 4];
    stream.read_exact(&mut head).map_err(|e| e.to_string())?;
    if head[0] != 0x05 || head[1] != 0x00 {
        return Err(format!("A proxy SOCKS5 recusou o destino (código {}).", head[1]));
    }
    match head[3] {
        0x01 => { let mut buf = [0u8; 4]; stream.read_exact(&mut buf).map_err(|e| e.to_string())?; }
        0x04 => { let mut buf = [0u8; 16]; stream.read_exact(&mut buf).map_err(|e| e.to_string())?; }
        0x03 => { let mut len = [0u8; 1]; stream.read_exact(&mut len).map_err(|e| e.to_string())?; let mut buf = vec![0u8; len[0] as usize]; stream.read_exact(&mut buf).map_err(|e| e.to_string())?; }
        _ => return Err("Resposta SOCKS5 inválida.".into()),
    }
    let mut port = [0u8; 2];
    stream.read_exact(&mut port).map_err(|e| e.to_string())?;
    Ok(stream)
}

fn test_socks_ip(proxy: &ProxyTestRequest) -> Result<String, String> {
    let mut stream = socks5_connect(proxy, "api.ipify.org", 80)?;
    stream.write_all(b"GET /?format=json HTTP/1.1\r\nHost: api.ipify.org\r\nConnection: close\r\n\r\n").map_err(|e| e.to_string())?;
    let mut bytes = Vec::new();
    stream.read_to_end(&mut bytes).map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&bytes);
    let body = text.split_once("\r\n\r\n").map(|(_, body)| body).ok_or("Resposta inválida no teste de IP.")?;
    let payload: serde_json::Value = serde_json::from_str(body.trim()).map_err(|e| format!("Resposta de IP inválida: {e}"))?;
    payload.get("ip").and_then(serde_json::Value::as_str).map(str::to_string).ok_or("IP não encontrado na resposta.".into())
}

async fn execute_proxy_test(request: ProxyTestRequest) -> ProxyTestResult {
    if let Err(error) = validate_proxy_request(&request) {
        return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(error) };
    }
    let started = Instant::now();
    if request.protocol == "socks5" {
        let result = tauri::async_runtime::spawn_blocking(move || test_socks_ip(&request)).await;
        return match result {
            Ok(Ok(ip)) => ProxyTestResult { ok: true, ip: Some(ip), latency_ms: Some(started.elapsed().as_millis() as u64), error: None },
            Ok(Err(error)) => ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(error) },
            Err(error) => ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(format!("Falha no teste SOCKS5: {error}")) },
        };
    }

    let proxy_url = format!("{}://{}:{}", request.protocol, request.host, request.port);
    let mut proxy = match reqwest::Proxy::all(&proxy_url) {
        Ok(proxy) => proxy,
        Err(error) => return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(format!("Proxy inválida: {error}")) },
    };
    if let Some(username) = request.username.as_deref().filter(|v| !v.is_empty()) {
        proxy = proxy.basic_auth(username, request.password.as_deref().unwrap_or(""));
    }
    let client = match reqwest::Client::builder().proxy(proxy).timeout(Duration::from_secs(12)).build() {
        Ok(client) => client,
        Err(error) => return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(format!("Não foi possível preparar a conexão: {error}")) },
    };
    let response = match client.get("https://api.ipify.org?format=json").send().await {
        Ok(response) => response,
        Err(error) => return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(format!("A proxy não respondeu: {error}")) },
    };
    if !response.status().is_success() {
        return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(format!("Teste retornou HTTP {}.", response.status())) };
    }
    let payload: serde_json::Value = match response.json().await {
        Ok(payload) => payload,
        Err(error) => return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(format!("Resposta de IP inválida: {error}")) },
    };
    let ip = payload.get("ip").and_then(serde_json::Value::as_str).map(str::to_string);
    ProxyTestResult { ok: ip.is_some(), ip, latency_ms: Some(started.elapsed().as_millis() as u64), error: if ip.is_some() { None } else { Some("IP não encontrado na resposta.".into()) } }
}

fn read_http_request(stream: &mut TcpStream) -> Result<(Vec<u8>, usize), String> {
    let mut data = Vec::with_capacity(4096);
    let mut buf = [0u8; 4096];
    loop {
        let count = stream.read(&mut buf).map_err(|e| e.to_string())?;
        if count == 0 { return Err("Conexão local encerrada antes do cabeçalho HTTP.".into()); }
        data.extend_from_slice(&buf[..count]);
        if let Some(index) = data.windows(4).position(|w| w == b"\r\n\r\n") { return Ok((data, index + 4)); }
        if data.len() > 64 * 1024 { return Err("Cabeçalho HTTP local excedeu o limite.".into()); }
    }
}

fn tunnel(mut client: TcpStream, mut upstream: TcpStream) -> Result<(), String> {
    client.set_read_timeout(None).map_err(|e| e.to_string())?;
    upstream.set_read_timeout(None).map_err(|e| e.to_string())?;
    let mut client_read = client.try_clone().map_err(|e| e.to_string())?;
    let mut upstream_write = upstream.try_clone().map_err(|e| e.to_string())?;
    let forward = thread::spawn(move || {
        let _ = io::copy(&mut client_read, &mut upstream_write);
        let _ = upstream_write.shutdown(Shutdown::Write);
    });
    let _ = io::copy(&mut upstream, &mut client);
    let _ = client.shutdown(Shutdown::Write);
    let _ = forward.join();
    Ok(())
}

fn handle_socks_bridge_client(mut client: TcpStream, proxy: &ProxyTestRequest) -> Result<(), String> {
    client.set_read_timeout(Some(Duration::from_secs(20))).map_err(|e| e.to_string())?;
    let (data, header_end) = read_http_request(&mut client)?;
    let header = String::from_utf8_lossy(&data[..header_end]);
    let mut lines = header.split("\r\n");
    let first = lines.next().ok_or("Requisição HTTP vazia.")?;
    let mut first_parts = first.split_whitespace();
    let method = first_parts.next().ok_or("Método HTTP ausente.")?;
    let target = first_parts.next().ok_or("Destino HTTP ausente.")?;
    let version = first_parts.next().unwrap_or("HTTP/1.1");

    if method.eq_ignore_ascii_case("CONNECT") {
        let (host, port) = parse_host_port(target, 443)?;
        let mut upstream = socks5_connect(proxy, &host, port)?;
        client.write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n").map_err(|e| e.to_string())?;
        if data.len() > header_end { upstream.write_all(&data[header_end..]).map_err(|e| e.to_string())?; }
        return tunnel(client, upstream);
    }

    let (host, port, path) = if let Some(rest) = target.strip_prefix("http://") {
        let (authority, path) = rest.split_once('/').map(|(a, p)| (a, format!("/{p}"))).unwrap_or((rest, "/".into()));
        let (host, port) = parse_host_port(authority, 80)?;
        (host, port, path)
    } else {
        let host_line = header.lines().find(|line| line.to_ascii_lowercase().starts_with("host:")).ok_or("Cabeçalho Host ausente.")?;
        let (host, port) = parse_host_port(host_line.split_once(':').map(|(_, v)| v.trim()).unwrap_or(""), 80)?;
        (host, port, target.to_string())
    };
    let mut upstream = socks5_connect(proxy, &host, port)?;
    let mut rewritten = format!("{method} {path} {version}\r\n");
    for line in lines {
        if line.is_empty() { continue; }
        if line.to_ascii_lowercase().starts_with("proxy-connection:") { continue; }
        rewritten.push_str(line);
        rewritten.push_str("\r\n");
    }
    rewritten.push_str("\r\n");
    upstream.write_all(rewritten.as_bytes()).map_err(|e| e.to_string())?;
    if data.len() > header_end { upstream.write_all(&data[header_end..]).map_err(|e| e.to_string())?; }
    tunnel(client, upstream)
}

fn start_socks_bridge(proxy: ProxyTestRequest) -> Result<(u16, Arc<AtomicBool>), String> {
    let listener = TcpListener::bind(("127.0.0.1", 0)).map_err(|e| format!("Não foi possível abrir a ponte local: {e}"))?;
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let stop = Arc::new(AtomicBool::new(false));
    let stop_thread = stop.clone();
    thread::spawn(move || {
        while !stop_thread.load(Ordering::Relaxed) {
            match listener.accept() {
                Ok((stream, _)) => {
                    let request = proxy.clone();
                    thread::spawn(move || { let _ = handle_socks_bridge_client(stream, &request); });
                }
                Err(error) if error.kind() == io::ErrorKind::WouldBlock => thread::sleep(Duration::from_millis(40)),
                Err(_) => break,
            }
        }
    });
    Ok((port, stop))
}

#[derive(Clone)]
struct BrowserInfo { name: &'static str, path: PathBuf }

fn push_if_exists(items: &mut Vec<BrowserInfo>, name: &'static str, path: PathBuf) {
    if path.is_file() { items.push(BrowserInfo { name, path }); }
}

#[cfg(target_os = "windows")]
fn browser_candidates() -> Vec<BrowserInfo> {
    let mut items = Vec::new();
    let pf = env::var_os("PROGRAMFILES").map(PathBuf::from);
    let pfx = env::var_os("PROGRAMFILES(X86)").map(PathBuf::from);
    let local = env::var_os("LOCALAPPDATA").map(PathBuf::from);
    for base in [pf.as_ref(), pfx.as_ref()].into_iter().flatten() {
        push_if_exists(&mut items, "Microsoft Edge", base.join("Microsoft/Edge/Application/msedge.exe"));
        push_if_exists(&mut items, "Google Chrome", base.join("Google/Chrome/Application/chrome.exe"));
        push_if_exists(&mut items, "Brave", base.join("BraveSoftware/Brave-Browser/Application/brave.exe"));
    }
    if let Some(base) = local.as_ref() {
        push_if_exists(&mut items, "Google Chrome", base.join("Google/Chrome/Application/chrome.exe"));
        push_if_exists(&mut items, "Microsoft Edge", base.join("Microsoft/Edge/Application/msedge.exe"));
        push_if_exists(&mut items, "Brave", base.join("BraveSoftware/Brave-Browser/Application/brave.exe"));
    }
    items
}

#[cfg(not(target_os = "windows"))]
fn browser_candidates() -> Vec<BrowserInfo> {
    let mut items = Vec::new();
    for (name, path) in [
        ("Google Chrome", "/usr/bin/google-chrome"),
        ("Chromium", "/usr/bin/chromium"),
        ("Chromium", "/usr/bin/chromium-browser"),
        ("Brave", "/usr/bin/brave-browser"),
    ] { push_if_exists(&mut items, name, PathBuf::from(path)); }
    items
}

fn find_browser() -> Result<BrowserInfo, String> {
    browser_candidates().into_iter().next().ok_or_else(|| "Nenhum navegador Chromium compatível foi encontrado. Instale Microsoft Edge, Google Chrome ou Brave.".into())
}

fn profile_data_dir(app: &tauri::AppHandle, profile_id: &str) -> Result<PathBuf, String> {
    let root = app.path().app_data_dir().map_err(|e| format!("Não foi possível localizar os dados do aplicativo: {e}"))?;
    let path = root.join("profiles").join(profile_id).join("browser-data");
    std::fs::create_dir_all(&path).map_err(|e| format!("Não foi possível criar os dados do perfil: {e}"))?;
    Ok(path)
}

fn stop_process(mut process: BrowserProcess) {
    if let Some(stop) = process.bridge_stop.take() { stop.store(true, Ordering::Relaxed); }
    let pid = process.child.id();
    #[cfg(target_os = "windows")]
    { let _ = Command::new("taskkill").args(["/PID", &pid.to_string(), "/T", "/F"]).stdout(Stdio::null()).stderr(Stdio::null()).status(); }
    let _ = process.child.kill();
    let _ = process.child.wait();
}

#[tauri::command]
async fn test_proxy_connection(request: ProxyTestRequest) -> ProxyTestResult {
    execute_proxy_test(request).await
}

#[tauri::command]
async fn launch_profile(app: tauri::AppHandle, state: tauri::State<'_, AppState>, request: LaunchProfileRequest) -> Result<LaunchProfileResult, String> {
    validate_profile_id(&request.profile_id)?;
    let start_url = validated_start_url(request.start_url.as_deref())?;

    {
        let mut processes = state.processes.lock().map_err(|_| "Estado interno indisponível.")?;
        if let Some(existing) = processes.get_mut(&request.profile_id) {
            if existing.child.try_wait().map_err(|e| e.to_string())?.is_none() { return Err("Este perfil já está em execução.".into()); }
            if let Some(old) = processes.remove(&request.profile_id) { if let Some(stop) = old.bridge_stop { stop.store(true, Ordering::Relaxed); } }
        }
    }

    let mut proxy_ip = None;
    if let Some(proxy) = request.proxy.clone() {
        if request.verify_ip || request.block_direct_fallback {
            let test = execute_proxy_test(proxy.clone()).await;
            if !test.ok { return Err(test.error.unwrap_or_else(|| "A proxy não passou na verificação de conectividade.".into())); }
            proxy_ip = test.ip;
        }
    }

    let browser = find_browser()?;
    let data_dir = profile_data_dir(&app, &request.profile_id)?;
    let mut command = Command::new(&browser.path);
    command
        .arg(format!("--user-data-dir={}", data_dir.to_string_lossy()))
        .arg("--no-first-run")
        .arg("--no-default-browser-check")
        .arg("--disable-background-networking")
        .arg("--disable-sync")
        .arg("--new-window");

    let mut bridge_stop = None;
    let mut warning = None;
    if let Some(proxy) = request.proxy.clone() {
        match proxy.protocol.as_str() {
            "socks5" => {
                let (port, stop) = start_socks_bridge(proxy)?;
                command.arg(format!("--proxy-server=http://127.0.0.1:{port}"));
                bridge_stop = Some(stop);
            }
            "http" | "https" => {
                command.arg(format!("--proxy-server={}://{}:{}", proxy.protocol, proxy.host, proxy.port));
                if proxy.username.as_deref().is_some_and(|v| !v.is_empty()) {
                    warning = Some("O navegador pode solicitar usuário e senha da proxy HTTP/HTTPS na primeira conexão.".into());
                }
            }
            _ => return Err("Protocolo de proxy não suportado.".into()),
        }
    }
    command.arg(start_url).stdout(Stdio::null()).stderr(Stdio::null());
    let child = command.spawn().map_err(|e| format!("Não foi possível abrir {}: {e}", browser.name))?;
    let pid = child.id();
    let mut processes = state.processes.lock().map_err(|_| "Estado interno indisponível.")?;
    processes.insert(request.profile_id, BrowserProcess { child, bridge_stop });
    Ok(LaunchProfileResult { browser: browser.name.into(), pid, proxy_ip, warning })
}

#[tauri::command]
fn stop_profile(state: tauri::State<'_, AppState>, profile_id: String) -> Result<bool, String> {
    validate_profile_id(&profile_id)?;
    let process = state.processes.lock().map_err(|_| "Estado interno indisponível.")?.remove(&profile_id);
    if let Some(process) = process { stop_process(process); Ok(true) } else { Ok(false) }
}

#[tauri::command]
fn profile_status(state: tauri::State<'_, AppState>, profile_id: String) -> Result<bool, String> {
    validate_profile_id(&profile_id)?;
    let mut processes = state.processes.lock().map_err(|_| "Estado interno indisponível.")?;
    let Some(process) = processes.get_mut(&profile_id) else { return Ok(false); };
    match process.child.try_wait().map_err(|e| e.to_string())? {
        None => Ok(true),
        Some(_) => {
            if let Some(mut ended) = processes.remove(&profile_id) { if let Some(stop) = ended.bridge_stop.take() { stop.store(true, Ordering::Relaxed); } }
            Ok(false)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![test_proxy_connection, launch_profile, stop_profile, profile_status])
        .run(tauri::generate_context!())
        .expect("error while running Overyn");
}

#[cfg(test)]
mod tests {
    use super::{parse_host_port, validate_profile_id, validate_proxy_request, validated_start_url, ProxyTestRequest};
    #[test]
    fn accepts_supported_proxy() {
        let request = ProxyTestRequest { protocol: "socks5".into(), host: "127.0.0.1".into(), port: 50101, username: None, password: None };
        assert!(validate_proxy_request(&request).is_ok());
    }
    #[test]
    fn rejects_unsafe_host() {
        let request = ProxyTestRequest { protocol: "http".into(), host: "host/path".into(), port: 8080, username: None, password: None };
        assert!(validate_proxy_request(&request).is_err());
    }
    #[test]
    fn validates_profile_and_url() {
        assert!(validate_profile_id("profile-01_ab").is_ok());
        assert!(validate_profile_id("../profile").is_err());
        assert!(validated_start_url(Some("https://example.com")).is_ok());
        assert!(validated_start_url(Some("file:///tmp/x")).is_err());
    }
    #[test]
    fn parses_proxy_targets() {
        assert_eq!(parse_host_port("example.com:443", 80).unwrap(), ("example.com".into(), 443));
        assert_eq!(parse_host_port("example.com", 80).unwrap(), ("example.com".into(), 80));
    }
}
