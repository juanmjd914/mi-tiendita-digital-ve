import { motion } from 'motion/react'
import { ArrowRight, Gamepad2 } from 'lucide-react'

const GAMES = [
  {
    id: 1,
    name: "Assassin's Creed Shadows",
    img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
    price: 65,
    genre: 'Acción / RPG',
  },
  {
    id: 2,
    name: 'Spider-Man 2',
    img: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&q=80',
    price: 70,
    genre: 'Acción / Aventura',
  },
  {
    id: 3,
    name: 'Mortal Kombat 1',
    img: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&q=80',
    price: 60,
    genre: 'Pelea',
  },
  {
    id: 4,
    name: 'Crimson Desert',
    img: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80',
    price: 70,
    genre: 'RPG / Mundo Abierto',
  },
  {
    id: 5,
    name: 'God of War Ragnarök',
    img: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=400&q=80',
    price: 55,
    genre: 'Acción / Aventura',
  },
  {
    id: 6,
    name: 'EA Sports FC 25',
    img: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&q=80',
    price: 65,
    genre: 'Deportes',
  },
]

export default function PS5Gallery() {
  return (
    <section id="juegos" className="py-20 px-4 relative overflow-hidden">
      {/* Fondo dark purple */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0020]/60 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass-violet px-4 py-2 rounded-full border border-brand-violet/30 mb-4">
            <Gamepad2 size={16} className="text-brand-violet" />
            <span className="text-brand-violet text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk' }}>
              Catálogo PlayStation
            </span>
          </div>
          <h2 className="text-white font-bold text-3xl sm:text-5xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Juegos <span className="gradient-text">PS5</span>
          </h2>
          <p className="text-white/40 text-sm mt-3 max-w-md mx-auto">
            Los títulos más esperados disponibles en formato digital con entrega inmediata
          </p>
        </motion.div>

        {/* Grid tipo PlayStation Store */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src={game.img}
                alt={game.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white/60 text-[9px] tracking-widest uppercase mb-0.5">{game.genre}</p>
                <p className="text-white font-bold text-xs leading-tight mb-2" style={{ fontFamily: 'Space Grotesk' }}>{game.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-brand-cyan font-bold text-sm">${game.price}</span>
                  <button className="bg-brand-violet/80 text-white text-[10px] px-2 py-1 rounded-lg hover:bg-brand-violet transition-colors">
                    Ver más
                  </button>
                </div>
              </div>
              {/* Badge precio siempre visible */}
              <div className="absolute top-2 right-2 bg-brand-violet/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ${game.price}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 px-10 py-4 bg-brand-violet text-white font-bold text-sm rounded-full glow-violet"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Ver Catálogo Completo <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    </section>
  )
}
