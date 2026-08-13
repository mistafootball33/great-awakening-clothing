/*
 * Cart drawer. Line items persist in localStorage. Checkout hands the cart to
 * Hostinger's hosted checkout (POST /v2/channels/{id}/checkout -> redirect URL)
 * when a sales channel is configured; otherwise it explains demo mode.
 */
(function () {
  const KEY = "ga-cart-v1";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    renderBadge();
  }

  function add(product, variant, qty = 1) {
    const items = load();
    const lineId = `${product.id}::${variant.id}`;
    const existing = items.find((i) => i.lineId === lineId);
    if (existing) existing.qty += qty;
    else
      items.push({
        lineId,
        productId: product.id,
        slug: product.slug,
        variantId: variant.id,
        title: product.title,
        variantTitle: variant.title,
        priceMinor: variant.priceMinor ?? product.priceMinor,
        image: product.image,
        qty,
      });
    save(items);
    openDrawer();
    renderDrawer();
  }

  function setQty(lineId, qty) {
    let items = load();
    const item = items.find((i) => i.lineId === lineId);
    if (!item) return;
    item.qty = qty;
    if (item.qty <= 0) items = items.filter((i) => i.lineId !== lineId);
    save(items);
    renderDrawer();
  }

  function count() {
    return load().reduce((n, i) => n + i.qty, 0);
  }

  function subtotalMinor() {
    return load().reduce((n, i) => n + i.priceMinor * i.qty, 0);
  }

  /* ---- UI ---- */

  function renderBadge() {
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      const n = count();
      el.textContent = n;
      el.classList.toggle("is-visible", n > 0);
    });
  }

  function openDrawer() {
    document.body.classList.add("cart-open");
    renderDrawer();
  }

  function closeDrawer() {
    document.body.classList.remove("cart-open");
  }

  function renderDrawer() {
    const list = document.querySelector("[data-cart-items]");
    const totalEl = document.querySelector("[data-cart-subtotal]");
    const noteEl = document.querySelector("[data-cart-note]");
    if (!list) return;
    const items = load();
    const fmt = window.GA_CATALOG.formatPrice;

    if (!items.length) {
      list.innerHTML = `<p class="cart-empty">Your bag is empty.<br /><a href="shop.html" class="link-underline">Shop the collection</a></p>`;
    } else {
      list.innerHTML = items
        .map(
          (i) => `
        <div class="cart-line" data-line="${i.lineId}">
          <a href="product.html?p=${encodeURIComponent(i.slug)}" class="cart-line-media"><img src="${i.image}" alt="${esc(i.title)}" /></a>
          <div class="cart-line-body">
            <p class="cart-line-title">${esc(i.title)}</p>
            <p class="cart-line-variant">${esc(i.variantTitle)}</p>
            <div class="cart-line-controls">
              <div class="qty-stepper">
                <button type="button" data-qty-minus aria-label="Decrease quantity">&minus;</button>
                <span>${i.qty}</span>
                <button type="button" data-qty-plus aria-label="Increase quantity">+</button>
              </div>
              <button type="button" class="cart-line-remove" data-remove>Remove</button>
            </div>
          </div>
          <p class="cart-line-price">${fmt(i.priceMinor * i.qty)}</p>
        </div>`
        )
        .join("");
    }

    if (totalEl) totalEl.textContent = fmt(subtotalMinor());
    if (noteEl) {
      const threshold = window.GA_CONFIG.FREE_SHIPPING_THRESHOLD;
      const away = threshold - subtotalMinor();
      noteEl.textContent =
        items.length && away > 0
          ? `You're ${fmt(away)} away from free U.S. shipping.`
          : items.length
          ? "You've unlocked free U.S. shipping."
          : "";
    }
  }

  async function checkout() {
    const items = load();
    if (!items.length) return;
    const btn = document.querySelector("[data-checkout]");
    if (window.GA_API.isLive()) {
      try {
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Preparing checkout…";
        }
        const payload = items.map((i) => ({ variant_id: i.variantId, quantity: i.qty }));
        const res = await window.GA_API.createHostedCheckout(payload);
        window.location.href = res.url;
        return;
      } catch (err) {
        alert("Checkout is unavailable right now. Please try again.\n\n" + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Checkout";
        }
      }
    } else {
      alert(
        "Demo mode: connect the Hostinger sales channel in assets/js/config.js to enable secure hosted checkout."
      );
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* Delegated events */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-cart-open]")) {
      e.preventDefault();
      openDrawer();
    }
    if (t.closest("[data-cart-close]") || t.matches(".cart-overlay")) closeDrawer();
    if (t.closest("[data-checkout]")) checkout();
    const line = t.closest(".cart-line");
    if (line) {
      const id = line.dataset.line;
      const item = load().find((i) => i.lineId === id);
      if (!item) return;
      if (t.closest("[data-qty-minus]")) setQty(id, item.qty - 1);
      if (t.closest("[data-qty-plus]")) setQty(id, item.qty + 1);
      if (t.closest("[data-remove]")) setQty(id, 0);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  document.addEventListener("DOMContentLoaded", () => {
    renderBadge();
    renderDrawer();
  });

  window.GA_CART = { add, openDrawer };
})();
