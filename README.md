# Kevy — Free Quote Estimator

A single-page **instant quote calculator** for a window cleaning / pressure
washing business. The customer picks the services they want, enters a size for
each, and sees a live per-line price plus a running total. A final call-to-action
opens their SMS app with the quote pre-filled so they can text to lock it in.

Everything runs **client-side** — no backend, no login, no build step. Just three
static files (`index.html`, `style.css`, `script.js`).

## How it works

The quote builder is a 3-step flow: **① home size → ② number of storeys →
③ services**. It then reveals a **price range** per service plus a combined
total range — the way a real inspection quote is presented:

```
range = base range  ×  home-size factor  ×  storey factor
```

The storey factor only applies to height-sensitive work (windows, soft wash,
roof, gutters) — driveways stay at ground level. Everything is rounded to the
nearest $5. Results say "Estimated range — exact price confirmed at your free
inspection," and the "Text me" button sends the full breakdown by SMS.

## Page layout

It's a conversion-style landing page — sky-blue hero, stat band, the 3-step quote
builder, a value-comparison card, a **Kevy vs. competitors** pros/cons table, and
a badge footer — all in a single scroll.

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
const PHONE = "+17789832593";   // full international format, digits only
const BUSINESS = "Kevy Exterior Cleaning";
```

`PHONE` drives both the **"Call"** and **"Text me to lock in this quote"**
buttons. `BUSINESS` labels the text message so you know which quote came in.

### 2. Home size & storey factors

The step 1 & 2 buttons — each just a label plus a multiplier:

```js
const HOME_SIZES = [
  { id: "medium", label: "Medium", sub: "1,500–2,500 sq ft", factor: 1.0 },
  ...
];
const STOREYS = [
  { id: "2", label: "2 Storeys", factor: 1.25 },
  ...
];
```

### 3. Services & pricing

Each service has a `[low, high]` **base range** (for a Medium, single-storey
home), a tagline, and the "includes" bullets shown on its result card:

```js
{
  id: "windows",
  name: "Window Cleaning",
  tagline: "Streak-free glass, sparkle guaranteed",
  base: [180, 260],          // low–high before size/storey factors
  heightSensitive: true,     // false = skip the storey factor (e.g. driveways)
  includes: ["Exterior windows, streak-free finish", "Screens wiped down", ...],
}
```

Current base ranges (Medium, 1-storey):

| Service | Base range | Storey-sensitive |
|---|---|---|
| Window Cleaning | $180–260 | yes |
| Soft Washing (House) | $430–620 | yes |
| Roof Moss Removal | $480–700 | yes |
| Gutter Cleaning | $180–260 | yes |
| Driveway Pressure Washing | $240–360 | no |

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
