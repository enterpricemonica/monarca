#!/usr/bin/env python3
"""Validate data/products.json before publishing.

A malformed catalogue file fails silently in the browser — the page loads and
the grid is simply empty. This script turns that into a loud error.
"""
import json
import re
import sys

CATEGORIES = {"tonics", "perfumes", "oils", "soaps", "hair", "creams"}
REQUIRED = {
    "id": str, "name": str, "category": str, "size": str,
    "description": str, "ingredients": list, "available": bool,
}
NULLABLE = {"price": int, "artisanNote": str, "photo": str}

# The id becomes the product's public URL (?p=<id>), so it must be a safe,
# predictable slug: lowercase ascii letters, digits and single hyphens,
# with no leading/trailing/doubled hyphen.
ID_SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def main(path="data/products.json"):
    try:
        with open(path, encoding="utf-8") as fh:
            products = json.load(fh)
    except json.JSONDecodeError as exc:
        print(f"INVALID JSON: {exc}")
        return 1

    if not isinstance(products, list):
        print("Top level must be a list of products.")
        return 1

    errors = []
    seen = set()
    for index, product in enumerate(products):
        if not isinstance(product, dict):
            errors.append(f"index {index}: product must be an object")
            continue

        label = product.get("id", f"index {index}")
        for field, kind in REQUIRED.items():
            if field not in product:
                errors.append(f"{label}: missing '{field}'")
            elif not isinstance(product[field], kind):
                errors.append(f"{label}: '{field}' must be {kind.__name__}")
        for field, kind in NULLABLE.items():
            if field not in product:
                errors.append(f"{label}: missing '{field}' (use null if unknown)")
            elif product[field] is not None and not isinstance(product[field], kind):
                errors.append(f"{label}: '{field}' must be {kind.__name__} or null")
            elif field == "price" and isinstance(product[field], bool):
                errors.append(f"{label}: 'price' must be {kind.__name__} or null, not bool")
        if isinstance(product.get("id"), str) and not ID_SLUG_RE.match(product["id"]):
            errors.append(
                f"{label}: 'id' {product['id']!r} must be a lowercase slug "
                "(letters, digits, single hyphens only; no leading/trailing/double hyphen)"
            )
        if isinstance(product.get("ingredients"), list):
            for item in product["ingredients"]:
                if not isinstance(item, str):
                    errors.append(f"{label}: every 'ingredients' item must be a string")
                    break
        if product.get("category") not in CATEGORIES:
            errors.append(f"{label}: category must be one of {sorted(CATEGORIES)}")
        if "featured" in product and not isinstance(product["featured"], bool):
            errors.append(f"{label}: 'featured' must be true or false")
        if product.get("id") in seen:
            errors.append(f"{label}: duplicate id")
        seen.add(product.get("id"))

    featured = [p.get("id") for p in products
                if isinstance(p, dict) and p.get("featured")]
    if len(featured) > 1:
        errors.append(
            "only one product may be 'featured' (the hero block shows one): "
            + ", ".join(featured))

    if errors:
        print(f"{len(errors)} problem(s):")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"OK — {len(products)} products, all valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))
