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

function createCard() {
  const crypto = document.getElementById('crypto').value;
  const fiat = document.getElementById('fiat').value;
  const amount = parseFloat(document.getElementById('amount').value);

  if (isNaN(amount) || amount <= 0) {
    tg.showAlert('Enter a positive amount');
    return;
  }

  loader.classList.remove('hidden');

  setTimeout(() => {
    const payload = JSON.stringify({
      action: 'create_card',
      crypto,
      fiat,
      amount
    });

    console.log('Sending to bot:', payload);
    tg.sendData(payload);

    loader.innerHTML = '<div class="success">Card created! Check chat with bot.</div>';
    setTimeout(() => tg.close(), 1500);
  }, 2000);
}
function updateLabels() {
  const direction = document.getElementById('direction').value;
  const sourceLabel = document.getElementById('source-label');
  const targetLabel = document.getElementById('target-label');
  const amountLabel = document.getElementById('amount-label');
  const rateInfo = document.getElementById('rate-info');

  if (direction === 'crypto_to_fiat') {
    sourceLabel.textContent = 'Source Crypto';
    targetLabel.textContent = 'Target Fiat';
    amountLabel.textContent = 'Amount in Crypto';
    rateInfo.textContent = ''; // можно добавить реальный курс позже
  } else {
    sourceLabel.textContent = 'Source Fiat';
    targetLabel.textContent = 'Target Crypto';
    amountLabel.textContent = 'Amount in Fiat';
    rateInfo.textContent = '';
  }
}

function deposit() {
  const direction = document.getElementById('direction').value;
  const source = document.getElementById('source').value;
  const target = document.getElementById('target').value;
  const amount = parseFloat(document.getElementById('amount').value);

  if (isNaN(amount) || amount <= 0) {
    tg.showAlert('Enter a positive amount');
    return;
  }

  // Фейковый адрес
  const fakeAddress = source + '1Fake' + Math.random().toString(36).substring(2, 15);

  document.getElementById('deposit-address').textContent = fakeAddress;
  document.getElementById('deposit-result').classList.remove('hidden');
}

function simulateDeposit() {
  const amount = parseFloat(document.getElementById('amount').value);
  const target = document.getElementById('target').value;

  // Фейковый баланс (можно сделать умнее позже)
  const balance = amount * 0.0001; // условно для крипты или наоборот

  document.getElementById('balance-text').textContent = balance.toFixed(8) + ' ' + target;
  document.getElementById('balance-result').classList.remove('hidden');
}

// Инициализация при загрузке
updateLabels();