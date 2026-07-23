# Kevy — Free Quote Estimator

A single-page **instant quote calculator** for a window cleaning / pressure
washing business. The customer picks the services they want, enters a size for
each, and sees a live per-line price plus a running total. A final call-to-action
opens their SMS app with the quote pre-filled so they can text to lock it in.

Everything runs **client-side** — no backend, no login, no build step. Just three
static files (`index.html`, `style.css`, `script.js`).

## How it works

For each selected service:

```
price = max(minimum, quantity × rate)   →  rounded to the nearest $5
```

If the entered quantity is larger than the service's `cap`, the calculator shows
a **"$X+, contact for exact quote"** starting price instead of a raw number, and
the "Text me" button still works so the lead isn't lost.

## Page layout

It's a conversion-style landing page — sky-blue hero, stat band, the live quote
calculator, a value-comparison card, a "why choose us" trust list, and a badge
footer — all in a single scroll.

> **Placeholder marketing copy:** the headline, the stats (`700+`, `3,000+`,
> `6+`), the "why choose us" points, and the value-comparison figures live in
> [`index.html`](index.html). Replace them with the client's **real** numbers
> and claims before going live.

## Editing for a new client

The pricing + phone number live at the **top of [`script.js`](script.js)**; the
marketing copy lives in [`index.html`](index.html). The "Call" button and footer
year update themselves from `PHONE` automatically.

### 1. Phone number

```js
const PHONE = "+15555550123";   // full international format, digits only
const BUSINESS = "Kevy Exterior Cleaning";
```

`PHONE` is the number the **"Text me to lock in this quote"** button opens.
`BUSINESS` just labels the text message so you know which quote came in.

### 2. Services & pricing

`SERVICES` is a plain array — add, remove, reorder, or re-price rows freely:

```js
{
  id: "windows",             // unique key, no spaces
  name: "Window Cleaning",   // label shown to the customer
  unit: "window",            // singular unit name
  unitPlural: "windows",     // plural unit name
  rate: 14,                  // price per unit
  minimum: 249,              // floor price for the job
  cap: 60,                   // qty above this shows "$X+, contact us"
  hint: "Count exterior panes you want cleaned.",
}
```

The current pricing:

| Service | Input | Rate | Minimum | Cap |
|---|---|---|---|---|
| Window Cleaning | # of windows | $14 / window | $249 | 60 |
| Soft Washing (House) | sq ft of exterior | $0.28 / sq ft | $499 | 6000 |
| Roof Moss Removal | sq ft of roof | $0.35 / sq ft | $599 | 6000 |
| Gutter Cleaning | linear ft of gutters | $1.75 / linear ft | $249 | 400 |
| Driveway Pressure Washing | sq ft of driveway | $0.50 / sq ft | $299 | 6000 |

Save the file and refresh — no build required.

## Running locally

Open `index.html` directly in a browser, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploying

Any static host works (Vercel, Netlify, GitHub Pages, Cloudflare Pages). There's
no build command and no framework — publish the folder as-is.

```bash
vercel --prod
```
