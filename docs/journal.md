# 📓 Learning Journal — Monarca

Lesson by lesson: **what we did** and **what we discussed**. Newest entry on top.

> 🔖 Picking the work back up? Start with [`next-session.md`](next-session.md).

---

## 🗓️ Lesson 3 — 2026-07-29 · "The day it became a real shop 💰"

Eight commits. The site went from a handsome brochure to an actual catalogue: **8 products,
6 with prices, 5 with real photographs.** Two days ago it was 3 products, no prices and no
photographs at all.

### ✅ What we did

- **Rebuilt the header.** Sandra didn't like the letters, and she was right — the nav links
  were the browser's default underlined links, which read as "nobody styled this". They are
  now small caps with tracking, matching the section eyebrows, with a rule that grows from
  the left on hover.
- **Audited the page structure** properly, with a script rather than by eye — and it found
  two real defects (below).
- **Added structured data** so search engines understand what Monarca is and what it sells.
- **Rewrote the README** from 25 lines into a real guide, and verified every claim in it.
- **Applied the prices** and added three products: the calendula cream, the aftershave
  splash and the acne-prone splash. Opened a `creams` category for the first.
- **Added the calendula cream photograph** — the best composition of the set.
- **Made the featured product an explicit choice**, then moved it to the cream.
- **Deleted the solid shampoo**, answered the delivery question, confirmed no Instagram.

### 💡 Topics we discussed

- **A heading is structure, not decoration.** When the big statement line and the artisan
  quote replaced the old `<h2>`s, two whole sections lost their headings. Visually nothing
  changed. But someone navigating by heading with a screen reader could no longer find
  those sections at all — for them the sections had ceased to exist. The fix wasn't to add
  new headings; it was to make the text that already *acted* as the heading actually be one.

- **The most valuable space on a page should not be assigned by accident.** The featured
  block showed whichever product came first in the data file with a photograph. That rule
  was fine when exactly one product had a photo. With five, it silently handed the best
  spot on the site to file order. It is now an explicit `"featured": true`, and the
  validator refuses to let two products claim it — because a second one would be a decision
  quietly ignored.

- **Documentation that drifts becomes misinformation.** The README was verified line by line
  — that the 14 files it names exist, that `node --test tests/` really does fail, that
  `package.json` really has no dependencies. Then four commits later it was already stale
  about prices and photo counts, and had to be corrected. A doc nobody checks is worse than
  no doc.

- **Structured data generated, never duplicated.** The product markup is built from
  `data/products.json` at runtime rather than written into the HTML, so the two can't
  disagree. A hand-maintained second copy of the catalogue would have gone stale the first
  time a product changed.

- **Deliberately incomplete markup.** No `offers` block was emitted, because Google needs a
  price to show a product rich result and every price was still unknown. Markup that claims
  more than the page can back up is worse than no markup. It starts working by itself now
  that prices exist.

- **I retracted an earlier recommendation.** I had proposed renaming "Splash piel acneica",
  treating it like the "anticaída" claim we removed. On reflection they are different:
  *anticaída* promises an **effect**, while *piel acneica* names a **skin type**, which is
  ordinary cosmetic labelling. The name stayed.

### 🐛 Three bugs found by looking, not guessing

1. **Two sections had no heading** — found by scripting the document outline.
2. **A nav link was unreachable.** Adding "Ingredientes" pushed "Preguntas" past the right
   edge of a 360 px phone, and `overflow-x: hidden` meant it was *invisible* rather than
   visibly cut. Measured: the last link now ends at x=94 of 360.
3. **The sticky header covered every anchor target.** Tapping any nav link scrolled the
   section's title underneath the header. The header is 136 px tall on a phone and sections
   were landing at 112 px. Nobody would ever report this — it just makes a site feel badly
   made.

### 🔜 Next

Two prices (serum, shampoo), three photographs, two ingredient lists, and a visit counter.

---

## 🗓️ Lesson 2 — 2026-07-28 · "Photographs change everything 📷"

The design was called "horrible" — fairly. Rebuilt it, then learned why.

### ✅ What we did
- Rediagnosed the root cause: it was **a photo grid with no photographs**, which always
  reads as unfinished no matter how it is styled. Stopped pretending to be a photo grid and
  gave each product a full-width band instead.
- Cut individual flowers out of the wreath artwork so the whole page could speak the brand's
  own watercolour language, instead of only the hero.
- Cut out Sandra's standalone monarch, keeping the **white spots on its wings** — a naive
  "remove the white" would have punched holes straight through them. The background is only
  the white that touches the image border, so it was flood-filled inward from the edges.
- Added scroll-driven motion (`animation-timeline`), which costs no JavaScript per frame.
- Added statement typography and a full-bleed featured product — the two patterns from the
  award-winning artisanal shops that work with, and without, photographs.
- Added a snapping product rail and one ticker.
- Restored the **original lettered wreath** as the hero at Sandra's request, keeping a
  visually-hidden `<h1>` so the page still has a heading for a screen reader.

### 💡 Topics we discussed
- **Compression is free quality.** The logo assets went from 766 KB to 141 KB with no visible
  loss, because watercolour and line art are not photographs. Product photos went from 2 MB
  originals to ~100 KB.
- **Scroll-driven animation ranges must finish inside `entry`.** A range that runs into
  `cover` can be cut short for anything near the bottom of the page — the scroll ends before
  the range does, and the element stays half-faded permanently.
- **Rejecting material is part of the job.** The liquid shampoo photograph was turned down on
  two grounds: its label reads "ANTICAÍDA" (publishing the photo would republish the exact
  claim we had removed from the copy), and it carries a completely different visual identity.
- **A carousel hides half your catalogue** unless the next card peeks past the edge. That
  overhang is the only thing telling a visitor the row scrolls.

---

## 🗓️ Lesson 1 — 2026-07-27 · "A catalogue that ends in a conversation 🦋"

Built the whole site in one sitting, as eleven planned tasks with a code review after each.
The reviews were not a formality: they caught a bug that would have trapped customers on
the page, and several that would have shut out anyone using a keyboard.

### ✅ What we did

- **Separated the data from the design.** The products live in `data/products.json`.
  Adding one means editing that file — never the layout, never the CSS.
- **Gave every product its own address** (`?p=agua-de-rosas`), so Sandra can send a customer
  one product instead of the whole site. This is the reason the site is built the way it is.
- **Made the WhatsApp button open a chat with the message already written**, naming the
  product. No order arrives as a bare "hola" she has to chase.
- **Derived usable logos from the artwork.** What we were given was an Instagram welcome
  graphic: a solid background with "BIENVENIDA" baked in, illegible at header size. We
  extracted the clean wordmark, cut a square butterfly for the favicon, and emptied the
  wreath's centre so the real heading could sit inside the ring.
- **Wrote a validator** (`tools/validate-data.py`) that refuses a broken catalogue file
  before it is published.
- **Made failure safe:** if the product data cannot load, the page still shows a message and
  a working WhatsApp button. The business stays reachable even when the catalogue does not.

### 💡 Topics we discussed

- **Contrast is measurable, not a matter of taste.** The butterfly orange (`#D47625`) fails
  WCAG AA for text, so a deeper orange (`#A8551A`) carries every button and link while the
  bright one stays purely decorative. Same apparent colour; only one is legible.
- **The Back button is part of the interface.** Our first version pushed a history entry
  every time a panel closed. A customer who viewed four products and tapped Back expecting
  to return to Instagram would instead have watched the panels reopen one at a time.
  Closing now *unwinds* the entry that opening added.
- **`aria-modal` is a promise you have to keep.** Declaring a dialog modal while focus stays
  outside it, and Tab walks straight into the page behind, is worse than not declaring it.
- **Cosmetic language, not medical claims.** In Colombia, INVIMA reclassifies a cosmetic
  that claims a therapeutic effect as a medicine. "Anticaída" and "Antipiojos" were removed
  outright rather than paraphrased — a paraphrase of a therapeutic claim is still one.
- **Honest placeholders beat invented data.** Two products show "Consultar presentación"
  because no printed page states their size. Writing "250 ml" because it sounds plausible
  would be lying to a customer about something that goes on her skin.
- **Grammar is part of the design.** The status line first read "1 jabones". It now counts
  "producto/productos" and names the category separately, which is correct for all five.

### 🔜 Next

Real photographs, the price list, the three Splash products, and going live.
