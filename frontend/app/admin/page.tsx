'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, Order, User } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание', paid: 'Оплачен', processing: 'Обработка',
  shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменён',
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'orders' | 'users'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && user?.role !== 'admin') router.push('/')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.orders.adminAll().then(setOrders),
      api.auth.me().then(() => {}) // placeholder
    ]).finally(() => setFetching(false))
  }, [user])

  const updateStatus = async (id: string, status: string) => {
    await api.orders.updateStatus(id, status)
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
  }

  const trainML = async () => {
    try {
      const res = await fetch('/api/recommendations/train')
      const data = await res.json()
      alert(JSON.stringify(data, null, 2))
    } catch { alert('Ошибка при запуске обучения') }
  }

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">⚙️ Панель администратора</h1>
        <button onClick={trainML} className="btn-secondary text-sm">
          🤖 Обучить ML модель
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Всего заказов', value: orders.length, icon: '📦' },
          { label: 'Выручка', value: `${totalRevenue.toLocaleString('ru-RU')} ₸`, icon: '💰' },
          { label: 'Оплачено', value: orders.filter((o) => o.status === 'paid' || o.status === 'delivered').length, icon: '✅' },
          { label: 'Отменено', value: orders.filter((o) => o.status === 'cancelled').length, icon: '❌' },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100">
        {(['orders', 'users'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'orders' ? '📦 Заказы' : '👥 Пользователи'}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="text-center py-10 text-gray-400">Загрузка...</div>
      ) : tab === 'orders' ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID заказа', 'Дата', 'Сумма', 'Товаров', 'Статус', 'Действие'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">#{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3 font-bold">{Number(o.total).toLocaleString('ru-RU')} ₸</td>
                  <td className="px-4 py-3 text-gray-600">{o.items?.length || 0} шт.</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      o.status === 'paid' || o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      o.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-10 text-gray-400">Заказов пока нет</div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p>Список пользователей доступен через API: <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/users</code></p>
        </div>
      )}
    </div>
  )
}
