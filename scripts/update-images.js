/**
 * Script para actualizar las imágenes reales de productos en Supabase
 * Ejecutar con: node scripts/update-images.js
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/Productos`
const url  = (filename) => `${BASE}/${encodeURIComponent(filename)}`

// Mapeo: nombre del producto → archivo en bucket Productos
const UPDATES = [
  {
    name:    'Gabinete Gamer Cougar MX410-T',
    img_url: url('Gabinete-MX410T-9.webp'),
  },
  {
    name:    'Soporte de Escritorio para Micrófono Philco',
    img_url: url('soporte para microfono philco.webp'),
  },
  {
    name:    'Powerbank Carga Inalámbrica Philco',
    img_url: url('Powerbank Philco Carga inalambrica tipo c1.webp'),
  },
  {
    name:    'Joystick Bluetooth 3.0 para Celular Ultra',
    img_url: url('Joystick Bluetooth para Celular Ultra.webp'),
  },
  {
    name:    'Cable USB Tipo C a 3.5mm Auxiliar',
    img_url: url('CABLE USB TIPO C  A 3.5MM1.webp'),
  },
  {
    name:    'Headset Gamer Philco 7.1 Surround',
    img_url: url('AUDIFONO GAMER ULTRA1.webp'),
  },
  {
    name:    'Mouse Gamer RGB 6400 DPI',
    img_url: url('MOUSE HP GAMER RGB M160.webp'),
  },
  {
    name:    'Gabinete Gamer Cougar MX410-T Pro',
    img_url: url('Gabinete Cougar Gemini s 720x72023.webp'),
  },
]

async function run() {
  console.log('🖼️  Actualizando imágenes de productos...\n')

  for (const { name, img_url } of UPDATES) {
    const { error } = await supabase
      .from('products')
      .update({ img_url })
      .eq('name', name)

    if (error) {
      console.error(`❌  ${name}\n    ${error.message}`)
    } else {
      console.log(`✅  ${name}`)
      console.log(`    ${img_url}\n`)
    }
  }

  console.log('✨ Listo!')
}

run()
