'use client'

import Link from 'next/link'
import { Product } from '@/lib/api'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
    </div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const { user } = useAuth()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) { window.location.href = '/auth'; return }
    setAdding(true)
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        title: product.title,
        price: product.price,
        image: product.images?.[0],
      })
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {}
    setAdding(false)
  }

  const img = product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/300`

  return (
    <Link href={`/catalog/${product.id}`} className="card group flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={img}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {product.category && (
          <span className="badge bg-brand-50 text-brand-700">{product.category}</span>
        )}
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {product.title}
        </h3>
        <StarRating rating={product.rating} />
        <p className="text-xs text-gray-400 mt-auto">{product.reviewCount} отзывов</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
          <span className="text-lg font-bold text-gray-900">
            {Number(product.price).toLocaleString('ru-RU')} ₸
          </span>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              added
                ? 'bg-green-100 text-green-700'
                : product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-600 text-white'
            }`}
          >
            {added ? '✓ Добавлено' : product.stock === 0 ? 'Нет в наличии' : '+ В корзину'}
          </button>
        </div>
      </div>
    </Link>
  )
}
