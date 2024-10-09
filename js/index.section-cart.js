import { ProductsService } from "./index.products-service.js";

export class Cart {
  static #instance;
  constructor() {
    if (Cart.#instance) return Cart.#instance;
    Cart.#instance = this;
    this.container = document.querySelector(".cart-container");
    this.productsService = new ProductsService();
    this.cart = JSON.parse(localStorage.getItem("cart") ?? "{}");
    this.addEventListeners();
    this.renderCart();
    this.updateCartCount(); 
  }

  addEventListeners() {
    document
      .querySelector(".product-card")
      .addEventListener("click", this.renderCart.bind(this));
    document
      .querySelector(".order")
      .addEventListener("click", this.order.bind(this));
  }

  async renderCart() {
    let total = 0;
    let cartHtml = `<div class="row">
                      <div class="col-5"><strong>Product</strong></div>
                      <div class="col-3"><strong>Price</strong></div>
                      <div class="col-2"><strong>Quantity</strong></div>
                    </div>`;
    for (const productId in this.cart) {
      const product = await this.productsService.getProductById(productId);
      cartHtml += this.createCartHtml(product);
      total += product.price * this.cart[productId];
    }
    cartHtml += ` <div class="row">
                    <div class="col-5"><strong>TOTAL</strong></div>
                    <div class="col-3"><strong>$${total.toFixed(2)}</strong></div>
                 </div>`;
    this.container.innerHTML = cartHtml;
    this.container
      .querySelectorAll(".plus")
      .forEach((el) =>
        el.addEventListener("click", (ev) =>
          this.changeQuantity(ev, this.addProductOperation)
        )
      );
    this.container
      .querySelectorAll(".minus")
      .forEach((el) =>
        el.addEventListener("click", (ev) =>
          this.changeQuantity(ev, this.deleteProductOperation)
        )
      );
    this.updateCartCount(); 
  }

  createCartHtml(product) {
    return `<div class="row" data-id="${product.id}">
              <div class="col-5">${product.title}</div>
              <div class="col-3">${product.price}</div>
              <div class="col-2">${this.cart[product.id]}</div>
              <div class="col-1">
                <button data-id=${product.id} class="btn btn-sm plus">+</button>
              </div>
              <div class="col-1">
                <button data-id=${product.id} class="btn btn-sm minus">-</button>
              </div>
            </div>`;
  }

  changeQuantity(ev, operation) {
    ev.stopPropagation();
    operation.call(this, ev.target.dataset.id);
    this.saveCart();
    this.renderCart();
  }

  addProductOperation(id) {
    this.cart[id] = (this.cart[id] || 0) + 1;
  }

  deleteProductOperation(id) {
    if (this.cart[id] > 1) {
      this.cart[id] -= 1;
    } else {
      delete this.cart[id];
    }
  }

  addProduct(id) {
    this.addProductOperation(id);
    this.saveCart();
    this.renderCart();
  }

  saveCart() {
    localStorage.setItem("cart", JSON.stringify(this.cart));
  }

  updateCartCount() {
    const cartCountElement = document.querySelector("#cart-count");
    const totalQuantity = Object.values(this.cart).reduce(
      (acc, quantity) => acc + quantity,
      0
    );
    cartCountElement.textContent = totalQuantity; 
  }

  async order(ev) {
    if (Object.keys(this.cart).length === 0) return;
    const form = document.querySelector(".form-contacts");
    if (!form.checkValidity()) return;
    ev.preventDefault();
    const data = new FormData();
    data.append("cart", JSON.stringify(this.cart));
    data.append("name", form.querySelector("input[name=name]").value);
    data.append("email", form.querySelector("input[name=email]").value);
    const response = await fetch("https://formspree.io/f/", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: data,
    });
    if (response.ok) {
      form.reset();
      this.cart = {};
      this.saveCart();
      this.renderCart();
      document.querySelector("#modal-cart .close-btn").click();
    }
  }
}

new Cart();