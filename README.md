# InfiTech Creatives – Invoice Generator

A small, mobile-friendly invoice app for **InfiTech Creatives**.
Built with React + Vite + Tailwind CSS. All data stays in your browser's
`localStorage`, so there's no backend and no login.

## Features

- Create invoices with auto numbers (`INV-2026-001`, `INV-2026-002`, …)
- Client details with **saved clients** (type a name and pick it to auto-fill)
- Line items with **quick-add saved services** and default prices
- Optional discount (₹ or %) and GST (18% by default, can be switched off)
- Automatic subtotal, tax, total and amount in words (Indian format)
- Status: Unpaid / Partially Paid / Paid, plus the amount received
- A4 invoice preview with logo, bank/UPI details and a **PAID** stamp
- **Download PDF** (`INV-2026-001_Client_Name.pdf`)
- **Share on WhatsApp**: downloads the PDF, then opens WhatsApp with the client's number and a ready-made message
- Dashboard with search, status filter and totals (billed / received / pending)
- Edit, duplicate and delete invoices
- Settings page for business details, GSTIN, bank details and UPI ID
- **Backup**: export all data to a JSON file and import it back

## Run locally

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

To try it on your phone over the same Wi-Fi, run `npm run dev -- --host` and
open the "Network" URL on the phone.

Production build:

```bash
npm run build
npm run preview
```

## Deploy for free

The app is a static site (the `dist` folder). It uses hash-based URLs
(`/#/settings`), so no redirect rules are needed.

### Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo.
3. Vercel detects Vite automatically (build command `npm run build`, output `dist`). Click **Deploy**.

### Netlify

1. Push this repo to GitHub.
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → pick the repo.
3. Build command: `npm run build`, publish directory: `dist`. Click **Deploy**.

Tip: on your phone, open the deployed site and use **Add to Home Screen** so it opens like an app.

## Your data

- Everything is stored in the browser you use. Data on your phone and on your laptop is separate.
- Clearing browser data or site data **deletes your invoices**. Use **Settings → Backup → Export JSON** regularly, and **Import JSON** to restore or move to another device.
- Importing replaces all current data.

## Customising

- Business details, bank/UPI, default GST %, due days and notes: **Settings** page in the app.
- Logos: `public/logo-horizontal.png` (invoice and header) and `public/logo-icon.png` (favicon).
- Invoice layout: `src/components/InvoicePreview.jsx`.
- Default services list: `src/lib/store.jsx` (or edit them in Settings).
