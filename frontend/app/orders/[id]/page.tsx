'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, Order } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered']
const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание', paid: 'Оплачен', processing: 'Обработка',
  shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменён',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => { if (!loading && !user) router.push('/auth') }, [user, loading])
  useEffect(() => {
    if (!user) return
    api.orders.get(id).then(setOrder).catch(() => router.push('/orders'))
  }, [id, user])

  if (!order) return <div className="flex justify-center py-20"><div className="animate-spin text-4xl">⏳</div></div>

  const stepIdx = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/orders')} className="text-sm text-gray-500 hover:text-brand-600 mb-6 flex items-center gap-1">
        ← Мои заказы
      </button>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Заказ #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString('ru-RU')}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-600">{Number(order.total).toLocaleString('ru-RU')} ₸</p>
            {order.paymentId && <p className="text-xs text-gray-400 mt-1">ID: {order.paymentId}</p>}
          </div>
        </div>

        {/* Progress tracker */}
        {order.status !== 'cancelled' && (
          <div className="mb-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-brand-500 z-0 transition-all duration-500"
                style={{ width: `${(stepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i <= stepIdx ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 text-center hidden sm:block">{STATUS_LABELS[step]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.shippingAddress && (
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <p className="font-medium text-gray-700 mb-1">📍 Адрес доставки</p>
            <p className="text-gray-500">{order.shippingAddress}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card p-6">
        <h2 className="font-bold mb-4">Товары в заказе</h2>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={item.product?.images?.[0] || `https://picsum.photos/seed/${item.productId}/64/64`}
                  alt={item.product?.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/catalog/${item.productId}`} className="font-medium text-gray-900 hover:text-brand-600 truncate block">
                  {item.product?.title || 'Товар'}
                </Link>
                <p className="text-sm text-gray-500">{item.quantity} шт. × {Number(item.priceAtPurchase).toLocaleString('ru-RU')} ₸</p>
              </div>
              <p className="font-bold text-gray-900">
                {(Number(item.priceAtPurchase) * item.quantity).toLocaleString('ru-RU')} ₸
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-lg">
          <span>Итого</span>
          <span className="text-brand-600">{Number(order.total).toLocaleString('ru-RU')} ₸</span>
        </div>
      </div>
    </div>
  )
}
