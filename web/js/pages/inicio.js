import { initCoverflow } from '../components/coverflow.js'

// Velocidad del carrusel infinito proporcional a la cantidad de productos.
const strip = document.querySelector('[data-marquee]')
if (strip) {
  const items = strip.querySelectorAll('.strip__item:not([aria-hidden])').length
  strip.style.setProperty('--marquee-dur', `${Math.max(25, items * 3)}s`)
}

document.querySelectorAll('[data-coverflow]').forEach((el) => initCoverflow(el))
