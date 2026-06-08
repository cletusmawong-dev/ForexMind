#!/usr/bin/env node
/* ============================================================
   ForexMind setup wizard
   Run:  npm run setup
   Asks you for your API keys in the terminal and writes them
   safely into the local .env file. No text editor needed.
   ============================================================ */
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '.env');

const C = {
  reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m',
  cyan:'\x1b[36m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', blue:'\x1b[34m'
};
const say = (s='') => console.log(s);

/* Robust prompt that works in a real terminal AND with piped input.
   We listen to the 'line' event ourselves so EOF (piped input) can't
   leave a question hanging forever. */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
const lineQueue = [];
let pending = null;
let closed = false;
rl.on('line', (l) => { if (pending) { const r = pending; pending = null; r(l); } else lineQueue.push(l); });
rl.on('close', () => { closed = true; if (pending) { const r = pending; pending = null; r(''); } });
const ask = (q) => new Promise(res => {
  process.stdout.write(q);
  if (lineQueue.length) return res(lineQueue.shift().trim());
  if (closed) return res('');
  pending = (l) => res((l || '').trim());
});

/* read existing .env (if any) into a key->value map so we don't lose other settings */
function readEnv() {
  const map = {};
  if (fs.existsSync(ENV_PATH)) {
    for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) map[m[1]] = m[2];
    }
  }
  return map;
}

function writeEnv(env) {
  const content =
`# ============================================================
#   ForexMind private keys — created by 'npm run setup'
#   Do NOT share this file. It is git-ignored on purpose.
# ============================================================

# Market data — https://twelvedata.com (Dashboard -> API Keys)
TWELVE_DATA_KEY=${env.TWELVE_DATA_KEY || ''}

# AI (Google Gemini) — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=${env.GEMINI_API_KEY || ''}

# Gmail notifications — App Password from https://myaccount.google.com/apppasswords
GMAIL_USER=${env.GMAIL_USER || ''}
GMAIL_APP_PASSWORD=${env.GMAIL_APP_PASSWORD || ''}
ALERT_TO=${env.ALERT_TO || 'cletusmawa@gmail.com'}

# Optional settings
GEMINI_MODEL=${env.GEMINI_MODEL || 'gemini-1.5-flash'}
PORT=${env.PORT || '3000'}
`;
  fs.writeFileSync(ENV_PATH, content, { mode: 0o600 }); // owner read/write only
}

const mask = (v) => !v ? `${C.dim}(empty)${C.reset}`
  : v.length <= 8 ? '••••' : v.slice(0,4) + '••••' + v.slice(-3);

async function main() {
  say();
  say(`${C.cyan}${C.bold}  ╔══════════════════════════════════════════╗${C.reset}`);
  say(`${C.cyan}${C.bold}  ║        ForexMind  ·  Setup Wizard        ║${C.reset}`);
  say(`${C.cyan}${C.bold}  ╚══════════════════════════════════════════╝${C.reset}`);
  say();
  say(`${C.dim}  This will save your keys into a private .env file.`);
  say(`  Press ENTER to keep an existing value or skip a key.${C.reset}`);
  say();

  const env = readEnv();

  // --- Twelve Data ---
  say(`${C.bold}1) Market data — Twelve Data${C.reset}`);
  say(`   ${C.dim}Free key: ${C.blue}https://twelvedata.com${C.reset}${C.dim} → Dashboard → API Keys${C.reset}`);
  if (env.TWELVE_DATA_KEY) say(`   Current: ${C.green}${mask(env.TWELVE_DATA_KEY)}${C.reset}`);
  const td = await ask(`   ${C.cyan}Paste TWELVE_DATA_KEY ▸ ${C.reset}`);
  if (td) env.TWELVE_DATA_KEY = td;
  say();

  // --- Gemini ---
  say(`${C.bold}2) AI — Google Gemini${C.reset}`);
  say(`   ${C.dim}Free key: ${C.blue}https://aistudio.google.com/app/apikey${C.reset}${C.dim} → Create API key${C.reset}`);
  if (env.GEMINI_API_KEY) say(`   Current: ${C.green}${mask(env.GEMINI_API_KEY)}${C.reset}`);
  const gm = await ask(`   ${C.cyan}Paste GEMINI_API_KEY ▸ ${C.reset}`);
  if (gm) env.GEMINI_API_KEY = gm;
  say();

  // --- Gmail notifications ---
  say(`${C.bold}3) Email alerts — Gmail (optional)${C.reset}`);
  say(`   ${C.dim}Make an App Password: ${C.blue}https://myaccount.google.com/apppasswords${C.reset}${C.dim} (enable 2-Step first)${C.reset}`);
  if (env.GMAIL_USER) say(`   Current sender: ${C.green}${env.GMAIL_USER}${C.reset}`);
  const gu = await ask(`   ${C.cyan}Gmail address to send FROM (ENTER to skip) ▸ ${C.reset}`);
  if (gu) env.GMAIL_USER = gu;
  if (env.GMAIL_USER) {
    const gp = await ask(`   ${C.cyan}Gmail App Password (16 chars) ▸ ${C.reset}`);
    if (gp) env.GMAIL_APP_PASSWORD = gp.replace(/\s+/g, '');
    const to = await ask(`   ${C.cyan}Send alerts TO ${C.dim}(ENTER for ${env.ALERT_TO || 'cletusmawa@gmail.com'})${C.reset}${C.cyan} ▸ ${C.reset}`);
    if (to) env.ALERT_TO = to;
  }
  say();

  // --- Optional port ---
  const port = await ask(`${C.bold}4) Port${C.reset} ${C.dim}(press ENTER for ${env.PORT || 3000})${C.reset} ▸ `);
  if (port) env.PORT = port;

  writeEnv(env);

  say();
  say(`${C.green}${C.bold}  ✓ Saved to .env${C.reset}`);
  say();
  say(`  ${C.bold}Status:${C.reset}`);
  say(`   • Market data: ${env.TWELVE_DATA_KEY ? C.green+'ENABLED (live)' : C.yellow+'empty → simulated data'}${C.reset}`);
  say(`   • Gemini AI:   ${env.GEMINI_API_KEY ? C.green+'ENABLED' : C.yellow+'empty → local AI fallback'}${C.reset}`);
  say(`   • Email alerts:${env.GMAIL_USER && env.GMAIL_APP_PASSWORD ? C.green+' ENABLED → '+(env.ALERT_TO||env.GMAIL_USER) : C.yellow+' off (no Gmail app password)'}${C.reset}`);
  say();
  say(`  ${C.bold}Next step — start the app:${C.reset}`);
  say(`   ${C.cyan}npm start${C.reset}`);
  say(`  Then open ${C.blue}http://localhost:${env.PORT || 3000}${C.reset}`);
  say();
  say(`  ${C.dim}Tip: you can re-run 'npm run setup' anytime to change keys.${C.reset}`);
  say();

  rl.close();
}

main().catch(e => { console.error(C.red + 'Setup error: ' + e.message + C.reset); rl.close(); process.exit(1); });
