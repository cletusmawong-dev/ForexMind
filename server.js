/* ============================================================
   ForexMind backend
   - Keeps API keys SECRET (never sent to the browser)
   - /api/candles   real OHLC from Twelve Data (XAU/USD, FX, intraday)
   - /api/calendar  today's high-impact economic events (free feed)
   - /api/brief     Gemini-reasoned daily market briefing
   - /api/chat      Gemini-reasoned chat over live context
   - Graceful: if a key is missing, returns {fallback:true} so the
     frontend can use its built-in simulated data / local reasoning.
   ============================================================ */
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import nodemailer from 'nodemailer';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname)); // serve index.html etc.

const PORT = process.env.PORT || 3000;
const TD_KEY = process.env.TWELVE_DATA_KEY || '';
// NOTE: this baked-in key is a TESTING fallback only. Your .env / host env
// var GEMINI_API_KEY (if set) always takes priority. Replace before real use.
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6KGlHSk9zybIyLULpA7f7sE1g52B2oXMUApvi6SDV_T_g';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || '';
const ALERT_TO = process.env.ALERT_TO || GMAIL_USER || '';

/* ---------- Gmail transporter ---------- */
let mailer = null;
if (GMAIL_USER && GMAIL_PASS) {
  mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });
}
// simple rate-limit so we don't spam the inbox
const mailThrottle = new Map();
function canSend(k, ms = 60000) {
  const last = mailThrottle.get(k) || 0;
  if (Date.now() - last < ms) return false;
  mailThrottle.set(k, Date.now());
  return true;
}
function glassEmail(title, bodyHtml) {
  return `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#0a1224;padding:24px">
    <div style="max-width:520px;margin:0 auto;background:linear-gradient(180deg,#141a2e,#0e1322);
      border:1px solid rgba(255,255,255,.1);border-radius:18px;overflow:hidden;color:#eef3fb">
      <div style="padding:18px 22px;background:linear-gradient(135deg,#6e8bff,#3dd7e0);color:#06101f">
        <div style="font-size:13px;font-weight:700;letter-spacing:1px;opacity:.8">FOREXMIND ALERT</div>
        <div style="font-size:20px;font-weight:800;margin-top:2px">${title}</div>
      </div>
      <div style="padding:20px 22px;font-size:14px;line-height:1.6">${bodyHtml}</div>
      <div style="padding:14px 22px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:#75849f">
        Sent by your ForexMind trading desk · ${new Date().toUTCString()}
      </div>
    </div></div>`;
}

/* ---------- tiny TTL cache ---------- */
const cache = new Map();
const getCache = (k) => { const e = cache.get(k); if (e && e.exp > Date.now()) return e.v; cache.delete(k); return null; };
const setCache = (k, v, ttlMs) => cache.set(k, { v, exp: Date.now() + ttlMs });

/* ---------- map our TF -> Twelve Data interval ---------- */
const TD_INTERVAL = { '5m':'5min','15m':'15min','1H':'1h','4H':'4h','1D':'1day' };

/* ===================== MARKET DATA ===================== */
app.get('/api/candles', async (req, res) => {
  const symbol = (req.query.symbol || 'XAU/USD').toUpperCase();   // e.g. "XAU/USD"
  const tf = req.query.tf || '5m';
  const outputsize = Math.min(parseInt(req.query.size || '120', 10), 500);
  const interval = TD_INTERVAL[tf] || '5min';

  if (!TD_KEY) return res.json({ fallback: true, reason: 'no_twelve_data_key' });

  const k = `c:${symbol}:${interval}:${outputsize}`;
  const hit = getCache(k);
  if (hit) return res.json(hit);

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}`
      + `&interval=${interval}&outputsize=${outputsize}&apikey=${TD_KEY}&order=ASC`;
    const r = await fetch(url);
    const j = await r.json();
    if (j.status === 'error' || !j.values) {
      return res.json({ fallback: true, reason: j.message || 'td_error' });
    }
    const candles = j.values.map(v => ({
      t: v.datetime, o:+v.open, h:+v.high, l:+v.low, c:+v.close, v: v.volume!=null?+v.volume:null,
    }));
    const payload = { live: true, symbol, tf, candles };
    setCache(k, payload, tf === '1D' ? 60*60*1000 : 60*1000); // 1m intraday / 1h daily
    res.json(payload);
  } catch (e) {
    res.json({ fallback: true, reason: 'fetch_failed' });
  }
});

/* ===================== ECONOMIC CALENDAR ===================== */
/* Uses the free, no-key Forex Factory weekly JSON. We filter to
   today's High-impact USD events (these move gold & the dollar). */
app.get('/api/calendar', async (_req, res) => {
  const k = 'calendar:today';
  const hit = getCache(k);
  if (hit) return res.json(hit);
  try {
    const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: { 'User-Agent': 'ForexMind/1.0' }
    });
    if (!r.ok) throw 0;
    const all = await r.json();
    const today = new Date().toISOString().slice(0,10);
    const events = all
      .filter(e => (e.date || '').slice(0,10) === today)
      .map(e => ({
        time: e.date, title: e.title, country: e.country,
        impact: e.impact, forecast: e.forecast, previous: e.previous
      }));
    const highUSD = events.filter(e => e.country === 'USD' && /high/i.test(e.impact));
    const payload = { live: true, date: today, count: events.length, highImpactUSD: highUSD, all: events };
    setCache(k, payload, 30*60*1000); // 30 min
    res.json(payload);
  } catch (e) {
    res.json({ fallback: true, reason: 'calendar_unavailable' });
  }
});

/* ===================== GEMINI HELPER ===================== */
async function callGeminiOnce(model, system, userContent, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/`
    + `${model}:generateContent?key=${GEMINI_KEY}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.6 }
    })
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || 'gemini_error');
  const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text).join('').trim();
  if (!text) throw new Error('gemini_empty_response');
  return text;
}
// Retries on transient "high demand" errors, then falls back to a second model.
async function callGemini(system, userContent, maxTokens = 700) {
  const models = [GEMINI_MODEL, 'gemini-2.0-flash'];
  let lastErr;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try { return await callGeminiOnce(model, system, userContent, maxTokens); }
      catch (e) {
        lastErr = e;
        const transient = /high demand|overload|503|429|rate|quota|unavailable/i.test(e.message);
        if (transient && attempt === 0) { await new Promise(r => setTimeout(r, 900)); continue; }
        break; // non-transient or already retried -> try next model
      }
    }
  }
  throw lastErr || new Error('gemini_failed');
}

const TRADING_SYSTEM = `You are ForexMind, a knowledgeable and friendly AI trading assistant and all-round market companion.
Your specialty is the user's strategy — a Zone MA ribbon (MA9 vs MA21; green when MA9>MA21, red when below)
plus the Impulse MACD (LazyBear, length 34, signal 9) — applied to gold (XAU/USD) and major forex pairs. You
also weigh high-impact USD economic events and the active trading session / ICT killzone (Sydney, Tokyo/Asian,
London, New York) because liquidity and volatility depend on them.

But you are NOT limited to that. You can freely answer ANY question the user asks — trading education
(what is a pip, leverage, risk management, order types, candlestick patterns, market structure, psychology),
explanations of any instrument or concept, general finance, or even casual conversation. Be genuinely helpful
and conversational, like a smart trading buddy.

Rules:
- Answer the actual question asked. If it's general or off-topic, just answer it naturally — don't force it back to gold.
- When you DO have the live snapshot/calendar/session context, use those real numbers; never fabricate specific live prices you weren't given.
- Be concise, structured, and practical. Use short paragraphs or bullets.
- Briefly note risk management where relevant, as a personal trading desk would.`;

/* ===================== DAILY BRIEFING ===================== */
app.post('/api/brief', async (req, res) => {
  if (!GEMINI_KEY) return res.json({ fallback: true, reason: 'no_gemini_key' });
  try {
    const { snapshot, calendar, sessions } = req.body || {};
    const content =
`Give me today's market briefing. Today is ${new Date().toDateString()}.

LIVE TECHNICAL SNAPSHOT (per symbol, current timeframe):
${JSON.stringify(snapshot, null, 2)}

TODAY'S HIGH-IMPACT USD ECONOMIC EVENTS:
${JSON.stringify(calendar, null, 2)}

CURRENT MARKET SESSIONS (UTC-based):
${JSON.stringify(sessions, null, 2)}

Write a briefing with these sections:
1) **Market Mood** — 2-3 sentences on overall risk/dollar/gold tone, factoring which session/killzone is active.
2) **Gold (XAU/USD) focus** — what the Zone + Impulse MACD say right now and the bias.
3) **Watch today** — the high-impact events and how they could move gold/USD.
4) **Session timing** — note the active session/killzone and the best upcoming window to trade.
5) **Game plan** — when to look for longs vs shorts per the strategy, and a risk reminder.
Keep it tight and skimmable.`;
    const text = await callGemini(TRADING_SYSTEM, content, 900);
    res.json({ live: true, text });
  } catch (e) {
    res.json({ fallback: true, reason: e.message });
  }
});

/* ===================== CHAT ===================== */
app.post('/api/chat', async (req, res) => {
  if (!GEMINI_KEY) return res.json({ fallback: true, reason: 'no_gemini_key' });
  try {
    const { message, context, history } = req.body || {};
    const convo = Array.isArray(history) && history.length
      ? '\nRecent conversation (for context, so you can follow up naturally):\n'
        + history.map(h => `${h.role === 'user' ? 'User' : 'You'}: ${h.text}`).join('\n') + '\n'
      : '';
    const content =
`${convo}
User's new message: "${message}"

If it relates to the live market, here is the current context you may use
(use these real numbers; don't invent live prices). If it's general, educational,
or off-topic, just answer directly — you don't have to mention this data:
${JSON.stringify(context, null, 2)}

Answer the user's actual message helpfully and conversationally, taking the recent conversation into account.`;
    const text = await callGemini(TRADING_SYSTEM, content, 700);
    res.json({ live: true, text });
  } catch (e) {
    res.json({ fallback: true, reason: e.message });
  }
});

/* ===================== EMAIL NOTIFICATIONS ===================== */
// Generic notify (used for signals + custom alerts)
app.post('/api/notify', async (req, res) => {
  if (!mailer) return res.json({ fallback: true, reason: 'no_gmail_config' });
  try {
    const { subject, html, text, key, throttleMs } = req.body || {};
    if (key && !canSend(key, throttleMs || 60000)) return res.json({ skipped: true, reason: 'throttled' });
    await mailer.sendMail({
      from: `"ForexMind" <${GMAIL_USER}>`,
      to: ALERT_TO,
      subject: subject || 'ForexMind alert',
      text: text || subject || 'ForexMind alert',
      html: html || glassEmail(subject || 'ForexMind alert', `<p>${text || ''}</p>`)
    });
    res.json({ sent: true, to: ALERT_TO });
  } catch (e) {
    res.json({ fallback: true, reason: e.message });
  }
});

// Send a trade signal email (structured)
app.post('/api/notify/signal', async (req, res) => {
  if (!mailer) return res.json({ fallback: true, reason: 'no_gmail_config' });
  try {
    const s = req.body || {};
    const k = `sig:${s.symbol}:${s.timeframe}:${s.action}`;
    if (!canSend(k, 5 * 60 * 1000)) return res.json({ skipped: true, reason: 'throttled' });
    const isBuy = s.action === 'BUY';
    const color = isBuy ? '#34e3a4' : s.action === 'SELL' ? '#ff5f7a' : '#ffbb45';
    const arrow = isBuy ? '▲' : '▼';
    const confColor = s.confidence>=85?'#34e3a4':s.confidence>=70?'#3dd7e0':s.confidence>=55?'#ffbb45':'#ff5f7a';
    const confLabel = s.confidence>=85?'STRONG':s.confidence>=70?'GOOD':s.confidence>=50?'MODERATE':'WEAK';
    const row=(l,v,c)=>v!=null&&v!==''?`<tr><td style="padding:7px 0;color:#a7b6d6;font-size:13px">${l}</td><td style="text-align:right;font-weight:700;font-size:14px;${c?'color:'+c:''}">${v}</td></tr>`:'';
    const html = glassEmail(`${arrow} ${s.action} ${s.symbol}`, `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <span style="font-size:28px;font-weight:800;color:${color}">${arrow} ${s.action}</span>
        <span style="font-size:20px;font-weight:700;color:#eef3fb">${s.symbol}</span>
      </div>
      <div style="display:inline-block;background:${confColor};color:#06101f;font-weight:800;font-size:12px;padding:4px 12px;border-radius:20px;margin-bottom:14px">
        ${confLabel} · ${s.confidence}% confidence
      </div>
      <div style="color:#75849f;font-size:12px;margin-bottom:14px">${s.timeframe} timeframe · ${new Date().toUTCString()}</div>

      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:6px 16px;margin-bottom:14px">
        <table style="width:100%;border-collapse:collapse">
          ${row('Current price',s.price)}
          ${row('Entry',s.entry,color)}
          ${row('Stop loss',s.stop,'#ff5f7a')}
          ${row('Take profit 1',s.tp1,'#34e3a4')}
          ${row('Take profit 2',s.tp2,'#34e3a4')}
        </table>
      </div>

      <div style="background:rgba(125,150,255,.08);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:6px 16px;margin-bottom:14px">
        <table style="width:100%;border-collapse:collapse">
          ${row('Risk / Reward', s.rr?('1:'+s.rr):null)}
          ${row('Tier', s.tier)}
          ${row('Risk level', s.riskLevel)}
          ${row('Market regime', s.regime)}
          ${row('Structure', s.structure)}
          ${row('Impulse MACD',s.macd, s.macd==='Bullish'?'#34e3a4':'#ff5f7a')}
          ${row('EMA 9 / 21',s.zone)}
          ${row('Trend',s.trend)}
          ${row('Momentum',s.momentum)}
        </table>
      </div>

      ${s.explain?`<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 16px;margin-bottom:12px">
        <div style="color:#eef3fb;font-weight:700;font-size:13px;margin-bottom:8px">Why this signal</div>
        ${s.explain.split('\n').map(l=>{const ok=l.trim().startsWith('✓');return `<div style="font-size:13px;color:${ok?'#cfe9dd':'#f3c4cc'};padding:2px 0">${l}</div>`;}).join('')}
      </div>`:''}
      ${s.similar?`<div style="font-size:13px;color:#a7b6d6;margin-bottom:6px">📊 ${s.similar}</div>`:''}
      ${s.decision?`<div style="display:inline-block;background:rgba(110,139,255,.18);color:#aab8ff;font-weight:700;font-size:13px;padding:6px 14px;border-radius:20px;margin-bottom:8px">Decision: ${s.decision}</div>`:''}
      ${s.session?`<div style="margin-top:6px;font-size:13px;color:#a7b6d6">🕐 ${s.session}</div>`:''}`);
    await mailer.sendMail({
      from: `"ForexMind" <${GMAIL_USER}>`, to: ALERT_TO,
      subject: `${isBuy?'🟢':'🔴'} ${s.action} ${s.symbol} ${s.timeframe} · ${s.confidence}% (${s.tier||''})`,
      text: `${s.action} ${s.symbol} (${s.timeframe}) @ ${s.price}\nEntry ${s.entry} | SL ${s.stop} | TP1 ${s.tp1} | TP2 ${s.tp2}\nConfidence ${s.confidence}% (${s.tier}) | RR 1:${s.rr} | Regime ${s.regime}\nMACD ${s.macd} | Trend ${s.trend} | Momentum ${s.momentum}\n${(s.explain||s.reasons||'').replace(/\n/g,' | ')}`,
      html
    });
    res.json({ sent: true, to: ALERT_TO });
  } catch (e) {
    res.json({ fallback: true, reason: e.message });
  }
});

/* ===================== STATUS ===================== */
app.get('/api/status', (_req, res) => res.json({
  ok: true,
  hasMarketData: !!TD_KEY,
  hasAI: !!GEMINI_KEY,
  hasEmail: !!mailer,
  alertTo: mailer ? ALERT_TO : null,
  model: GEMINI_KEY ? GEMINI_MODEL : null
}));

app.listen(PORT, () => {
  console.log(`\nForexMind running → http://localhost:${PORT}`);
  console.log(`  Market data (Twelve Data): ${TD_KEY ? 'ENABLED' : 'missing key → simulated fallback'}`);
  console.log(`  AI (Google Gemini):        ${GEMINI_KEY ? 'ENABLED' : 'missing key → local reasoning fallback'}`);
  console.log(`  Email (Gmail):             ${mailer ? 'ENABLED → ' + ALERT_TO : 'not configured (add GMAIL_USER + GMAIL_APP_PASSWORD)'}\n`);
});
