# Firebase Authentication — Setup Guide

## What was added

| File | Purpose |
|------|---------|
| `frontend/src/lib/firebase.js` | Firebase init, auth helpers, role detection |
| `frontend/src/lib/AuthContext.jsx` | React context — exposes `user`, `role`, `loading` |
| `frontend/src/components/LoginPage.jsx` | Login screen with two distinct buttons |
| `frontend/src/App.jsx` | Updated — auth guard + role-based page gating |
| `frontend/src/main.jsx` | Updated — wraps app in `<AuthProvider>` |
| `frontend/src/components/NavRail.jsx` | Updated — user chip, role badge, sign-out button, hidden menu items for customers |
| `frontend/src/components/ComplaintDetail.jsx` | Updated — customers can only add notes; status & owner changes are manager-only |
| `frontend/.env.example` | Template for your Firebase credentials |

---

## How roles work

| Who | How they sign in | What they see |
|-----|-----------------|---------------|
| **Manager** (`psm@nxtwave.in`) | Email/Password (auto-fired, no form) | Full platform — every page |
| **Customer** | Google Sign-In (popup) | Dashboard, Booking, AWB, Quotation, Complaints, AI Tools, Weight Calc, etc. |

Manager-only pages (hidden from customers): Customer CRM, Airport Pickup, Warehouse, Invoice, Workflow, Agent Portal, Rate Manager, Partners, Cargo Cleaner, Insights, Reminders.

In `ComplaintDetail`, **customers can add notes** (to send queries) but **cannot change status or assign owners** — those actions are manager-only.

---

## Step-by-step Firebase setup

### 1 — Create a Firebase project
1. Open [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `cargo-ops`) → Continue
3. Disable Google Analytics if you don't need it → **Create project**

### 2 — Register a Web App
1. In the project overview, click the **</>** (Web) icon
2. Enter app nickname: `Cargo Ops Frontend`
3. Click **Register app**
4. Copy the `firebaseConfig` object values — you'll need them next

### 3 — Create `.env` file
```bash
cd frontend
cp .env.example .env
# Now paste your real values into .env
```

### 4 — Enable Authentication providers
1. In Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** tab:
   - Enable **Email/Password**
   - Enable **Google** (set your support email)

### 5 — Create the Manager account
1. Authentication → **Users** tab → **Add user**
   - Email: `psm@nxtwave.in`
   - Password: `nxtwave123!`
2. Click **Add user** — that's it. The credentials are hardcoded in `firebase.js` and will auto-login when the manager clicks the button.

### 6 — Install and run
```bash
cd frontend
npm install      # picks up firebase ^10.14.1
npm run dev
```

---

## Authorized domains (for production)
Firebase blocks Google sign-in from unknown domains.

1. Authentication → **Settings** → **Authorized domains**
2. Add your deployed domain (e.g. `cargo-ops.vercel.app`)

`localhost` is already whitelisted for development.

---

## Security notes

- The manager password lives in `firebase.js` (client-side). This is acceptable for an internal ops tool, but if you need stricter security, move manager login to a server-side custom token flow.
- Google OAuth tokens are handled entirely by Firebase — no tokens touch your backend.
- To protect backend routes, pass `user.getIdToken()` in the `Authorization` header and verify it server-side with the Firebase Admin SDK.
