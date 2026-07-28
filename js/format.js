import { WHATSAPP_NUMBER, ARTISAN_NAME } from "./config.js";

/** Format a COP amount the way Colombian shops write it: $18.000 */
export function formatPrice(value) {
  if (value === null || value === undefined) return "Precio a consultar";
  return `$${value.toLocaleString("es-CO")}`;
}

/**
 * Build the message the customer sends. It names the product so Sandra never
 * receives a bare "hola" she has to chase.
 */
export function buildOrderMessage(product) {
  const opening = `Hola ${ARTISAN_NAME}, me interesa el ${product.name} (${product.size})`;
  if (product.price === null || product.price === undefined) {
    return `${opening}. ¿Cuál es el precio y está disponible?`;
  }
  return `${opening} — ${formatPrice(product.price)}. ¿Está disponible?`;
}

/** wa.me link that opens WhatsApp with the message already written. */
export function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
