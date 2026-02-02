const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const splash = document.getElementById('splash');
const app = document.getElementById('app');
const progressBar = document.querySelector('.progress-bar');
const loader = document.getElementById('loader');

// Splash
if (splash && progressBar) {
  setTimeout(() => progressBar.style.width = '100%', 100);
  setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      app.classList.remove('hidden');
    }, 800);
  }, 3000);
}

// Wizard state
let direction = 'crypto_to_fiat';

function setDirection(dir) {
  direction = dir;
  document.getElementById('step1').classList.remove('active');
  document.getElementById('step2').classList.add('active');
  updateSource();
}

function updateSource() {
  const sel = document.getElementById('source-currency');
  sel.innerHTML = '';
  const list = direction === 'crypto_to_fiat' 
    ? ['BTC','ETH','USDT','SOL','TON']
    : ['USD','EUR','RUB','TRY','BRL'];
  list.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

function nextStep(step) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + step).classList.add('active');
}

function generateCard() {
  loader.classList.remove('hidden');

  setTimeout(() => {
    const amount = parseFloat(document.getElementById('amount').value) || 1000;
    const source = document.getElementById('source-currency').value;
    const target = direction === 'crypto_to_fiat' ? 'USD' : 'BTC';

    const last4 = Math.floor(1000 + Math.random() * 9000);
    const expiry = '12/28';
    const cvv = Math.floor(100 + Math.random() * 900);
    const balance = direction === 'crypto_to_fiat' ? amount * 65000 : amount / 65000;

    // Canvas card
    const canvas = document.getElementById('card-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0,0,380,240);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('Shadow Card', 20, 50);
    ctx.font = '20px monospace';
    ctx.fillText('4111 1111 1111 ' + last4, 20, 90);
    ctx.fillText('Valid Thru ' + expiry, 20, 130);
    ctx.fillText('CVV: ' + cvv, 20, 160);
    ctx.fillText('Balance: ' + balance.toFixed(2) + ' ' + target, 20, 200);

    document.getElementById('card-result').classList.remove('hidden');
    loader.classList.add('hidden');
  }, 2000);
}

function copyCard() {
  const text = `4111 1111 1111 ${document.getElementById('card-last4').textContent || '1234'}\nExpiry: 12/28\nCVV: 123`;
  navigator.clipboard.writeText(text).then(() => tg.showAlert('Copied!'));
}

// Init
updateSource();