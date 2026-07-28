# Monarca Catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, mobile-first product catalogue for Monarca where every product has a shareable URL and a WhatsApp order button pre-filled with that product's details.

**Architecture:** A single HTML page renders products from `data/products.json` at runtime. JavaScript is split into two pure, unit-tested ES modules (`format.js`, `catalog.js`) and one DOM-wiring module (`app.js`) that imports them. Product detail opens as a panel over the catalogue while `history.pushState` writes `?p=<id>` to the URL, so any product can be linked to directly without a build step or a server.

**Tech Stack:** Vanilla HTML5, CSS3 (custom properties), JavaScript ES modules. Tests with Node's built-in runner (`node --test`) — no dependencies to install. Google Fonts for typography. Python 3 + Pillow for one-off logo asset preparation. GitHub Pages for hosting.

> **Refinement of the spec:** the spec listed a single `app.js` at the repository root.
> This plan splits it into `js/config.js`, `js/format.js`, `js/catalog.js` and `js/app.js`
> so the logic can be unit-tested without a browser. Same behaviour, same no-build-step
> constraint; only the file boundaries changed.

## Global Constraints

These apply to every task without being repeated.

- **Site content is Spanish. Code is English.** File names, JSON keys, function names, variables, comments, commit messages and docs in English; every string the customer reads in Spanish.
- **No build step.** Adding a product must never require running a compiler or generator. Editing `data/products.json` and pushing is the entire update workflow.
- **No dependencies.** No npm packages, no frameworks, no CSS libraries. Tests use `node:test` and `node:assert`, which ship with Node.
- **Colour tokens, exact values:** `--paper: #FAF7FF`, `--ink: #222222`, `--ink-soft: #4A4458`, `--action: #A8551A`, `--butterfly: #D47625`, `--lilac: #B09DC6`, `--lilac-pale: #C9BADB`, `--sage: #8FA148`.
- **Contrast rule:** `--action` (`#A8551A`) is the only colour permitted for buttons, links and any interactive text. `--butterfly`, `--lilac`, `--lilac-pale` and `--sage` are decorative only and must never carry text — they fail WCAG AA at body size.
- **Single light theme.** No dark mode. Do not add `prefers-color-scheme` rules.
- **Mobile first.** Author the phone layout first; widen with `min-width` media queries only.
- **WhatsApp number:** `573227084613` (displayed as `322 708 4613`). Defined once, in `js/config.js`.
- **No medical claims.** Product and ingredient copy uses cosmetic language only. Never write "analgésico", "antiinflamatorio", "combate el acné", "antiséptico", "bactericida", or any claim to treat a condition.
- **Fonts:** Cormorant Garamond (headings), Karla (body/UI), loaded from Google Fonts. The logo script is never used as a text face.

---

### Task 1: Repository scaffolding, product data, and the JSON validator

**Files:**
- Create: `.gitignore`
- Create: `data/products.json`
- Create: `tools/validate-data.py`
- Create: `README.md`

**Interfaces:**
- Consumes: nothing
- Produces: `data/products.json` — an array of product objects matching the schema below. Every later task reads this shape.

Product schema, all fields required, `artisanNote` / `photo` / `price` nullable:

```
id          string   lowercase-hyphenated, unique, permanent (it is the public URL)
name        string   Spanish
category    string   "tonics" | "perfumes" | "oils" | "soaps" | "hair"
price       number|null   integer COP, e.g. 18000. null means "ask for the price"
size        string   e.g. "250 ml"
description string   Spanish, cosmetic language only
ingredients string[] Spanish
artisanNote string|null
photo       string|null   filename inside assets/products/
available   boolean
```

> **Deviation from the spec, deliberate:** the spec declared `price` a plain number. No
> prices are available yet, so `price` accepts `null` and the UI shows "Precio a consultar".
> Without this the catalogue could not be built until every price was collected.

- [ ] **Step 1: Create `.gitignore`**

```gitignore
# OS noise
.DS_Store
Thumbs.db
desktop.ini

# Editor
.vscode/
.idea/

# Source material not for publication
source-material/
```

- [ ] **Step 2: Transcribe the printed catalogue into `data/products.json`**

The printed catalogue is exported as 11 PNG pages at `/mnt/c/Users/santa/Downloads/1.png`
through `11.png`. Page 2 is the ingredient list, page 11 is the contact page; the rest are
one product each.

Read each product page with the Read tool and transcribe it. Rewrite any therapeutic claim
into cosmetic language before it enters the file (see Global Constraints).

Seed the file with this verified entry from page 5, then append one object per product page:

```json
[
  {
    "id": "agua-de-rosas",
    "name": "Agua de rosas",
    "category": "tonics",
    "price": null,
    "size": "250 ml",
    "description": "Tónico facial refrescante de aroma suave, elaborado de forma artesanal.",
    "ingredients": ["Rosa", "Agua destilada"],
    "artisanNote": "Hacer uso completo del producto para recibir los beneficios.",
    "photo": null,
    "available": true
  }
]
```

- [ ] **Step 3: Create the validator at `tools/validate-data.py`**

```python
#!/usr/bin/env python3
"""Validate data/products.json before publishing.

A malformed catalogue file fails silently in the browser — the page loads and
the grid is simply empty. This script turns that into a loud error.
"""
import json
import sys

CATEGORIES = {"tonics", "perfumes", "oils", "soaps", "hair"}
REQUIRED = {
    "id": str, "name": str, "category": str, "size": str,
    "description": str, "ingredients": list, "available": bool,
}
NULLABLE = {"price": int, "artisanNote": str, "photo": str}


def main(path="data/products.json"):
    try:
        with open(path, encoding="utf-8") as fh:
            products = json.load(fh)
    except json.JSONDecodeError as exc:
        print(f"INVALID JSON: {exc}")
        return 1

    if not isinstance(products, list):
        print("Top level must be a list of products.")
        return 1

    errors = []
    seen = set()
    for index, product in enumerate(products):
        label = product.get("id", f"index {index}")
        for field, kind in REQUIRED.items():
            if field not in product:
                errors.append(f"{label}: missing '{field}'")
            elif not isinstance(product[field], kind):
                errors.append(f"{label}: '{field}' must be {kind.__name__}")
        for field, kind in NULLABLE.items():
            if field not in product:
                errors.append(f"{label}: missing '{field}' (use null if unknown)")
            elif product[field] is not None and not isinstance(product[field], kind):
                errors.append(f"{label}: '{field}' must be {kind.__name__} or null")
        if product.get("category") not in CATEGORIES:
            errors.append(f"{label}: category must be one of {sorted(CATEGORIES)}")
        if product.get("id") in seen:
            errors.append(f"{label}: duplicate id")
        seen.add(product.get("id"))

    if errors:
        print(f"{len(errors)} problem(s):")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"OK — {len(products)} products, all valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))
```

> **Amended 2026-07-27 after review.** The validator above shipped with four gaps that a
> code review caught, all fixed in commit `24cf101`. The version in `tools/validate-data.py`
> is authoritative; this listing is the starting point it grew from. The fixes were:
> `price: true` passed because Python's `bool` subclasses `int`; the `id` format was never
> checked at all, so `"Agua De Rosas!"` was accepted as a public URL; `ingredients` element
> types were unchecked; and a non-dict entry in the array crashed with a raw traceback
> instead of the script's own error format.

- [ ] **Step 4: Run the validator and confirm it passes**

Run: `python3 tools/validate-data.py`
Expected: `OK — N products, all valid.`

- [ ] **Step 5: Prove the validator catches a real mistake**

Temporarily change one product's `"category"` to `"tonicos"` and run it again.
Expected: exit code 1 and a line reading `category must be one of ['oils', 'perfumes', 'tonics']`.
Then change it back and confirm it prints OK again.

- [ ] **Step 6: Write `README.md`**

```markdown
# Monarca — catálogo artesanal

Catálogo de productos artesanales de **Monarca** (Sandra Santamaría), con pedidos por
WhatsApp.

🔗 https://enterpricemonica.github.io/monarca

## Cómo agregar un producto

1. Abre `data/products.json`
2. Copia un producto existente y cambia sus datos
3. Valida el archivo: `python3 tools/validate-data.py`
4. Publica: `git add -A && git commit -m "Add product X" && git push`

El `id` es la dirección pública del producto. **No lo cambies después de compartirlo**, o
los enlaces que ya circulan dejarán de funcionar.

## Desarrollo

```bash
python3 -m http.server 8000    # el sitio usa módulos ES, no funciona con file://
node --test                    # pruebas de la lógica (autodescubre tests/)
python3 tools/validate-data.py # valida el catálogo
```
```

- [ ] **Step 7: Commit**

```bash
git add .gitignore data/products.json tools/validate-data.py README.md
git commit -m "Add product data, schema validator, and README"
```

---

### Task 2: Price formatting and WhatsApp message building

**Files:**
- Create: `js/config.js`
- Create: `js/format.js`
- Test: `tests/format.test.js`

**Interfaces:**
- Consumes: the product shape from Task 1
- Produces:
  - `WHATSAPP_NUMBER: string` — `"573227084613"` (from `js/config.js`)
  - `formatPrice(value: number|null): string`
  - `buildOrderMessage(product: object): string`
  - `whatsappUrl(message: string): string`

- [ ] **Step 1: Write the failing test at `tests/format.test.js`**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { formatPrice, buildOrderMessage, whatsappUrl } from "../js/format.js";

test("formatPrice uses Colombian thousands separators", () => {
  assert.equal(formatPrice(18000), "$18.000");
  assert.equal(formatPrice(7500), "$7.500");
  assert.equal(formatPrice(120000), "$120.000");
});

test("formatPrice invites a question when the price is unknown", () => {
  assert.equal(formatPrice(null), "Precio a consultar");
});

test("buildOrderMessage names the product, size and price", () => {
  const product = { name: "Agua de rosas", size: "250 ml", price: 18000 };
  assert.equal(
    buildOrderMessage(product),
    "Hola Sandra, me interesa el Agua de rosas (250 ml) — $18.000. ¿Está disponible?"
  );
});

test("buildOrderMessage asks for the price when there is none", () => {
  const product = { name: "Aceite de romero", size: "60 ml", price: null };
  assert.equal(
    buildOrderMessage(product),
    "Hola Sandra, me interesa el Aceite de romero (60 ml). ¿Cuál es el precio y está disponible?"
  );
});

test("whatsappUrl encodes the message and targets the business number", () => {
  const url = whatsappUrl("Hola ¿está disponible?");
  assert.equal(url, "https://wa.me/573227084613?text=Hola%20%C2%BFest%C3%A1%20disponible%3F");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/format.test.js`
Expected: FAIL — `Cannot find module .../js/format.js`

- [ ] **Step 3: Write `js/config.js`**

```javascript
// Business contact details. Defined once so a change never has to be hunted down.
export const WHATSAPP_NUMBER = "573227084613";
export const WHATSAPP_DISPLAY = "322 708 4613";
export const ARTISAN_NAME = "Sandra";
```

- [ ] **Step 4: Write the minimal implementation at `js/format.js`**

```javascript
import { WHATSAPP_NUMBER, ARTISAN_NAME } from "./config.js";

/** Format a COP amount the way Colombian shops write it: $18.000 */
export function formatPrice(value) {
  if (value === null || value === undefined) return "Precio a consultar";
  return `$${value.toLocaleString("es-CO")}`;
}

/**
 * Build the message the customer sends. It names the product so Sandra never
 * receives a bare "hola" she has to chase.
 */
export function buildOrderMessage(product) {
  const opening = `Hola ${ARTISAN_NAME}, me interesa el ${product.name} (${product.size})`;
  if (product.price === null || product.price === undefined) {
    return `${opening}. ¿Cuál es el precio y está disponible?`;
  }
  return `${opening} — ${formatPrice(product.price)}. ¿Está disponible?`;
}

/** wa.me link that opens WhatsApp with the message already written. */
export function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test tests/format.test.js`
Expected: PASS — 5 tests, 0 failures

- [ ] **Step 6: Commit**

```bash
git add js/config.js js/format.js tests/format.test.js
git commit -m "Add price formatting and WhatsApp message building"
```

---

### Task 3: Catalogue filtering and lookup

**Files:**
- Create: `js/catalog.js`
- Test: `tests/catalog.test.js`

**Interfaces:**
- Consumes: the product shape from Task 1
- Produces:
  - `CATEGORY_LABELS: Record<string, string>` — `{ tonics: "Tónicos", perfumes: "Perfumes", oils: "Aceites", soaps: "Jabones", hair: "Cabello" }`
  - `filterByCategory(products: object[], category: string): object[]` — `"all"` returns every product
  - `findById(products: object[], id: string): object|null`
  - `countByCategory(products: object[]): Record<string, number>` — includes an `all` key

- [ ] **Step 1: Write the failing test at `tests/catalog.test.js`**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_LABELS, filterByCategory, findById, countByCategory } from "../js/catalog.js";

const products = [
  { id: "agua-de-rosas", name: "Agua de rosas", category: "tonics" },
  { id: "tonico-romero", name: "Tónico de romero", category: "tonics" },
  { id: "perfume-lavanda", name: "Perfume de lavanda", category: "perfumes" },
  { id: "aceite-calendula", name: "Aceite de caléndula", category: "oils" },
  { id: "jabon-manzanilla", name: "Jabón de manzanilla", category: "soaps" },
];

test("category labels are the Spanish names shown to customers", () => {
  assert.equal(CATEGORY_LABELS.tonics, "Tónicos");
  assert.equal(CATEGORY_LABELS.perfumes, "Perfumes");
  assert.equal(CATEGORY_LABELS.oils, "Aceites");
  assert.equal(CATEGORY_LABELS.soaps, "Jabones");
  assert.equal(CATEGORY_LABELS.hair, "Cabello");
});

test("filterByCategory narrows to one category", () => {
  assert.deepEqual(filterByCategory(products, "tonics").map((p) => p.id),
    ["agua-de-rosas", "tonico-romero"]);
  assert.deepEqual(filterByCategory(products, "oils").map((p) => p.id),
    ["aceite-calendula"]);
});

test("filterByCategory with 'all' returns everything", () => {
  assert.equal(filterByCategory(products, "all").length, 5);
});

test("filterByCategory returns an empty list for a category with no products", () => {
  assert.deepEqual(filterByCategory(products, "hair"), []);
});

test("filterByCategory does not mutate the original list", () => {
  const copy = filterByCategory(products, "all");
  copy.pop();
  assert.equal(products.length, 5);
});

test("findById returns the product or null, never undefined", () => {
  assert.equal(findById(products, "perfume-lavanda").name, "Perfume de lavanda");
  assert.equal(findById(products, "no-existe"), null);
});

test("countByCategory counts every category, including empty ones", () => {
  assert.deepEqual(countByCategory(products),
    { all: 5, tonics: 2, perfumes: 1, oils: 1, soaps: 1, hair: 0 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/catalog.test.js`
Expected: FAIL — `Cannot find module .../js/catalog.js`

- [ ] **Step 3: Write the minimal implementation at `js/catalog.js`**

```javascript
/** Category identifiers are English; these are the labels customers read. */
export const CATEGORY_LABELS = {
  tonics: "Tónicos",
  perfumes: "Perfumes",
  oils: "Aceites",
  soaps: "Jabones",
  hair: "Cabello",
};

/** Return the products in one category, or all of them for "all". */
export function filterByCategory(products, category) {
  if (category === "all") return products.slice();
  return products.filter((product) => product.category === category);
}

/** Look a product up by its id. Returns null — never undefined — when absent. */
export function findById(products, id) {
  const found = products.find((product) => product.id === id);
  return found ?? null;
}

/** How many products sit in each category, plus the total under "all". */
export function countByCategory(products) {
  const counts = { all: products.length };
  for (const key of Object.keys(CATEGORY_LABELS)) counts[key] = 0;
  for (const product of products) {
    if (product.category in counts) counts[product.category] += 1;
  }
  return counts;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/catalog.test.js`
Expected: PASS — 7 tests, 0 failures

- [ ] **Step 5: Run the whole suite**

Run: `node --test`
Expected: PASS — 12 tests total, 0 failures

- [ ] **Step 6: Commit**

```bash
git add js/catalog.js tests/catalog.test.js
git commit -m "Add catalogue filtering, lookup and counts"
```

---

### Task 4: Prepare the logo assets

**Files:**
- Create: `assets/logo-monarca.png`
- Create: `assets/wreath-monarca.png`
- Create: `tools/prepare-logo.py`

**Interfaces:**
- Consumes: `/mnt/c/Users/santa/Downloads/monarca-logo.png.png` (1080×1080, RGB, no alpha) and `/mnt/c/Users/santa/Downloads/11.png` (contact page, carries the clean wordmark)
- Produces: two PNGs with transparent backgrounds, referenced by `index.html` in Task 5

The supplied logo is an Instagram welcome graphic with a solid background and the words
"BIENVENIDA" and "PRODUCTOS ARTESANALES" baked in — unusable at header size. The clean
wordmark (script + butterfly) appears on page 11 of the catalogue.

- [ ] **Step 1: Write `tools/prepare-logo.py`**

```python
#!/usr/bin/env python3
"""Derive publishable logo assets from the source artwork.

Run once. The outputs are committed; this script exists so the process is
repeatable if the source artwork changes.
"""
from PIL import Image

SOURCE_WREATH = "/mnt/c/Users/santa/Downloads/monarca-logo.png.png"
SOURCE_MARK = "/mnt/c/Users/santa/Downloads/11.png"


def remove_light_background(image, threshold=238):
    """Make near-white pixels transparent, feathering by how light they are."""
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            lightest = max(r, g, b)
            if min(r, g, b) >= threshold:
                pixels[x, y] = (r, g, b, 0)
            elif lightest >= threshold:
                # partial transparency at the edges keeps the artwork from looking cut out
                pixels[x, y] = (r, g, b, int(a * (255 - lightest) / (255 - threshold)))
    return image


def main():
    wreath = remove_light_background(Image.open(SOURCE_WREATH))
    wreath.save("assets/wreath-monarca.png")
    print("wrote assets/wreath-monarca.png", wreath.size)

    # The wordmark occupies roughly the middle band of the contact page.
    page = Image.open(SOURCE_MARK)
    width, height = page.size
    box = (int(width * 0.22), int(height * 0.24), int(width * 0.88), int(height * 0.45))
    mark = remove_light_background(page.crop(box))
    mark.thumbnail((600, 600), Image.LANCZOS)
    mark.save("assets/logo-monarca.png")
    print("wrote assets/logo-monarca.png", mark.size)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it**

Run: `python3 tools/prepare-logo.py`
Expected: two lines confirming both files were written, with their sizes.

- [ ] **Step 3: Inspect both outputs with the Read tool**

Read `assets/logo-monarca.png` and confirm: the script "Monarca" and the butterfly are
present and complete, the word "BIENVENIDA" is **not** present, and no flowers are clipped
mid-petal. Read `assets/wreath-monarca.png` and confirm the full wreath survived with a
transparent background.

If the crop box cut the wordmark, adjust the four `box` fractions and re-run. Do not
proceed until both images are correct — every page carries them.

- [ ] **Step 4: Verify transparency programmatically**

Run:
```bash
python3 -c "
from PIL import Image
for path in ['assets/logo-monarca.png', 'assets/wreath-monarca.png']:
    im = Image.open(path)
    alpha = im.getchannel('A')
    clear = sum(1 for v in alpha.get_flattened_data() if v < 10)
    print(path, im.size, 'transparent px:', clear)
"
```
Expected: both report a transparent pixel count well above zero.

- [ ] **Step 5: Commit**

```bash
git add tools/prepare-logo.py assets/logo-monarca.png assets/wreath-monarca.png
git commit -m "Derive transparent logo mark and wreath from source artwork"
```

---

### Task 5: Page skeleton, design tokens and static sections

**Files:**
- Create: `index.html`
- Create: `styles.css`

**Interfaces:**
- Consumes: `assets/logo-monarca.png`, `assets/wreath-monarca.png` from Task 4
- Produces: the DOM hooks every later task attaches to —
  `#filters`, `#catalog-grid`, `#catalog-status`, `#detail-panel`, `#detail-content`

- [ ] **Step 1: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Monarca — Productos artesanales</title>
  <meta name="description" content="Tónicos, perfumes y aceites artesanales. Pedidos por WhatsApp." />
  <link rel="icon" href="assets/logo-monarca.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Karla:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="header">
    <a class="header__brand" href="./">
      <img src="assets/logo-monarca.png" alt="Monarca" class="header__logo" />
    </a>
    <nav class="header__nav">
      <a href="#catalogo">Catálogo</a>
      <a href="#artesana">La artesana</a>
      <a href="#preguntas">Preguntas</a>
    </nav>
    <a class="btn btn--action header__cta" id="header-whatsapp" href="#">Escribir por WhatsApp</a>
  </header>

  <noscript>
    <p class="noscript">
      Para ver el catálogo necesitas activar JavaScript. Mientras tanto, escríbenos
      por WhatsApp al <strong>322 708 4613</strong>.
    </p>
  </noscript>

  <main>
    <section class="hero">
      <img src="assets/wreath-monarca.png" alt="" class="hero__wreath" />
      <div class="hero__text">
        <h1>Monarca</h1>
        <p class="hero__tagline">Es el momento perfecto para florecer y brillar.</p>
        <p class="hero__sub">Tónicos, perfumes y aceites hechos a mano, en lotes pequeños.</p>
        <a class="btn btn--action" href="#catalogo">Ver el catálogo</a>
      </div>
    </section>

    <section id="catalogo" class="section">
      <h2>Catálogo</h2>
      <div class="filters" id="filters" role="group" aria-label="Filtrar por categoría"></div>
      <p class="catalog__status" id="catalog-status" role="status"></p>
      <div class="grid" id="catalog-grid"></div>
    </section>

    <section id="artesana" class="section section--artisan">
      <h2>Sobre la artesana</h2>
      <p>
        Soy Sandra Santamaría. Preparo cada producto a mano, en lotes pequeños, con
        plantas que conozco y recetas que he ido afinando con los años.
      </p>
      <p>Será un placer asesorarte y ayudarte a elegir lo que mejor te sirva.</p>
    </section>

    <section id="ingredientes" class="section">
      <h2>Nuestros ingredientes</h2>
      <p class="section__intro">
        Cada preparación parte de plantas escogidas por su aroma y su tradición de uso.
      </p>
      <ul class="ingredients" id="ingredients-list">
        <li><strong>Manzanilla</strong> — de aroma suave y familiar, tradicionalmente asociada a la calma.</li>
        <li><strong>Caléndula</strong> — clásica en la cosmética artesanal, de tono cálido y dorado.</li>
        <li><strong>Lavanda</strong> — aroma envolvente que acompaña los momentos de descanso.</li>
        <li><strong>Romero</strong> — herbal y fresco, muy usado en preparaciones para el cabello.</li>
        <li><strong>Rosa</strong> — delicada y floral, la base de nuestra agua de rosas.</li>
        <li><strong>Menta</strong> — refrescante, de aroma limpio y despierto.</li>
        <li><strong>Ylang-ylang</strong> — floral e intenso, muy presente en perfumería.</li>
        <li><strong>Cedro</strong> — amaderado y sereno, de fondo cálido.</li>
      </ul>
    </section>

    <section id="preguntas" class="section">
      <h2>Preguntas frecuentes</h2>
      <details><summary>¿Cómo hago un pedido?</summary>
        <p>Elige el producto y toca «Pedir por WhatsApp». Se abre un mensaje ya escrito con
        el producto que te interesa; sólo tienes que enviarlo.</p></details>
      <details><summary>¿Cómo se conservan los productos?</summary>
        <p>En un lugar fresco y fuera del sol directo. Al ser preparaciones artesanales sin
        conservantes fuertes, se aprovechan mejor en los meses siguientes a su compra.</p></details>
      <details><summary>¿Puedo pedir varios productos?</summary>
        <p>Sí. Escríbenos por WhatsApp y armamos el pedido completo contigo.</p></details>
    </section>
  </main>

  <aside class="detail" id="detail-panel" hidden aria-modal="true" role="dialog" aria-labelledby="detail-title">
    <div class="detail__box">
      <button class="detail__close" id="detail-close" aria-label="Cerrar">×</button>
      <div id="detail-content"></div>
    </div>
  </aside>

  <footer class="footer">
    <img src="assets/logo-monarca.png" alt="" class="footer__logo" />
    <p>Sandra Santamaría · <a id="footer-whatsapp" href="#">WhatsApp 322 708 4613</a></p>
    <p class="footer__fine">Productos cosméticos artesanales. No sustituyen ningún tratamiento médico.</p>
  </footer>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `styles.css`**

```css
/* ---- Design tokens, sampled from the Monarca artwork ---------------------
   --action is the ONLY colour allowed on buttons, links and interactive text.
   --butterfly, --lilac, --lilac-pale and --sage fail WCAG AA at body size and
   are decorative only.                                                      */
:root {
  --paper: #FAF7FF;
  --ink: #222222;
  --ink-soft: #4A4458;
  --action: #A8551A;
  --butterfly: #D47625;
  --lilac: #B09DC6;
  --lilac-pale: #C9BADB;
  --sage: #8FA148;

  --serif: "Cormorant Garamond", Georgia, serif;
  --sans: "Karla", system-ui, sans-serif;

  --gap: 1rem;
  --radius: 4px;
  --max: 68rem;
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 1rem;
  line-height: 1.6;
}

h1, h2, h3 { font-family: var(--serif); font-weight: 600; line-height: 1.15; margin: 0; text-wrap: balance; }
h1 { font-size: clamp(2.5rem, 9vw, 4rem); }
h2 { font-size: clamp(1.6rem, 5vw, 2.2rem); }
p { margin: 0 0 1rem; }

a { color: var(--action); }
a:focus-visible, button:focus-visible, summary:focus-visible {
  outline: 2px solid var(--action);
  outline-offset: 2px;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius);
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.btn--action { background: var(--action); color: #fff; }
.btn--quiet { background: transparent; color: var(--action); border: 1px solid var(--lilac); }

/* ---- Header ---- */
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--lilac-pale);
}
.header__logo { height: 40px; width: auto; display: block; }
.header__nav { display: flex; gap: 1rem; font-size: 0.9rem; }
.header__cta { margin-left: auto; font-size: 0.85rem; padding: 0.5rem 1rem; }

.noscript {
  margin: 0;
  padding: 1rem;
  background: var(--lilac-pale);
  text-align: center;
}

/* ---- Hero ----
   Wreath and text share one grid cell so the text sits in the wreath's empty
   centre. No negative margins: those depend on container width and drift.   */
.hero { display: grid; place-items: center; text-align: center; padding: 2rem 1rem 3rem; }
.hero__wreath, .hero__text { grid-area: 1 / 1; }
.hero__wreath { width: min(100%, 30rem); height: auto; display: block; }
.hero__text { max-width: 20rem; }
.hero__tagline { font-family: var(--serif); font-size: 1.25rem; color: var(--ink-soft); }
.hero__sub { color: var(--ink-soft); max-width: 30ch; margin-inline: auto; }

/* ---- Sections ---- */
.section { max-width: var(--max); margin-inline: auto; padding: 2.5rem 1rem; }
.section__intro { color: var(--ink-soft); max-width: 60ch; }
.section--artisan { background: rgba(176, 157, 198, 0.12); max-width: none; }
.section--artisan > * { max-width: var(--max); margin-inline: auto; }

.ingredients { list-style: none; padding: 0; display: grid; gap: 0.6rem; }
.ingredients li { padding-left: 1rem; border-left: 2px solid var(--sage); }

details { border-top: 1px solid var(--lilac-pale); padding: 0.75rem 0; }
summary { cursor: pointer; font-weight: 600; }

/* ---- Filters ---- */
.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.filter {
  padding: 0.5rem 1rem;
  border: 1px solid var(--lilac);
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}
.filter[aria-pressed="true"] { background: var(--action); color: #fff; border-color: var(--action); }
.catalog__status { color: var(--ink-soft); font-size: 0.9rem; min-height: 1.5em; }

/* ---- Product grid ---- */
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--gap); }
@media (min-width: 40rem) { .grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 60rem) { .grid { grid-template-columns: repeat(4, 1fr); } }

.card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0;
  border: 1px solid var(--lilac-pale);
  border-radius: var(--radius);
  background: #fff;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
}
.card__media { aspect-ratio: 1; width: 100%; object-fit: cover; display: block; }
.card__placeholder {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  background: var(--lilac-pale);
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.85rem;
  text-align: center;
  padding: 0.5rem;
}
.card__body { padding: 0 0.75rem 0.85rem; display: flex; flex-direction: column; gap: 0.2rem; }
.card__name { font-family: var(--serif); font-size: 1.05rem; }
.card__size { color: var(--ink-soft); font-size: 0.8rem; }
.card__price { font-weight: 600; }
.card__sold-out { color: var(--ink-soft); font-size: 0.8rem; font-weight: 600; }

/* ---- Detail panel ---- */
.detail {
  position: fixed;
  inset: 0;
  background: rgba(34, 34, 34, 0.45);
  display: grid;
  place-items: end center;
  z-index: 10;
}
.detail[hidden] { display: none; }
.detail__box {
  background: var(--paper);
  width: 100%;
  max-width: 34rem;
  max-height: 92vh;
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
  position: relative;
}
@media (min-width: 40rem) {
  .detail { place-items: center; }
  .detail__box { border-radius: 12px; }
}
.detail__close {
  position: absolute; top: 0.5rem; right: 0.75rem;
  background: none; border: none; font-size: 1.75rem; line-height: 1;
  cursor: pointer; color: var(--ink-soft);
}
.detail__media { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius); }
.detail__price { font-size: 1.25rem; font-weight: 600; }
.detail__note {
  border-left: 3px solid var(--butterfly);
  padding-left: 0.85rem;
  font-style: italic;
  color: var(--ink-soft);
}
.tags { display: flex; flex-wrap: wrap; gap: 0.35rem; list-style: none; padding: 0; }
.tags li {
  background: var(--lilac-pale);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
}
.detail__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }

/* ---- Footer ---- */
.footer { text-align: center; padding: 2.5rem 1rem; border-top: 1px solid var(--lilac-pale); }
.footer__logo { height: 48px; width: auto; }
.footer__fine { color: var(--ink-soft); font-size: 0.8rem; max-width: 40ch; margin-inline: auto; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Serve the page and check it**

Run: `python3 -m http.server 8000` then open `http://localhost:8000`
Expected: header with the logo, hero with the wreath and tagline, empty catalogue area,
artisan / ingredients / FAQ sections, footer. The console will report a 404 for
`js/app.js` — that is expected; it arrives in Task 6.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "Add page skeleton, design tokens and static sections"
```

---

### Task 6: Render the catalogue

**Files:**
- Create: `js/app.js`
- Modify: nothing

**Interfaces:**
- Consumes: `filterByCategory`, `findById`, `countByCategory`, `CATEGORY_LABELS` (Task 3); `formatPrice`, `buildOrderMessage`, `whatsappUrl`, `WHATSAPP_NUMBER` (Task 2); DOM hooks from Task 5
- Produces: `renderGrid(products)` rendering into `#catalog-grid`; each card carries `data-id`

- [ ] **Step 1: Write `js/app.js`**

```javascript
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

async function start() {
  const whatsappGreeting = whatsappUrl(`Hola ${ARTISAN_NAME}, quisiera más información.`);
  for (const id of ["header-whatsapp", "footer-whatsapp"]) {
    document.getElementById(id).href = whatsappGreeting;
  }

  const response = await fetch("data/products.json");
  allProducts = await response.json();
  renderGrid(allProducts);
  status.textContent = `${allProducts.length} productos`;
}

start();
```

- [ ] **Step 2: Reload the page and confirm the products appear**

Expected: every product from `data/products.json` shows as a card. Products without a
photo show the lavender placeholder tile with the butterfly, not a broken image. The
status line reads the product count. The header and footer WhatsApp links now point at
`wa.me`.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "Render the product catalogue from the data file"
```

---

### Task 7: Category filters

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `renderGrid` (Task 6), `filterByCategory`, `countByCategory`, `CATEGORY_LABELS` (Task 3)
- Produces: `applyFilter(category: string)`; module-level `currentCategory`

- [ ] **Step 1: Add the filter code to `js/app.js`**

Add below `renderGrid`:

```javascript
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
```

Then replace the last two lines of `start()`:

```javascript
  renderGrid(allProducts);
  status.textContent = `${allProducts.length} productos`;
```

with:

```javascript
  applyFilter("all");
```

- [ ] **Step 2: Reload and test every filter**

Expected: six buttons with counts — `Todos · Tónicos · Perfumes · Aceites · Jabones · Cabello`.
Clicking one narrows the grid, marks that button as pressed, and updates the status line.
The counts must match what `data/products.json` actually contains, and a category with no
products must still show with `(0)` rather than disappearing.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "Add category filters with live counts"
```

---

### Task 8: Product detail panel with WhatsApp ordering

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `findById` (Task 3), `formatPrice`, `buildOrderMessage`, `whatsappUrl` (Task 2), `#detail-panel` / `#detail-content` / `#detail-close` (Task 5)
- Produces: `openDetail(id: string): boolean` — returns `false` when the id is unknown; `closeDetail(): void`

- [ ] **Step 1: Add the detail panel code to `js/app.js`**

```javascript
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

export function openDetail(id) {
  const product = findById(allProducts, id);
  if (!product) return false;
  panelContent.innerHTML = detailMarkup(product);
  panel.hidden = false;
  document.body.style.overflow = "hidden";
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
  if (event.key === "Escape" && !panel.hidden) closeDetail();
});
```

- [ ] **Step 2: Test the panel by hand**

Expected: clicking a card opens the panel with photo-or-placeholder, name, size, price,
description, ingredient tags and the artisan note when present. Clicking the backdrop, the
× or pressing Escape closes it. The page behind does not scroll while it is open.

- [ ] **Step 3: Verify the WhatsApp link carries the right product**

Right-click "Pedir por WhatsApp" → copy link address. Paste it in a text editor.
Expected: `https://wa.me/573227084613?text=Hola%20Sandra%2C%20me%20interesa%20el%20...`
with the product's own name and size URL-encoded inside it. Confirm the product named in
the link is the card you clicked.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "Add product detail panel with WhatsApp ordering and copy link"
```

---

### Task 9: Shareable per-product URLs

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `openDetail`, `closeDetail` (Task 8)
- Produces: URL state `?p=<id>`; a product opened by URL on load

- [ ] **Step 1: Add URL handling to `js/app.js`**

Change `openDetail` so it records the URL. Add this line immediately before `return true;`:

```javascript
  if (new URLSearchParams(location.search).get("p") !== product.id) {
    history.pushState({ product: product.id }, "", `?p=${product.id}`);
  }
```

Change `closeDetail` so leaving the panel clears the URL. Add at the end of the function:

```javascript
  if (new URLSearchParams(location.search).has("p")) {
    history.pushState({}, "", location.pathname);
  }
```

Add the Back-button handler and the on-load check:

```javascript
window.addEventListener("popstate", () => {
  const id = new URLSearchParams(location.search).get("p");
  if (id) {
    openDetail(id);
  } else {
    panel.hidden = true;
    document.body.style.overflow = "";
  }
});

/** Open the product named in ?p= when someone arrives from a shared link. */
function openFromUrl() {
  const id = new URLSearchParams(location.search).get("p");
  if (!id) return;
  if (!openDetail(id)) {
    status.textContent = "Ese producto ya no está disponible. Aquí está el catálogo completo.";
  }
}
```

Call it at the end of `start()`, after `applyFilter("all")`:

```javascript
  openFromUrl();
```

> Note: `popstate` closes the panel directly rather than calling `closeDetail`, because
> `closeDetail` pushes a history entry — calling it here would fight the Back button.

- [ ] **Step 2: Test the shareable link**

Open `http://localhost:8000/?p=agua-de-rosas` (use an id that exists in your data file).
Expected: the page loads with that product's panel already open.

- [ ] **Step 3: Test the Back button**

From the catalogue, click a product (URL becomes `?p=…`), then press the browser Back
button.
Expected: the panel closes and the URL returns to the plain page. Pressing Forward reopens it.

- [ ] **Step 4: Test an unknown product**

Open `http://localhost:8000/?p=no-existe`
Expected: the full catalogue with the status line reading
"Ese producto ya no está disponible. Aquí está el catálogo completo." — **not** a blank
screen and **not** an empty panel.

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "Add shareable per-product URLs with Back button support"
```

---

### Task 10: Failure handling

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `start()` (Task 6)
- Produces: a catalogue failure never removes the customer's route to WhatsApp

- [ ] **Step 1: Wrap the data load in `js/app.js`**

Replace the body of `start()` from the `fetch` line onward with:

```javascript
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
      <p><a class="btn btn--action" href="${whatsappGreeting}">Escribir por WhatsApp</a></p>`;
    return;
  }

  applyFilter("all");
  openFromUrl();
```

Note `whatsappGreeting` is already defined at the top of `start()` in Task 6, and
`WHATSAPP_DISPLAY` is already imported from `./config.js`.

- [ ] **Step 2: Force the failure and watch it behave**

Rename the data file, reload, then restore it:

```bash
mv data/products.json data/products.json.bak
# reload the browser
mv data/products.json.bak data/products.json
```

Expected while renamed: the message about writing on WhatsApp, plus a working WhatsApp
button. **Not** a blank page and not a silent empty grid.

- [ ] **Step 3: Force a malformed file and watch it behave**

Add a trailing comma inside `data/products.json`, reload, then remove it.
Expected: the same friendly message, and a parse error visible in the browser console for
whoever is debugging.

- [ ] **Step 4: Confirm the validator catches what the browser could not**

Run: `python3 tools/validate-data.py` while the trailing comma is present.
Expected: `INVALID JSON:` followed by the line and column. This is why the validator runs
before every publish.

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "Keep WhatsApp reachable when the catalogue fails to load"
```

---

### Task 11: Verification, documentation and publication

**Files:**
- Create: `docs/journal.md`
- Create: `docs/commands.md`
- Modify: nothing

**Interfaces:**
- Consumes: everything above
- Produces: a live site at `https://enterpricemonica.github.io/monarca`

- [ ] **Step 1: Run the full test suite**

Run: `node --test`
Expected: 12 tests, 0 failures.

- [ ] **Step 2: Validate the catalogue data**

Run: `python3 tools/validate-data.py`
Expected: `OK — N products, all valid.`

- [ ] **Step 3: Work through the acceptance checklist**

With `python3 -m http.server 8000` running, confirm each of these:

1. Every product in the data file appears in the grid
2. Each filter shows a count matching the data file
3. `?p=<real-id>` opens that product directly
4. Browser Back closes the panel; Forward reopens it
5. `?p=no-existe` shows the catalogue with the notice, not a blank screen
6. The WhatsApp button opens a chat pre-filled with the **correct** product
7. A product with `"photo": null` shows the butterfly placeholder
8. A product with `"available": false` reads *Agotado* and its button says
   "Preguntar disponibilidad"
9. The page works at 360 px wide with no horizontal scrolling
10. Keyboard: Tab reaches the cards, Enter opens one, Escape closes it

- [ ] **Step 4: Verify the WhatsApp number digit by digit**

Run:
```bash
grep -rn "573227084613\|322 708 4613" js/ index.html
```
Expected: the number appears only in `js/config.js` and as display text in `index.html`
and matches `+57 322 708 4613` exactly. **Confirm this with Monica before publishing** —
a wrong number fails silently and costs sales with no error message.

- [ ] **Step 5: Test on a real phone**

Find the machine's LAN address with `hostname -I`, then open
`http://<that-address>:8000` on a phone connected to the same network. Confirm the layout,
that the WhatsApp button actually opens WhatsApp, and that the pre-filled message arrives
intact.

- [ ] **Step 6: Write `docs/journal.md`**

```markdown
# 📓 Learning Journal — Monarca

Lesson by lesson: **what we did** and **what we discussed**. Newest entry on top.

---

## 🗓️ Lesson 1 — 2026-07-27 · "A catalogue that ends in a conversation 🦋"

### ✅ What we did
- Built a static catalogue for Monarca: products live in `data/products.json`, and
  JavaScript renders them. Adding a product never touches the layout.
- Gave every product its own shareable address (`?p=agua-de-rosas`) so Sandra can send a
  customer one product instead of the whole site.
- Made the WhatsApp button open a chat with the message already written, naming the
  product — so no order arrives as a bare "hola".
- Derived a usable logo from the artwork: the supplied file was an Instagram graphic with
  a solid background and the word "BIENVENIDA" baked in, illegible at header size.
- Sampled the brand palette from the logo's own pixels and checked every colour for
  contrast.

### 💡 Topics we discussed
- **Data separated from presentation** — the reason a catalogue can grow without redesign.
- **Contrast is measurable, not a matter of taste**: the butterfly orange (`#D47625`)
  fails WCAG AA for text, so a deeper orange (`#A8551A`) carries every button while the
  bright one stays decorative.
- **Failure modes**: if the data file breaks, the WhatsApp button must survive — the
  business has to stay reachable even when the catalogue does not.
- **Cosmetic vs medical language**: claiming a therapeutic effect reclassifies a cosmetic
  as a medicine under INVIMA. The copy was rewritten accordingly.

### 🔜 Next
- Real photographs, the full price list, and the remaining products.
```

- [ ] **Step 7: Write `docs/commands.md`**

```markdown
# 🛠️ Commands — Monarca

## Run the site locally
```bash
python3 -m http.server 8000
```
The site uses ES modules, which browsers refuse to load from `file://`. It must be served.

## Run the tests
```bash
node --test
```
Node's own test runner — nothing to install.

## Validate the catalogue before publishing
```bash
python3 tools/validate-data.py
```
Catches a trailing comma, a missing field or a bad category. Without it, a broken data
file just shows an empty catalogue with no error.

## Publish
```bash
git add -A
git commit -m "Describe the change"
git push
```

## Open the site on a phone (same Wi-Fi)
```bash
hostname -I     # take the first address
```
Then open `http://<that-address>:8000` on the phone.
```

- [ ] **Step 8: Commit the docs**

```bash
git add docs/journal.md docs/commands.md
git commit -m "Add build journal and command reference"
```

- [ ] **Step 9: Publish to GitHub**

```bash
gh repo create monarca --public --source=. --remote=origin --push
```

Then enable Pages:

```bash
gh api -X POST repos/enterpricemonica/monarca/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

- [ ] **Step 10: Confirm the site is live**

Wait about a minute, then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://enterpricemonica.github.io/monarca/
```
Expected: `200`.

Open it in a browser and repeat checklist items 3, 5 and 6 from Step 3 against the live
URL — deep links and relative paths behave differently under a subdirectory than at the
root, and this is where that would show up.

---

## Notes for whoever executes this

**The data file is the product.** Tasks 6 through 10 are worthless if `data/products.json`
does not hold real products with real names. Do Task 1 properly.

**Do not "improve" the colour rules.** The palette assignments in Global Constraints come
from measured contrast ratios, not preference. Putting text on `--lilac` or `--butterfly`
makes it unreadable for people with low vision.

**Never change a product `id` that has been shared.** It is the public URL. Renaming it
breaks every link already sent by WhatsApp, silently.
