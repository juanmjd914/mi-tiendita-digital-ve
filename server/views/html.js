// Tag de plantillas con escape automático: todo valor interpolado se escapa
// salvo que venga envuelto en raw() o sea el resultado de otro html``.

class SafeHtml {
  constructor(value) { this.value = value }
  toString() { return this.value }
}

export const raw = (value) => new SafeHtml(String(value ?? ''))

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function render(value) {
  if (value === null || value === undefined || value === false) return ''
  if (value instanceof SafeHtml) return value.value
  if (Array.isArray(value)) return value.map(render).join('')
  return escapeHtml(value)
}

export function html(strings, ...values) {
  let out = strings[0]
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1]
  return new SafeHtml(out)
}

// JSON seguro dentro de <script type="application/ld+json">
export const jsonLd = (data) =>
  raw(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`)
