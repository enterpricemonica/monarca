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
node --test tests/             # pruebas de la lógica
python3 tools/validate-data.py # valida el catálogo
```
