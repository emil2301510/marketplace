const BASE = '/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Auth
export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string }) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST', body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST', body: JSON.stringify(body),
      }),
    me: () => request<User>('/users/me'),
  },
  products: {
    list: (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
      return request<ProductListResponse>(`/products${qs}`)
    },
    get: (id: string) => request<Product>(`/products/${id}`),
    categories: () => request<string[]>('/products/categories'),
    create: (body: Partial<Product>) =>
      request<Product>('/products', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Product>) =>
      request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/products/${id}`, { method: 'DELETE' }),
    myProducts: () => request<Product[]>('/products/seller/my'),
  },
  cart: {
    get: () => request<CartResponse>('/cart'),
    add: (item: CartItem) =>
      request<CartItem[]>('/cart/add', { method: 'POST', body: JSON.stringify(item) }),
    update: (productId: string, quantity: number) =>
      request<CartItem[]>(`/cart/${productId}`, {
        method: 'PATCH', body: JSON.stringify({ quantity }),
      }),
    remove: (productId: string) =>
      request<CartItem[]>(`/cart/${productId}`, { method: 'DELETE' }),
    clear: () => request<void>('/cart', { method: 'DELETE' }),
  },
  orders: {
    create: (body: { items: { productId: string; quantity: number }[]; shippingAddress: string }) =>
      request<Order>('/orders', { method: 'POST', body: JSON.stringify(body) }),
    list: () => request<Order[]>('/orders'),
    get: (id: string) => request<Order>(`/orders/${id}`),
    adminAll: () => request<Order[]>('/orders/admin/all'),
    updateStatus: (id: string, status: string) =>
      request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  reviews: {
    forProduct: (productId: string) => request<Review[]>(`/reviews/product/${productId}`),
    create: (productId: string, body: { rating: number; comment: string }) =>
      request<Review>(`/reviews/product/${productId}`, { method: 'POST', body: JSON.stringify(body) }),
  },
  recommendations: {
    forUser: () => request<{ productIds: string[] }>('/recommendations/user'),
    similar: (productId: string) =>
      request<{ similarProductIds: string[] }>(`/recommendations/product/${productId}`),
  },
}

// Types
export interface User {
  id: string
  email: string
  name?: string
  role: 'user' | 'seller' | 'admin'
  avatarUrl?: string
  createdAt: string
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  stock: number
  category?: string
  images?: string[]
  rating: number
  reviewCount: number
  salesCount: number
  sellerId: string
  seller?: User
  createdAt: string
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface CartItem {
  productId: string
  quantity: number
  title: string
  price: number
  image?: string
}

export interface CartResponse {
  items: CartItem[]
  total: number
}

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  priceAtPurchase: number
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: string
  shippingAddress: string
  paymentId?: string
  createdAt: string
}

export interface Review {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string
  user: User
  createdAt: string
}
