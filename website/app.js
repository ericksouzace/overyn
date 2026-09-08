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

document.querySelectorAll('.js-download').forEach((button) => {
  button.addEventListener('click', () => {
    openModal('Instalar Overyn', 'A página está pronta para receber o instalador. Assim que o build do Windows for publicado, este botão passará a baixar o .exe/.msi diretamente.');
  });
});

document.querySelector('#requirements').addEventListener('click', () => {
  openModal('Requisitos do sistema', 'Windows 10 ou 11 em 64 bits, conexão com a internet e aproximadamente 300 MB livres.');
});

document.querySelector('#testProxy').addEventListener('click', () => {
  const status = document.querySelector('#proxyStatus');
  status.textContent = '✓ Demonstração concluída — no desktop, o teste retorna IP e latência reais.';
  status.classList.add('ok');
});

document.querySelector('#saveProxy').addEventListener('click', () => {
  const status = document.querySelector('#proxyStatus');
  status.textContent = '✓ Configuração de demonstração salva.';
  status.classList.add('ok');
});

document.querySelectorAll('.device button').forEach((button) => {
  button.addEventListener('click', () => {
    openModal('Preview do Overyn', `No aplicativo desktop, “${button.textContent.trim()}” é uma ação interativa.`);
  });
});

['#closeModal', '#modalOk'].forEach((selector) => {
  document.querySelector(selector).addEventListener('click', closeModal);
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});
