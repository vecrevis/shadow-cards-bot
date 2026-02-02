const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const splash = document.getElementById('splash');
const app = document.getElementById('app');
const progressBar = document.querySelector('.progress-bar');
const loader = document.getElementById('loader');

// Запускаем сплеш
if (splash && progressBar) {
  progressBar.style.width = '0%';
  setTimeout(() => {
    progressBar.style.width = '100%';
  }, 100);

  setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      if (app) {
        app.classList.remove('hidden');
      }
    }, 800);
  }, 3000); // 3 секунды сплеша
} else {
  console.error('Не найдены элементы splash или progress-bar');
}

// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tabId = tab.dataset.tab + '-tab';
    const content = document.getElementById(tabId);
    if (content) content.classList.add('active');
  });
});

// Создание карты
function createCard() {
  const crypto = document.getElementById('crypto')?.value;
  const fiat = document.getElementById('fiat')?.value;
  const amount = parseFloat(document.getElementById('amount')?.value);

  if (!crypto || !fiat || isNaN(amount) || amount <= 0) {
    tg.showAlert('Заполни все поля правильно');
    return;
  }

  if (loader) loader.classList.remove('hidden');

  setTimeout(() => {
    const payload = JSON.stringify({ action: 'create_card', crypto, fiat, amount });
    console.log('Отправляю данные:', payload);
    tg.sendData(payload);
  }, 2000);
}