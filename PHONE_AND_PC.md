# 📱💻 Running ForexMind on BOTH phone and PC

**The single most important thing to understand:**

> You only ever run the app on **ONE computer** (or one cloud server).
> Every other device — your phone, a tablet, another laptop — just opens it in a **web browser**.
> **Your phone installs NOTHING.**

Think of it like a website. You don't "install" YouTube on every device — you just open the URL.
ForexMind is the same. Pick one of the two options below.

---

## 🟢 Option A — Quick: run on your PC, open on your phone (same Wi-Fi)
Great for testing today. Free. ~5 minutes. **Your phone needs no install.**

### On your PC (one time)
1. Install Node.js and start the app exactly as in **START_HERE.md**:
   ```
   cd trading
   npm install
   npm start
   ```
   You'll see: `ForexMind running → http://localhost:3000`

2. Find your PC's local IP address:
   - **Windows:** open `cmd`, type `ipconfig`, look for **IPv4 Address** (e.g. `192.168.1.20`).
   - **Mac:** System Settings → Wi-Fi → Details → look for **IP Address** (e.g. `192.168.1.20`).

### On your phone
3. Make sure the phone is on the **same Wi-Fi** as the PC.
4. Open the phone's browser (Chrome/Safari) and go to:
   ```
   http://192.168.1.20:3000
   ```
   (use *your* PC's IP from step 2).

🎉 Done — the AI briefing pops up on your phone too.

> ⚠️ The app only works while your PC is on and `npm start` is running. Close the terminal = app stops.
> Also, this only works on your home/office network, not out and about. For "always on, anywhere",
> use Option B.

### 📲 Make it feel like a real app (optional)
On your phone's browser, tap the **Share / menu** button → **"Add to Home Screen."**
You'll get a ForexMind icon that opens full-screen like a native app.

---

## 🔵 Option B — Best: deploy to the cloud (open it anywhere, install nothing)
Now your phone and PC both just visit a public link like `https://forexmind.onrender.com`.
No PC needs to stay on. This is how you'd actually use it day to day.

We'll use **Render** (has a free tier). Other good options: Railway, Fly.io, Vercel.

### Steps
1. **Put the code on GitHub** (one time):
   - Create a free account at <https://github.com>.
   - Make a new repository and upload the `trading` folder
     (GitHub's website has a drag-and-drop "upload files" button — no git commands needed).
   - ⚠️ Do **not** upload your `.env` file (your secret keys). The included `.gitignore`
     already prevents this.

2. **Create the web service on Render:**
   - Sign up at <https://render.com> (you can log in with GitHub).
   - Click **New → Web Service** and pick your repo.
   - Settings:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Instance type:** Free
   - Render auto-detects Node.

3. **Add your secret keys safely:**
   - In the service's **Environment** tab, add these (this is the cloud version of your `.env`):
     - `TWELVE_DATA_KEY` = your key
     - `GEMINI_API_KEY` = your key
   - (Render sets `PORT` for you automatically — the app already reads it.)

4. **Deploy.** Render gives you a URL like `https://forexmind-xxxx.onrender.com`.
   Open that on your **phone and PC** — same link, works anywhere. 🎉
   Add it to your home screen (see above) for an app-like icon.

> 💡 Free cloud tiers may "sleep" when idle and take ~30s to wake on the first visit. That's normal.

---

## ❓ "So what do I actually install where?"

| Device | Option A (Wi-Fi) | Option B (Cloud) |
|---|---|---|
| **PC** | Install Node.js, run `npm start` | Nothing to keep running (cloud does it) |
| **Phone** | **Nothing** — just open the URL in the browser | **Nothing** — just open the URL |
| **Cloud** | — | Render runs `npm install` + `npm start` for you |

You never install Node, npm, or anything else **on the phone**. Phones run the app through the browser.

---

## 🔑 Where do the API keys go?
- **Option A:** in the `.env` file on your **PC** (see START_HERE.md).
- **Option B:** in **Render's Environment tab** (never in the code, never on the phone).

Either way, keys stay on the server side and are never exposed to the browser. ✅

*Built on Arena.ai's Agent Mode.*
