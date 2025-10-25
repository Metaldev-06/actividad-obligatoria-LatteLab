import { products } from "../data/data.js";

//!Products Template
const productsContainer = document.getElementById("product-container");
const templateCards = document.getElementById("template-products").content;

const fragment = document.createDocumentFragment();

const showProductsHome = (products) => {
  productsContainer.innerHTML = "";
  products.map((item) => {
    const clone = templateCards.cloneNode(true);

    clone.getElementById("template-card-img").setAttribute("src", item.image);
    clone.getElementById("template-card-name").textContent = item.name;
    clone.getElementById("template-card-price").textContent = "$" + item.price;
    clone.getElementById("template-card-description").textContent =
      item.description;
    clone.getElementById("template-card-button").dataset.id = item.id;

    fragment.appendChild(clone);
  });
  productsContainer.appendChild(fragment);
};

document.addEventListener("DOMContentLoaded", () => {
  showProductsHome(products);
});
