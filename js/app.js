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
  currentCategory = category;
  const visible = filterByCategory(allProducts, category);
  renderGrid(visible);
  renderFilters();
  const label = category === "all" ? "productos" : CATEGORY_LABELS[category].toLowerCase();
  status.textContent = `${visible.length} ${label}`;
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (button) applyFilter(button.dataset.category);
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
