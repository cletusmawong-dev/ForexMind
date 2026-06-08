# ForexMind — Personal AI Trading Assistant 🟡📈

An AI-powered, mobile-friendly trading research app for **Gold (XAU/USD)** and forex.
It runs your strategy — **Zone MA (9/21) ribbon + Impulse MACD (34/9)** — on **real market data**,
gives **live signals with suggested Take-Profit / Stop-Loss**, and uses **Google Gemini** to write a
**reasoned daily market briefing** (including today's high-impact USD economic events).

> ⚠️ Educational/research only. It does **not** place real trades and is **not** financial advice.

---

## ✨ Features (v3)
- **📧 Gmail email alerts** — get trade signals & test emails sent to your inbox (set up a Gmail App Password)
- **Flexible chart** — mouse-wheel/pinch **zoom**, drag to **pan**, drag handle to **resize height**, +/−/reset buttons
- **More candlestick patterns** — engulfing, doji, hammer, stars, soldiers/crows, piercing, dark cloud, tweezers, inside/outside bars, spinning top

## Features (v2)
- **Market Sessions & ICT Killzones** — live Sydney/Tokyo/London/New York status with countdowns + overlap alerts
- **Drawing tools** — trend lines, horizontal lines, rectangle zones, Fibonacci retracement (saved per pair)
- **Multiple chart types** — candlesticks, line, area, Heikin-Ashi
- **Candlestick pattern detection** — engulfing, doji, hammer, stars, soldiers/crows, marubozu
- **Risk / Position calculator** — account % risk → exact position size & lots
- **Crosshair readout** — hover for OHLC + price at any point
- **Multi-timeframe trend**, **market volume** panel, smart-money overlays (FVG / Supply-Demand / Liquidity)

## Core Features
- **Real market data** via Twelve Data (XAU/USD + forex + intraday 5m/15m/1H/4H/1D)
- **Candlestick charts** with the 9/21 zone-colored MA ribbon + Impulse MACD pane
- **Live strategy signals**: BUY = green zone **and** MACD above signal; SELL = red zone **and** MACD below signal; otherwise HOLD
- **Auto trade plan**: ATR-based Stop-Loss (1.5×ATR), Take-Profit 1 (1:1.5 R) and TP2 (1:3 R), drawn on the chart
- **Alerts** (toast + vibration) the moment an entry aligns
- **AI Daily Brief** (Gemini): market mood, gold focus, today's events to watch, and a game plan — auto-pops on open
- **AI Chat** that reasons over your live data + the economic calendar
- **Economic calendar**: today's high-impact USD events (free feed)
- **Paper portfolio** with live P/L (saved in your browser)
- **Mobile-friendly** with a bottom tab bar (Chart / Watch / AI / News / Folio)

---

## 🚀 Setup (5 minutes)

### 1. Install Node.js 18+
Check with: `node -v`

### 2. Get your free API keys
- **Market data — Twelve Data:** sign up at <https://twelvedata.com/> → Dashboard → API Keys.
  The free tier covers XAU/USD + intraday.
- **AI — Google Gemini:** create a FREE key at <https://aistudio.google.com/app/apikey> → "Create API key".

### 3. Configure
```bash
cd trading
cp .env.example .env        # then open .env and paste your keys
npm install
npm start
```

### 4. Open the app
Visit **http://localhost:3000** (also works great on your phone if on the same Wi-Fi —
use your computer's local IP, e.g. http://192.168.1.20:3000).

---

## 🔒 Why a backend?
API keys must stay secret. If they were in the browser, anyone could steal them and run up your bill.
The Node server (`server.js`) holds the keys and exposes safe routes:

| Route | What it does |
|---|---|
| `GET /api/candles` | Real OHLC candles from Twelve Data |
| `GET /api/calendar` | Today's high-impact economic events |
| `POST /api/brief` | Gemini-reasoned daily market briefing |
| `POST /api/chat` | Gemini-reasoned chat over your live context |
| `GET /api/status` | Tells the UI which features are enabled |

### Graceful fallback
If a key is missing or you open `index.html` without the server, the app **still runs** using
realistic **simulated** candles and a **local reasoning** engine. The status dot shows **Sim**;
with the backend + keys it shows **Live** and uses **Gemini**.

---

## 🧠 The strategy (from your chart)
- **Zone MA 9/21** — "two moving averages with zone coloring": green when MA9 > MA21 (uptrend),
  red when MA9 < MA21 (downtrend).
- **Impulse MACD (LazyBear) 34/9** — momentum oscillator; histogram = MACD − signal line.
- **Trade only when both agree**, then manage risk with the ATR-based stop and the two take-profits.

---

## 🛣️ Roadmap ideas
- Real broker integration (OANDA) to place trades from the plan (with strong safeguards)
- Push/email/Telegram alerts instead of in-app toasts
- Backtesting the strategy on historical data
- News *headlines* + sentiment (Marketaux / Finnhub) on top of the calendar

---

*Built on Arena.ai's Agent Mode.*
