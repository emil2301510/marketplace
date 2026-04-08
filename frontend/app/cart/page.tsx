'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'

export default function CartPage() {
  const { items, total, removeItem, updateQty, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [ordering, setOrdering] = useState(false)

  const handleOrder = async () => {
    if (!user) { router.push('/auth'); return }
    if (!address) { alert('Введите адрес доставки'); return }
    setOrdering(true)
    try {
      const order = await api.orders.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address,
      })
      await clearCart()
      router.push(`/orders/${order.id}`)
    } catch (err: any) {
      alert(err.message)
    }
    setOrdering(false)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h1 className="text-2xl font-bold mb-3">Корзина пуста</h1>
        <p className="text-gray-500 mb-8">Добавьте товары из каталога</p>
        <Link href="/catalog" className="btn-primary text-base px-8 py-3">Перейти в каталог</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">🛒 Корзина</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="card p-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={item.image || `https://picsum.photos/seed/${item.productId}/80/80`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                <p className="text-brand-600 font-bold mt-1">
                  {Number(item.price).toLocaleString('ru-RU')} ₸
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 font-bold text-lg flex items-center justify-center">
                  −
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 font-bold text-lg flex items-center justify-center">
                  +
                </button>
              </div>
              <p className="font-bold text-gray-900 w-28 text-right">
                {(Number(item.price) * item.quantity).toLocaleString('ru-RU')} ₸
              </p>
              <button onClick={() => removeItem(item.productId)}
                className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                ✕
              </button>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            Очистить корзину
          </button>
        </div>

        {/* Order summary */}
        <div>
          <div className="card p-6 sticky top-20">
            <h2 className="font-bold text-lg mb-4">Оформление заказа</h2>

            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Товаров: {items.reduce((s, i) => s + i.quantity, 0)} шт.</span>
            </div>
            <div className="flex justify-between font-bold text-xl mb-6 pt-3 border-t border-gray-100">
              <span>Итого:</span>
              <span className="text-brand-600">{Number(total).toLocaleString('ru-RU')} ₸</span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес доставки</label>
              <textarea
                className="input resize-none text-sm"
                rows={3}
                placeholder="Улица, дом, квартира..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
              <span>💳</span>
              <span>Оплата mock — заказ будет автоматически оплачен</span>
            </div>

            <button
              onClick={handleOrder}
              disabled={ordering}
              className="btn-primary w-full py-3 text-base"
            >
              {ordering ? 'Оформляем...' : 'Оформить заказ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
