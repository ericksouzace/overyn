# Overyn Desktop 0.4.0

Overyn é um aplicativo desktop para organizar perfis de navegação separados e configurações de rede individuais por perfil.

## O que já existe nesta versão

- interface desktop React + TypeScript;
- shell nativo Tauri 2;
- criação, edição e remoção de perfis;
- cadastro de proxies HTTP, HTTPS e SOCKS5;
- vínculo de proxy por perfil;
- teste de proxy no backend nativo, usando endpoint fixo de IP público;
- falha fechada no teste: se a proxy falhar, o teste não usa conexão direta como fallback;
- preferências de segurança armazenadas localmente;
- landing page em `website/` pronta para Vercel;
- workflow de build do instalador Windows no GitHub Actions.

## Limite atual

O runtime que abre um navegador real com armazenamento persistente e proxy por perfil será conectado em uma etapa separada. A interface desta versão não promete invisibilidade, spoofing de fingerprint ou bypass de mecanismos de terceiros.

## Desenvolvimento

```bash
npm ci
npm run dev
```

Validação:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Desktop Tauri:

```bash
npm run tauri dev
```

## Site

A landing page está em `website/`. Na Vercel, selecione `website` como Root Directory e use o preset `Other`.
