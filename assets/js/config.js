/*
 * Great Awakening Clothing — storefront configuration
 *
 * To connect the live Hostinger store, fill in SALES_CHANNEL_ID (and optionally
 * STORE_ID) from the Hostinger Ecommerce dashboard. While these are empty the
 * site runs in demo mode using the bundled catalog in catalog.js, and checkout
 * shows a demo notice instead of redirecting to Hostinger's hosted checkout.
 */
window.GA_CONFIG = {
  API_BASE: "https://api-ecommerce.hostinger.com",
  SALES_CHANNEL_ID: "scha_01KZVBJ89CJYM2DET6Y61F4WRZ",
  STORE_ID: "",
  CURRENCY: "USD",
  FREE_SHIPPING_THRESHOLD: 7500, // minor units (cents)
  /*
   * Category display names.
   * The Hostinger storefront API identifies categories (collections) by id
   * only — it does not expose the names you typed in the dashboard. The site
   * detects every category automatically; add its display name here once:
   *   "pcol_XXXXXXXXXXXXXXXXXXXXXXXXXX": "Hats",
   * Unnamed categories appear as "Category 1", "Category 2", … until named.
   */
  COLLECTION_NAMES: {
    // "pcol_01KZY1DJ72DPVXZB21MPZNGFRK": "Your category name",
  },
};
