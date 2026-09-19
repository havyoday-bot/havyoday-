/* =========================================================
   HAVYODAY — APP.JS
   Supabase Connected Version
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     1. SUPABASE CONFIG
     ======================================================= */

  const SUPABASE_URL =
    "https://ebzvmhbmoowsmmffvgif.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_B-y3E6yHs2LhpFHmVkmBAQ_cMCiQgzd";


  /* =======================================================
     2. SUPABASE CLIENT
     ======================================================= */

  let supabase = null;

  try {

    if (
      window.supabaseClient
    ) {

      supabase =
        window.supabaseClient;

    } else if (
      window.supabase &&
      typeof window.supabase.createClient ===
        "function"
    ) {

      supabase =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY
        );

      window.supabaseClient =
        supabase;

    }

  } catch (error) {

    console.error(
      "HAVYODAY: Supabase initialization error:",
      error
    );

  }


  /* =======================================================
     3. DATABASE / STORAGE NAMES
     ======================================================= */

  const PRODUCT_TABLE =
    "pooja stor";

  const ORDER_TABLE =
    "orders";

  const BANNER_TABLE =
    "banners";

  const PRODUCT_BUCKET =
    "New test product";

  const BANNER_BUCKET =
    "banners";

  const CART_KEY =
    "havyoday_cart";


  /* =======================================================
     4. BASIC HELPERS
     ======================================================= */

  function safeText(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value);

  }


  function escapeHTML(
    value
  ) {

    return safeText(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  function escapeAttribute(
    value
  ) {

    return escapeHTML(
      value
    );

  }


  function formatPrice(
    value
  ) {

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {

      return "₹0";

    }

    return (
      "₹" +
      number.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2
        }
      )
    );

  }


  function getImageUrl(
    imageUrl,
    bucketName
  ) {

    const value =
      safeText(
        imageUrl
      ).trim();


    if (!value) {

      return "";

    }


    if (
      value.startsWith(
        "http://"
      ) ||
      value.startsWith(
        "https://"
      ) ||
      value.startsWith(
        "data:"
      )
    ) {

      return value;

    }


    if (!supabase) {

      return value;

    }


    try {

      const result =
        supabase.storage
          .from(
            bucketName
          )
          .getPublicUrl(
            value
          );


      if (
        result &&
        result.data &&
        result.data.publicUrl
      ) {

        return result.data.publicUrl;

      }

    } catch (error) {

      console.error(
        "HAVYODAY: Image URL error:",
        error
      );

    }


    return value;

  }


  /* =======================================================
     5. CART HELPERS
     ======================================================= */

  function getCart() {

    try {

      const savedCart =
        localStorage.getItem(
          CART_KEY
        );


      if (!savedCart) {

        return [];

      }


      const cart =
        JSON.parse(
          savedCart
        );


      return Array.isArray(cart)
        ? cart
        : [];

    } catch (error) {

      console.error(
        "HAVYODAY: Cart read error:",
        error
      );

      return [];

    }

  }


  function saveCart(
    cart
  ) {

    try {

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(
          Array.isArray(cart)
            ? cart
            : []
        )
      );


      updateCartCount();


      window.dispatchEvent(
        new CustomEvent(
          "havyoday:cart-updated"
        )
      );


      return true;

    } catch (error) {

      console.error(
        "HAVYODAY: Cart save error:",
        error
      );

      return false;

    }

  }


  function updateCartCount() {

    const cartCount =
      document.getElementById(
        "cart-count"
      );


    if (!cartCount) {

      return;

    }


    const cart =
      getCart();


    let totalQuantity =
      0;


    cart.forEach(
      function (item) {

        totalQuantity +=
          Number(
            item.quantity
          ) || 1;

      }
    );


    cartCount.textContent =
      String(
        totalQuantity
      );

  }


  /* =======================================================
     6. ADD TO CART
     ======================================================= */

  function addToCart(
    product,
    quantity
  ) {

    if (
      !product ||
      product.id ===
        undefined ||
      product.id ===
        null
    ) {

      showToast(
        "Product information is missing."
      );

      return false;

    }


    const cart =
      getCart();


    const productId =
      String(
        product.id
      );


    const addQuantity =
      Math.max(
        1,
        Number(
          quantity
        ) || 1
      );


    const existingIndex =
      cart.findIndex(
        function (item) {

          return String(
            item.id
          ) === productId;

        }
      );


    if (
      existingIndex !== -1
    ) {

      cart[
        existingIndex
      ].quantity =
        (
          Number(
            cart[
              existingIndex
            ].quantity
          ) || 0
        ) + addQuantity;

    } else {

      cart.push({

        id:
          product.id,

        name:
          safeText(
            product.name
          ),

        price:
          Number(
            product.price
          ) || 0,

        image_url:
          safeText(
            product.image_url
          ),

        quantity:
          addQuantity

      });

    }


    const saved =
      saveCart(
        cart
      );


    if (saved) {

      showToast(
        "Product added to cart."
      );

    }


    return saved;

  }


  /* =======================================================
     7. BUY NOW
     ======================================================= */

  function buyNow(
    product
  ) {

    if (
      !product ||
      product.id ===
        undefined ||
      product.id ===
        null
    ) {

      showToast(
        "Product information is missing."
      );

      return false;

    }


    const cartItem = {

      id:
        product.id,

      name:
        safeText(
          product.name
        ),

      price:
        Number(
          product.price
        ) || 0,

      image_url:
        safeText(
          product.image_url
        ),

      quantity:
        1

    };


    try {

      localStorage.setItem(
        CART_KEY,
        JSON.stringify(
          [cartItem]
        )
      );


      updateCartCount();


      window.dispatchEvent(
        new CustomEvent(
          "havyoday:cart-updated"
        )
      );


      return true;

    } catch (error) {

      console.error(
        "HAVYODAY: Buy now error:",
        error
      );


      showToast(
        "Unable to continue."
      );


      return false;

    }

  }


  /* =======================================================
     8. PRODUCT CARD
     ======================================================= */

  function createProductCard(
    product
  ) {

    const imageUrl =
      getImageUrl(
        product.image_url,
        PRODUCT_BUCKET
      );


    const name =
      safeText(
        product.name
      );


    const description =
      safeText(
        product.description
      );


    const price =
      Number(
        product.price
      ) || 0;


    const originalPrice =
      Number(
        product.original_price
      ) || 0;


    const discount =
      Number(
        product.discount
      ) || 0;


    const stock =
      Number(
        product.stock
      );


    const featured =
      product.featured === true;


    let priceHTML =
      `
        <span class="product-price">
          ${escapeHTML(
            formatPrice(price)
          )}
        </span>
      `;


    if (
      originalPrice > price
    ) {

      priceHTML += `
        <span class="original-price">
          ${escapeHTML(
            formatPrice(
              originalPrice
            )
          )}
        </span>
      `;

    }


    let discountHTML =
      "";


    if (
      discount > 0
    ) {

      discountHTML = `
        <span class="product-discount">
          ${escapeHTML(
            String(
              discount
            )
          )}% OFF
        </span>
      `;

    }


    let stockHTML =
      "";


    if (
      Number.isFinite(stock)
    ) {

      if (
        stock > 0
      ) {

        stockHTML = `
          <span class="product-stock">
            In Stock
          </span>
        `;

      } else {

        stockHTML = `
          <span class="product-stock">
            Out of Stock
          </span>
        `;

      }

    }


    return `
      <article
        class="product-card"
        data-product-id="${escapeAttribute(
          product.id
        )}"
      >

        ${
          imageUrl
            ? `
              <div class="product-image-wrap">

                <img
                  src="${escapeAttribute(
                    imageUrl
                  )}"
                  alt="${escapeAttribute(
                    name
                  )}"
                  class="product-image"
                  loading="lazy"
                >

                ${
                  featured
                    ? `
                      <span class="featured-badge">
                        Featured
                      </span>
                    `
                    : ""
                }

              </div>
            `
            : ""
        }

        <div class="product-info">

          <h3 class="product-name">
            ${escapeHTML(
              name
            )}
          </h3>

          ${
            description
              ? `
                <p class="product-description">
                  ${escapeHTML(
                    description
                  )}
                </p>
              `
              : ""
          }

          <div class="product-price-row">
            ${priceHTML}
            ${discountHTML}
          </div>

          ${stockHTML}

          <div class="product-actions">

            <button
              type="button"
              class="view-product"
              data-action="view"
              data-id="${escapeAttribute(
                product.id
              )}"
            >
              View Product
            </button>

            <button
              type="button"
              class="add-to-cart"
              data-action="add"
              data-id="${escapeAttribute(
                product.id
              )}"
              ${
                Number.isFinite(stock) &&
                stock <= 0
                  ? "disabled"
                  : ""
              }
            >
              Add to Cart
            </button>

            <button
              type="button"
              class="buy-now"
              data-action="buy"
              data-id="${escapeAttribute(
                product.id
              )}"
              ${
                Number.isFinite(stock) &&
                stock <= 0
                  ? "disabled"
                  : ""
              }
            >
              Buy Now
            </button>

          </div>

        </div>

      </article>
    `;

  } /* =======================================================
   9. LOAD PRODUCTS FROM SUPABASE
   ======================================================= */

async function loadProducts() {

  const container =
    document.getElementById(
      "products-grid"
    );


  if (!container) {
    return;
  }


  if (!supabase) {

    showProductsError(
      "Supabase connection is not available."
    );

    return;

  }


  container.innerHTML = `
    <div class="products-loading">
      Loading products...
    </div>
  `;


  try {

    const {
      data,
      error
    } =
      await supabase
        .from(
          PRODUCT_TABLE
        )
        .select(
          `
            id,
            name,
            price,
            description,
            image_url,
            stock,
            created_at,
            original_price,
            discount,
            featured
          `
        )
        .order(
          "created_at",
          {
            ascending: false,
            nullsFirst: false
          }
        );


    if (error) {

      console.error(
        "HAVYODAY: Product loading error:",
        error
      );


      showProductsError(
        "Unable to load products."
      );


      return;

    }


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      container.innerHTML = `
        <div class="products-loading">
          No products available.
        </div>
      `;


      return;

    }


    renderProducts(
      data
    );

  } catch (error) {

    console.error(
      "HAVYODAY: Product loading exception:",
      error
    );


    showProductsError(
      "Unable to load products."
    );

  }

}


/* =======================================================
   10. RENDER PRODUCTS
   ======================================================= */

function renderProducts(
  products
) {

  const container =
    document.getElementById(
      "products-grid"
    );


  if (!container) {
    return;
  }


  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    container.innerHTML = `
      <div class="products-loading">
        No products available.
      </div>
    `;


    return;

  }


  container.innerHTML =
    products
      .map(
        function (product) {

          return createProductCard(
            product
          );

        }
      )
      .join(
        ""
      );


  bindProductActions(
    products
  );

}


/* =======================================================
   11. PRODUCT ACTIONS
   ======================================================= */

function bindProductActions(
  products
) {

  const container =
    document.getElementById(
      "products-grid"
    );


  if (!container) {
    return;
  }


  container.onclick =
    function (event) {

      const button =
        event.target.closest(
          "button[data-action]"
        );


      if (!button) {
        return;
      }


      const action =
        button.getAttribute(
          "data-action"
        );


      const productId =
        button.getAttribute(
          "data-id"
        );


      const product =
        products.find(
          function (item) {

            return String(
              item.id
            ) === String(
              productId
            );

          }
        );


      if (!product) {

        showToast(
          "Product not found."
        );


        return;

      }


      if (
        action ===
        "view"
      ) {

        window.location.href =
          "product.html?id=" +
          encodeURIComponent(
            product.id
          );


        return;

      }


      if (
        action ===
        "add"
      ) {

        addToCart(
          product,
          1
        );


        return;

      }


      if (
        action ===
        "buy"
      ) {

        const success =
          buyNow(
            product
          );


        if (success) {

          window.location.href =
            "checkout.html";

        }

      }

    };

}


/* =======================================================
   12. LOAD BANNER
   ======================================================= */

async function loadBanner() {

  const container =
    document.getElementById(
      "banner-container"
    );


  if (!container) {
    return;
  }


  if (!supabase) {

    showBannerError(
      "Supabase connection is not available."
    );


    return;

  }


  container.innerHTML = `
    <div class="banner-loading">
      Loading...
    </div>
  `;


  try {

    const {
      data,
      error
    } =
      await supabase
        .from(
          BANNER_TABLE
        )
        .select(
          `
            id,
            image_url,
            title,
            is_active
          `
        )
        .eq(
          "is_active",
          true
        )
        .order(
          "id",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "HAVYODAY: Banner loading error:",
        error
      );


      showBannerError(
        "Unable to load banner."
      );


      return;

    }


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      container.innerHTML =
        "";


      return;

    }


    renderBanner(
      data[0]
    );

  } catch (error) {

    console.error(
      "HAVYODAY: Banner loading exception:",
      error
    );


    showBannerError(
      "Unable to load banner."
    );

  }

} /* =======================================================
   13. RENDER BANNER
   ======================================================= */

function renderBanner(
  banner
) {

  const container =
    document.getElementById(
      "banner-container"
    );


  if (!container) {

    return;

  }


  const imageUrl =
    getImageUrl(
      banner.image_url,
      BANNER_BUCKET
    );


  if (!imageUrl) {

    container.innerHTML =
      "";

    return;

  }


  const title =
    safeText(
      banner.title || ""
    );


  container.innerHTML = `

    <div class="admin-banner">

      <img
        src="${escapeAttribute(imageUrl)}"
        alt="${escapeAttribute(
          title ||
          "HAVYODAY Banner"
        )}"
        class="banner-image"
        loading="eager"
      >

      ${
        title
          ? `
            <div class="banner-content">

              <h2>
                ${escapeHTML(title)}
              </h2>

            </div>
          `
          : ""
      }

    </div>

  `;


  const image =
    container.querySelector(
      ".banner-image"
    );


  if (image) {

    image.addEventListener(
      "error",
      function () {

        console.error(
          "HAVYODAY: Banner image could not be loaded."
        );


        container.innerHTML =
          "";

      }
    );

  }

}


/* =======================================================
   14. ERROR / LOADING HELPERS
   ======================================================= */

function showProductsError(
  message
) {

  const container =
    document.getElementById(
      "products-grid"
    );


  if (!container) {

    return;

  }


  container.innerHTML = `
    <div class="products-error">
      ${escapeHTML(
        message ||
        "Unable to load products."
      )}
    </div>
  `;

}


function showBannerError(
  message
) {

  const container =
    document.getElementById(
      "banner-container"
    );


  if (!container) {

    return;

  }


  container.innerHTML = `
    <div class="banner-error">
      ${escapeHTML(
        message ||
        "Unable to load banner."
      )}
    </div>
  `;

}


function showToast(
  message
) {

let toast =document.getElementById(
      "havyoday-toast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );


    toast.id =
      "havyoday-toast";


    toast.style.position =
      "fixed";


    toast.style.left =
      "50%";


    toast.style.bottom =
      "25px";


    toast.style.transform =
      "translateX(-50%)";


    toast.style.zIndex =
      "99999";


    toast.style.padding =
      "12px 18px";


    toast.style.borderRadius =
      "10px";


    toast.style.background =
      "#38251b";


    toast.style.color =
      "#ffffff";


    toast.style.fontSize =
      "14px";


    toast.style.boxShadow =
      "0 8px 30px rgba(0,0,0,.20)";


    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message || "";


  toast.style.display =
    "block";


  clearTimeout(
    toast._hideTimer
  );


  toast._hideTimer =
    setTimeout(
      function () {

        toast.style.display =
          "none";

      },
      2500
    );         

  }   /* =======================================================
     15. CREATE ORDER
     ======================================================= */

  async function createOrder(
    orderData
  ) {

    if (!supabase) {

      return {
        success: false,
        error:
          "Supabase connection is not available."
      };

    }


    if (
      !orderData ||
      typeof orderData !== "object"
    ) {

      return {
        success: false,
        error:
          "Invalid order data."
      };

    }


    const generatedOrderId =
      orderData.order_id ||
      (
        "ORD-" +
        Date.now()
      );


    const orderPayload = {

      customer_name:
        safeText(
          orderData.customer_name || ""
        ),

      address:
        safeText(
          orderData.address || ""
        ),

      order_id:
        generatedOrderId,

      mobile:
        safeText(
          orderData.mobile || ""
        ),

      city:
        safeText(
          orderData.city || ""
        ),

      state:
        safeText(
          orderData.state || ""
        ),

      pincode:
        safeText(
          orderData.pincode || ""
        ),

      landmark:
        safeText(
          orderData.landmark || ""
        ),

      whatsapp_number:
        safeText(
          orderData.whatsapp_number || ""
        ),

      quantity:
        Number(
          orderData.quantity
        ) || 1,

      order_date:
        orderData.order_date ||
        new Date().toISOString(),

      payment_method:
        safeText(
          orderData.payment_method || ""
        ),

      products:
        Array.isArray(
          orderData.products
        )
          ? orderData.products
          : [],

      total_amount:
        Number(
          orderData.total_amount
        ) || 0,

      status:
        safeText(
          orderData.status ||
          "pending"
        )

    };


    try {

      const {
        data,
        error
      } =
        await supabase
          .from(
            ORDER_TABLE
          )
          .insert(
            orderPayload
          )
          .select()
          .single();


      if (error) {

        console.error(
          "HAVYODAY: Order insert error:",
          error
        );


        return {
          success: false,
          error:
            error.message ||
            "Unable to place order."
        };

      }


      return {
        success: true,
        data: data
      };

    } catch (error) {

      console.error(
        "HAVYODAY: Create order exception:",
        error
      );


      return {
        success: false,
        error:
          error.message ||
          "Unable to place order."
      };

    }

  }


  /* =======================================================
     16. FIND ORDER
     ======================================================= */

  async function findOrder(
    mobile,
    orderId
  ) {

    if (!supabase) {

      return {
        success: false,
        error:
          "Supabase connection is not available."
      };

    }


    const cleanMobile =
      safeText(
        mobile || ""
      ).trim();


    const cleanOrderId =
      safeText(
        orderId || ""
      ).trim();


    if (
      !cleanMobile ||
      !cleanOrderId
    ) {

      return {
        success: false,
        error:
          "Mobile number and Order ID are required."
      };

    }


    try {

      const {
        data,
        error
      } =
        await supabase
          .from(
            ORDER_TABLE
          )
          .select(
            `
              id,
              customer_name,
              address,
              order_id,
              mobile,
              city,
              state,
              pincode,
              landmark,
              whatsapp_number,
              quantity,
              order_date,
              payment_method,
              products,
              total_amount,
              status
            `
          )
          .eq(
            "mobile",
            cleanMobile
          )
          .eq(
            "order_id",
            cleanOrderId
          )
          .maybeSingle();


      if (error) {

        console.error(
          "HAVYODAY: Find order error:",
          error
        );


        return {
          success: false,
          error:
            error.message ||
            "Unable to find order."
        };

      }


      if (!data) {

        return {
          success: false,
          error:
            "Order not found."
        };

      }


      return {
        success: true,
        data: data
      };

    } catch (error) {

      console.error(
        "HAVYODAY: Find order exception:",
        error
      );


      return {
        success: false,
        error:
          error.message ||
          "Unable to find order."
      };

    }

  }


  /* =======================================================
     17. PUBLIC HAVYODAY API
     ======================================================= */

  window.HAVYODAY = {

    supabase:
      supabase,

    loadProducts:
      loadProducts,

    loadBanner:
      loadBanner,

    addToCart:
      addToCart,

    buyNow:
      buyNow,

    updateCartCount:
      updateCartCount,

    createOrder:
      createOrder,

    findOrder:
      findOrder,

    getImageUrl:
      getImageUrl

  };


  /* =======================================================
     18. INITIALIZE HAVYODAY
     ======================================================= */

  function initHAVYODAY() {

    updateCartCount();


    const productsGrid =
      document.getElementById(
        "products-grid"
      );


    const bannerContainer =
      document.getElementById(
        "banner-container"
      );


    if (productsGrid) {

      loadProducts();

    }


    if (bannerContainer) {

      loadBanner();

    }


    window.addEventListener(
      "storage",
      function (event) {

        if (
          event.key ===
          CART_KEY
        ) {

          updateCartCount();

        }

      }
    );


    window.addEventListener(
      "havyoday:cart-updated",
      function () {

        updateCartCount();

      }
    );

  }


  /* =======================================================
     19. START APPLICATION
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initHAVYODAY
    );

  } else {

    initHAVYODAY();

  }


})();


        
          
