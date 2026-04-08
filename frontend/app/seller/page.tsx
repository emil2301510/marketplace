'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, Product } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export default function SellerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', price: '', stock: '', category: '',
    images: '',
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'seller' && user.role !== 'admin'))) {
      router.push('/')
    }
  }, [user, loading])

  const fetchProducts = () => {
    api.products.myProducts().then(setProducts).finally(() => setFetching(false))
  }

  useEffect(() => { if (user) fetchProducts() }, [user])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', price: '', stock: '', category: '', images: '' })
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      title: p.title, description: p.description,
      price: String(p.price), stock: String(p.stock),
      category: p.category || '', images: p.images?.join(', ') || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category || undefined,
        images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      }
      if (editing) {
        await api.products.update(editing.id, body)
      } else {
        await api.products.create(body)
      }
      setShowForm(false)
      fetchProducts()
    } catch (err: any) { alert(err.message) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return
    await api.products.delete(id)
    fetchProducts()
  }

  const totalRevenue = products.reduce((s, p) => s + Number(p.price) * p.salesCount, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">🏪 Кабинет продавца</h1>
        <button onClick={openCreate} className="btn-primary">+ Добавить товар</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Товаров', value: products.length, icon: '📦' },
          { label: 'Продаж', value: products.reduce((s, p) => s + p.salesCount, 0), icon: '🛒' },
          { label: 'Выручка', value: `${totalRevenue.toLocaleString('ru-RU')} ₸`, icon: '💰' },
          { label: 'Средний рейтинг', value: products.length ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1) : '—', icon: '⭐' },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? 'Редактировать товар' : 'Новый товар'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание *</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₸) *</label>
                  <input type="number" min="0" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Количество *</label>
                  <input type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                <input className="input" placeholder="Электроника, Одежда..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL изображений (через запятую)</label>
                <input className="input" placeholder="https://..." value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Сохранение...' : editing ? 'Сохранить' : 'Создать'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products table */}
      {fetching ? (
        <div className="text-center py-10 text-gray-400">Загрузка...</div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-5xl mb-4">📦</div>
          <p>У вас пока нет товаров. Добавьте первый!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Товар', 'Цена', 'Остаток', 'Продажи', 'Рейтинг', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={p.images?.[0] || `https://picsum.photos/seed/${p.id}/40/40`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{p.title}</p>
                        {p.category && <span className="text-xs text-gray-400">{p.category}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{Number(p.price).toLocaleString('ru-RU')} ₸</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.stock} шт.
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.salesCount}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span>{p.rating.toFixed(1)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="text-xs px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        Изменить
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs px-3 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
