# 🔥 Firestore Setup (ForexMind V2)

ForexMind now saves your **signals, alerts, and trade journal** to Cloud Firestore so they
persist across devices and power the dashboard tiles, history, and analytics.

Your web config is already wired into `index.html` (project: `sms-base-39feb`).

---

## Step 1 — Enable Cloud Firestore
1. Open the [Firebase Console](https://console.firebase.google.com/) → project **sms-base-39feb**.
2. Left menu → **Build → Firestore Database** → **Create database**.
3. Choose a location, and start in **Test mode** (you can tighten rules later — see below).

> We use **Cloud Firestore**, not the Realtime Database. (Your config also had a
> `databaseURL`, which is for RTDB — you can ignore that; ForexMind uses Firestore.)

---

## Step 2 — Collections (created automatically)
You don't need to make these by hand — the app creates them on first write:
- `signals` — every generated signal + its outcome (running / TP Hit / SL Hit / Expired)
- `alerts` — the Alert Center feed
- `journal` — your trade journal entries
- `knowledge_base` — AI-discovered trading rules & lessons

---

## Step 3 — Security rules
Because this is a **personal** app using the public web config, anyone with the config could
in theory read/write. For a quick personal start, **Test mode** is fine. For a safer setup,
paste these rules in **Firestore → Rules** (lets anyone read/write only these 3 collections,
nothing else — good enough for personal use; for full lock-down we'd add Firebase Auth later):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{col}/{doc} {
      allow read, write: if col in ['signals','alerts','journal','knowledge_base','mt5_candles'];
    }
  }
}
```

> 🔒 Want it fully private (only you)? Tell me and I'll add **Firebase Auth (email login)**
> so the rules can require a signed-in user. That's a small Phase-1.5 add-on.

---

## How it behaves
- ✅ Online with Firestore → data saves to the cloud, syncs across your phone + PC.
- ✅ Offline / Firestore blocked → the app automatically falls back to your browser's local
  storage so nothing breaks (you'll just not get cross-device sync).
- ⏱️ Signal **outcomes (TP/SL)** are checked every minute **while the app is open**.
  (For 24/7 tracking even when closed, we'd move this to the backend later.)

*Built on Arena.ai's Agent Mode.*
