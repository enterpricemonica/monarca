/** Category identifiers are English; these are the labels customers read. */
export const CATEGORY_LABELS = {
  tonics: "Tónicos",
  perfumes: "Perfumes",
  oils: "Aceites",
  soaps: "Jabones",
  hair: "Cabello",
  creams: "Cremas",
};

/** Return the products in one category, or all of them for "all". */
export function filterByCategory(products, category) {
  if (category === "all") return products.slice();
  return products.filter((product) => product.category === category);
}

/** Look a product up by its id. Returns null — never undefined — when absent. */
export function findById(products, id) {
  const found = products.find((product) => product.id === id);
  return found ?? null;
}

/** How many products sit in each category, plus the total under "all". */
export function countByCategory(products) {
  const counts = { all: products.length };
  for (const key of Object.keys(CATEGORY_LABELS)) counts[key] = 0;
  for (const product of products) {
    if (product.category in counts) counts[product.category] += 1;
  }
  return counts;
}
