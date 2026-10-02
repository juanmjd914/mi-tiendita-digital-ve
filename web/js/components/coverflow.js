// Carrusel tipo coverflow: tarjeta central destacada, flechas, puntos, swipe y teclado.
export function initCoverflow(root, { autoplay = 5000 } = {}) {
  const track = root.querySelector('[data-cf-track]')
  const viewport = track?.parentElement
  const slides = [...root.querySelectorAll('[data-slide]')]
  const dots = root.querySelector('[data-cf-dots]')
  if (!track || slides.length === 0) return
  let index = 0
  // Con solo 2 tarjetas se centra la pareja (si no, queda un hueco a un lado)
  if (slides.length === 2) track.style.setProperty('--shift', '0.5')
  let timer = null
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  if (dots) {
    dots.innerHTML = slides.map((_, i) => `<button type="button" aria-label="Ir al producto ${i + 1}"></button>`).join('')
    dots.addEventListener('click', (e) => {
      const b = e.target.closest('button')
      if (b) go([...dots.children].indexOf(b))
    })
  }

  // Carrusel circular: cada tarjeta se ubica según su distancia a la central (--d), así siempre
  // hay tarjetas a ambos lados. Las lejanas (|d| ≥ 3) quedan ocultas.
  function go(i) {
    index = (i + slides.length) % slides.length
    slides.forEach((el, n) => {
      let d = ((n - index) % slides.length + slides.length) % slides.length
      if (d > slides.length / 2) d -= slides.length
      const a = Math.abs(d)
      el.style.setProperty('--d', d)
      el.style.zIndex = String(10 - a)
      el.classList.toggle('is-active', a === 0)
      el.classList.toggle('is-near', a === 1)
      el.classList.toggle('is-far', a >= 3)
      el.inert = a >= 3
    })
    if (dots) [...dots.children].forEach((d, n) => d.setAttribute('aria-current', String(n === index)))
  }

  root.querySelector('[data-cf-prev]')?.addEventListener('click', () => { go(index - 1); restart() })
  root.querySelector('[data-cf-next]')?.addEventListener('click', () => { go(index + 1); restart() })
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { go(index - 1); restart() }
    if (e.key === 'ArrowRight') { go(index + 1); restart() }
  })
  slides.forEach((s, n) => s.addEventListener('click', (e) => {
    if (n !== index && !e.target.closest('button')) { e.preventDefault(); go(n); restart() }
  }))

  // Swipe táctil / arrastre
  let startX = null
  viewport.addEventListener('pointerdown', (e) => { startX = e.clientX })
  viewport.addEventListener('pointerup', (e) => {
    if (startX === null) return
    const dx = e.clientX - startX
    startX = null
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart() }
  })

  function restart() {
    clearInterval(timer)
    if (!autoplay || reduced || slides.length < 2) return
    timer = setInterval(() => go(index + 1), autoplay)
  }
  root.addEventListener('mouseenter', () => clearInterval(timer))
  root.addEventListener('mouseleave', restart)
  root.addEventListener('focusin', () => clearInterval(timer))

  go(index)
  restart()
}
