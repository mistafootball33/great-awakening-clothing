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
  SALES_CHANNEL_ID: "", // e.g. "01J..." — from Hostinger Ecommerce
  STORE_ID: "",
  CURRENCY: "USD",
  FREE_SHIPPING_THRESHOLD: 7500, // minor units (cents)
};
