/* =========================================================================
 *  EDIT THIS BLOCK FOR A NEW CLIENT
 * =========================================================================
 *  PHONE     the number the "Text me" / "Call" buttons use (intl, digits)
 *  BUSINESS  shown in the SMS so you know which quote came in
 *
 *  Pricing model (range-based, like a real inspection quote):
 *    range = base range  ×  home-size factor  ×  storey factor
 *  where storey factor only applies to height-sensitive work.
 *
 *  HOME_SIZES / STOREYS   – the buttons in steps 1 & 2, each with a factor
 *  SERVICES               – each has a [low, high] base range (for a Medium,
 *                           single-storey home), a tagline, and an
 *                           "includes" bullet list shown on the result card.
 *                           heightSensitive:false skips the storey factor
 *                           (e.g. driveways are always at ground level).
 * ========================================================================= */

const PHONE = "+17789832593";               // 778-983-2593
const BUSINESS = "Kevy Exterior Cleaning";

const HOME_SIZES = [
  { id: "small",  label: "Small",   sub: "Under 1,500 sq ft", factor: 0.8 },
  { id: "medium", label: "Medium",  sub: "1,500–2,500 sq ft", factor: 1.0 },
  { id: "large",  label: "Large",   sub: "2,500–4,000 sq ft", factor: 1.3 },
  { id: "xlarge", label: "X-Large", sub: "4,000+ sq ft",      factor: 1.6 },
];

const STOREYS = [
  { id: "1", label: "1 Storey",  factor: 1.0 },
  { id: "2", label: "2 Storeys", factor: 1.25 },
  { id: "3", label: "3 Storeys", factor: 1.5 },
];

const SERVICES = [
  {
    id: "windows",
    name: "Window Cleaning",
    tagline: "Streak-free glass, sparkle guaranteed",
    base: [180, 260],
    heightSensitive: true,
    includes: [
      "Exterior windows, streak-free finish",
      "Screens wiped down",
      "Sills & tracks detailed",
    ],
  },
  {
    id: "softwash",
    name: "Soft Washing (House)",
    tagline: "Curb appeal without the damage",
    base: [430, 620],
    heightSensitive: true,
    includes: [
      "Pro-grade soft-wash of all siding",
      "Won't damage paint or plants",
      "Plant protection before & after",
    ],
  },
  {
    id: "roofmoss",
    name: "Roof Moss Removal",
    tagline: "Protect your roof, kill the moss",
    base: [480, 700],
    heightSensitive: true,
    includes: [
      "Gentle moss & lichen treatment",
      "No pressure — protects your shingles",
      "Debris cleared from valleys",
    ],
  },
  {
    id: "gutters",
    name: "Gutter Cleaning",
    tagline: "Clear flow, no overflow",
    base: [180, 260],
    heightSensitive: true,
    includes: [
      "Full gutter cleaning, all debris cleared",
      "Downspouts flushed",
      "Waste bagged & hauled away",
    ],
  },
  {
    id: "driveway",
    name: "Driveway Pressure Washing",
    tagline: "Bring the concrete back to life",
    base: [240, 360],
    heightSensitive: false,
    includes: [
      "Deep pressure wash of driveway",
      "Oil & grime lifted",
      "Rinsed clean edge to edge",
    ],
  },
];

/* =========================================================================
 *  PRICING ENGINE  (you shouldn't need to touch anything below here)
 * ========================================================================= */

const CURRENCY = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});
const money = (n) => CURRENCY.format(n);
const roundTo5 = (n) => Math.round(n / 5) * 5;
const rangeLabel = (low, high) =>
  low === high ? money(low) : `${money(low)} – ${money(high)}`;

/** Returns [low, high] for a service given the chosen size + storey factors. */
function priceFor(service) {
  const size = HOME_SIZES.find((s) => s.id === state.size);
  const storey = STOREYS.find((s) => s.id === state.storey);
  if (!size || !storey) return [0, 0];
  const storeyFactor = service.heightSensitive ? storey.factor : 1;
  const mult = size.factor * storeyFactor;
  return [
    roundTo5(service.base[0] * mult),
    roundTo5(service.base[1] * mult),
  ];
}

/* -------------------------------------------------------------------------
 *  STATE
 * ------------------------------------------------------------------------- */

const state = {
  size: null,
  storey: null,
  services: {}, // id -> bool
  revealed: false,
};

const sizeChoicesEl = document.getElementById("sizeChoices");
const storyChoicesEl = document.getElementById("storyChoices");
const servicesEl = document.getElementById("services");
const estimateBtn = document.getElementById("estimateBtn");
const estimateHint = document.getElementById("estimateHint");
const resultsEl = document.getElementById("results");
const resultCardsEl = document.getElementById("resultCards");
const grandTotalEl = document.getElementById("grandTotal");
const ctaEl = document.getElementById("cta");

/* -------------------------------------------------------------------------
 *  BUILD THE INPUTS
 * ------------------------------------------------------------------------- */

function buildChoice(container, items, key) {
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice__btn";
    btn.dataset.id = item.id;
    btn.innerHTML = `<span class="choice__label">${item.label}</span>${
      item.sub ? `<span class="choice__sub">${item.sub}</span>` : ""
    }`;
    btn.addEventListener("click", () => {
      state[key] = item.id;
      container.querySelectorAll(".choice__btn").forEach((b) =>
        b.classList.toggle("is-on", b.dataset.id === item.id)
      );
      onInputChange();
    });
    container.appendChild(btn);
  });
}

function buildServices() {
  SERVICES.forEach((svc) => {
    const row = document.createElement("div");
    row.className = "service";
    row.dataset.id = svc.id;
    row.innerHTML = `
      <button class="service__toggle" type="button" aria-pressed="false">
        <span class="service__check" aria-hidden="true"></span>
        <span class="service__meta">
          <span class="service__name">${svc.name}</span>
          <span class="service__rate">${svc.tagline}</span>
        </span>
        <span class="service__price" data-role="price"></span>
      </button>
    `;
    servicesEl.appendChild(row);

    const toggle = row.querySelector(".service__toggle");
    toggle.addEventListener("click", () => {
      const now = !state.services[svc.id];
      state.services[svc.id] = now;
      row.classList.toggle("is-selected", now);
      toggle.setAttribute("aria-pressed", String(now));
      onInputChange();
    });
  });
}

/* -------------------------------------------------------------------------
 *  REACT TO INPUT CHANGES
 * ------------------------------------------------------------------------- */

function selectedServices() {
  return SERVICES.filter((s) => state.services[s.id]);
}

function ready() {
  return state.size && state.storey && selectedServices().length > 0;
}

function onInputChange() {
  // live per-service range preview once size + storey are chosen
  SERVICES.forEach((svc) => {
    const row = servicesEl.querySelector(`.service[data-id="${svc.id}"]`);
    const priceEl = row.querySelector('[data-role="price"]');
    if (state.size && state.storey && state.services[svc.id]) {
      const [low, high] = priceFor(svc);
      priceEl.textContent = rangeLabel(low, high);
    } else {
      priceEl.textContent = "";
    }
  });

  estimateBtn.disabled = !ready();
  estimateHint.textContent = ready()
    ? "Looks good — see your estimate."
    : "Choose a home size, storeys, and at least one service.";

  // if results are already showing, keep them in sync live
  if (state.revealed) renderResults();
}

/* -------------------------------------------------------------------------
 *  RESULTS
 * ------------------------------------------------------------------------- */

function totals() {
  let low = 0;
  let high = 0;
  selectedServices().forEach((svc) => {
    const [l, h] = priceFor(svc);
    low += l;
    high += h;
  });
  return [low, high];
}

function renderResults() {
  resultCardsEl.innerHTML = "";
  selectedServices().forEach((svc) => {
    const [low, high] = priceFor(svc);
    const card = document.createElement("article");
    card.className = "qcard";
    card.innerHTML = `
      <h3 class="qcard__name">${svc.name}</h3>
      <p class="qcard__tag">${svc.tagline}</p>
      <p class="qcard__range">${rangeLabel(low, high)}</p>
      <p class="qcard__note">Estimated range. Exact price confirmed at your free inspection.</p>
      <ul class="qcard__list">
        ${svc.includes
          .map(
            (i) => `<li><span class="tick tick--yes">&#10003;</span>${i}</li>`
          )
          .join("")}
      </ul>
    `;
    resultCardsEl.appendChild(card);
  });

  const [low, high] = totals();
  grandTotalEl.textContent = rangeLabel(low, high);
}

estimateBtn.addEventListener("click", () => {
  if (!ready()) return;
  state.revealed = true;
  resultsEl.hidden = false;
  renderResults();
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* -------------------------------------------------------------------------
 *  SMS DEEP LINK
 * ------------------------------------------------------------------------- */

function buildMessage() {
  const size = HOME_SIZES.find((s) => s.id === state.size);
  const storey = STOREYS.find((s) => s.id === state.storey);
  const lines = [
    `Hi ${BUSINESS}, I'd like to lock in this quote:`,
    `Home: ${size ? size.label : "?"} · ${storey ? storey.label : "?"}`,
  ];
  selectedServices().forEach((svc) => {
    const [low, high] = priceFor(svc);
    lines.push(`- ${svc.name}: ${rangeLabel(low, high)}`);
  });
  const [low, high] = totals();
  lines.push(`Estimated total: ${rangeLabel(low, high)}`);
  return lines.join("\n");
}

ctaEl.addEventListener("click", () => {
  const body = encodeURIComponent(buildMessage());
  window.location.href = `sms:${PHONE}?&body=${body}`;
});

/* -------------------------------------------------------------------------
 *  PAGE CHROME  (call button + footer year, kept in sync with PHONE)
 * ------------------------------------------------------------------------- */

const callBtn = document.getElementById("callBtn");
if (callBtn) callBtn.href = `tel:${PHONE}`;
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* -------------------------------------------------------------------------
 *  GO
 * ------------------------------------------------------------------------- */

buildChoice(sizeChoicesEl, HOME_SIZES, "size");
buildChoice(storyChoicesEl, STOREYS, "storey");
buildServices();
onInputChange();
