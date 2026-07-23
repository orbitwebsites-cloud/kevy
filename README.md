# Instant Wash Quote

A single-page **instant quote calculator** for a mobile pressure-washing / car-wash
business. The customer picks the services they want, enters an amount for each,
and sees a live per-line price plus a running total. A final call-to-action opens
their SMS app with the quote pre-filled so they can text to lock it in.

Everything runs **client-side** — no backend, no login, no build step. Three
static files: `index.html`, `style.css`, `script.js`.

## How it works

For each selected service:

```
price = max(minimum, quantity × rate)   →  rounded to the nearest $1
```

Quantities above a service's `cap` show a **"$X+, contact for exact quote"**
state, and the "Text me" button still works so the lead isn't lost.

## Current services & pricing

| Service | Input | Rate |
|---|---|---|
| Pressure Washing | sq ft | $0.25 / sq ft |
| Car Wash | vehicles | $20 each |
| Trash Can Cleaning | bins | $5 each |

## Editing for a new client

Everything is at the **top of [`script.js`](script.js)**.

```js
const PHONE = "+15555550123";    // TODO: real number, intl format, digits only
const BUSINESS = "OB Mobile Wash"; // TODO: real business name (shown in the SMS)
```

> **Set these before going live:** `PHONE` and `BUSINESS` are placeholders.

Then edit the `SERVICES` array — add, remove, or re-price rows freely:

```js
{
  id: "carwash",
  name: "Car Wash",
  unit: "vehicle",
  unitPlural: "vehicles",
  rate: 20,        // price per unit
  minimum: 0,      // floor price (0 = none)
  cap: 20,         // qty above this shows "contact for exact quote"
  hint: "How many vehicles?",
}
```

## Running locally

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploying

Static — publish the folder as-is on Vercel, Netlify, GitHub Pages, etc. No build
command, Root Directory `./`.
