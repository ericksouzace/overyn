# Overyn Desktop 0.4.0

Overyn é um aplicativo desktop para organizar perfis de navegação separados e configurações de rede individuais por perfil.

## Entregue na versão 0.4

- interface React + TypeScript em português;
- shell nativo Tauri 2 para Windows;
- criação, edição e remoção de perfis;
- diretório persistente de navegador separado para cada perfil;
- abertura e encerramento de Microsoft Edge, Google Chrome ou Brave;
- página inicial opcional por perfil;
- cadastro de proxies HTTP, HTTPS e SOCKS5;
- teste real de IP e latência pelo backend nativo;
- verificação de proxy antes da abertura do perfil;
- comportamento de falha fechada quando uma proxy configurada não responde;
- ponte local para SOCKS5 com ou sem usuário/senha;
- senha de proxy mantida somente na memória da sessão e excluída do armazenamento local e dos backups;
- site público em `website/` pronto para Vercel;
- workflow de validação e build do instalador NSIS no Windows;
- workflow de release por tag `v*` com publicação automática do `.exe` no GitHub Releases;
- configuração de GitHub Codespaces em `.devcontainer/`.

## Comportamento de rede

Quando um perfil possui proxy e a verificação está ativa, o navegador só é iniciado depois que a conexão configurada retorna um IP público válido. Não é adicionada uma regra de fallback direto ao navegador. SOCKS5 é encaminhado por uma ponte HTTP local do próprio Overyn para permitir autenticação sem colocar credenciais na linha de comando.

Em proxies HTTP/HTTPS autenticadas, o navegador Chromium pode solicitar as credenciais na primeira conexão. A senha não é salva em `localStorage`.

## Escopo

Overyn fornece separação de dados de sessão e configuração de rede. O projeto não implementa spoofing de fingerprint, invisibilidade, bypass de antifraude ou mecanismos destinados a contornar políticas de serviços externos.

## Desenvolvimento

Requisitos: Node.js 22+, npm 10+ e, para o desktop, Rust + pré-requisitos oficiais do Tauri.

```bash
npm ci
npm run dev
```

Validação web:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Desktop:

```bash
npm run tauri dev
```

## Instalador Windows

Pull requests e pushes executam `.github/workflows/windows-build.yml`. O artefato gerado é o instalador NSIS `.exe`.

Para publicar uma versão, crie uma tag como `v0.4.0`. O workflow `.github/workflows/release.yml` gera e anexa o instalador ao GitHub Releases. Os botões de download do site procuram automaticamente o `.exe` da release mais recente.

## Vercel

Use `website` como Root Directory, Framework Preset `Other`, sem Build Command e Output Directory `.`.
