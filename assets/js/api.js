/*
 * Hostinger Ecommerce Core API V2 storefront client.
 * Docs: https://api-ecommerce.hostinger.com (public storefront API).
 * All money amounts from the API are integers in minor units (cents).
 */
(function () {
  const cfg = window.GA_CONFIG;

  function isLive() {
    return Boolean(cfg.SALES_CHANNEL_ID);
  }

  async function request(path, options = {}) {
    const res = await fetch(cfg.API_BASE + path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Hostinger API ${res.status}: ${body.slice(0, 300)}`);
    }
    return res.json();
  }

  /* List products for the configured sales channel. */
  async function fetchProducts({ limit = 100, offset = 0 } = {}) {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return request(`/v2/channels/${cfg.SALES_CHANNEL_ID}/products?${qs}`);
  }

  async function fetchProduct(idOrSlug) {
    return request(`/v2/channels/${cfg.SALES_CHANNEL_ID}/products/${encodeURIComponent(idOrSlug)}`);
  }

  /*
   * Hosted checkout: create a cart from line items and get a redirect URL.
   * items: [{ variant_id, quantity }]
   */
  async function createHostedCheckout(items) {
    return request(`/v2/channels/${cfg.SALES_CHANNEL_ID}/checkout`, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  }

  /* Normalize a Hostinger PublicProduct into the shape the UI renders. */
  function normalizeProduct(p) {
    const variants = (p.variants || []).map((v) => ({
      id: v.id,
      title: v.title || "Default",
      priceMinor: variantPriceMinor(v),
      available: v.is_available !== false,
      image: v.image_url || null,
    }));
    const priceMinor =
      variants.find((v) => v.priceMinor != null)?.priceMinor ??
      productPriceMinor(p) ??
      0;
    return {
      id: p.id,
      slug: p.url_handle || p.slug || p.id,
      title: p.title || "Untitled",
      subtitle: p.subtitle || "",
      ribbon: p.ribbon_text || "",
      description: p.description || "",
      image: p.thumbnail || (p.images && p.images[0] && (p.images[0].url || p.images[0])) || "",
      images: (p.images || [])
        .map((im) => (typeof im === "string" ? im : im && im.url))
        .filter(Boolean),
      priceMinor,
      available: p.is_available !== false && p.purchasable !== false,
      variants,
      collections: (p.product_collections || []).map((c) => c.title || c.name || "").filter(Boolean),
      demo: false,
    };
  }

  function variantPriceMinor(v) {
    const prices = v.prices;
    if (Array.isArray(prices) && prices.length) {
      const match =
        prices.find((pr) => (pr.currency_code || pr.currency || "").toUpperCase() === cfg.CURRENCY) ||
        prices[0];
      return match.amount ?? match.calculated_price ?? null;
    }
    if (prices && typeof prices === "object") return prices.amount ?? null;
    return null;
  }

  function productPriceMinor(p) {
    const price = p.price;
    if (price == null) return null;
    if (typeof price === "number") return price;
    return price.amount ?? price.calculated_price ?? null;
  }

  window.GA_API = { isLive, fetchProducts, fetchProduct, createHostedCheckout, normalizeProduct };
})();
