import { CATEGORY_LABELS, filterByCategory, findById, countByCategory } from "./catalog.js";
import { formatPrice, buildOrderMessage, whatsappUrl } from "./format.js";
import { WHATSAPP_DISPLAY, ARTISAN_NAME } from "./config.js";

const grid = document.getElementById("catalog-grid");
const status = document.getElementById("catalog-status");

let allProducts = [];

/** Product image, or a branded tile when there is no photo yet. */
function mediaFor(product) {
  if (product.photo) {
    return `<img class="card__media" src="assets/products/${product.photo}"
                 alt="${product.name}" loading="lazy" />`;
  }
  // A <span>, not a <div>: the card is a <button>, which only accepts phrasing content.
  return `<span class="card__placeholder" aria-hidden="true">🦋<br />${product.name}</span>`;
}

function cardFor(product) {
  const soldOut = product.available
    ? ""
    : `<span class="card__sold-out">Agotado</span>`;
  return `
    <button class="card" data-id="${product.id}" type="button">
      ${mediaFor(product)}
      <span class="card__body">
        <span class="card__name">${product.name}</span>
        <span class="card__size">${product.size}</span>
        <span class="card__price">${formatPrice(product.price)}</span>
        ${soldOut}
      </span>
    </button>`;
}

export function renderGrid(products) {
  grid.innerHTML = products.map(cardFor).join("");
}

const filters = document.getElementById("filters");
let currentCategory = "all";

function renderFilters() {
  const counts = countByCategory(allProducts);
  const buttons = [["all", "Todos"], ...Object.entries(CATEGORY_LABELS)];
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
    : `<span class="card__placeholder" aria-hidden="true">🦋<br />${product.name}</span>`;

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
  return true;
}

export function closeDetail() {
  panel.hidden = true;
  document.body.style.overflow = "";
  // Return focus to the card that opened the panel, so the customer resumes
  // browsing where they left off instead of at the top of the document.
  if (opener && document.contains(opener)) opener.focus();
  opener = null;
}

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (card) openDetail(card.dataset.id);
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

async function start() {
  const whatsappGreeting = whatsappUrl(`Hola ${ARTISAN_NAME}, quisiera más información.`);
  for (const id of ["header-whatsapp", "footer-whatsapp"]) {
    document.getElementById(id).href = whatsappGreeting;
  }

  const response = await fetch("data/products.json");
  allProducts = await response.json();
  applyFilter("all");
}

start();
