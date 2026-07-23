/* =========================================================================
 *  EDIT THIS BLOCK FOR A NEW CLIENT
 * =========================================================================
 *  1. PHONE   – the number the "Text me" button opens in the SMS app.
 *               Use full international format, digits only (e.g. +14155551234).
 *  2. BUSINESS – shown in the SMS message so you know which quote came in.
 *  3. SERVICES – add / remove / re-price rows. Each service:
 *       id       unique key (no spaces)
 *       name     label shown to the customer
 *       unit     what the number means ("window", "sq ft", "linear ft")
 *       unitPlural  plural form for the unit
 *       rate     price per unit
 *       minimum  the floor price for the job
 *       cap      max quantity before we show a "contact us" starting price
 *       hint     small helper text under the input
 * ========================================================================= */

const PHONE = "+17789832593"; // 778-983-2593
const BUSINESS = "Kevy Exterior Cleaning";

const SERVICES = [
  {
    id: "windows",
    name: "Window Cleaning",
    unit: "window",
    unitPlural: "windows",
    rate: 14,
    minimum: 249,
    cap: 60,
    hint: "Count exterior panes you want cleaned.",
  },
  {
    id: "softwash",
    name: "Soft Washing (House)",
    unit: "sq ft",
    unitPlural: "sq ft",
    rate: 0.28,
    minimum: 499,
    cap: 6000,
    hint: "Approx. square footage of the home's exterior.",
  },
  {
    id: "roofmoss",
    name: "Roof Moss Removal",
    unit: "sq ft",
    unitPlural: "sq ft",
    rate: 0.35,
    minimum: 599,
    cap: 6000,
    hint: "Approx. square footage of roof surface.",
  },
  {
    id: "gutters",
    name: "Gutter Cleaning",
    unit: "linear ft",
    unitPlural: "linear ft",
    rate: 1.75,
    minimum: 249,
    cap: 400,
    hint: "Total run of gutters around the home.",
  },
  {
    id: "driveway",
    name: "Driveway Pressure Washing",
    unit: "sq ft",
    unitPlural: "sq ft",
    rate: 0.5,
    minimum: 299,
    cap: 6000,
    hint: "Approx. square footage of the driveway.",
  },
];

/* =========================================================================
 *  PRICING ENGINE  (you shouldn't need to touch anything below here)
 * ========================================================================= */

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const money = (n) => CURRENCY.format(n);

// Round to the nearest $5.
const roundTo5 = (n) => Math.round(n / 5) * 5;

/**
 * Returns { price, isCapped } for a given service + quantity.
 * price is always the $5-rounded number to display / add to the total.
 */
function priceFor(service, qty) {
  const clampedQty = Math.min(qty, service.cap);
  const raw = Math.max(service.minimum, clampedQty * service.rate);
  return {
    price: roundTo5(raw),
    isCapped: qty > service.cap,
  };
}

/* -------------------------------------------------------------------------
 *  STATE + RENDER
 * ------------------------------------------------------------------------- */

// selected[id] = true/false ; quantities[id] = number
const selected = {};
const quantities = {};

const servicesEl = document.getElementById("services");
const grandTotalEl = document.getElementById("grandTotal");
const summaryNoteEl = document.getElementById("summaryNote");
const ctaEl = document.getElementById("cta");

function buildRows() {
  SERVICES.forEach((svc) => {
    const row = document.createElement("div");
    row.className = "service";
    row.dataset.id = svc.id;
    row.innerHTML = `
      <button class="service__toggle" type="button" aria-expanded="false">
        <span class="service__check" aria-hidden="true"></span>
        <span class="service__meta">
          <span class="service__name">${svc.name}</span>
          <span class="service__rate">$${svc.rate}/${svc.unit} &middot; ${money(svc.minimum)} min</span>
        </span>
        <span class="service__price" data-role="price"></span>
      </button>
      <div class="service__panel" hidden>
        <label class="field">
          <span class="field__label">Number of ${svc.unitPlural}</span>
          <input class="field__input" type="number" inputmode="numeric"
                 min="0" step="1" placeholder="0" data-role="input" />
        </label>
        <p class="field__hint">${svc.hint}</p>
      </div>
    `;
    servicesEl.appendChild(row);

    const toggle = row.querySelector(".service__toggle");
    const panel = row.querySelector(".service__panel");
    const input = row.querySelector('[data-role="input"]');

    toggle.addEventListener("click", () => {
      const nowOn = !selected[svc.id];
      selected[svc.id] = nowOn;
      row.classList.toggle("is-selected", nowOn);
      toggle.setAttribute("aria-expanded", String(nowOn));
      panel.hidden = !nowOn;
      if (nowOn) {
        // focus the input for a snappy flow on mobile
        setTimeout(() => input.focus(), 0);
      }
      render();
    });

    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      quantities[svc.id] = isNaN(val) || val < 0 ? 0 : val;
      render();
    });
  });
}

function render() {
  let total = 0;
  let anyCapped = false;
  let count = 0;

  SERVICES.forEach((svc) => {
    const row = servicesEl.querySelector(`.service[data-id="${svc.id}"]`);
    const priceEl = row.querySelector('[data-role="price"]');
    const qty = quantities[svc.id] || 0;

    if (!selected[svc.id]) {
      priceEl.textContent = "";
      priceEl.classList.remove("is-capped");
      return;
    }

    count += 1;
    const { price, isCapped } = priceFor(svc, qty);
    total += price;

    if (isCapped) {
      anyCapped = true;
      priceEl.textContent = `${money(price)}+`;
      priceEl.classList.add("is-capped");
    } else {
      priceEl.textContent = money(price);
      priceEl.classList.remove("is-capped");
    }
  });

  grandTotalEl.textContent = anyCapped ? `${money(total)}+` : money(total);

  if (count === 0) {
    summaryNoteEl.textContent = "Pick a service above to get started.";
    ctaEl.disabled = true;
  } else if (anyCapped) {
    summaryNoteEl.textContent =
      "One or more jobs are larger than our instant range — text us for an exact quote.";
    ctaEl.disabled = false;
  } else {
    summaryNoteEl.textContent = "Rounded to the nearest $5. Text to lock it in.";
    ctaEl.disabled = false;
  }
}

/* -------------------------------------------------------------------------
 *  SMS DEEP LINK
 * ------------------------------------------------------------------------- */

function buildMessage() {
  const lines = [`Hi ${BUSINESS}, I'd like to lock in this quote:`];
  let total = 0;
  let anyCapped = false;

  SERVICES.forEach((svc) => {
    if (!selected[svc.id]) return;
    const qty = quantities[svc.id] || 0;
    const { price, isCapped } = priceFor(svc, qty);
    total += price;
    if (isCapped) anyCapped = true;

    const qtyLabel = `${qty} ${qty === 1 ? svc.unit : svc.unitPlural}`;
    const priceLabel = isCapped ? `${money(price)}+` : money(price);
    lines.push(`- ${svc.name} (${qtyLabel}): ${priceLabel}`);
  });

  lines.push(`Total: ${anyCapped ? money(total) + "+" : money(total)}`);
  return lines.join("\n");
}

ctaEl.addEventListener("click", () => {
  const body = encodeURIComponent(buildMessage());
  // "&" separator is the most broadly compatible for the sms: scheme body param.
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

buildRows();
render();
