import { useEffect } from 'react'

const SITE_NAME = 'Mi Tiendita Digital Ve'
const ORIGIN = 'https://mitienditadigitalve.com'

/** Crea o actualiza una etiqueta <meta> por name o property, devolviendo su valor previo. */
function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  const prev = el.content
  el.content = content
  return () => { el!.content = prev }
}

/**
 * Sincroniza el SEO de la página actual en una SPA: título, descripción,
 * canonical, Open Graph y Twitter Card. Al desmontar restaura los valores previos.
 */
export function useSEO({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    const restores: Array<() => void> = []

    // ── Título ──
    const prevTitle = document.title
    const fullTitle = `${title} — ${SITE_NAME}`
    document.title = fullTitle
    restores.push(() => { document.title = prevTitle })

    // ── Canonical (auto-referenciado a la ruta actual) ──
    const canonicalUrl = `${ORIGIN}${window.location.pathname}`
    let linkCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!linkCanonical) {
      linkCanonical = document.createElement('link')
      linkCanonical.rel = 'canonical'
      document.head.appendChild(linkCanonical)
    }
    const prevCanonical = linkCanonical.href
    linkCanonical.href = canonicalUrl
    restores.push(() => { linkCanonical!.href = prevCanonical })

    // ── Descripción + Open Graph + Twitter ──
    if (description) {
      restores.push(setMeta('meta[name="description"]', 'name', 'description', description))
      restores.push(setMeta('meta[property="og:description"]', 'property', 'og:description', description))
      restores.push(setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description))
    }
    restores.push(setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle))
    restores.push(setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle))
    restores.push(setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl))

    return () => { restores.forEach(fn => fn()) }
  }, [title, description])
}
