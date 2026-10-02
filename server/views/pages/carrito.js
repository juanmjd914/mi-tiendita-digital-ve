import { html } from '../html.js'
import { icon } from '../icons.js'

// La página se completa en el navegador con /api/cart/quote (el carrito vive en localStorage).
export function carritoBody() {
  return html`<section class="page-hero">
  <div class="wrap">
    <nav aria-label="Miga de pan"><ol class="breadcrumb"><li><a href="/">Inicio</a></li><li>Carrito</li></ol></nav>
    <h1>Tu carrito</h1>
  </div>
</section>
<section class="wrap cart" data-cart-page>
  <div class="cart__main">
    <div class="cart-table" data-cart-lines>
      <div class="cart-loading">${icon('bag', { size: 22 })}Cargando tu carrito…</div>
    </div>
    <div class="cart__tools" data-cart-tools hidden>
      <form class="coupon" data-coupon-form>
        <label class="sr-only" for="coupon">Código de descuento</label>
        <input id="coupon" name="coupon" type="text" placeholder="Código de descuento" autocomplete="off" maxlength="40">
        <button class="btn btn--primary btn--sm" type="submit">Aplicar</button>
      </form>
      <button class="link-btn" type="button" data-cart-clear>${icon('trash', { size: 16 })}Vaciar carrito</button>
    </div>
    <p class="coupon-msg" data-coupon-msg hidden></p>
  </div>
  <aside class="summary" data-cart-summary hidden>
    <h2>Resumen del pedido</h2>
    <dl>
      <div><dt>Productos</dt><dd data-s-count>0</dd></div>
      <div><dt>Subtotal</dt><dd data-s-subtotal>$0</dd></div>
      <div data-s-discount-row hidden><dt>Descuento <span data-s-coupon></span></dt><dd data-s-discount>$0</dd></div>
      <div><dt>Envío</dt><dd data-s-shipping>Se calcula en el checkout</dd></div>
      <div class="summary__total"><dt>Total</dt><dd data-s-total>$0</dd></div>
    </dl>
    <p class="summary__iva">IVA incluido</p>
    <div class="free-ship" data-free-ship>
      <p data-free-ship-text></p>
      <div class="free-ship__bar"><span data-free-ship-bar></span></div>
    </div>
    <a class="btn btn--primary btn--block" href="/checkout" data-go-checkout>${icon('lock', { size: 18 })}Ir al checkout</a>
    <a class="btn btn--ghost btn--block" href="/tienda">Seguir comprando</a>
    <p class="summary__warn" data-s-warn hidden></p>
  </aside>
</section>`
}
