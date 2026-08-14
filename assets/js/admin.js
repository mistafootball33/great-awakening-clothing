/* Store Manager dashboard: live read-only view of the Hostinger sales channel. */
(function () {
  const cfg = window.GA_CONFIG;
  const fmt = (m) => window.GA_CATALOG.formatPrice(m);
  const label = window.GA_CATALOG.collectionLabel;

  document.querySelector("[data-channel-id]").textContent = cfg.SALES_CHANNEL_ID || "not configured";

  let products = [];
  let meta = null;

  async function loadAll() {
    const rows = document.querySelector("[data-admin-rows]");
    rows.innerHTML = `<tr><td colspan="6"><p class="loading-note">Loading live catalog…</p></td></tr>`;
    try {
      const [pres, vres, mres] = await Promise.all([
        window.GA_API.fetchProducts({ limit: 100 }),
        window.GA_API.fetchVariants({ limit: 100 }),
        cfg.STORE_ID ? window.GA_API.fetchStoreMetadata().catch(() => null) : Promise.resolve(null),
      ]);
      const byProduct = {};
      (vres.data || []).forEach((v) => (byProduct[v.product_id] = byProduct[v.product_id] || []).push(v));
      // Admin view: keep every product, including unavailable ones.
      products = (pres.data || []).map((p) =>
        window.GA_API.normalizeProduct({ ...p, variants: p.variants || byProduct[p.id] || [] })
      );
      // Track raw inventory per product for the stock column.
      const invByProduct = {};
      (vres.data || []).forEach((v) => {
        const cur = invByProduct[v.product_id] || { tracked: false, qty: 0 };
        if (v.manage_inventory) {
          cur.tracked = true;
          cur.qty += v.inventory_quantity || 0;
        }
        invByProduct[v.product_id] = cur;
      });
      products.forEach((p) => (p.inventory = invByProduct[p.id] || { tracked: false, qty: 0 }));
      meta = mres && mres.store ? mres.store : null;
      renderStats();
      renderChecklist();
      renderTable();
      renderCategories();
    } catch (err) {
      rows.innerHTML = `<tr><td colspan="6"><p class="loading-note">Could not reach the Hostinger API: ${esc(err.message)}</p></td></tr>`;
    }
  }

  function renderStats() {
    const cats = allCategories();
    set("[data-stat-products]", products.length);
    set("[data-stat-products-sub]", products.filter((p) => p.available).length + " visible in the shop");
    set("[data-stat-categories]", cats.length);
    const unnamed = cats.filter((c) => /^Category \d+$/.test(label(c.id))).length;
    set("[data-stat-categories-sub]", unnamed ? `${unnamed} need a display name` : "all named");
    set("[data-stat-value]", fmt(products.reduce((n, p) => n + (p.priceMinor || 0), 0)));

    const payCard = document.querySelector("[data-card-payments]");
    if (meta) {
      const ok = meta.has_payment_methods;
      set("[data-stat-payments]", ok ? "Connected" : "Not set up");
      set("[data-stat-payments-sub]", ok ? "checkout is live" : "checkout blocked until connected");
      payCard.classList.add(ok ? "ok" : "warn");
    } else {
      set("[data-stat-payments]", "—");
      set("[data-stat-payments-sub]", "status unavailable");
    }

    const tracked = products.filter((p) => p.inventory.tracked);
    const low = tracked.filter((p) => p.inventory.qty <= 5);
    const stockCard = document.querySelector("[data-card-stock]");
    if (!tracked.length) {
      set("[data-stat-stock]", "Untracked");
      set("[data-stat-stock-sub]", "no products track stock counts");
    } else if (low.length) {
      set("[data-stat-stock]", low.length + " low");
      set("[data-stat-stock-sub]", "products at 5 or fewer units");
      stockCard.classList.add("warn");
    } else {
      set("[data-stat-stock]", "Healthy");
      set("[data-stat-stock-sub]", tracked.length + " products tracked");
      stockCard.classList.add("ok");
    }
  }

  function renderChecklist() {
    const cats = allCategories();
    const unnamed = cats.filter((c) => /^Category \d+$/.test(label(c.id)));
    const items = [
      {
        done: products.length > 0,
        text: "Products published to the sales channel",
        hint: products.length ? `${products.length} live` : 'Add products in the Hostinger panel.',
      },
      {
        done: cats.length > 0,
        text: "Categories created and assigned",
        hint: cats.length ? `${cats.length} categories in use` : "Create categories in the Hostinger panel.",
      },
      {
        done: unnamed.length === 0,
        text: "Category display names set on the website",
        hint: unnamed.length
          ? `${unnamed.length} showing as a placeholder — add names in assets/js/config.js`
          : "All categories have display names.",
      },
      {
        done: Boolean(meta && meta.has_payment_methods),
        text: "Payment provider connected",
        hint:
          meta && meta.has_payment_methods
            ? "Customers can check out."
            : 'Checkout returns an error until payments are connected in the Hostinger panel.',
      },
    ];
    document.querySelector("[data-checklist]").innerHTML = items
      .map(
        (i) => `
      <div class="check-item ${i.done ? "done" : "todo"}">
        <span class="mark">${i.done ? "✓" : "✗"}</span>
        <div><p><strong>${i.text}</strong></p><p class="hint">${i.hint}</p></div>
      </div>`
      )
      .join("");
  }

  function renderTable() {
    const q = (document.querySelector("[data-admin-search]").value || "").toLowerCase();
    const sort = document.querySelector("[data-admin-sort]").value;
    let list = products.slice();
    if (q)
      list = list.filter((p) =>
        (p.title + " " + p.subtitle + " " + p.collections.map(label).join(" ")).toLowerCase().includes(q)
      );
    if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "price-desc") list.sort((a, b) => b.priceMinor - a.priceMinor);
    if (sort === "price-asc") list.sort((a, b) => a.priceMinor - b.priceMinor);
    if (sort === "stock")
      list.sort((a, b) => (a.inventory.tracked ? a.inventory.qty : 1e9) - (b.inventory.tracked ? b.inventory.qty : 1e9));

    const rows = document.querySelector("[data-admin-rows]");
    if (!list.length) {
      rows.innerHTML = `<tr><td colspan="6"><p class="loading-note">No products match.</p></td></tr>`;
      return;
    }
    rows.innerHTML = list
      .map(
        (p) => `
      <tr>
        <td><img src="${p.image}" alt="" loading="lazy" /></td>
        <td><div class="p-title">${esc(p.title)}</div>${p.subtitle ? `<div class="p-sub">${esc(p.subtitle)}</div>` : ""}</td>
        <td>${p.collections.map((c) => `<span class="badge cat">${esc(label(c))}</span>`).join("") || "<span class='p-sub'>—</span>"}</td>
        <td>${fmt(p.priceMinor)}</td>
        <td>${p.inventory.tracked ? p.inventory.qty + " units" : "untracked"}</td>
        <td><span class="badge ${p.available ? "live" : "off"}">${p.available ? "Visible" : "Hidden"}</span></td>
      </tr>`
      )
      .join("");
  }

  function renderCategories() {
    const cats = allCategories();
    const el = document.querySelector("[data-admin-categories]");
    if (!cats.length) {
      el.innerHTML = `<p class="loading-note">No categories in the store yet.</p>`;
      return;
    }
    el.innerHTML = cats
      .map((c) => {
        const name = label(c.id);
        const unnamed = /^Category \d+$/.test(name);
        return `
        <div class="cat-row">
          <div>
            <span class="cat-name">${esc(name)}</span>
            <span class="badge cat">${c.count} ${c.count === 1 ? "product" : "products"}</span>
            <div class="cat-id">${esc(c.id)}</div>
          </div>
          ${unnamed ? `<span class="cat-warning">Needs a display name in config.js</span>` : ""}
        </div>`;
      })
      .join("");
  }

  function allCategories() {
    const map = {};
    products.forEach((p) => p.collections.forEach((c) => (map[c] = (map[c] || 0) + 1)));
    return Object.entries(map).map(([id, count]) => ({ id, count }));
  }

  function set(sel, v) {
    const el = document.querySelector(sel);
    if (el) el.textContent = v;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  document.querySelector("[data-refresh]").addEventListener("click", loadAll);
  document.querySelector("[data-admin-search]").addEventListener("input", renderTable);
  document.querySelector("[data-admin-sort]").addEventListener("change", renderTable);
  document.addEventListener("DOMContentLoaded", loadAll);
})();
