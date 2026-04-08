'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, Order } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Ожидание',  color: 'bg-yellow-100 text-yellow-700' },
  paid:       { label: 'Оплачен',   color: 'bg-green-100 text-green-700' },
  processing: { label: 'Обработка', color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Отправлен', color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Доставлен', color: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Отменён',   color: 'bg-red-100 text-red-700' },
}

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    api.orders.list().then(setOrders).finally(() => setFetching(false))
  }, [user])

  if (fetching) return <div className="flex justify-center py-20"><div className="animate-spin text-4xl">⏳</div></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">📦 Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 mb-6">У вас пока нет заказов</p>
          <Link href="/catalog" className="btn-primary">В каталог</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <Link key={order.id} href={`/orders/${order.id}`} className="card p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm text-gray-500">#{order.id.slice(0, 8)}</span>
                    <span className={`badge ${status.color}`}>{status.label}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {order.items?.length || 0} товаров · {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600 text-lg">{Number(order.total).toLocaleString('ru-RU')} ₸</p>
                  <p className="text-xs text-gray-400">→</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
