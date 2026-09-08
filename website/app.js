const modal = document.querySelector('#modal');
const title = document.querySelector('#modalTitle');
const text = document.querySelector('#modalText');

function openModal(t, m) {
  title.textContent = t;
  text.textContent = m;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

async function downloadLatest(button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Localizando instalador...';
  try {
    const response = await fetch('https://api.github.com/repos/ericksouzace/overyn/releases/latest', { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('release-not-found');
    const release = await response.json();
    const asset = release.assets?.find((item) => item.name.toLowerCase().endsWith('.exe')) || release.assets?.find((item) => item.name.toLowerCase().endsWith('.msi'));
    if (!asset?.browser_download_url) throw new Error('installer-not-found');
    window.location.href = asset.browser_download_url;
  } catch {
    openModal('Instalador em preparação', 'Ainda não há uma versão pública do instalador nesta página. O botão será liberado automaticamente quando a primeira versão do Overyn for publicada no GitHub Releases.');
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

document.querySelectorAll('.js-download').forEach((button) => button.addEventListener('click', () => { void downloadLatest(button); }));
document.querySelector('#requirements').addEventListener('click', () => openModal('Requisitos do sistema', 'Windows 10 ou 11 em 64 bits, Microsoft Edge, Google Chrome ou Brave instalado e conexão com a internet.'));
document.querySelector('#testProxy').addEventListener('click', () => { const status = document.querySelector('#proxyStatus'); status.textContent = '✓ Demonstração concluída — no desktop, o teste retorna IP e latência reais.'; status.classList.add('ok'); });
document.querySelector('#saveProxy').addEventListener('click', () => { const status = document.querySelector('#proxyStatus'); status.textContent = '✓ Configuração de demonstração salva.'; status.classList.add('ok'); });
document.querySelectorAll('.device button').forEach((button) => button.addEventListener('click', () => openModal('Preview do Overyn', `No aplicativo desktop, “${button.textContent.trim()}” é uma ação interativa.`)));
['#closeModal', '#modalOk'].forEach((selector) => document.querySelector(selector).addEventListener('click', closeModal));
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
