# Monarca

Product catalogue for **Monarca**, the artisanal beauty brand of Sandra Santamaría —
tonics, oils, soaps and hair care, made by hand in small batches in Colombia.

🔗 **Live:** <https://enterpricemonica.github.io/monarca/>

There is no cart and no checkout. Customers browse, then order over **WhatsApp** through a
button that opens a chat with the message already written, naming the product. Every product
also has its own shareable address (`?p=agua-de-rosas`), so one product can be sent to one
customer — that single requirement is why the site is built the way it is.

> **Language:** everything a customer reads is **Spanish**. Everything a developer reads —
> file names, JSON keys, comments, this file — is **English**.

---

## Adding or changing a product

This is the only routine job, and it touches exactly one file.

1. Open **`data/products.json`** and copy an existing entry.
2. Validate: `python3 tools/validate-data.py`
3. Publish: `git add -A && git commit -m "Add product X" && git push`

GitHub Pages redeploys in about a minute.

```json
{
  "id": "agua-de-rosas",
  "name": "Agua de rosas",
  "category": "tonics",
  "price": null,
  "size": "250 ml",
  "description": "Tónico facial refrescante de aroma suave.",
  "ingredients": ["Rosa", "Agua destilada"],
  "artisanNote": "Hacer uso completo del producto.",
  "photo": "agua-de-rosas.jpg",
  "available": true
}
```

| Field | Notes |
|---|---|
| `id` | Lowercase slug. **This is the public URL.** See the rules below. |
| `category` | One of `tonics`, `perfumes`, `oils`, `soaps`, `hair` |
| `price` | Integer in Colombian pesos (`18000`), or `null` for "Precio a consultar" |
| `size` | Free text — `"250 ml"`, or `"Consultar presentación"` when unknown |
| `photo` | Filename inside `assets/products/`, or `null` to show a brand watercolour |
| `available` | `false` marks the product *Agotado* |
| `featured` | Optional. `true` on **one** product puts it in the full-bleed block below the hero. Without it the block falls back to whichever product happens to be first with a photo — which hands the best spot on the site to file order. The validator rejects marking two. |

Categories with no products are hidden from the filter bar automatically — an empty
category never shows as an empty shelf.

## Adding a photograph

1. Put the original in `~/Downloads`.
2. Add a line to the `PHOTOS` table in **`tools/prepare-photos.py`**.
3. Run `python3 tools/prepare-photos.py` — it crops, resizes and compresses into
   `assets/products/`. Originals run around 2 MB each; outputs land near 100 KB.
4. Point the product's `photo` field at the new filename.

A product with `"photo": null` is not broken. It shows a watercolour flower cut from the
brand's own wreath, picked from the product's id so it stays the same as the catalogue is
filtered.

---

## Four rules that matter

**Never change an `id` that has been shared.** It is the product's public address. Renaming
it silently breaks every link already sent over WhatsApp. Deleting a product is safe — an old
link then shows the catalogue with a short notice, and that path is tested.

**Run the validator before every push.** A malformed catalogue file does not raise an error in
the browser; the page simply loads with an empty grid, which is far easier to miss.

**No medical or therapeutic claims. Ever.** Not in a description, not in an ingredient, not
paraphrased. Colombia's INVIMA reclassifies a cosmetic that claims a therapeutic effect as a
medicine, under a much heavier registration regime — and the risk falls on Sandra. Words like
*anticaída*, *antipiojos*, *antiséptico* and *combate el acné* appear on some product labels;
they must not appear on the site. Describe aroma, texture, sensation and traditional use
instead.

**Never add a `dependencies` block to `package.json`.** It exists only to declare
`"type": "module"`. This project has zero dependencies by design, and that is why it needs no
build step.

---

## How it fits together

```
index.html               Structure, the Spanish copy, and the business structured data
styles.css               Design tokens, layout, and the motion layer
js/config.js             The WhatsApp number and Sandra's name — defined once, here
js/format.js             Prices and the WhatsApp message          (unit tested)
js/catalog.js            Filtering, lookup, category counts       (unit tested)
js/app.js                Everything that touches the page
data/products.json       THE CATALOGUE
assets/                  Logo, butterfly, botanical cutouts
assets/products/         Product photographs
tools/validate-data.py   Schema check — run before publishing
tools/prepare-photos.py  Resize and compress a new photograph
tools/prepare-logo.py    Regenerate every logo asset from the source artwork
docs/                    Journal, command reference, handoff, spec and plan
```

Plain HTML, CSS and ES modules. No framework, no bundler, no build step.

**Design tokens** sit at the top of `styles.css`. One of them is not a preference: `--action`
(`#A8551A`) is the only colour allowed on buttons, links and interactive text. `--butterfly`,
`--lilac`, `--lilac-pale` and `--sage` fail WCAG AA at body size and are decorative only.

**Motion** uses scroll-driven animations (`animation-timeline`), which cost no JavaScript per
frame. Everything is wrapped twice — in `@supports`, so an older browser gets the static page
rather than a broken one, and in `prefers-reduced-motion`, so anyone who asked their system
for less movement gets none.

**Structured data** is in two parts: the shop itself is described statically in `index.html`,
and the products are generated by `app.js` from `data/products.json`, so the markup and the
page can never disagree.

---

## Commands

```bash
python3 -m http.server 8000      # serve locally — ES modules will not load from file://
node --test                      # run the test suite
python3 tools/validate-data.py   # validate the catalogue
```

⚠️ `node --test tests/` fails on this Node build — it resolves the path as a module
specifier. Use `node --test` with no argument; it discovers the tests itself.

Looking at the page the way a phone sees it takes two tricks, both written up in
[`docs/commands.md`](docs/commands.md): headless Chrome ignores `--window-size` for the layout
viewport, so render the page inside an iframe of the width you want; and the catalogue is
filled after an async fetch, so pass `--virtual-time-budget` or you will screenshot an empty
page and think it is broken.

---

## Still missing

| | |
|---|---|
| **Prices** | Every product reads "Precio a consultar" — the largest remaining gap |
| **Sizes** | Most read "Consultar presentación" |
| **A shampoo photograph** | The only product without one |
| **Customer reviews** | The strongest trust signal there is, and the site has none |
| **Visit measurement** | Nobody knows yet whether anyone is arriving |

---

## Documentation

| File | What it is |
|---|---|
| [`docs/next-session.md`](docs/next-session.md) | Start here — current state and what comes next |
| [`docs/journal.md`](docs/journal.md) | What was built, and what was learned building it |
| [`docs/commands.md`](docs/commands.md) | Every command used, explained plainly |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | The original design decisions |
| [`docs/superpowers/plans/`](docs/superpowers/plans/) | The task-by-task build plan |
