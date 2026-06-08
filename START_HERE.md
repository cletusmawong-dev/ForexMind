# ▶️ How to run ForexMind (beginner-friendly)

This is a step-by-step guide. No coding needed — just copy/paste.

---

## What you'll end up with
When you open the app, it **automatically pops up a "Today's Market Briefing"** where the AI
tells you how the market looks right now (gold focus, what to watch today, and a game plan).
You'll also get live charts, signals, and suggested Take-Profit / Stop-Loss.

---

## Step 1 — Install Node.js (one time)
1. Go to <https://nodejs.org> and download the **LTS** version.
2. Install it (just click "Next" through the installer).
3. To check it worked, open a terminal and type:
   ```
   node -v
   ```
   If you see a number like `v20.x.x`, you're good. ✅

> **How to open a terminal:**
> - **Windows:** press the Start key, type `cmd`, hit Enter.
> - **Mac:** press `Cmd+Space`, type `Terminal`, hit Enter.

---

## Step 2 — Go into the app folder
In the terminal, type `cd ` (with a space) then drag the `trading` folder onto the
terminal window and press Enter. Example:
```
cd /home/user/trading
```

---

## Step 3 — Add your API keys (one time)

### ⭐ Easiest way — the setup wizard (no text editor!)
Just run:
```
npm install
npm run setup
```
It will **ask you for each key in the terminal** — paste it, press Enter, done.
It saves everything into a private `.env` file for you. You can re-run it anytime to change keys.

Get your free keys here:
- Market data: <https://twelvedata.com> → sign up → Dashboard → API Keys
- AI (Google Gemini): <https://aistudio.google.com/app/apikey> → "Create API key"
- 📧 Email alerts (optional): a Gmail **App Password** from <https://myaccount.google.com/apppasswords>
  (turn on 2-Step Verification first, then pick "Mail"). The wizard will ask for your Gmail address
  + that 16-character password. Alerts go to **cletusmawa@gmail.com** by default.

### Or, the manual way
Open the **`.env`** file in the `trading` folder with any text editor (Notepad / TextEdit)
and paste your keys after the `=` signs:
```
TWELVE_DATA_KEY=your_twelvedata_key_here
GEMINI_API_KEY=your_gemini_key_here
```
Then save the file.

> 💡 No keys yet? You can skip this step — the app still runs with simulated data + a local AI.

> 💡 **Don't have keys yet?** You can still run it! Skip to Step 4. The app will use
> realistic *simulated* data and a local AI so you can see how everything works. Add keys
> later to switch on **live data + Gemini**.

---

## Step 4 — Start the app
```
npm start
```
(If you skipped the wizard, run `npm install` first.)
You should see:
```
ForexMind running → http://localhost:3000
```

---

## Step 5 — Open it
Open your web browser and go to:
```
http://localhost:3000
```
🎉 The **AI market briefing pops up automatically.** Done!

### 📱 Open it on your phone (optional)
While the app is running on your computer, find your computer's local IP address
(e.g. `192.168.1.20`) and on your phone's browser go to:
```
http://192.168.1.20:3000
```
(Your phone must be on the **same Wi-Fi**.)

---

## How the auto-brief works
Every time you load the page, the app:
1. Pulls the latest candles for all pairs (live if keys are set, simulated otherwise).
2. Reads today's high-impact USD economic events.
3. Sends that context to the AI, which **reasons** and writes your briefing.
4. Pops it up on screen. You can re-generate it anytime with the **📋 Brief** button
   (top-right) or the **↻** on the AI Daily Brief card.

---

## To stop the app
Click the terminal window and press **Ctrl + C**.

---

## Something not working?
| Problem | Fix |
|---|---|
| `node: command not found` | Node.js isn't installed — redo Step 1. |
| Page shows "Sim" not "Live" | Your `.env` keys are missing/empty — recheck Step 3, then restart with `npm start`. |
| Briefing says "needs the backend" | You opened the file directly instead of `http://localhost:3000`. Use the URL. |
| Port already in use | Change `PORT=3000` in `.env` to `PORT=3001` and use that in the URL. |

*Built on Arena.ai's Agent Mode.*
