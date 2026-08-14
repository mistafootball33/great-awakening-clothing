/* PWA: service worker registration + animated install invitation. */
(function () {
  const DISMISS_KEY = "ga-app-banner-dismissed";
  const DISMISS_DAYS = 7;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    maybeShowBanner();
  });

  function dismissed() {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return t && Date.now() - t < DISMISS_DAYS * 864e5;
  }

  function maybeShowBanner() {
    if (isStandalone || dismissed() || document.querySelector(".app-banner")) return;
    buildBanner();
    // Let the page settle, then rise.
    setTimeout(() => document.querySelector(".app-banner").classList.add("is-up"), 1800);
  }

  function buildBanner() {
    const el = document.createElement("div");
    el.className = "app-banner";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Install the Great Awakening app");
    el.innerHTML = `
      <div class="app-banner-ring" aria-hidden="true"><img src="assets/img/brand/icon-192.png" alt="" /></div>
      <div class="app-banner-copy">
        <p class="app-banner-title">Get the Great Awakening app</p>
        <p class="app-banner-sub">The shop on your home screen — fast, full-screen, always with you.</p>
      </div>
      <button type="button" class="app-banner-cta" data-app-install><span>${deferredPrompt ? "Install" : "How to install"}</span></button>
      <button type="button" class="app-banner-close" data-app-close aria-label="Not now">&times;</button>`;
    document.body.appendChild(el);

    el.querySelector("[data-app-close]").addEventListener("click", () => {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      el.classList.remove("is-up");
      setTimeout(() => el.remove(), 600);
    });

    el.querySelector("[data-app-install]").addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice.catch(() => null);
        if (choice && choice.outcome === "accepted") {
          el.classList.remove("is-up");
          setTimeout(() => el.remove(), 600);
        }
        deferredPrompt = null;
      } else {
        openModal();
      }
    });
  }

  function openModal() {
    if (document.querySelector(".app-modal")) return;
    const el = document.createElement("div");
    el.className = "app-modal";
    el.innerHTML = `
      <div class="app-modal-card" role="dialog" aria-label="How to install the app">
        <button type="button" class="cart-close" data-modal-close aria-label="Close">&times;</button>
        <img class="app-modal-icon" src="assets/img/brand/icon-192.png" alt="" />
        <h2>Add the app to your phone</h2>
        ${
          isIOS
            ? `<ol class="app-steps">
                <li><strong>Open this site in Safari</strong> (installing only works from Safari on iPhone).</li>
                <li>Tap the <strong>Share</strong> button <span class="app-key">⬆︎</span> at the bottom of the screen.</li>
                <li>Scroll down and tap <strong>“Add to Home Screen”</strong>.</li>
                <li>Tap <strong>Add</strong> — the Great Awakening app appears on your home screen.</li>
              </ol>`
            : `<ol class="app-steps">
                <li>Open this site in <strong>Chrome</strong> on your Android phone.</li>
                <li>Tap the <strong>⋮ menu</strong> in the top-right corner.</li>
                <li>Tap <strong>“Add to Home screen”</strong> (or <strong>“Install app”</strong>).</li>
                <li>Confirm — the Great Awakening app appears on your home screen.</li>
              </ol>`
        }
        <p class="app-modal-note">No app store, no download size — it's the shop itself, full-screen and one tap away.</p>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-open"));
    const close = () => {
      el.classList.remove("is-open");
      setTimeout(() => el.remove(), 400);
    };
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest("[data-modal-close]")) close();
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", esc);
      }
    });
  }

  // iOS never fires beforeinstallprompt — invite with instructions instead.
  document.addEventListener("DOMContentLoaded", () => {
    if (isIOS) maybeShowBanner();
    // Any element can open the instructions, e.g. a footer link.
    document.querySelectorAll("[data-get-app]").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        if (deferredPrompt) deferredPrompt.prompt();
        else openModal();
      })
    );
  });

  // Desktop Chrome fires beforeinstallprompt too — banner covers it.
})();
