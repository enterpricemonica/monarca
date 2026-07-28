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

test("whatsappUrl correctly encodes &, #, ñ and accented vowels via the order-message path", () => {
  // Product name deliberately includes characters the existing test never
  // touches: & and # (which a naive encoder might leave untouched or handle
  // as URL syntax) and ñ (which, like the accented vowels already covered,
  // must be percent-encoded as UTF-8).
  const product = {
    name: "Jabón artesanal ñandú & Champú #1",
    size: "100 g",
    price: 12000,
  };
  const url = whatsappUrl(buildOrderMessage(product));
  // Expected value verified with:
  //   node -e "console.log(encodeURIComponent('Hola Sandra, me interesa el Jabón artesanal ñandú & Champú #1 (100 g) — $12.000. ¿Está disponible?'))"
  assert.equal(
    url,
    "https://wa.me/573227084613?text=Hola%20Sandra%2C%20me%20interesa%20el%20Jab%C3%B3n%20artesanal%20%C3%B1and%C3%BA%20%26%20Champ%C3%BA%20%231%20(100%20g)%20%E2%80%94%20%2412.000.%20%C2%BFEst%C3%A1%20disponible%3F"
  );
});
