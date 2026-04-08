'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, Product } from '@/lib/api'
import ProductCard from '../components/ui/ProductCard'
import { useAuth } from '@/lib/auth-context'

export default function CatalogPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [recommended, setRecommended] = useState<Product[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('DESC')
  const [page, setPage] = useState(1)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: 16, sortBy, order }
      if (search) params.search = search
      if (category) params.category = category
      if (minPrice) params.minPrice = Number(minPrice)
      if (maxPrice) params.maxPrice = Number(maxPrice)
      const res = await api.products.list(params)
      setProducts(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch {}
    setLoading(false)
  }, [search, category, minPrice, maxPrice, sortBy, order, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { api.products.categories().then(setCategories).catch(() => {}) }, [])
  useEffect(() => {
    if (user) {
      api.recommendations.forUser()
        .then(async (r) => {
          if (r.productIds?.length) {
            const recs = await Promise.all(r.productIds.slice(0, 4).map((id) => api.products.get(id).catch(() => null)))
            setRecommended(recs.filter(Boolean) as Product[])
          }
        })
        .catch(() => {})
    }
  }, [user])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchProducts() }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Recommendations banner */}
      {recommended.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🤖 Рекомендуем для вас</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommended.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <hr className="mt-8 border-gray-100" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="card p-5 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-4">Фильтры</h3>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Поиск</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="Название товара..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="btn-primary px-3 py-2 text-sm">🔍</button>
              </div>
            </form>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Категория</label>
              <select
                className="input text-sm"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              >
                <option value="">Все категории</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Price range */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Цена (₸)</label>
              <div className="flex gap-2">
                <input type="number" className="input text-sm" placeholder="От"
                  value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <input type="number" className="input text-sm" placeholder="До"
                  value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>

            {/* Sort */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Сортировка</label>
              <select className="input text-sm" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }}>
                <option value="createdAt">Новинки</option>
                <option value="price">Цена</option>
                <option value="rating">Рейтинг</option>
                <option value="salesCount">Популярность</option>
              </select>
              <select className="input text-sm mt-2" value={order} onChange={(e) => { setOrder(e.target.value); setPage(1) }}>
                <option value="DESC">По убыванию</option>
                <option value="ASC">По возрастанию</option>
              </select>
            </div>

            <button
              onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setSortBy('createdAt'); setOrder('DESC'); setPage(1) }}
              className="btn-secondary w-full text-sm"
            >
              Сбросить фильтры
            </button>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Найдено: <b>{total}</b> товаров</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p>Ничего не найдено. Попробуйте изменить фильтры.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === i + 1
                          ? 'bg-brand-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
