'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { api, Product } from '@/lib/api'
import ProductCard from './components/ui/ProductCard'

export default function HomePage() {
  const { user } = useAuth()
  const lampRef = useRef<SVGGElement>(null)
  const glowRef = useRef<SVGEllipseElement>(null)
  const [isOn, setIsOn] = useState(false)
  const [featured, setFeatured] = useState<Product[]>([])
  const [gsapLoaded, setGsapLoaded] = useState(false)

  // GSAP animations
  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      setGsapLoaded(true)
      // Lamp idle animation
      if (lampRef.current) {
        gsap.to(lampRef.current, {
          rotation: 3,
          transformOrigin: 'center top',
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }
    })
  }, [])

  useEffect(() => {
    if (!gsapLoaded) return
    import('gsap').then(({ gsap }) => {
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          opacity: isOn ? 0.9 : 0,
          scaleX: isOn ? 1 : 0,
          scaleY: isOn ? 1 : 0,
          duration: 0.5,
          ease: 'power2.out',
        })
      }
    })
  }, [isOn, gsapLoaded])

  // Fetch featured products
  useEffect(() => {
    api.products.list({ limit: 8, sortBy: 'salesCount', order: 'DESC' })
      .then((r) => setFeatured(r.items))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`transition-colors duration-700 ${isOn ? 'bg-[#1c1f24]' : 'bg-[#121417]'} py-20 px-4`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Lamp SVG */}
          <div
            className="cursor-pointer select-none flex-shrink-0"
            onClick={() => setIsOn((v) => !v)}
            title="Нажми на лампу!"
          >
            <svg width="220" height="280" viewBox="0 0 220 280" fill="none">
              {/* Glow */}
              <ellipse
                ref={glowRef}
                cx="110" cy="90" rx="90" ry="70"
                fill="rgba(255,220,100,0.18)"
                style={{ opacity: 0 }}
              />
              <g ref={lampRef}>
                {/* Shade */}
                <ellipse cx="110" cy="88" rx="72" ry="26" fill={isOn ? '#fff9e6' : '#e8e0cc'} />
                <path d="M38 88 Q55 160 90 175 L130 175 Q165 160 182 88 Z"
                  fill={isOn ? '#f5edd6' : '#d4caae'} />
                {/* Bulb glow */}
                {isOn && (
                  <ellipse cx="110" cy="88" rx="30" ry="12"
                    fill="rgba(255,230,100,0.7)" />
                )}
                {/* Stem */}
                <rect x="106" y="175" width="8" height="65" fill="#c8c0a8" rx="3" />
                {/* Base */}
                <ellipse cx="110" cy="242" rx="44" ry="12" fill={isOn ? '#d4c89a' : '#b8b09a'} />
                {/* Pull cord */}
                <line x1="110" y1="175" x2="126" y2="218"
                  stroke="#999" strokeWidth="1.5" strokeDasharray="2,3" />
                <circle cx="126" cy="220" r="4"
                  fill={isOn ? '#f0a43c' : '#aaa'} />
              </g>
            </svg>
            <p className="text-center text-gray-500 text-xs mt-2 animate-pulse">
              {isOn ? '💡 Свет включён' : 'Нажми на лампу'}
            </p>
          </div>

          {/* Hero Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 transition-colors duration-500 ${isOn ? 'text-white' : 'text-gray-300'}`}>
              Добро пожаловать<br />
              <span className="text-brand-400">в Marketplace</span>
            </h1>
            <p className={`text-lg mb-8 transition-colors duration-500 ${isOn ? 'text-gray-300' : 'text-gray-500'}`}>
              Умные рекомендации на основе ML. Миллионы товаров. Быстрая доставка.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link href="/catalog" className="btn-primary text-base px-8 py-3">
                Перейти в каталог
              </Link>
              {!user && (
                <Link href="/auth" className="px-8 py-3 rounded-xl font-semibold border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors">
                  Войти
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">🔥 Популярные товары</h2>
          <Link href="/catalog" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
            Смотреть все →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg">Пока нет товаров. Запусти бэкенд и добавь первые!</p>
            <Link href="/seller" className="mt-4 inline-block btn-primary">Стать продавцом</Link>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
          {[
            { icon: '🤖', title: 'ML Рекомендации', desc: 'Collaborative Filtering на основе поведения пользователей' },
            { icon: '🔍', title: 'Умный поиск', desc: 'Полнотекстовый поиск на PostgreSQL с фильтрами' },
            { icon: '⚡', title: 'Redis кэширование', desc: 'Корзина и рекомендации в Redis для молниеносной скорости' },
          ].map((f) => (
            <div key={f.title} className="p-6">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
