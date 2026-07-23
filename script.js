/* =========================================================================
 *  EDIT THIS BLOCK FOR A NEW CLIENT
 * =========================================================================
 *  1. PHONE    – the number the "Text me" button opens in the SMS app.
 *                Full international format, digits only (e.g. +14155551234).
 *  2. BUSINESS – shown in the SMS message so you know which quote came in.
 *  3. SERVICES – each service:
 *       id       unique key (no spaces)
 *       name     label shown to the customer
 *       unit / unitPlural   what the number means (e.g. "sq ft", "vehicle")
 *       rate     price per unit
 *       minimum  floor price for the job (use 0 for none)
 *       cap      qty above this shows a "contact for exact quote" state
 *       hint     small helper text under the input
 * ========================================================================= */

const PHONE = "+15555550123";          // <-- TODO: set OB's real number
const BUSINESS = "OB Mobile Wash";     // <-- TODO: set the real business name

const SERVICES = [
  {
    id: "pressure",
    name: "Pressure Washing",
    unit: "sq ft",
    unitPlural: "sq ft",
    rate: 0.25,
    minimum: 0,
    cap: 6000,
    hint: "Approx. area to be pressure washed, in square feet.",
  },
  {
    id: "carwash",
    name: "Car Wash",
    unit: "vehicle",
    unitPlural: "vehicles",
    rate: 20,
    minimum: 0,
    cap: 20,
    hint: "How many vehicles?",
  },
  {
    id: "trashcan",
    name: "Trash Can Cleaning",
    unit: "bin",
    unitPlural: "bins",
    rate: 5,
    minimum: 0,
    cap: 40,
    hint: "How many bins to clean?",
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

// Round to the nearest whole dollar (prices here are small, so no $5 steps).
const roundMoney = (n) => Math.round(n);

/** Returns { price, isCapped } for a given service + quantity. */
function priceFor(service, qty) {
  const clampedQty = Math.min(qty, service.cap);
  const raw = Math.max(service.minimum, clampedQty * service.rate);
  return {
    price: roundMoney(raw),
    isCapped: qty > service.cap,
  };
}

/* -------------------------------------------------------------------------
 *  STATE + RENDER
 * ------------------------------------------------------------------------- */

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
    const rateLabel =
      svc.rate < 1
        ? `$${svc.rate.toFixed(2)}/${svc.unit}`
        : `${money(svc.rate)}/${svc.unit}`;
    row.innerHTML = `
      <button class="service__toggle" type="button" aria-expanded="false">
        <span class="service__check" aria-hidden="true"></span>
        <span class="service__meta">
          <span class="service__name">${svc.name}</span>
          <span class="service__rate">${rateLabel}</span>
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
      if (nowOn) setTimeout(() => input.focus(), 0);
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
    summaryNoteEl.textContent = "Text to lock it in.";
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
  window.location.href = `sms:${PHONE}?&body=${body}`;
});

/* -------------------------------------------------------------------------
 *  GO
 * ------------------------------------------------------------------------- */

buildRows();
render();
