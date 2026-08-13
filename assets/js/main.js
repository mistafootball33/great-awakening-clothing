/* Shared UI: cart drawer injection, header behavior, reveals, hero motion, page renderers. */
(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (m) => window.GA_CATALOG.formatPrice(m);

  /* ---- Cart drawer (identical on every page, injected once) ---- */
  function injectDrawer() {
    const tpl = document.createElement("div");
    tpl.innerHTML = `
      <div class="cart-overlay" aria-hidden="true"></div>
      <aside class="cart-drawer" role="dialog" aria-label="Shopping bag">
        <div class="cart-head">
          <h2 class="cart-title">Your bag</h2>
          <button type="button" class="cart-close" data-cart-close aria-label="Close bag">&times;</button>
        </div>
        <p class="cart-note" data-cart-note></p>
        <div class="cart-items" data-cart-items></div>
        <div class="cart-foot">
          <div class="cart-subtotal-row"><span>Subtotal</span><strong data-cart-subtotal>$0.00</strong></div>
          <p class="cart-fineprint">Shipping and taxes calculated at checkout.</p>
          <button type="button" class="btn btn-solid btn-block" data-checkout>Checkout</button>
        </div>
      </aside>`;
    while (tpl.firstElementChild) document.body.appendChild(tpl.firstElementChild);
  }

  /* ---- Header ---- */
  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const burger = document.querySelector("[data-nav-toggle]");
    if (burger) burger.addEventListener("click", () => document.body.classList.toggle("nav-open"));

    const search = document.querySelector("[data-search]");
    if (search)
      search.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && search.value.trim())
          window.location.href = "shop.html?q=" + encodeURIComponent(search.value.trim());
      });
  }

  /* ---- Scroll reveals ---- */
  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---- Cinematic hero ---- */
  function initHero() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    // Split headline into word spans for the staggered clip reveal.
    const headline = hero.querySelector(".hero-headline");
    if (headline && !reducedMotion) {
      const words = headline.textContent.trim().split(/\s+/);
      headline.innerHTML = words
        .map((w, i) => `<span class="hero-word" style="transition-delay:${0.55 + i * 0.12}s"><span>${w}</span></span>`)
        .join(" ");
    }
    requestAnimationFrame(() => hero.classList.add("is-ready"));

    const video = hero.querySelector(".hero-media video");
    if (video) {
      if (reducedMotion) {
        video.removeAttribute("autoplay");
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    }

    // Scroll parallax: media drifts slower than the page, content fades out.
    if (!reducedMotion) {
      const media = hero.querySelector(".hero-media");
      const content = hero.querySelector(".hero-content");
      let ticking = false;
      const update = () => {
        ticking = false;
        const y = window.scrollY;
        const h = hero.offsetHeight || 1;
        const p = Math.min(y / h, 1);
        if (media) media.style.transform = `translateY(${y * 0.35}px)`;
        if (content) {
          content.style.opacity = String(1 - p * 1.4);
          content.style.transform = `translateY(${y * 0.12}px)`;
        }
      };
      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        },
        { passive: true }
      );
    }
  }

  /* ---- Product cards ---- */
  function productCard(p, delay) {
    const style = delay ? ` style="transition-delay:${delay}ms"` : "";
    return `
      <article class="product-card reveal"${style}>
        <a class="product-media" href="product.html?p=${encodeURIComponent(p.slug)}">
          ${p.ribbon ? `<span class="product-ribbon">${esc(p.ribbon)}</span>` : ""}
          <img src="${p.image}" alt="${esc(p.title)}" loading="lazy" />
          <button type="button" class="quick-add" data-quick-add="${esc(p.id)}">Quick add</button>
        </a>
        <div class="product-meta">
          <h3 class="product-title"><a href="product.html?p=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h3>
          <p class="product-subtitle">${esc(p.subtitle || "")}</p>
          <p class="product-price">${fmt(p.priceMinor)}</p>
        </div>
      </article>`;
  }

  function bindQuickAdd(products) {
    document.querySelectorAll("[data-quick-add]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const p = products.find((x) => x.id === btn.dataset.quickAdd);
        if (!p) return;
        const variant = p.variants.find((v) => v.title === "M") || p.variants[0];
        window.GA_CART.add(p, variant, 1);
      });
    });
  }

  function renderGrid(sel, products, limit) {
    const el = document.querySelector(sel);
    if (!el) return;
    const list = limit ? products.slice(0, limit) : products;
    el.innerHTML = list.map((p, i) => productCard(p, (i % 4) * 70)).join("");
  }

  /* ---- Pages ---- */
  async function initHome() {
    const products = await window.GA_CATALOG.getProducts();
    renderGrid("[data-grid-new]", products.filter((p) => p.collections.includes("New Arrivals")).length
      ? products.filter((p) => p.collections.includes("New Arrivals"))
      : products, 4);
    renderGrid("[data-grid-best]", products.filter((p) => p.collections.includes("Bestsellers")).length
      ? products.filter((p) => p.collections.includes("Bestsellers"))
      : products.slice().reverse(), 4);
    bindQuickAdd(products);
    initReveals();
  }

  async function initShop() {
    const products = await window.GA_CATALOG.getProducts();
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").toLowerCase();
    let activeFilter = params.get("c") || "All";
    let sort = "featured";

    const collections = ["All", ...new Set(products.flatMap((p) => p.collections))];
    const chipsEl = document.querySelector("[data-filter-chips]");
    chipsEl.innerHTML = collections
      .map((c) => `<button type="button" class="chip${c === activeFilter ? " is-active" : ""}" data-chip="${esc(c)}">${esc(c)}</button>`)
      .join("");

    const heading = document.querySelector("[data-shop-heading]");
    const countEl = document.querySelector("[data-shop-count]");

    function apply() {
      let list = products.slice();
      if (q) list = list.filter((p) => (p.title + " " + p.subtitle + " " + p.collections.join(" ")).toLowerCase().includes(q));
      if (activeFilter !== "All") list = list.filter((p) => p.collections.includes(activeFilter));
      if (sort === "price-asc") list.sort((a, b) => a.priceMinor - b.priceMinor);
      if (sort === "price-desc") list.sort((a, b) => b.priceMinor - a.priceMinor);
      if (sort === "name") list.sort((a, b) => a.title.localeCompare(b.title));
      if (heading) heading.textContent = q ? `Results for “${q}”` : activeFilter === "All" ? "Shop all" : activeFilter;
      if (countEl) countEl.textContent = `${list.length} ${list.length === 1 ? "piece" : "pieces"}`;
      renderGrid("[data-grid-shop]", list);
      bindQuickAdd(list);
      initReveals();
    }

    chipsEl.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-chip]");
      if (!chip) return;
      activeFilter = chip.dataset.chip;
      chipsEl.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      apply();
    });

    const sortEl = document.querySelector("[data-sort]");
    if (sortEl)
      sortEl.addEventListener("change", () => {
        sort = sortEl.value;
        apply();
      });

    apply();
  }

  async function initProduct() {
    const params = new URLSearchParams(location.search);
    const slug = params.get("p");
    const p = slug ? await window.GA_CATALOG.getProduct(slug) : null;
    const wrap = document.querySelector("[data-pdp]");
    if (!wrap) return;
    if (!p) {
      wrap.innerHTML = `<div class="pdp-missing"><h1>Piece not found</h1><p><a class="link-underline" href="shop.html">Back to the shop</a></p></div>`;
      return;
    }
    document.title = `${p.title} — Great Awakening Clothing`;

    const gallery = p.images.length ? p.images : [p.image];
    wrap.innerHTML = `
      <div class="pdp-gallery reveal is-in">
        <div class="pdp-main"><img src="${gallery[0]}" alt="${esc(p.title)}" data-pdp-main /></div>
        ${gallery.length > 1 ? `<div class="pdp-thumbs">${gallery.map((g, i) => `<button type="button" class="pdp-thumb${i === 0 ? " is-active" : ""}" data-thumb="${g}"><img src="${g}" alt="" /></button>`).join("")}</div>` : ""}
      </div>
      <div class="pdp-info">
        ${p.ribbon ? `<span class="product-ribbon static">${esc(p.ribbon)}</span>` : ""}
        <h1 class="pdp-title">${esc(p.title)}</h1>
        <p class="pdp-subtitle">${esc(p.subtitle || "")}</p>
        <p class="pdp-price">${fmt(p.priceMinor)}</p>
        <div class="pdp-variants" data-variants>
          ${p.variants.map((v, i) => `<button type="button" class="variant-pill${i === 0 ? " is-active" : ""}" data-variant="${esc(v.id)}" ${v.available ? "" : "disabled"}>${esc(v.title)}</button>`).join("")}
        </div>
        <button type="button" class="btn btn-solid btn-block" data-add>Add to bag — ${fmt(p.priceMinor)}</button>
        <div class="pdp-desc"><p>${esc(p.description)}</p></div>
        <ul class="pdp-perks">
          <li>Free U.S. shipping over $75</li>
          <li>30-day easy returns</li>
          <li>Secure checkout by Hostinger</li>
        </ul>
      </div>`;

    let selected = p.variants[0];
    wrap.querySelector("[data-variants]").addEventListener("click", (e) => {
      const pill = e.target.closest("[data-variant]");
      if (!pill) return;
      selected = p.variants.find((v) => v.id === pill.dataset.variant) || selected;
      wrap.querySelectorAll(".variant-pill").forEach((b) => b.classList.toggle("is-active", b === pill));
    });
    wrap.querySelector("[data-add]").addEventListener("click", () => window.GA_CART.add(p, selected, 1));
    wrap.querySelectorAll("[data-thumb]").forEach((b) =>
      b.addEventListener("click", () => {
        wrap.querySelector("[data-pdp-main]").src = b.dataset.thumb;
        wrap.querySelectorAll(".pdp-thumb").forEach((t) => t.classList.toggle("is-active", t === b));
      })
    );

    const products = await window.GA_CATALOG.getProducts();
    const related = products.filter((x) => x.id !== p.id).slice(0, 4);
    renderGrid("[data-grid-related]", related);
    bindQuickAdd(related);
    initReveals();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectDrawer();
    initHeader();
    initHero();
    const page = document.body.dataset.page;
    if (page === "home") initHome();
    else if (page === "shop") initShop();
    else if (page === "product") initProduct();
    else initReveals();
  });
})();
