# 🔖 Where We Left Off — Monarca

Resume point. Last updated: **2026-07-27**.

> Read this first. The build story is in [`journal.md`](journal.md); every command is in
> [`commands.md`](commands.md); the design decisions are in
> [`superpowers/specs/`](superpowers/specs/) and the task-by-task plan in
> [`superpowers/plans/`](superpowers/plans/).

---

## 📍 State

**The site is built, tested and working — and deliberately NOT published yet.**

All eleven planned tasks are done. The repository is local only: no GitHub remote, nothing
on the internet. Sandra's phone number is in the code but has not been made public.

- 13 tests passing (`node --test`)
- Catalogue data valid (`python3 tools/validate-data.py`)
- 168 KB total page weight, images included
- Verified at 360 px and 768 px with no horizontal overflow

## ✅ What works

Category filters with live counts · product detail panel · WhatsApp order button pre-filled
with the product · shareable `?p=` links with Back-button support · butterfly placeholders
for products without photos · a friendly failure state that keeps WhatsApp reachable if the
catalogue cannot load · keyboard support throughout, including a focus trap in the panel.

## ⛔ The one decision blocking launch

**Publishing puts Sandra's phone number (322 708 4613) on the public internet.** That is the
point of the site, but it is her call, not ours. Nothing goes live until she says so.

When she agrees, publishing is:

```bash
cd /home/santa/projects/monarca
gh repo create monarca --public --source=. --remote=origin --push
gh api -X POST repos/enterpricemonica/monarca/pages -f "source[branch]=main" -f "source[path]=/"
```

The site then appears at <https://enterpricemonica.github.io/monarca/>. After publishing,
re-check the deep links and the WhatsApp button **against the live URL** — the site sits in
a subdirectory there, and that is exactly where relative paths tend to break.

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
