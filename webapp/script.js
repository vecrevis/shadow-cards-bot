const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const splash = document.getElementById('splash');
const app = document.getElementById('app');
const progressBar = document.querySelector('.progress-bar');
const loader = document.getElementById('loader');

// Сплеш
if (splash && progressBar) {
  setTimeout(() => { progressBar.style.width = '100%'; }, 100);
  setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      app.classList.remove('hidden');
    }, 800);
  }, 3000);
}

// Wizard
let direction = 'crypto_to_fiat';

function setDirection(dir) {
  direction = dir;
  document.getElementById('step1').classList.remove('active');
  document.getElementById('step2').classList.add('active');
  updateSourceOptions();
}

function updateSourceOptions() {
  const select = document.getElementById('source-currency');
  select.innerHTML = '';
  const options = direction === 'crypto_to_fiat' 
    ? ['BTC','ETH','USDT','SOL','TON']
    : ['USD','EUR','RUB','TRY','BRL'];
  options.forEach(opt => {
    const op = document.createElement('option');
    op.value = opt;
    op.textContent = opt;
    select.appendChild(op);
  });
}

function goToStep(step) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + step).classList.add('active');
}

function generateCard() {
  const amount = parseFloat(document.getElementById('amount').value);
  if (isNaN(amount) || amount <= 0) return tg.showAlert('Введи сумму');

  loader.classList.remove('hidden');

  setTimeout(() => {
    const last4 = Math.floor(1000 + Math.random() * 9000);
    const expiry = '12/28';
    const cvv = Math.floor(100 + Math.random() * 900);
    const balance = amount * 1000;

    document.getElementById('card-last4').textContent = last4;
    document.getElementById('card-expiry').textContent = expiry;
    document.getElementById('card-cvv').textContent = cvv;
    document.getElementById('card-balance').textContent = balance.toFixed(2);

    document.getElementById('card-result').classList.remove('hidden');
    loader.classList.add('hidden');
  }, 2000);
}

function copyCard() {
  const text = `Номер: 4111 1111 1111 ${document.getElementById('card-last4').textContent}\nСрок: ${document.getElementById('card-expiry').textContent}\nCVV: ${document.getElementById('card-cvv').textContent}`;
  navigator.clipboard.writeText(text).then(() => tg.showAlert('Скопировано!'));
}

// Инициализация
updateSourceOptions();
function goToStep3() {
  const source = document.getElementById('source-currency').value;
  if (!source) return tg.showAlert('Выбери валюту');

  const amountInput = document.getElementById('amount');
  amountInput.value = '1000'; // дефолт

  document.getElementById('step2').classList.remove('active');
  document.getElementById('step3').classList.add('active');

  updateConversionInfo();
}

function updateConversionInfo() {
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const source = document.getElementById('source-currency').value;
  const target = direction === 'crypto_to_fiat' ? 'USD' : 'BTC'; // дефолт, можно сделать динамическим

  // Фейковый курс (можно заменить на реальный fetch позже)
  const rate = direction === 'crypto_to_fiat' ? 65000 : 0.000015; // BTC → USD или USD → BTC
  const converted = direction === 'crypto_to_fiat' ? amount * rate : amount / rate;

  document.getElementById('conversion-info').textContent = 
    `${amount} ${source} ≈ ${converted.toFixed(2)} ${target}`;

  // Фейковый адрес
  const fakeAddr = source + '1Fake' + Math.random().toString(36).substring(2, 15);
  document.getElementById('deposit-address').textContent = fakeAddr;
  document.getElementById('deposit-address-container').classList.remove('hidden');
}

function simulateDepositAndGenerate() {
  loader.classList.remove('hidden');

  setTimeout(() => {
    const amount = parseFloat(document.getElementById('amount').value);
    const source = document.getElementById('source-currency').value;
    const target = direction === 'crypto_to_fiat' ? 'USD' : 'BTC';

    // Фейковая генерация карты
    const last4 = Math.floor(1000 + Math.random() * 9000);
    const expiry = '12/28';
    const cvv = Math.floor(100 + Math.random() * 900);
    const balance = direction === 'crypto_to_fiat' ? amount * 65000 : amount * 0.000015;

    document.getElementById('card-last4').textContent = last4;
    document.getElementById('card-expiry').textContent = expiry;
    document.getElementById('card-cvv').textContent = cvv;
    document.getElementById('card-balance').textContent = balance.toFixed(2) + ' ' + target;

    document.getElementById('card-result').classList.remove('hidden');
    loader.classList.add('hidden');
  }, 2000);
}