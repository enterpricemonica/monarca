# 🔖 Where We Left Off — Monarca

Resume point. Last updated: **2026-07-27**.

> Read this first. The build story is in [`journal.md`](journal.md); every command is in
> [`commands.md`](commands.md); the design decisions are in
> [`superpowers/specs/`](superpowers/specs/) and the task-by-task plan in
> [`superpowers/plans/`](superpowers/plans/).

---

## 📍 State

**The site is LIVE:** <https://enterpricemonica.github.io/monarca/> (published 2026-07-28).

Repository: <https://github.com/enterpricemonica/monarca> (public). Verified on the live
URL, not just locally: every asset, the data file, the shared `?p=` links, and the WhatsApp
button all resolve correctly from the `/monarca/` subdirectory.

- 13 tests passing (`node --test`)
- Catalogue data valid (`python3 tools/validate-data.py`)
- 168 KB total page weight, images included
- Verified at 360 px and 768 px with no horizontal overflow

## ✅ What works

Category filters with live counts · product detail panel · WhatsApp order button pre-filled
with the product · shareable `?p=` links with Back-button support · butterfly placeholders
for products without photos · a friendly failure state that keeps WhatsApp reachable if the
catalogue cannot load · keyboard support throughout, including a focus trap in the panel.

## 🔍 The final whole-branch review

Run 2026-07-28, after all eleven tasks. It looked at the system as a whole and found five
things no per-task review could see, because each of those only saw one task's diff. **All
five are fixed** (commit `0424cff`):

- The close button did nothing on the first tap if the customer arrived on a `?p=` link
  naming a product that had since been renamed — which is exactly what is planned for the
  three Splash products.
- The page was a dead end where `<script type="module">` is unsupported (old Android
  WebViews, some in-app browsers): JS is "on", so `<noscript>` never showed, and both
  WhatsApp buttons were inert `href="#"`. The real `wa.me` URL is now in the HTML itself.
- The two empty categories showed a blank rectangle, while the hero promised "tónicos,
  perfumes y aceites". They now show a short message and a WhatsApp button.
- No Open Graph tags — on a site whose entire purpose is links shared through WhatsApp.
- The footer *displayed* a hardcoded number while *linking* to the one in config, so
  changing the number as the docs instruct would have half-updated it.

The review also **struck one earlier finding from the record as incorrect**: the
non-mutation test in `catalog.test.js` was said to pass for the wrong reason; the reviewer
disproved that by breaking `filterByCategory` and watching the test fail on its own
assertion. The remaining deferred minor findings were each judged and none blocks launch;
they are listed in `.superpowers/sdd/progress.md`.

## ⚠️ Still unconfirmed, and it fails silently

**Nobody has checked Sandra's WhatsApp number digit by digit.** `322 708 4613` was read off
her printed catalogue. If a digit is wrong, nothing errors — orders simply never arrive.
Ask her to open the live site and press the button herself.

## 🚀 Publishing again

The remote is set up, so from now on it is just:

```bash
git add -A && git commit -m "..." && git push
```

GitHub Pages redeploys in about a minute.

## 📋 What the site is waiting on from Sandra

| Needed | For | Why it matters |
|---|---|---|
| **Product photographs** | `assets/products/` | The biggest single improvement available. Every product currently shows a placeholder. Consistency beats quality: one background, one light source, one distance for all of them. |
| **Prices** | `price` in `products.json` | Every product currently reads "Precio a consultar". |
| **Sizes for the soap and the shampoo** | `size` | Both read "Consultar presentación" because no printed page states a measurement, and inventing one would be lying to a customer. |
| **The three Splash products** | new entries | Left out for now: their pages print no size and no ingredient list, and guessing ingredients for something that goes on skin is not acceptable. When the data arrives, rename **"Splash Piel Acneica" → "Splash Piel Equilibrante"** and **"Splash Relajante Muscular" → "Splash Aroma Relajante"** — the originals name a medical condition and a physiological effect. |
| **Delivery terms and Instagram handle** | FAQ and footer | Currently absent. |

## 🗂️ How the code is arranged

```
index.html            structure and the Spanish copy
styles.css            design tokens and layout
js/config.js          the WhatsApp number and Sandra's name — defined once
js/format.js          prices and the WhatsApp message  (tested)
js/catalog.js         filtering, lookup, counts        (tested)
js/app.js             everything that touches the page
data/products.json    THE CATALOGUE — the only file you edit to add a product
tools/validate-data.py   run before every publish
tools/prepare-logo.py    regenerates the three images from the artwork
```

## ⚠️ Things not to forget

- **Never change a product `id` that has been shared.** It is the public URL; every link
  already sent stops working, silently.
- **Run the validator before every push.** A broken catalogue file shows an empty page
  rather than an error.
- **The category list is five values** — `tonics`, `perfumes`, `oils`, `soaps`, `hair`.
  Adding a sixth means updating `CATEGORY_LABELS` in `js/catalog.js` *and* `CATEGORIES` in
  `tools/validate-data.py`. The validator will catch you if you forget.
- **No medical claims, ever.** Not in a description, not in an ingredient, not paraphrased.
- **This project has zero dependencies.** `package.json` exists only to declare
  `"type": "module"`. Never add a `dependencies` block.
