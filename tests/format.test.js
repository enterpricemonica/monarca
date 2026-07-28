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
