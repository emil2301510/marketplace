'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, Product, Review } from '@/lib/api'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import ProductCard from '../../components/ui/ProductCard'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [similar, setSimilar] = useState<Product[]>([])
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  // Review form
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    api.products.get(id).then(setProduct).catch(() => router.push('/catalog'))
    api.reviews.forProduct(id).then(setReviews).catch(() => {})
    api.recommendations.similar(id)
      .then(async (r) => {
        if (r.similarProductIds?.length) {
          const products = await Promise.all(
            r.similarProductIds.slice(0, 4).map((pid) => api.products.get(pid).catch(() => null))
          )
          setSimilar(products.filter(Boolean) as Product[])
        }
      })
      .catch(() => {})
  }, [id])

  if (!product) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  )

  const images = product.images?.length
    ? product.images
    : [`https://picsum.photos/seed/${product.id}/600/450`]

  const handleAddToCart = async () => {
    if (!user) { router.push('/auth'); return }
    setAdding(true)
    try {
      await addItem({ productId: product.id, quantity: qty, title: product.title, price: product.price, image: images[0] })
      router.push('/cart')
    } catch {}
    setAdding(false)
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    setSubmittingReview(true)
    try {
      const r = await api.reviews.create(id, { rating, comment })
      setReviews([r, ...reviews])
      setComment('')
    } catch (err: any) { alert(err.message) }
    setSubmittingReview(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-brand-600 mb-6 flex items-center gap-1">
        ← Назад
      </button>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div>
          <div className="card overflow-hidden mb-3 aspect-square">
            <img src={images[imgIdx]} alt={product.title} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-brand-500' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <span className="badge bg-brand-50 text-brand-700 mb-3">{product.category}</span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.title}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <svg key={s} className={`w-5 h-5 ${s <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500">{product.rating.toFixed(1)} ({product.reviewCount} отзывов)</span>
          </div>

          <p className="text-3xl font-bold text-gray-900 mb-2">
            {Number(product.price).toLocaleString('ru-RU')} ₸
          </p>
          <p className="text-sm text-gray-500 mb-6">
            В наличии: <b className={product.stock > 0 ? 'text-green-600' : 'text-red-500'}>{product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}</b>
          </p>

          <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>

          {/* Add to cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2.5 hover:bg-gray-50 text-lg font-bold">−</button>
              <span className="px-4 py-2.5 font-semibold min-w-[3rem] text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-4 py-2.5 hover:bg-gray-50 text-lg font-bold">+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              className="btn-primary flex-1 py-3 text-base"
            >
              {adding ? 'Добавляем...' : '🛒 В корзину'}
            </button>
          </div>
        </div>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div className="mb-16">
          <h2 className="text-xl font-bold mb-6">Похожие товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similar.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h2 className="text-xl font-bold mb-6">Отзывы ({reviews.length})</h2>

        {/* Review form */}
        {user && (
          <form onSubmit={submitReview} className="card p-6 mb-6">
            <h3 className="font-semibold mb-4">Оставить отзыв</h3>
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}
                  className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
            <textarea
              className="input mb-3 resize-none" rows={3}
              placeholder="Напишите отзыв..."
              value={comment} onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit" disabled={submittingReview} className="btn-primary">
              {submittingReview ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {r.user?.name?.[0]?.toUpperCase() || r.user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.user?.name || r.user?.email?.split('@')[0]}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              {r.comment && <p className="text-gray-600 text-sm mt-2">{r.comment}</p>}
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-gray-400 text-center py-8">Пока нет отзывов. Будьте первым!</p>
          )}
        </div>
      </div>
    </div>
  )
}
