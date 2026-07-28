# 📓 Learning Journal — Monarca

Lesson by lesson: **what we did** and **what we discussed**. Newest entry on top.

> 🔖 Picking the work back up? Start with [`next-session.md`](next-session.md).

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
