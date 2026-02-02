import asyncio
import logging
import random
from datetime import datetime, timedelta
from faker import Faker
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from dotenv import load_dotenv
import os
import aiosqlite

load_dotenv()
logging.basicConfig(level=logging.INFO)
fake = Faker()

bot = Bot(token=os.getenv("BOT_TOKEN"))
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

class CardForm(StatesGroup):
    crypto = State()
    fiat = State()
    amount = State()

CRYPTO_CHOICES = ["BTC", "ETH", "USDT", "SOL", "TON", "XRP", "ADA", "DOGE"]
FIAT_CHOICES = ["USD", "EUR", "RUB", "TRY", "BRL", "INR", "AED", "GBP"]

FAKE_RATES = {c: random.uniform(0.8, 1.2) for c in CRYPTO_CHOICES}

async def init_db():
    async with aiosqlite.connect(os.getenv("DB_PATH")) as db:
        await db.execute('''CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            balance_crypto REAL DEFAULT 0.0
        )''')
        await db.execute('''CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            crypto TEXT,
            fiat TEXT,
            card_number TEXT,
            expiry TEXT,
            cvv TEXT,
            balance_fiat REAL DEFAULT 0.0
        )''')
        await db.commit()

def generate_card_number():
    prefix = "4" + "".join(str(random.randint(0, 9)) for _ in range(14))
    digits = [int(d) for d in prefix]
    for i in range(len(digits) - 1, -1, -1):
        if (len(digits) - i) % 2 == 0:
            digits[i] *= 2
            if digits[i] > 9:
                digits[i] -= 9
    check = (10 - sum(digits) % 10) % 10
    return prefix + str(check)

def generate_expiry():
    expiry = datetime.now() + timedelta(days=1095 + random.randint(0, 180))
    return expiry.strftime("%m/%y")

def generate_cvv():
    return str(random.randint(100, 999))

@dp.message(Command("start"))
async def start(message: types.Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🖤 Создать карту")],
            [KeyboardButton(text="❄️ Мои карты")],
            [KeyboardButton(text="⚫ Баланс")]
        ],
        resize_keyboard=True
    )
    await message.answer(
        "Shadow Cards\nХолод. Контроль. Мир в твоей тени.\nЛюбая крипта → любой фиат → премиальная карта.\n\nВыбери ↓",
        reply_markup=kb
    )
    async with aiosqlite.connect(os.getenv("DB_PATH")) as db:
        await db.execute("INSERT OR IGNORE INTO users (user_id) VALUES (?)", (message.from_user.id,))
        await db.commit()

@dp.message(lambda m: m.text == "🖤 Создать карту")
async def create_card_start(message: types.Message, state: FSMContext):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=c, callback_data=f"crypto_{c}") for c in CRYPTO_CHOICES[i:i+3]]
        for i in range(0, len(CRYPTO_CHOICES), 3)
    ])
    await message.answer("Исходная крипта:", reply_markup=kb)
    await state.set_state(CardForm.crypto)

@dp.callback_query(lambda c: c.data.startswith("crypto_"))
async def choose_crypto(callback: types.CallbackQuery, state: FSMContext):
    crypto = callback.data.split("_")[1]
    await state.update_data(crypto=crypto)
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f, callback_data=f"fiat_{f}") for f in FIAT_CHOICES[i:i+3]]
        for i in range(0, len(FIAT_CHOICES), 3)
    ])
    await callback.message.edit_text(f"Крипта: {crypto}\nФиат карты:", reply_markup=kb)
    await state.set_state(CardForm.fiat)

@dp.callback_query(lambda c: c.data.startswith("fiat_"))
async def choose_fiat(callback: types.CallbackQuery, state: FSMContext):
    fiat = callback.data.split("_")[1]
    data = await state.get_data()
    await state.update_data(fiat=fiat)
    await callback.message.edit_text(
        f"🖤 Создание карты\nКрипта: {data['crypto']}\nФиат: {fiat}\n\nВведи сумму в крипте:"
    )
    await state.set_state(CardForm.amount)

@dp.message(CardForm.amount)
async def process_amount(message: types.Message, state: FSMContext):
    text = message.text.strip()  # убираем пробелы по краям
    try:
        # Убираем все нечисловые символы кроме точки и минуса (на всякий случай)
        cleaned = ''.join(c for c in text if c.isdigit() or c in '.-')
        amount = float(cleaned)
        if amount <= 0:
            await message.answer("Сумма должна быть больше нуля.")
            return
    except (ValueError, TypeError):
        await message.answer("Введи нормальное положительное число (например: 1000 или 500.5)")
        return

    data = await state.get_data()
    crypto = data["crypto"]
    fiat = data["fiat"]
    rate = FAKE_RATES.get(crypto, 1.0)
    fiat_amount = amount * rate * 1000

    card_num = generate_card_number()
    expiry = generate_expiry()
    cvv = generate_cvv()

    async with aiosqlite.connect(os.getenv("DB_PATH")) as db:
        await db.execute(
            "UPDATE users SET balance_crypto = balance_crypto + ? WHERE user_id = ?",
            (amount, message.from_user.id)
        )
        await db.execute(
            "INSERT INTO cards (user_id, crypto, fiat, card_number, expiry, cvv, balance_fiat) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (message.from_user.id, crypto, fiat, card_num, expiry, cvv, fiat_amount)
        )
        await db.commit()

    # Экранируем для MarkdownV2 (точки, тире, скобки и т.д.)
    escaped_card = card_num.replace('-', '\\-').replace('.', '\\.')
    escaped_expiry = expiry.replace('-', '\\-').replace('.', '\\.')
    escaped_cvv = cvv.replace('-', '\\-').replace('.', '\\.')
    escaped_bal = f"{fiat_amount:.2f}".replace('.', '\\.')

    await message.answer(
        f"❄️ Карта создана\n"
        f"Номер: `{escaped_card}`\n"
        f"Срок: {escaped_expiry}\n"
        f"CVV: {escaped_cvv}\n"
        f"Баланс: {escaped_bal} {fiat}",
        parse_mode="MarkdownV2"
    )
    await state.clear()

@dp.message(lambda m: m.text == "❄️ Мои карты")
async def my_cards(message: types.Message):
    async with aiosqlite.connect(os.getenv("DB_PATH")) as db:
        cursor = await db.execute(
            "SELECT crypto, fiat, card_number, expiry, cvv, balance_fiat FROM cards WHERE user_id = ?",
            (message.from_user.id,)
        )
        cards = await cursor.fetchall()

    if not cards:
        await message.answer("Теней нет.")
        return

    text = "Твои карты:\n\n"
    for card in cards:
        text += f"🖤 {card[0]} → {card[1]}\n`{card[2]}`\nСрок: {card[3]}\nCVV: {card[4]}\nБаланс: {card[5]:.2f} {card[1]}\n\n"

    await message.answer(text, parse_mode="MarkdownV2")

@dp.message(lambda m: m.text == "⚫ Баланс")
async def balance(message: types.Message):
    async with aiosqlite.connect(os.getenv("DB_PATH")) as db:
        cursor = await db.execute("SELECT balance_crypto FROM users WHERE user_id = ?", (message.from_user.id,))
        row = await cursor.fetchone()
        bal = row[0] if row else 0.0
    await message.answer(f"Баланс крипты: {bal:.4f}")

async def main():
    await init_db()
    await dp.start_polling(bot)
@dp.message(content_types=types.ContentType.WEB_APP_DATA)
async def debug_webapp(message: types.Message):
    print("Получены данные из аппки:", message.web_app_data.data)
    await message.answer(f"Получено: {message.web_app_data.data}")
if __name__ == "__main__":
    asyncio.run(main()) 
    from aiogram.filters import ContentType
import json

@dp.message(content_types=types.ContentType.WEB_APP_DATA)
async def handle_web_app_data(message: types.Message):
    print("Получены данные из аппки:", message.web_app_data.data)
    try:
        data = json.loads(message.web_app_data.data)
        if data.get('action') == 'create_card':
            crypto = data['crypto']
            fiat = data['fiat']
            amount = float(data['amount'])

            rate = FAKE_RATES.get(crypto, 1.0)
            fiat_amount = amount * rate * 1000  # твой коэффициент

            card_num = generate_card_number()
            expiry = generate_expiry()
            cvv = generate_cvv()

            async with aiosqlite.connect(os.getenv("DB_PATH")) as db:
                await db.execute(
                    "UPDATE users SET balance_crypto = balance_crypto + ? WHERE user_id = ?",
                    (amount, message.from_user.id)
                )
                await db.execute(
                    "INSERT INTO cards (user_id, crypto, fiat, card_number, expiry, cvv, balance_fiat) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (message.from_user.id, crypto, fiat, card_num, expiry, cvv, fiat_amount)
                )
                await db.commit()

            escaped_card = card_num.replace('-', '\\-').replace('.', '\\.')
            escaped_expiry = expiry.replace('-', '\\-').replace('.', '\\.')
            escaped_cvv = cvv.replace('-', '\\-').replace('.', '\\.')
            escaped_bal = f"{fiat_amount:.2f}".replace('.', '\\.')

            await message.answer(
                f"❄️ Карта создана\n"
                f"Номер: `{escaped_card}`\n"
                f"Срок: {escaped_expiry}\n"
                f"CVV: {escaped_cvv}\n"
                f"Баланс: {escaped_bal} {fiat}",
                parse_mode="MarkdownV2"
            )
        else:
            await message.answer("Неизвестная команда")
    except Exception as e:
        print("Ошибка в обработке:", str(e))
        await message.answer(f"Ошибка: {str(e)}")