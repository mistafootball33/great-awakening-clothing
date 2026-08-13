/*
 * Catalog loader. Live mode pulls from the Hostinger storefront API;
 * demo mode uses the bundled collection below so the site is fully
 * browsable before the store is connected. Prices are minor units (cents).
 */
(function () {
  const DEMO_PRODUCTS = [
    {
      id: "demo-hoodie-cream",
      slug: "daybreak-hoodie-cream",
      title: "Daybreak Hoodie",
      subtitle: "Heavyweight fleece — Bone",
      ribbon: "New",
      description:
        "A 480 GSM heavyweight fleece hoodie in warm bone, garment-dyed and finished with our embroidered rising-sun mark at the chest. Dropped shoulders, double-lined hood, ribbed cuffs that hold their shape.",
      image: "assets/img/products/hoodie-cream.jpg",
      images: ["assets/img/products/hoodie-cream.jpg"],
      priceMinor: 8800,
      available: true,
      collections: ["Hoodies", "New Arrivals", "Bestsellers"],
      variants: sizeRun("demo-hoodie-cream", 8800),
      demo: true,
    },
    {
      id: "demo-hoodie-black",
      slug: "first-light-hoodie-black",
      title: "First Light Hoodie",
      subtitle: "Heavyweight fleece — Ink",
      ribbon: "",
      description:
        "Our signature sunrise graphic printed in amber across a matte black heavyweight hoodie. Soft-hand water-based ink, brushed fleece interior, built to be lived in.",
      image: "assets/img/products/hoodie-black.jpg",
      images: ["assets/img/products/hoodie-black.jpg"],
      priceMinor: 9200,
      available: true,
      collections: ["Hoodies", "Bestsellers"],
      variants: sizeRun("demo-hoodie-black", 9200),
      demo: true,
    },
    {
      id: "demo-tee-white",
      slug: "awakening-tee-white",
      title: "Awakening Tee",
      subtitle: "Heavyweight cotton — White",
      ribbon: "Bestseller",
      description:
        "The tee that started it all. 220 GSM combed cotton with the Great Awakening arch and rising sun printed at the chest. Pre-shrunk, boxy fit, ribbed collar.",
      image: "assets/img/products/tee-white.jpg",
      images: ["assets/img/products/tee-white.jpg"],
      priceMinor: 4200,
      available: true,
      collections: ["Tees & Tops", "Bestsellers"],
      variants: sizeRun("demo-tee-white", 4200),
      demo: true,
    },
    {
      id: "demo-tee-black",
      slug: "ember-tee-black",
      title: "Ember Tee",
      subtitle: "Heavyweight cotton — Ink",
      ribbon: "",
      description:
        "A quiet one. Ink-black heavyweight cotton with a single gold sun at the chest. Wears in, never out.",
      image: "assets/img/products/tee-black.jpg",
      images: ["assets/img/products/tee-black.jpg"],
      priceMinor: 4200,
      available: true,
      collections: ["Tees & Tops", "New Arrivals"],
      variants: sizeRun("demo-tee-black", 4200),
      demo: true,
    },
    {
      id: "demo-cap-cream",
      slug: "horizon-cap-cream",
      title: "Horizon Cap",
      subtitle: "Corduroy — Bone",
      ribbon: "",
      description:
        "Six-panel corduroy cap in bone with the embroidered sunrise up front. Adjustable brass closure, low unstructured profile.",
      image: "assets/img/products/cap-cream.jpg",
      images: ["assets/img/products/cap-cream.jpg"],
      priceMinor: 3400,
      available: true,
      collections: ["Headwear", "New Arrivals"],
      variants: [{ id: "demo-cap-cream-os", title: "One Size", priceMinor: 3400, available: true }],
      demo: true,
    },
    {
      id: "demo-crew-terracotta",
      slug: "golden-hour-crewneck",
      title: "Golden Hour Crewneck",
      subtitle: "French terry — Terracotta",
      ribbon: "New",
      description:
        "Garment-dyed french terry crewneck in terracotta with a tonal embroidered sun. Relaxed through the body, ribbed everywhere it counts.",
      image: "assets/img/products/crewneck-terracotta.jpg",
      images: ["assets/img/products/crewneck-terracotta.jpg"],
      priceMinor: 7400,
      available: true,
      collections: ["Sweats", "New Arrivals", "Bestsellers"],
      variants: sizeRun("demo-crew-terracotta", 7400),
      demo: true,
    },
    {
      id: "demo-joggers-black",
      slug: "still-morning-joggers",
      title: "Still Morning Joggers",
      subtitle: "Brushed fleece — Ink",
      ribbon: "",
      description:
        "Tapered fleece joggers with gold-tipped drawcords and a low-key sun mark at the hip. Deep pockets, cuffed ankle, all-day weight.",
      image: "assets/img/products/joggers-black.jpg",
      images: ["assets/img/products/joggers-black.jpg"],
      priceMinor: 6800,
      available: true,
      collections: ["Sweats"],
      variants: sizeRun("demo-joggers-black", 6800),
      demo: true,
    },
    {
      id: "demo-jacket-camel",
      slug: "pilgrim-chore-jacket",
      title: "Pilgrim Chore Jacket",
      subtitle: "Washed canvas — Camel",
      ribbon: "Limited",
      description:
        "A washed-canvas chore jacket in camel with corozo buttons and the sunrise stitched over the chest pocket. Cut roomy for layering through the cold months.",
      image: "assets/img/products/jacket-camel.jpg",
      images: ["assets/img/products/jacket-camel.jpg"],
      priceMinor: 12800,
      available: true,
      collections: ["Outerwear", "New Arrivals"],
      variants: sizeRun("demo-jacket-camel", 12800),
      demo: true,
    },
  ];

  function sizeRun(base, priceMinor) {
    return ["S", "M", "L", "XL", "2XL"].map((s) => ({
      id: `${base}-${s.toLowerCase()}`,
      title: s,
      priceMinor,
      available: true,
    }));
  }

  let cache = null;

  async function getProducts() {
    if (cache) return cache;
    if (window.GA_API.isLive()) {
      try {
        // The product list returns variants/prices as null; join the variants endpoint.
        const [res, vres] = await Promise.all([
          window.GA_API.fetchProducts({ limit: 100 }),
          window.GA_API.fetchVariants({ limit: 100 }),
        ]);
        const variantsByProduct = {};
        (vres.data || []).forEach((v) => {
          (variantsByProduct[v.product_id] = variantsByProduct[v.product_id] || []).push(v);
        });
        const items = (res.data || [])
          .map((p) =>
            window.GA_API.normalizeProduct({ ...p, variants: p.variants || variantsByProduct[p.id] || [] })
          )
          .filter((p) => p.available);
        // Live mode shows ONLY the sales channel's products — never the demo set.
        cache = items;
        return cache;
      } catch (err) {
        console.warn("Could not load the live catalog:", err.message);
        return [];
      }
    }
    cache = DEMO_PRODUCTS;
    return cache;
  }

  async function getProduct(idOrSlug) {
    const items = await getProducts();
    return items.find((p) => p.slug === idOrSlug || p.id === idOrSlug) || null;
  }

  function formatPrice(minor, currency) {
    const cur = currency || window.GA_CONFIG.CURRENCY || "USD";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format((minor || 0) / 100);
  }

  window.GA_CATALOG = { getProducts, getProduct, formatPrice };
})();
