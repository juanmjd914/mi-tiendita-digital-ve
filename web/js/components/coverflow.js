// Carrusel tipo coverflow: tarjeta central destacada, flechas, puntos, swipe y teclado.
export function initCoverflow(root, { autoplay = 5000 } = {}) {
  const track = root.querySelector('[data-cf-track]')
  const viewport = track?.parentElement
  const slides = [...root.querySelectorAll('[data-slide]')]
  const dots = root.querySelector('[data-cf-dots]')
  if (!track || slides.length === 0) return
  let index = Math.min(1, slides.length - 1)
  let timer = null
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  if (dots) {
    dots.innerHTML = slides.map((_, i) => `<button type="button" aria-label="Ir al producto ${i + 1}"></button>`).join('')
    dots.addEventListener('click', (e) => {
      const b = e.target.closest('button')
      if (b) go([...dots.children].indexOf(b))
    })
  }

  function go(i) {
    index = (i + slides.length) % slides.length
    const s = slides[index]
    const offset = s.offsetLeft - (viewport.clientWidth - s.offsetWidth) / 2
    track.style.transform = `translateX(${-offset}px)`
    slides.forEach((el, n) => {
      const d = Math.abs(n - index)
      el.classList.toggle('is-active', d === 0)
      el.classList.toggle('is-near', d === 1)
      el.inert = false
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
  addEventListener('resize', () => go(index))

  go(index)
  restart()
}
