const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

function createCard() {
  const crypto = document.getElementById('crypto').value;
  const fiat = document.getElementById('fiat').value;
  const amount = parseFloat(document.getElementById('amount').value);

  if (isNaN(amount) || amount <= 0) {
    tg.showAlert('Введи положительную сумму');
    return;
  }

  const payload = JSON.stringify({
    action: 'create_card',
    crypto: crypto,
    fiat: fiat,
    amount: amount
  });

  tg.sendData(payload);
  tg.close();
}