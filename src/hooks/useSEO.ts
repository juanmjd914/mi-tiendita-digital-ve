import { useEffect } from 'react'

export function useSEO({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = `${title} — Mi Tiendita Digital Ve`
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    const prevDesc = meta?.content ?? ''
    if (description && meta) meta.content = description
    return () => {
      document.title = prevTitle
      if (meta) meta.content = prevDesc
    }
  }, [title, description])
}
