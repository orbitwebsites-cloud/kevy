# Jet Fusion Cleaning — Instant Quote Estimator

A single-page **instant quote calculator** for Jet Fusion Cleaning (professional
pressure washing). Customers pick the services they want, enter a size where
needed, and see a live low–high estimate. A final call-to-action opens their SMS
app with the quote pre-filled so they can text to lock it in.

Everything runs **client-side** — no backend, no login, no build step. Three
static files: `index.html`, `style.css`, `script.js`.

## Editing for a new client

Everything you need is at the **top of [`script.js`](script.js)**.

```js
const PHONE = "+61477504558";          // full intl format, digits only
const BUSINESS = "Jet Fusion Cleaning";
const CURRENCY_CODE = "AUD";           // ISO currency code
const CALLOUT_MIN = 10;                // minimum charged on any job
```

`SERVICES` supports two pricing shapes so range-based flyers map cleanly:

- **`type: "flat"`** — a fixed selectable option, no size input. `price` is a
  `[low, high]` range.
  ```js
  { id: "drive-small", type: "flat", name: "Small Driveway",
    sub: "1 car", price: [60, 80] }
  ```
- **`type: "unit"`** — priced by a size the customer enters. `rate` is a
  `[low, high]` per-unit range; `price = qty × rate`, floored at `minimum`,
  and quantities above `cap` show a "contact for exact quote" state.
  ```js
  { id: "footpaths", type: "unit", name: "Footpaths", unit: "m²",
    unitPlural: "m²", rate: [2, 4], minimum: 10, cap: 300,
    hint: "Total footpath area in square metres." }
  ```

Every service produces a low–high estimate; the running total is the summed
range, floored at `CALLOUT_MIN`. Prices are rounded to the nearest $5.

### Current pricing

| Service | Type | Price |
|---|---|---|
| Small Driveway (1 car) | flat | $60–80 |
| Double Driveway (2 cars) | flat | $90–140 |
| Large Driveway (3+ cars) | flat | $150–220 |
| Patio / Concrete Area | flat | $80–150 |
| Footpaths | per m² | $2–4/m² |
| Fence Washing | per m | $5–10/m |
| Minimum call-out | — | $10 |

## Running locally

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploying

Static — publish the folder as-is on Vercel, Netlify, GitHub Pages, etc. No
build command, no framework, Root Directory `./`.
