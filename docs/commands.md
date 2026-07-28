# 🛠️ Commands — Monarca

Every command this project uses, explained plainly.

## Run the site locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The site uses **ES modules**, which browsers refuse to
load from `file://` — double-clicking `index.html` will show a blank catalogue. It has to be
served.

## Run the tests

```bash
node --test
```

Node's own test runner; nothing to install. It finds `tests/*.test.js` on its own.

⚠️ **Not** `node --test tests/`. On this Node build that resolves the path as a module and
fails with `MODULE_NOT_FOUND`. Running a single file (`node --test tests/format.test.js`)
does work.

## Validate the catalogue before publishing

```bash
python3 tools/validate-data.py
```

Catches a trailing comma, a missing field, a bad category, a duplicate id, or an id that
isn't a clean URL slug. Run it **every time** before pushing: a broken data file does not
throw an error in the browser, it just shows an empty catalogue, which is far easier to miss.

## Rebuild the logo assets

```bash
python3 tools/prepare-logo.py
```

Regenerates all three images from the original artwork. Only needed if the source artwork
changes — the outputs are committed.

## Publish

```bash
git add -A
git commit -m "Describe the change"
git push
```

## Add a product

1. Open `data/products.json`
2. Copy an existing entry and change its values
3. `python3 tools/validate-data.py`
4. Commit and push

The `id` is the product's **public address**. Once a link has been shared, changing the id
breaks it silently — every message already sent stops working.

---

## Looking at the page the way a phone sees it

Two traps on this machine, both of which cost us time:

**Headless Chrome ignores the width you ask for.** It pins the layout viewport near 548 CSS
pixels regardless of `--window-size`, so a "360 px screenshot" is really a 360-pixel *crop*
of a 548-pixel page — text looks cut off when nothing is wrong. Render the page inside an
iframe of the width you actually want; an iframe gets a genuine viewport.

**The catalogue is drawn after an async fetch.** Without `--virtual-time-budget` the
screenshot is taken before the products arrive, and the catalogue looks empty.

```bash
cat > _vt.html <<'EOF'
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#333}iframe{border:0;background:#fff;display:block}
</style></head><body><iframe src="/#catalogo" width="360" height="1200"></iframe></body></html>
EOF
(python3 -m http.server 8000 >/dev/null 2>&1 &) ; sleep 2
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --hide-scrollbars --virtual-time-budget=6000 --window-size=390,1250 \
  --screenshot='C:\Users\santa\AppData\Local\Temp\shot.png' http://localhost:8000/_vt.html
pkill -f "http.server 8000"; rm -f _vt.html
```

`_vt*.html` is gitignored so the harness can never be committed by accident.

Because the parent page and the iframe share an origin, the parent can also **click inside
it** and read the result — which is how the filters, the detail panel and the Back button
were actually tested rather than assumed:

```javascript
var d = document.querySelector('iframe').contentDocument;
d.querySelector('[data-category="soaps"]').click();
console.log(d.querySelectorAll('.card').length);
```
