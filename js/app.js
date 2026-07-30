import { CATEGORY_LABELS, filterByCategory, findById, countByCategory } from "./catalog.js";
import { formatPrice, buildOrderMessage, whatsappUrl } from "./format.js";
import { WHATSAPP_DISPLAY, ARTISAN_NAME } from "./config.js";

const grid = document.getElementById("catalog-grid");
const status = document.getElementById("catalog-status");

// Hoisted to module scope so both the empty-category state (renderGrid) and
// the fetch-failure state (start) can link straight to WhatsApp without
// duplicating the message.
const WHATSAPP_GREETING = whatsappUrl(`Hola ${ARTISAN_NAME}, quisiera más información.`);

let allProducts = [];

/* The brand's own watercolour, used where a photograph will eventually go.
   Rotated per product so no two read the same, and picked from a hash of the
   id rather than the list index so a product keeps its bloom when filtered. */
const BLOOMS = [
  "assets/butterfly.png",
  "assets/botanical-sprig-slim.png",
  "assets/botanical-rose-corner.png",
  "assets/botanical-sprig-tall.png",
];

function bloomFor(product) {
  let hash = 0;
  for (const ch of product.id) hash = (hash + ch.charCodeAt(0)) % BLOOMS.length;
  return BLOOMS[hash];
}

/** Product photograph, or the brand bloom while none exists. */
function mediaFor(product, cls) {
  if (product.photo) {
    return `<img class="${cls}" src="assets/products/${product.photo}"
                 alt="${product.name}" loading="lazy" />`;
  }
  return `<img class="band__bloom" src="${bloomFor(product)}" alt="" loading="lazy" />`;
}

function bandFor(product) {
  const soldOut = product.available
    ? ""
    : `<span class="band__sold-out">Agotado</span>`;
  const askPrice = product.price === null || product.price === undefined;
  return `
    <button class="band" data-id="${product.id}" type="button">
      <span class="band__art">${mediaFor(product, "band__photo")}</span>
      <span class="band__body">
        <span class="band__kicker">${CATEGORY_LABELS[product.category] ?? ""}</span>
        <span class="band__name">${product.name}</span>
        <span class="band__desc">${product.description}</span>
        <span class="band__meta">
          <span class="band__size">${product.size}</span>
          <span class="band__price${askPrice ? " band__price--ask" : ""}">${formatPrice(product.price)}</span>
          ${soldOut}
        </span>
        <span class="band__more">Ver detalles y pedir →</span>
      </span>
    </button>`;
}

const feature = document.getElementById("destacado");

/* The full-bleed opening block — the most valuable space on the page.

   Which product fills it is an explicit choice: set "featured": true on one
   entry in products.json. The fallback is the first product with a photograph,
   which was a fine rule while only one product had one, but now simply hands
   the best spot to whatever happens to sit first in the file. */
function renderFeature() {
  const product =
    allProducts.find((p) => p.featured && p.photo && p.available) ??
    allProducts.find((p) => p.photo && p.available);
  if (!feature || !product) return;

  feature.hidden = false;
  feature.innerHTML = `
    <div class="feature__media" style="background-image:url('assets/products/${product.photo}')">
      <div class="feature__veil">
        <div class="feature__inner">
          <p class="feature__eyebrow">${CATEGORY_LABELS[product.category] ?? "Destacado"}</p>
          <h2 class="feature__name">${product.name}</h2>
          <p class="feature__desc">${product.description}</p>
          <p class="feature__meta">${product.size} · ${formatPrice(product.price)}</p>
          <div class="feature__actions">
            <a class="btn btn--action" target="_blank" rel="noopener"
               href="${whatsappUrl(buildOrderMessage(product))}">Pedir por WhatsApp</a>
            <button class="feature__more" type="button" data-id="${product.id}">Ver detalles</button>
          </div>
        </div>
      </div>
    </div>`;

  feature.querySelector(".feature__more").addEventListener("click", (event) => {
    openDetail(event.currentTarget.dataset.id);
  });
}

function railCardFor(product) {
  const soldOut = product.available
    ? ""
    : `<span class="rail__sold-out">Agotado</span>`;
  const askPrice = product.price === null || product.price === undefined;
  const art = product.photo
    ? `<img class="rail__photo" src="assets/products/${product.photo}" alt="${product.name}" loading="lazy" />`
    : `<img class="rail__bloom" src="${bloomFor(product)}" alt="" loading="lazy" />`;
  return `
    <button class="band rail__card" data-id="${product.id}" type="button">
      <span class="rail__art">${art}</span>
      <span class="rail__body">
        <span class="rail__kicker">${CATEGORY_LABELS[product.category] ?? ""}</span>
        <span class="rail__name">${product.name}</span>
        <span class="rail__desc">${product.description}</span>
        <span class="rail__meta">
          <span class="rail__size">${product.size}</span>
          <span class="rail__price${askPrice ? " rail__price--ask" : ""}">${formatPrice(product.price)}</span>
          ${soldOut}
        </span>
      </span>
    </button>`;
}

export function renderGrid(products) {
  if (!products.length) {
    grid.innerHTML = emptyStateMarkup();
    grid.className = "bands";
    return;
  }
  grid.className = "rail";
  grid.innerHTML = products.map(railCardFor).join("");
  updateRailNav();
}

/* The arrows only exist for pointer users; touch users get the peeking card.
   They stay in sync with the scroll position so they can be disabled at the
   ends rather than silently doing nothing. */
const railNav = document.getElementById("rail-nav");

function updateRailNav() {
  if (!railNav) return;
  const atStart = grid.scrollLeft <= 4;
  const atEnd = grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 4;
  railNav.hidden = grid.scrollWidth <= grid.clientWidth + 4;
  railNav.querySelector("[data-dir='-1']").disabled = atStart;
  railNav.querySelector("[data-dir='1']").disabled = atEnd;
}

if (railNav) {
  railNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dir]");
    if (!button) return;
    const card = grid.querySelector(".rail__card");
    const step = card ? card.getBoundingClientRect().width + 16 : grid.clientWidth * 0.8;
    grid.scrollBy({ left: step * Number(button.dataset.dir) });
  });
  grid.addEventListener("scroll", updateRailNav, { passive: true });
  window.addEventListener("resize", updateRailNav);
}

const filters = document.getElementById("filters");
let currentCategory = "all";

function renderFilters() {
  const counts = countByCategory(allProducts);
  // Only offer categories that actually hold something. Six chips for three
  // products, four of them leading nowhere, made the shop look like empty
  // shelves.
  const buttons = [["all", "Todos"], ...Object.entries(CATEGORY_LABELS)]
    .filter(([key]) => key === "all" || counts[key] > 0);
  filters.innerHTML = buttons
    .map(([key, label]) => `
      <button class="filter" type="button" data-category="${key}"
              aria-pressed="${key === currentCategory}">
        ${label} (${counts[key] ?? 0})
      </button>`)
    .join("");
}

export function applyFilter(category) {
  // Rebuilding the buttons below throws away the focused element, which would
  // drop a keyboard user back to the top of the document on every filter they
  // try. Remember whether focus was inside the group so it can be restored.
  const hadFocus = document.activeElement && filters.contains(document.activeElement);

  currentCategory = category;
  const visible = filterByCategory(allProducts, category);
  renderGrid(visible);
  renderFilters();

  if (hadFocus) {
    const restored = filters.querySelector(`[data-category="${category}"]`);
    if (restored) restored.focus();
  }
  // Always count "producto(s)" and name the category separately. Using the
  // category label as the counted noun produces broken Spanish — "1 jabones",
  // and worse for Cabello, where "1 cabello" means nothing at all.
  const noun = visible.length === 1 ? "producto" : "productos";
  status.textContent =
    category === "all"
      ? `${visible.length} ${noun}`
      : `${visible.length} ${noun} en ${CATEGORY_LABELS[category]}`;
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (button) applyFilter(button.dataset.category);
});

// Detail panel
const panel = document.getElementById("detail-panel");
const panelContent = document.getElementById("detail-content");

function detailMarkup(product) {
  const media = product.photo
    ? `<img class="detail__media" src="assets/products/${product.photo}" alt="${product.name}" />`
    : `<div class="detail__bloom"><img src="${bloomFor(product)}" alt="" /></div>`;

  const note = product.artisanNote
    ? `<p class="detail__note"><strong>Recomendación de la artesana:</strong>
         ${product.artisanNote}</p>`
    : "";

  const tags = product.ingredients.length
    ? `<ul class="tags">${product.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>`
    : "";

  const orderLabel = product.available ? "Pedir por WhatsApp" : "Preguntar disponibilidad";

  return `
    ${media}
    <h2 id="detail-title">${product.name}</h2>
    <p class="card__size">${product.size}</p>
    <p class="detail__price">${formatPrice(product.price)}</p>
    <p>${product.description}</p>
    ${tags}
    ${note}
    <div class="detail__actions">
      <a class="btn btn--action" id="detail-order" target="_blank" rel="noopener"
         href="${whatsappUrl(buildOrderMessage(product))}">${orderLabel}</a>
      <button class="btn btn--quiet" id="detail-copy" type="button">Copiar enlace</button>
    </div>`;
}

// The card that opened the panel, so focus can go back where it came from.
let opener = null;
// Whether WE pushed the current history entry, and so may unwind it on close.
let pushedForPanel = false;

export function openDetail(id) {
  const product = findById(allProducts, id);
  if (!product) return false;
  opener = document.activeElement;
  panelContent.innerHTML = detailMarkup(product);
  panel.hidden = false;
  document.body.style.overflow = "hidden";
  // The panel claims aria-modal, so focus has to move into it. Without this a
  // keyboard user would have to tab through the whole page behind to reach it,
  // and a screen reader would never announce that anything had opened.
  document.getElementById("detail-close").focus();
  document.getElementById("detail-copy").addEventListener("click", async (event) => {
    const url = `${location.origin}${location.pathname}?p=${product.id}`;
    try {
      await navigator.clipboard.writeText(url);
      event.target.textContent = "¡Enlace copiado!";
    } catch {
      event.target.textContent = url;
    }
  });
  if (new URLSearchParams(location.search).get("p") !== product.id) {
    history.pushState({ product: product.id }, "", `?p=${product.id}`);
    pushedForPanel = true;
  }
  return true;
}

/** Hide the panel and put focus back. Touches no history. */
function hidePanel() {
  panel.hidden = true;
  document.body.style.overflow = "";
  // Return focus to the card that opened the panel, so the customer resumes
  // browsing where they left off instead of at the top of the document.
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}

export function closeDetail() {
  // Closing must UNWIND the history entry that opening added, not stack a new
  // one on top. Pushing on close means every product a customer views leaves
  // two entries behind, so tapping Back to return to Instagram instead reopens
  // the panels one by one.
  if (pushedForPanel) {
    pushedForPanel = false;
    history.back();          // popstate calls hidePanel()
    return;
  }

  // No entry of ours to unwind — the customer arrived straight from a shared
  // ?p= link, so this is the first page in their history. Going back would
  // throw them out of the site entirely; rewrite the URL in place instead.
  hidePanel();
  if (new URLSearchParams(location.search).has("p")) {
    history.replaceState({}, "", location.pathname);
  }
}

grid.addEventListener("click", (event) => {
  const band = event.target.closest(".band");
  if (band) openDetail(band.dataset.id);
});

document.getElementById("detail-close").addEventListener("click", closeDetail);
panel.addEventListener("click", (event) => {
  if (event.target === panel) closeDetail();
});
document.addEventListener("keydown", (event) => {
  if (panel.hidden) return;

  if (event.key === "Escape") {
    closeDetail();
    return;
  }

  // Keep Tab inside the panel. It is marked aria-modal, and without this a
  // keyboard user tabs straight out of it into the footer behind — able to
  // operate a page they are being told is blocked.
  if (event.key !== "Tab") return;
  const focusable = panel.querySelectorAll("button, a[href]");
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("p");
  if (id && openDetail(id)) return;
  // Either there is no id, or id names a product that no longer exists (a
  // stale ?p= link after a rename or removal) — either way there is nothing
  // to unwind, and the panel must not be left showing.
  pushedForPanel = false;
  hidePanel();
});

/** Open the product named in ?p= when someone arrives from a shared link. */
function openFromUrl() {
  const id = new URLSearchParams(location.search).get("p");
  if (!id) return;
  if (!openDetail(id)) {
    status.textContent = "Ese producto ya no está disponible. Aquí está el catálogo completo.";
  }
}

/* Tell search engines what each product is, generated from the same data the
   page renders so the two can never disagree.

   Deliberately no `offers` block: Google needs a price to show a product rich
   result, and every price here is still unknown. Emitting an offer with no
   price would be markup that claims more than the page can back up. The moment
   prices land in products.json this starts producing them with no code change. */
function describeProducts() {
  const base = location.origin + location.pathname;
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catálogo Monarca",
    numberOfItems: allProducts.length,
    itemListElement: allProducts.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description,
        url: `${base}?p=${product.id}`,
        ...(product.photo && { image: `${base}assets/products/${product.photo}` }),
        material: product.ingredients.join(", "),
        brand: { "@type": "Brand", name: "Monarca" },
      },
    })),
  };

  const tag = document.createElement("script");
  tag.type = "application/ld+json";
  tag.textContent = JSON.stringify(data);
  document.head.appendChild(tag);
}

async function start() {
  for (const id of ["header-whatsapp", "footer-whatsapp"]) {
    document.getElementById(id).href = WHATSAPP_GREETING;
  }
  // The footer link's visible text is set here too, next to the href, so the
  // two can never drift apart if the number in config.js ever changes.
  document.getElementById("footer-whatsapp").textContent = `WhatsApp ${WHATSAPP_DISPLAY}`;

  try {
    const response = await fetch("data/products.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allProducts = await response.json();
  } catch (error) {
    console.error("No se pudo cargar el catálogo:", error);
    status.textContent =
      `No pudimos cargar el catálogo en este momento. ` +
      `Escríbenos por WhatsApp al ${WHATSAPP_DISPLAY} y te ayudamos.`;
    grid.innerHTML = `
      <p><a class="btn btn--action" href="${WHATSAPP_GREETING}">Escribir por WhatsApp</a></p>`;
    return;
  }

  renderFeature();
  applyFilter("all");
  openFromUrl();
  describeProducts();
}

start();
