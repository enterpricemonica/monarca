import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORY_LABELS, filterByCategory, findById, countByCategory } from "../js/catalog.js";

const products = [
  { id: "agua-de-rosas", name: "Agua de rosas", category: "tonics" },
  { id: "tonico-romero", name: "Tónico de romero", category: "tonics" },
  { id: "perfume-lavanda", name: "Perfume de lavanda", category: "perfumes" },
  { id: "aceite-calendula", name: "Aceite de caléndula", category: "oils" },
  { id: "jabon-manzanilla", name: "Jabón de manzanilla", category: "soaps" },
];

test("category labels are the Spanish names shown to customers", () => {
  assert.equal(CATEGORY_LABELS.tonics, "Tónicos");
  assert.equal(CATEGORY_LABELS.perfumes, "Perfumes");
  assert.equal(CATEGORY_LABELS.oils, "Aceites");
  assert.equal(CATEGORY_LABELS.soaps, "Jabones");
  assert.equal(CATEGORY_LABELS.hair, "Cabello");
});

test("filterByCategory narrows to one category", () => {
  assert.deepEqual(filterByCategory(products, "tonics").map((p) => p.id),
    ["agua-de-rosas", "tonico-romero"]);
  assert.deepEqual(filterByCategory(products, "oils").map((p) => p.id),
    ["aceite-calendula"]);
});

test("filterByCategory with 'all' returns everything", () => {
  assert.equal(filterByCategory(products, "all").length, 5);
});

test("filterByCategory returns an empty list for a category with no products", () => {
  assert.deepEqual(filterByCategory(products, "hair"), []);
});

test("filterByCategory does not mutate the original list", () => {
  const copy = filterByCategory(products, "all");
  copy.pop();
  assert.equal(products.length, 5);
});

test("findById returns the product or null, never undefined", () => {
  assert.equal(findById(products, "perfume-lavanda").name, "Perfume de lavanda");
  assert.equal(findById(products, "no-existe"), null);
});

test("countByCategory counts every category, including empty ones", () => {
  assert.deepEqual(countByCategory(products),
    { all: 5, tonics: 2, perfumes: 1, oils: 1, soaps: 1, hair: 0 });
});
