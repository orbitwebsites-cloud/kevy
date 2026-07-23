/* =========================================================================
 *  EDIT THIS BLOCK FOR A NEW CLIENT
 * =========================================================================
 *  PHONE          the number the "Text me" button opens (intl format, digits)
 *  BUSINESS       shown in the SMS so you know which quote came in
 *  CURRENCY_CODE  ISO code for money formatting ("AUD", "USD", ...)
 *  CALLOUT_MIN    minimum total charged on any job (call-out fee floor)
 *
 *  SERVICES supports two pricing shapes:
 *    type: "flat"  – a fixed selectable option (no size input). Price is a
 *                    [low, high] range, e.g. a "1 car driveway".
 *    type: "unit"  – priced by a size the customer enters. rate is a
 *                    [low, high] per-unit range; price = qty x rate.
 *  Both produce a low–high estimate so range-based flyers map cleanly.
 * ========================================================================= */

const PHONE = "+61477504558";            // 0477 504 558
const BUSINESS = "Jet Fusion Cleaning";
const CURRENCY_CODE = "AUD";
const CALLOUT_MIN = 10;                   // minimum call-out applies to all jobs

const SERVICES = [
  {
    id: "drive-small",
    type: "flat",
    name: "Small Driveway",
    sub: "1 car",
    price: [60, 80],
  },
  {
    id: "drive-double",
    type: "flat",
    name: "Double Driveway",
    sub: "2 cars",
    price: [90, 140],
  },
  {
    id: "drive-large",
    type: "flat",
    name: "Large Driveway",
    sub: "3+ cars",
    price: [150, 220],
  },
  {
    id: "patio",
    type: "flat",
    name: "Patio / Concrete Area",
    sub: "Standard size",
    price: [80, 150],
  },
  {
    id: "footpaths",
    type: "unit",
    name: "Footpaths",
    unit: "m²",
    unitPlural: "m²",
    rate: [2, 4],           // $2–4 per m²
    minimum: CALLOUT_MIN,
    cap: 300,
    hint: "Total footpath area in square metres.",
  },
  {
    id: "fence",
    type: "unit",
    name: "Fence Washing",
    unit: "m",
    unitPlural: "m",
    rate: [5, 10],          // $5–10 per metre
    minimum: CALLOUT_MIN,
    cap: 150,
    hint: "Total length of fence in metres.",
  },
];

/* =========================================================================
 *  PRICING ENGINE  (you shouldn't need to touch anything below here)
 * ========================================================================= */

const CURRENCY = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: CURRENCY_CODE,
  maximumFractionDigits: 0,
});

const money = (n) => CURRENCY.format(n);
const roundTo5 = (n) => Math.round(n / 5) * 5;

// Format a [low, high] pair as "$60" (if equal) or "$60–$80".
function rangeLabel(low, high) {
  return low === high ? money(low) : `${money(low)}–${money(high)}`;
}

/**
 * Returns { low, high, isCapped } for a service + quantity.
 * Flat services ignore qty. Unit services clamp qty at the cap.
 */
function priceFor(service, qty) {
  if (service.type === "flat") {
    return {
      low: roundTo5(service.price[0]),
      high: roundTo5(service.price[1]),
      isCapped: false,
    };
  }
  const clampedQty = Math.min(qty, service.cap);
  const low = Math.max(service.minimum, clampedQty * service.rate[0]);
  const high = Math.max(service.minimum, clampedQty * service.rate[1]);
  return {
    low: roundTo5(low),
    high: roundTo5(high),
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

function rateBlurb(svc) {
  if (svc.type === "flat") return rangeLabel(svc.price[0], svc.price[1]);
  return `$${svc.rate[0]}–${svc.rate[1]}/${svc.unit} · ${money(svc.minimum)} min`;
}

function buildRows() {
  SERVICES.forEach((svc) => {
    const row = document.createElement("div");
    row.className = "service";
    row.dataset.id = svc.id;

    const metaSub = svc.type === "flat" ? svc.sub : rateBlurb(svc);

    row.innerHTML = `
      <button class="service__toggle" type="button" aria-expanded="false">
        <span class="service__check" aria-hidden="true"></span>
        <span class="service__meta">
          <span class="service__name">${svc.name}</span>
          <span class="service__rate">${metaSub}</span>
        </span>
        <span class="service__price" data-role="price">${
          svc.type === "flat" ? rangeLabel(svc.price[0], svc.price[1]) : ""
        }</span>
      </button>
      ${
        svc.type === "unit"
          ? `<div class="service__panel" hidden>
               <label class="field">
                 <span class="field__label">Size in ${svc.unitPlural}</span>
                 <input class="field__input" type="number" inputmode="numeric"
                        min="0" step="1" placeholder="0" data-role="input" />
               </label>
               <p class="field__hint">${svc.hint}</p>
             </div>`
          : ""
      }
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
      if (panel) panel.hidden = !nowOn;
      if (nowOn && input) setTimeout(() => input.focus(), 0);
      render();
    });

    if (input) {
      input.addEventListener("input", () => {
        const val = parseFloat(input.value);
        quantities[svc.id] = isNaN(val) || val < 0 ? 0 : val;
        render();
      });
    }
  });
}

function render() {
  let totalLow = 0;
  let totalHigh = 0;
  let anyCapped = false;
  let count = 0;

  SERVICES.forEach((svc) => {
    const row = servicesEl.querySelector(`.service[data-id="${svc.id}"]`);
    const priceEl = row.querySelector('[data-role="price"]');

    if (!selected[svc.id]) {
      // flat rows keep their static range label; unit rows clear
      if (svc.type === "unit") {
        priceEl.textContent = "";
        priceEl.classList.remove("is-capped");
      }
      priceEl.classList.remove("is-active");
      return;
    }

    count += 1;
    priceEl.classList.add("is-active");
    const qty = quantities[svc.id] || 0;
    const { low, high, isCapped } = priceFor(svc, qty);
    totalLow += low;
    totalHigh += high;

    if (isCapped) {
      anyCapped = true;
      priceEl.textContent = `${money(high)}+`;
      priceEl.classList.add("is-capped");
    } else {
      priceEl.textContent = rangeLabel(low, high);
      priceEl.classList.remove("is-capped");
    }
  });

  // enforce the call-out minimum on the whole job
  if (count > 0) {
    totalLow = Math.max(totalLow, CALLOUT_MIN);
    totalHigh = Math.max(totalHigh, CALLOUT_MIN);
  }

  grandTotalEl.textContent = anyCapped
    ? `${money(totalHigh)}+`
    : rangeLabel(totalLow, totalHigh);

  if (count === 0) {
    summaryNoteEl.textContent = "Pick a service above to get started.";
    ctaEl.disabled = true;
  } else if (anyCapped) {
    summaryNoteEl.textContent =
      "One or more jobs are larger than our instant range — message us for an exact quote.";
    ctaEl.disabled = false;
  } else {
    summaryNoteEl.textContent = `Estimate range · ${money(CALLOUT_MIN)} minimum call-out. WhatsApp to lock it in.`;
    ctaEl.disabled = false;
  }
}

/* -------------------------------------------------------------------------
 *  SMS DEEP LINK
 * ------------------------------------------------------------------------- */

function buildMessage() {
  const lines = [`Hi ${BUSINESS}, I'd like a quote for:`];
  let totalLow = 0;
  let totalHigh = 0;
  let anyCapped = false;

  SERVICES.forEach((svc) => {
    if (!selected[svc.id]) return;
    const qty = quantities[svc.id] || 0;
    const { low, high, isCapped } = priceFor(svc, qty);
    totalLow += low;
    totalHigh += high;
    if (isCapped) anyCapped = true;

    let label;
    if (svc.type === "flat") {
      label = `${svc.name} (${svc.sub})`;
    } else {
      const q = `${qty} ${svc.unitPlural}`;
      label = `${svc.name} (${q})`;
    }
    const priceLabel = isCapped ? `${money(high)}+` : rangeLabel(low, high);
    lines.push(`- ${label}: ${priceLabel}`);
  });

  totalLow = Math.max(totalLow, CALLOUT_MIN);
  totalHigh = Math.max(totalHigh, CALLOUT_MIN);
  const totalLabel = anyCapped ? `${money(totalHigh)}+` : rangeLabel(totalLow, totalHigh);
  lines.push(`Estimated total: ${totalLabel}`);
  return lines.join("\n");
}

ctaEl.addEventListener("click", () => {
  const body = encodeURIComponent(buildMessage());
  // WhatsApp deep link. wa.me needs the number in international format with
  // no "+", spaces or dashes — we derive it from PHONE automatically.
  const waNumber = PHONE.replace(/[^0-9]/g, "");
  window.location.href = `https://wa.me/${waNumber}?text=${body}`;
});

/* -------------------------------------------------------------------------
 *  GO
 * ------------------------------------------------------------------------- */

buildRows();
render();
