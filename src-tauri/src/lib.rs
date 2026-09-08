use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

#[derive(Debug, Deserialize)]
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
    latency_ms: Option<u128>,
    error: Option<String>,
}

fn validate_proxy_request(request: &ProxyTestRequest) -> Result<(), String> {
    match request.protocol.as_str() {
        "http" | "https" | "socks5" => {}
        _ => return Err("Protocolo de proxy não suportado.".to_string()),
    }
    if request.host.trim().is_empty() || request.host.len() > 253 {
        return Err("Host de proxy inválido.".to_string());
    }
    if request.host.chars().any(|c| c.is_whitespace() || matches!(c, '/' | '\\' | '@')) {
        return Err("Host de proxy contém caracteres inválidos.".to_string());
    }
    if request.port == 0 {
        return Err("Porta de proxy inválida.".to_string());
    }
    Ok(())
}

#[tauri::command]
async fn test_proxy_connection(request: ProxyTestRequest) -> ProxyTestResult {
    if let Err(error) = validate_proxy_request(&request) {
        return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(error) };
    }
    let proxy_url = format!("{}://{}:{}", request.protocol, request.host, request.port);
    let mut proxy = match reqwest::Proxy::all(&proxy_url) {
        Ok(proxy) => proxy,
        Err(error) => return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(format!("Proxy inválida: {error}")) },
    };
    if let (Some(username), Some(password)) = (request.username.as_deref(), request.password.as_deref()) {
        if !username.is_empty() {
            proxy = proxy.basic_auth(username, password);
        }
    }
    let client = match reqwest::Client::builder().proxy(proxy).timeout(Duration::from_secs(12)).build() {
        Ok(client) => client,
        Err(error) => return ProxyTestResult { ok: false, ip: None, latency_ms: None, error: Some(format!("Não foi possível preparar a conexão: {error}")) },
    };
    let started = Instant::now();
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
    ProxyTestResult { ok: ip.is_some(), ip, latency_ms: Some(started.elapsed().as_millis()), error: None }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![test_proxy_connection])
        .run(tauri::generate_context!())
        .expect("error while running Overyn");
}

#[cfg(test)]
mod tests {
    use super::{validate_proxy_request, ProxyTestRequest};
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
}
