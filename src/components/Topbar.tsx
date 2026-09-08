import { Bell, Search } from 'lucide-react';

export function Topbar() {
  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={16} />
        <input aria-label="Pesquisar" placeholder="Pesquisar perfis e proxies..." />
        <kbd>Ctrl K</kbd>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" title="Notificações" aria-label="Notificações" onClick={() => window.alert('Nenhuma notificação nova.')}><Bell size={17} /></button>
        <span className="connection-state"><i /> Desktop conectado</span>
      </div>
    </header>
  );
}
