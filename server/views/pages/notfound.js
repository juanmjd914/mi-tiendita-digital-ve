import { html } from '../html.js'
import { icon } from '../icons.js'

export function notFoundBody() {
  return html`<section class="nf wrap">
  <div class="nf__card">
    <div class="nf__copy">
      <p class="eyebrow">Error 404</p>
      <p class="nf__code" aria-hidden="true">404</p>
      <h1>Algo salió <span class="text-jade">mal</span></h1>
      <p class="nf__lead">No encontramos la página que buscas. Puede que el producto ya no esté disponible o que el enlace haya cambiado.</p>
      <form class="nf__search" action="/tienda" method="get" role="search">
        ${icon('search', { size: 18 })}
        <label class="sr-only" for="nf-q">Buscar productos</label>
        <input id="nf-q" name="search" type="search" placeholder="Busca un producto…">
      </form>
      <div class="nf__actions">
        <a class="btn btn--primary" href="/">${icon('arrow-right', { size: 18 })}Volver al inicio</a>
        <a class="btn btn--ghost" href="/tienda">Ir a la tienda</a>
        <a class="btn btn--ghost" href="/soporte">Soporte</a>
      </div>
    </div>
    <div class="nf__art" aria-hidden="true">
      <img src="/img/mascota-404.webp" alt="" width="589" height="900" decoding="async">
    </div>
  </div>
</section>`
}

export const notFoundCss = 'pages/404'
