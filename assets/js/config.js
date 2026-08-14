/*
 * Great Awakening Clothing — storefront configuration
 *
 * To connect the live Hostinger store, fill in SALES_CHANNEL_ID (and optionally
 * STORE_ID) from the Hostinger Ecommerce dashboard. While these are empty the
 * site runs in demo mode using the bundled catalog in catalog.js, and checkout
 * shows a demo notice instead of redirecting to Hostinger's hosted checkout.
 */
window.GA_CONFIG = {
  /*
   * COMING SOON MODE — set to true to show the cinematic landing page
   * instead of the store; set back to false to open the site. While it's
   * on, add ?preview=1 to any URL to browse the real site (this session
   * only), e.g. yoursite.com/index.html?preview=1. The /admin.html
   * dashboard is never blocked.
   */
  COMING_SOON: true,

  API_BASE: "https://api-ecommerce.hostinger.com",
  SALES_CHANNEL_ID: "scha_01KZVBJ89CJYM2DET6Y61F4WRZ",
  STORE_ID: "store_01KWT3TF7XPSQ1WCNVEF1YRGFC",
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
    "pcol_01KZY1D24JZHPYTPHCC74K3693": "All Products",
    "pcol_01KZY77WYG952JBHQM9NTX460N": "Shirts",
    "pcol_01KZY60G4Y4W58W81EMTNS1MTK": "Hats",
  },
};

/* Coming-soon gate: redirects both ways based on the flag above. */
(function () {
  var onLanding = /coming-soon\.html$/.test(location.pathname);
  var onAdmin = /admin\.html$/.test(location.pathname);
  var qs = new URLSearchParams(location.search);
  if (qs.get("preview") === "1") sessionStorage.setItem("ga-preview", "1");
  var bypass = sessionStorage.getItem("ga-preview") === "1";
  if (window.GA_CONFIG.COMING_SOON && !onLanding && !onAdmin && !bypass) {
    location.replace("coming-soon.html");
  } else if (!window.GA_CONFIG.COMING_SOON && onLanding) {
    location.replace("index.html");
  }
})();
