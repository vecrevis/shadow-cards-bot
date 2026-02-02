const tg = window.Telegram.WebApp;
tg.ready();
document.getElementById('startup').play().catch(() => {}); // автоплей часто блокируется, но иногда работает
tg.expand();

const splash = document.getElementById('splash');
const app = document.getElementById('app');
const progressBar = document.querySelector('.progress-bar');
const loader = document.getElementById('loader');

// Splash 3 секунды с более драматичным эффектом
setTimeout(() => {
  progressBar.style.width = '100%';
  setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      app.classList.remove('hidden');
    }, 800); // плавный fade-out
  }, 3000); // общая длительность сплеша 3 секунды
}, 100);

// Tabs switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
  });
});

function createCard() {
  const crypto = document.getElementById('crypto').value;
  const fiat = document.getElementById('fiat').value;
  const amount = parseFloat(document.getElementById('amount').value);

  if (isNaN(amount) || amount <= 0) {
    tg.showAlert('Введи положительную сумму');
    return;
  }

  loader.classList.remove('hidden');

  setTimeout(() => {
    const payload = JSON.stringify({ action: 'create_card', crypto, fiat, amount });
    console.log('Отправляю в бота:', payload); // ← для дебага в консоли браузера
    tg.sendData(payload);
    // НЕ закрывай аппку вручную — пусть Telegram сам закроет
  }, 2000);
}
