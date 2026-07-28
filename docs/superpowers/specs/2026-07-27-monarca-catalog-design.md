# Monarca — Product Catalogue with WhatsApp Ordering

**Design specification · 2026-07-27**

| | |
|---|---|
| **Client** | Sandra Santamaría — *Monarca, productos artesanales* |
| **Built by** | Monica Santamaria Lopez |
| **Type** | Static site, no server, no database |
| **Hosting** | New `monarca` repo on GitHub → `https://enterpricemonica.github.io/monarca` |
| **Site language** | **Spanish** (customers are in Colombia) |
| **Code language** | **English** — filenames, keys, comments, docs |

> **Language rule, stated because this project inverts it.** Everything the customer reads
> is in Spanish. Everything a developer reads — file names, JSON keys, comments, this
> document — is in English.

---

## 1. What this is

A catalogue of handmade beauty products that a customer browses and then orders **through
WhatsApp**. There is no checkout, no cart, and no online payment. The site's job is to end
in a WhatsApp message that Sandra can answer.

**The primary use case is not browsing.** It is Sandra sending one customer the link to one
product. Every architectural decision below follows from that.

### Success criteria

1. A customer can find a product and reach a pre-filled WhatsApp message in two taps.
2. Sandra can copy a link to any single product and send it.
3. Monica can add a product by editing one data file — no layout work.
4. The site is usable on a phone, since almost all traffic arrives from WhatsApp/Instagram.
5. The catalogue looks intentional even though most products have no photo yet.

### Out of scope

Cart, checkout, online payment, stock control, customer accounts, order history, an admin
panel, a second language. Each was considered and rejected as unnecessary for a business
that sells by conversation.

---

## 2. Approach

Three approaches were considered:

| | Approach | Verdict |
|---|---|---|
| A | Single page, filters, no per-product URLs | Rejected — Sandra could not share one product |
| **B** | **Single page, filters, per-product URLs via `?p=<id>`** | **Chosen** |
| C | Build script generating 32 static pages | Rejected for now — adds a build step to every edit |

**B** serves the primary use case without putting a compile step between Monica and
publishing. Its weakness is search-engine indexing, which matters little for a business
whose customers arrive from WhatsApp and Instagram. Moving from B to C later is
straightforward because the data is already separate from the presentation.

---

## 3. Architecture

```
monarca/
├── index.html              Structure and static copy
├── styles.css              All styling
├── app.js                  Catalogue rendering, filters, detail panel, WhatsApp links
├── data/
│   └── products.json       THE CATALOGUE — the only file edited to add a product
├── assets/
│   ├── logo-monarca.png    Compact mark: script + butterfly, transparent background
│   ├── wreath-monarca.png  Full floral wreath, for the hero
│   └── products/           Product photographs
└── docs/
    ├── journal.md          Dated build log
    ├── commands.md         Command cheat sheet
    └── superpowers/specs/  This document
```

### Components

| Component | Responsibility | Depends on |
|---|---|---|
| `products.json` | Holds catalogue data. No presentation. | Nothing |
| Catalogue renderer | Turns product data into cards | `products.json` |
| Filter | Narrows the visible set by category | Catalogue renderer |
| Detail panel | Shows one product, builds the WhatsApp message | Catalogue renderer |
| Router | Reads and writes `?p=<id>`, handles Back | Detail panel |

Each can be understood and tested without reading the others. The router knows nothing
about how a product looks; the renderer knows nothing about URLs.

---

## 4. Data model

One entry in `data/products.json`:

```json
{
  "id": "agua-de-rosas",
  "name": "Agua de rosas",
  "category": "tonics",
  "price": 18000,
  "size": "250 ml",
  "description": "Tónico facial refrescante, destilado en frío.",
  "ingredients": ["Rosa", "Agua destilada"],
  "artisanNote": "Hacer uso completo del producto para recibir los beneficios.",
  "photo": null,
  "available": true
}
```

| Field | Type | Rules |
|---|---|---|
| `id` | string | Lowercase, hyphenated, unique. **Becomes the shareable URL — never change it once shared.** |
| `name` | string | Spanish, as printed on the label |
| `category` | string | One of `tonics`, `perfumes`, `oils`, `soaps`, `hair` |
| `price` | number | Plain integer in COP: `18000`, never `"$18.000"` |
| `size` | string | Presentation, e.g. `"250 ml"` |
| `description` | string | One or two sentences, cosmetic language (see §8) |
| `ingredients` | string[] | Displayed as tags |
| `artisanNote` | string \| null | Sandra's own recommendation. `null` hides the block |
| `photo` | string \| null | Filename in `assets/products/`. **`null` is normal**, not an error |
| `available` | boolean | `false` marks the card *Agotado* |

Category identifiers are English; their Spanish labels (`Tónicos`, `Perfumes`, `Aceites`,
`Jabones`, `Cabello`) live in `app.js` as a lookup.

> **Amended 2026-07-27, during Task 1.** The catalogue was originally specified with three
> categories, from a verbal description of the range. Transcribing the printed catalogue
> revealed a *Jabón artesanal* (eight scents) and a *Shampoo artesanal*, neither of which is
> a tonic, a perfume or an oil. Rather than mislabel them — a customer filtering "Aceites"
> should not find a bar of soap — the enum was widened to five before any UI was built. Prices are formatted for Colombia at display time
(`18000` → `$18.000`), so sorting stays numeric and formatting stays consistent.

---

## 5. Page structure

One page, in this order:

1. **Header** — compact logo, category links, WhatsApp button
2. **Hero** — the full wreath graphic, the brand's own line *"Es el momento perfecto para
   florecer y brillar"*, and a button down to the catalogue
3. **Catalogue** — filters (`Todos · Tónicos · Perfumes · Aceites`) and a card grid
4. **Sobre la artesana** — Sandra, in first person, as the printed catalogue already does
5. **Ingredientes** — the botanical list, rewritten per §8
6. **Preguntas frecuentes** — delivery, how to order, how long a product keeps
7. **Footer** — WhatsApp, phone, Instagram

**Card:** photo (or placeholder), name, size, **price**. Price is on the card, not hidden
in the detail panel.

**Detail panel:** opens over the catalogue — not a new page. Large photo, price, size,
description, ingredient tags, *Recomendación de la artesana*, then two buttons:
**Pedir por WhatsApp** and **Copiar enlace**.

**Mobile first.** The phone layout is designed first and widened for desktop.

---

## 6. The WhatsApp flow

The order button opens WhatsApp with the message already written:

```
https://wa.me/573227084613?text=<url-encoded message>
```

Message template:

> Hola Sandra, me interesa el **{name}** ({size}) — {price}. ¿Está disponible?

`{price}` is the *formatted* price as shown on the site (`18000` → `$18.000`), so the
message reads the same as the page the customer was looking at.

The customer only presses send, and Sandra receives a message that already identifies the
product instead of a bare "hola" she has to chase. This is the feature that makes the site
a selling tool rather than a brochure.

**Number:** `+57 322 708 4613`, taken from the printed catalogue. It is a business contact
Sandra already publishes. It must be verified digit by digit before launch — a wrong number
fails silently, with no error and no sale.

### Deep links

Opening a product rewrites the URL to `?p=<id>` via `history.pushState` — no reload.
Browser Back closes the panel. Loading a URL that already carries `?p=<id>` opens that
product directly.

---

## 7. Error handling

| Situation | Behaviour |
|---|---|
| `?p=` names an unknown product | Full catalogue with a short notice. Never a blank screen |
| `products.json` fails to load | Clear message **with the WhatsApp button still visible** — the business stays reachable even if the catalogue breaks |
| `products.json` is malformed | Same as above; the parse error is logged to the console for Monica |
| `photo` is `null` or the file is missing | Brand placeholder: lavender tile, butterfly silhouette, product name |
| `available` is `false` | Card shown, marked *Agotado*, button becomes "Preguntar disponibilidad" |
| JavaScript disabled | `<noscript>` block with the phone number and WhatsApp link |

The rule behind all of these: **a failure must never leave the customer with no way to
reach Sandra.**

---

## 8. Copy: cosmetic language, not medical claims

The current printed catalogue lists therapeutic effects — *analgésica, antiinflamatoria,
combate el acné, depresión, insomnio*.

In Colombia, INVIMA regulates this. A cosmetic that claims a therapeutic effect is legally
reclassified as a medicine, under a different and much heavier registration regime. The
risk falls on Sandra, not on the website.

**Every ingredient and product description is rewritten in cosmetic language.** The
botanical facts stay; the medical promise goes.

| Instead of | Write |
|---|---|
| "Analgésica, antiinflamatoria" | "Aporta una sensación de alivio y frescor" |
| "Combate el acné" | "Ayuda a mantener la piel limpia y equilibrada" |
| "Antiséptico, bactericida" | "De aroma limpio y herbal, tradicionalmente usada para purificar" |
| "Depresión, insomnio" | "Aroma envolvente que acompaña momentos de calma" |

This is a recommendation, not a technical constraint. Monica decides; the spec records the
reasoning either way.

---

## 9. Visual identity

Extracted from the logo file by sampling pixels, then checked for contrast (WCAG 2.1).

| Token | Hex | Contrast on paper | Use |
|---|---|---|---|
| `--paper` | `#FAF7FF` | — | Page background. The brand's own canvas, not white |
| `--ink` | `#222222` | 15.0 | Body and headings |
| `--ink-soft` | `#4A4458` | 8.8 | Secondary text — a lilac-biased grey, not neutral grey |
| `--action` | `#A8551A` | 5.3 with white | **Buttons and links** |
| `--butterfly` | `#D47625` | 3.1 | **Decorative only** — the butterfly, large graphics |
| `--lilac` | `#B09DC6` | 2.3 | **Decorative only** — borders, tints |
| `--lilac-pale` | `#C9BADB` | — | Decorative fills |
| `--sage` | `#8FA148` | 2.7 | **Decorative only** — leaves, small marks |

**The measured constraint:** the butterfly orange fails contrast for text and for buttons.
A deeper orange (`#A8551A`) carries every interactive element; the bright orange stays
graphic. They read as the same colour; only one is legible.

Lilac and sage never carry text.

**Single light theme, deliberately.** The brand *is* pale lavender. A dark mode would fight
its own identity.

### Typography

Served from Google Fonts — this is GitHub Pages, not a sandboxed artifact, so web fonts
load normally.

- **Cormorant Garamond** — headings. A fine, high-contrast serif that echoes the thin
  strokes of the logo's script.
- **Karla** — body and interface. Humanist, reads well in Spanish, holds up small on a
  phone.
- The logo's script is **never** used as a text face. It exists only inside the logo image.

### Logo assets

The supplied file (`monarca-logo.png.png`, 1080×1080) is an Instagram welcome graphic: a
solid background with no transparency, and the words "BIENVENIDA", the tagline and
"PRODUCTOS ARTESANALES" baked in. At 40 px tall it is an illegible smudge.

The usable mark already exists inside the printed catalogue — the "Monarca" script with the
butterfly, without "BIENVENIDA". Two assets are derived:

- `logo-monarca.png` — the compact mark, background removed, for the header and favicon
- `wreath-monarca.png` — the full wreath, used large in the hero where it works

### Photography

Product photographs are the weakest part of the current material: a plastic bottle on a
table with party ribbons and a garden visible through the window. New photographs are
planned.

**The guidance that matters is consistency, not quality:** one background, one light source,
one distance, for every product. Consistency reads as professional; individually pretty but
mismatched photos do not.

---

## 10. Verification

Run locally (`python3 -m http.server 8000`) and confirm, before publishing:

1. All products render; each filter shows the correct count
2. `?p=agua-de-rosas` opens that product directly; browser Back closes the panel
3. `?p=inventado` shows the catalogue with a notice, not a blank screen
4. The WhatsApp button opens a chat **pre-filled with the correct product**
5. A product with `"photo": null` shows the placeholder
6. The WhatsApp number is correct digit by digit
7. Renders correctly on a real phone, not just a narrowed window
8. `products.json` parses — validated with
   `python3 -c "import json;json.load(open('data/products.json'))"`.
   A single trailing comma breaks the entire catalogue

Step 8 runs before every publish. It is the failure most likely to happen and the easiest
to miss, because a broken JSON file produces an empty catalogue rather than an error.

---

## 11. Inputs still required from Monica

The design is complete and can be built against placeholder data. These inputs are needed
before launch, not before implementation:

| Input | Needed for | Status |
|---|---|---|
| Full product list — name, category, price, size, description | `products.json` | Sandra has ~32 products; the printed catalogue covers ~10 |
| New product photographs | `assets/products/` | Being reshot |
| Confirmation of the WhatsApp number | Order links | Read from the catalogue as `322 708 4613`; unverified |
| Delivery terms — coverage, cost, timing | FAQ section | Not yet discussed |
| Instagram handle, if any | Footer | Not yet discussed |

The build proceeds with a small set of real products drawn from the printed catalogue, so
the site is testable end to end from day one and the rest is data entry.
