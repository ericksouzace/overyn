# Overyn runtime scope

O runtime do Overyn separa dados de sessão por perfil e permite configuração HTTP/HTTPS/SOCKS5 individual. Quando a verificação de rede está habilitada, a proxy precisa responder antes da abertura do navegador. O navegador é iniciado com QUIC desativado e política WebRTC para impedir UDP não roteado pela proxy.

Não há spoofing de fingerprint, invisibilidade, bypass de antifraude ou mecanismos destinados a contornar políticas de serviços externos.
