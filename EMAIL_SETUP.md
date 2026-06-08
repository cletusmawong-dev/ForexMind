# 📧 Email Alerts Setup (Gmail)

ForexMind can email you trade signals and test alerts. It uses Gmail to send them.
Alerts are delivered to **cletusmawa@gmail.com** by default (you can change this).

> 🔒 You do NOT use your normal Gmail password. Google requires a special **App Password**.

---

## Step 1 — Turn on 2-Step Verification
1. Go to <https://myaccount.google.com/security>
2. Under "How you sign in to Google", enable **2-Step Verification** (if not already on).

## Step 2 — Create an App Password
1. Go to <https://myaccount.google.com/apppasswords>
2. App name: type `ForexMind` → click **Create**.
3. Google shows a **16-character password** (like `abcd efgh ijkl mnop`). Copy it.

## Step 3 — Add it to ForexMind
Run the wizard:
```
npm run setup
```
When it asks:
- **Gmail address to send FROM** → the Gmail account you just made the app password for
- **Gmail App Password** → paste the 16-char code (spaces are removed automatically)
- **Send alerts TO** → press Enter to use `cletusmawa@gmail.com`, or type another address

Then start the app:
```
npm start
```
You should see: `Email (Gmail): ENABLED → cletusmawa@gmail.com`

## Step 4 — Test it
- In the app header, click the **📧 button** → it toggles alerts on and sends a **test email**.
- Check the inbox. 🎉

---

## What gets emailed?
- ✅ A **test email** when you enable alerts
- ⚡ A **trade-signal email** whenever a fresh BUY/SELL setup aligns (Zone + Impulse MACD agree),
  including entry, stop-loss, TP1/TP2, confidence, the reasons, and the active session.
- 🛡️ Signals are **rate-limited** (max one per symbol/timeframe every 5 minutes) so your inbox stays clean.

## Manual setup (instead of the wizard)
Edit `.env`:
```
GMAIL_USER=youraddress@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
ALERT_TO=cletusmawa@gmail.com
```

## Troubleshooting
| Problem | Fix |
|---|---|
| "not configured" in the log | `GMAIL_USER` or `GMAIL_APP_PASSWORD` is empty — re-run `npm run setup`. |
| "Invalid login" error | You used your normal password — you must use an **App Password**. |
| No app-password option | 2-Step Verification isn't on yet — enable it first. |
| Email in spam | Mark it "Not spam" once; future ones land in the inbox. |

*Built on Arena.ai's Agent Mode.*
