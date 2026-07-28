#!/usr/bin/env python3
"""Validate data/products.json before publishing.

A malformed catalogue file fails silently in the browser — the page loads and
the grid is simply empty. This script turns that into a loud error.
"""
import json
import sys

CATEGORIES = {"tonics", "perfumes", "oils", "soaps", "hair"}
REQUIRED = {
    "id": str, "name": str, "category": str, "size": str,
    "description": str, "ingredients": list, "available": bool,
}
NULLABLE = {"price": int, "artisanNote": str, "photo": str}


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
        if product.get("category") not in CATEGORIES:
            errors.append(f"{label}: category must be one of {sorted(CATEGORIES)}")
        if product.get("id") in seen:
            errors.append(f"{label}: duplicate id")
        seen.add(product.get("id"))

    if errors:
        print(f"{len(errors)} problem(s):")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"OK — {len(products)} products, all valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))
