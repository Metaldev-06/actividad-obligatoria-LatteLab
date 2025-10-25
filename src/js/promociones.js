import { products } from "../data/data.js";

const productsContainer = document.getElementById("product-container");
const templateCards = document.getElementById("template-products").content;

const templateCart = document.getElementById("template-cart").content;
const asideCart = document.getElementById("cart-container");

const aside = document.getElementById("aside-menu");
const overlay = document.getElementById("aside-overlay");
const btnCart = document.getElementById("cart-button");
const btnClose = document.getElementById("cart-close");
const badge = document.getElementById("badge-count");

const shippingFlat = 5;
const freeShippingThresholdQty = 3;
const extraDiscountThreshold = 80;
const extraDiscountRate = 0.3;

let lastFocusedEl = null;
let cart = {};

function openCart() {
  if (!aside) return;
  lastFocusedEl = document.activeElement;
  aside.classList.add("is-open");
  overlay.classList.add("is-open");
  document.body.classList.add("body--locked");
  aside.setAttribute("aria-hidden", "false");
  btnCart?.setAttribute("aria-expanded", "true");
  aside.focus();
}
function closeCart() {
  if (!aside) return;
  aside.classList.remove("is-open");
  overlay.classList.remove("is-open");
  document.body.classList.remove("body--locked");
  aside.setAttribute("aria-hidden", "true");
  btnCart?.setAttribute("aria-expanded", "false");
  if (lastFocusedEl && typeof lastFocusedEl.focus === "function")
    lastFocusedEl.focus();
}
function toggleCart() {
  if (aside.classList.contains("is-open")) closeCart();
  else openCart();
}
btnCart?.addEventListener("click", toggleCart);
btnClose?.addEventListener("click", closeCart);
overlay?.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && aside.classList.contains("is-open")) closeCart();
});
aside.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const focusables = aside.querySelectorAll(
    'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

const showProductsHome = (list) => {
  productsContainer.innerHTML = "";
  const frag = document.createDocumentFragment();

  list.forEach((item) => {
    const clone = templateCards.cloneNode(true);

    clone.getElementById("template-card-img").setAttribute("src", item.image);
    clone.getElementById("template-card-name").textContent = item.name;
    clone.getElementById("template-card-description").textContent =
      item.description;

    const btn = clone.getElementById("template-card-button");
    btn.dataset.id = item.id;

    const hasDiscount = item.discount > 0;
    const discountedPrice = hasDiscount
      ? (item.price * (100 - item.discount)) / 100
      : item.price;

    if (hasDiscount) {
      clone.getElementById("template-card-price-discounted").textContent =
        "$" + discountedPrice.toFixed(2);
      const priceEl = clone.getElementById("template-card-price");
      priceEl.textContent = "$" + item.price;
      priceEl.classList.add("price-original");
      const discountDiv = clone.getElementById("template-card-discount");
      discountDiv.style.display = "block";
      clone.getElementById(
        "template-card-discount-value"
      ).textContent = `-${item.discount}%`;
    } else {
      clone.getElementById("template-card-price").textContent =
        "$" + item.price;
    }

    btn.dataset.priceOriginal = String(item.price);
    btn.dataset.priceFinal = String(discountedPrice);

    frag.appendChild(clone);
  });

  productsContainer.appendChild(frag);
};

const showCart = () => {
  asideCart.innerHTML = "";
  const frag = document.createDocumentFragment();

  Object.values(cart).forEach((p, index) => {
    const clone = templateCart.cloneNode(true);

    clone.querySelector("#cart-id").textContent = index + 1;
    clone.querySelector("#cart-img").setAttribute("src", p.img);
    clone.querySelector("#cart-title").textContent = p.name;
    clone.querySelector("#cart-quantity").textContent = p.quantity;
    clone.querySelector("#cart-title").textContent = p.name;
    const discountDiv = clone.querySelector("#cart-discount");
    if (p.discountPercent > 0) {
      discountDiv.style.display = "block";
      discountDiv.querySelector(
        "#cart-discount-value"
      ).textContent = `-${p.discountPercent}%`;
    } else {
      discountDiv.style.display = "none";
    }

    const lineTotal = (p.unitFinal * p.quantity).toFixed(2);
    clone.querySelector("#cart-price").textContent = `$${lineTotal}`;

    clone.querySelector("#btn-plus").dataset.id = p.id;
    clone.querySelector("#btn-remove").dataset.id = p.id;
    clone.querySelector("#btn-delete").dataset.id = p.id;

    frag.appendChild(clone);
  });

  asideCart.appendChild(frag);

  localStorage.setItem("cart", JSON.stringify(cart));

  if (Object.keys(cart).length === 0) {
    asideCart.innerHTML = `<p>No hay artículos en el carrito 😥</p>`;
  }

  paintCartBadge();
  renderSummary();
};

productsContainer.addEventListener("click", (e) => {
  if (!e.target.classList.contains("products__button")) return;
  const card = e.target.closest(".products__card");
  if (!card) return;
  setCart(card);
});

const setCart = (cardEl) => {
  const btn = cardEl.querySelector("#template-card-button");
  const id = btn.dataset.id;
  const img = cardEl.querySelector("#template-card-img").getAttribute("src");
  const name = cardEl.querySelector("#template-card-name").textContent.trim();

  const unitOriginal = Number(btn.dataset.priceOriginal);
  const unitFinal = Number(btn.dataset.priceFinal);

  const discountPercent =
    unitOriginal > unitFinal
      ? Math.round((1 - unitFinal / unitOriginal) * 100)
      : 0;

  const product = {
    id,
    img,
    name,
    unitOriginal,
    unitFinal,
    quantity: 1,
    discountPercent,
  };

  if (cart[id]) product.quantity = cart[id].quantity + 1;
  cart[id] = product;

  showCart();
};

asideCart.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.id === "btn-plus") {
    cart[id].quantity += 1;
  } else if (e.target.id === "btn-remove") {
    cart[id].quantity -= 1;
    if (cart[id].quantity <= 0) delete cart[id];
  } else if (e.target.id === "btn-delete") {
    delete cart[id];
  }

  showCart();
});

const paintCartBadge = () => {
  const totalQty = Object.values(cart).reduce((acc, p) => acc + p.quantity, 0);
  if (!totalQty) {
    badge.style.display = "none";
  } else {
    badge.style.display = "inline-block";
    badge.textContent = totalQty;
  }
};

function renderSummary() {
  const box = document.getElementById("cart-summary");
  if (!box) return;

  const items = Object.values(cart);
  if (!items.length) {
    box.innerHTML = "";
    return;
  }

  const totalQty = items.reduce((acc, p) => acc + p.quantity, 0);

  const totalSinDesc = items.reduce(
    (acc, p) => acc + (p.unitOriginal ?? p.unitFinal) * p.quantity,
    0
  );
  const totalConDesc = items.reduce(
    (acc, p) => acc + (p.unitFinal ?? p.unitOriginal) * p.quantity,
    0
  );
  const ahorroProductos = totalSinDesc - totalConDesc;

  const appliesExtraDiscount = totalConDesc >= extraDiscountThreshold;
  const extraDiscountAmount = appliesExtraDiscount
    ? totalConDesc * extraDiscountRate
    : 0;

  const subtotalTrasExtra = totalConDesc - extraDiscountAmount;

  const shipping = totalQty >= freeShippingThresholdQty ? 0 : shippingFlat;
  const ahorroEnvio = shipping === 0 ? shippingFlat : 0;

  const shippingLabel =
    shipping === 0
      ? `$0.00 <span class="savings">(gratis por 3+ ítems)</span>`
      : `$${shipping.toFixed(
          2
        )} <span class="muted">(gratis desde 3 ítems)</span>`;

  const totalAPagar = subtotalTrasExtra + shipping;
  const ahorroTotal = ahorroProductos + extraDiscountAmount + ahorroEnvio;

  const extraDiscountLabel = appliesExtraDiscount
    ? `-$${extraDiscountAmount.toFixed(
        2
      )} <span class="savings">(30% por superar $${extraDiscountThreshold})</span>`
    : `$0.00 <span class="muted">(30% desde $${extraDiscountThreshold})</span>`;

  box.innerHTML = `
    <div class="row"><span>Ítems</span><span>${totalQty}</span></div>

    <div class="row"><span>Subtotal (productos sin desc.)</span>
      <span class="muted">$${totalSinDesc.toFixed(2)}</span>
    </div>

    <div class="row"><span>Descuento en productos</span>
      <span class="savings">-$${ahorroProductos.toFixed(2)}</span>
    </div>

    <div class="row"><span>Subtotal tras desc. de productos</span>
      <span>$${totalConDesc.toFixed(2)}</span>
    </div>

    <div class="row"><span>Descuento adicional</span>
      <span>${extraDiscountLabel}</span>
    </div>

    <div class="row"><span>Envío</span>
      <span>${shippingLabel}</span>
    </div>

    ${
      ahorroEnvio > 0
        ? `
      <div class="row"><span>Ahorro en envío</span>
        <span class="savings">-$${ahorroEnvio.toFixed(2)}</span>
      </div>
    `
        : ""
    }

    <div class="row total"><span>Total a pagar</span>
      <span>$${totalAPagar.toFixed(2)}</span>
    </div>

    <div class="row"><span>Ahorro total</span>
      <span class="savings">-$${ahorroTotal.toFixed(2)}</span>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("cart");
  if (saved) {
    try {
      cart = JSON.parse(saved) || {};
    } catch {
      cart = {};
    }
  }
  showProductsHome(products);
  showCart();
});
