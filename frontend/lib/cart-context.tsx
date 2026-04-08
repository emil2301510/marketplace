'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, CartItem } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface CartContextType {
  items: CartItem[]
  total: number
  count: number
  addItem: (item: CartItem) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQty: (productId: string, qty: number) => Promise<void>
  clearCart: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)

  const refresh = async () => {
    if (!user) return
    try {
      const cart = await api.cart.get()
      setItems(cart.items)
      setTotal(cart.total)
    } catch {}
  }

  useEffect(() => { refresh() }, [user])

  const addItem = async (item: CartItem) => {
    await api.cart.add(item)
    await refresh()
  }

  const removeItem = async (productId: string) => {
    await api.cart.remove(productId)
    await refresh()
  }

  const updateQty = async (productId: string, qty: number) => {
    await api.cart.update(productId, qty)
    await refresh()
  }

  const clearCart = async () => {
    await api.cart.clear()
    setItems([])
    setTotal(0)
  }

  return (
    <CartContext.Provider value={{
      items, total,
      count: items.reduce((s, i) => s + i.quantity, 0),
      addItem, removeItem, updateQty, clearCart, refresh,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
