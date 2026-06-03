import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { convertToBase, getCompatibleUnits } from '@/lib/units'

export interface CartItem {
  productId: string
  productName: string
  sku: string
  baseUnit: string
  basePricePerUnit: number
  orderedUnit: string
  orderedQuantity: number
  baseQuantity: number
  lineTotal: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'baseQuantity' | 'lineTotal'>) => void
  updateItem: (productId: string, orderedQuantity: number, orderedUnit: string) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const baseQuantity = convertToBase(item.orderedQuantity, item.orderedUnit)
        const lineTotal = baseQuantity * item.basePricePerUnit

        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, orderedQuantity: item.orderedQuantity, orderedUnit: item.orderedUnit, baseQuantity, lineTotal }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, baseQuantity, lineTotal }] }
        })
      },

      updateItem: (productId, orderedQuantity, orderedUnit) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId !== productId) return i
            const baseQuantity = convertToBase(orderedQuantity, orderedUnit)
            const lineTotal = baseQuantity * i.basePricePerUnit
            return { ...i, orderedQuantity, orderedUnit, baseQuantity, lineTotal }
          }),
        }))
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.lineTotal, 0),
    }),
    { name: 'aasa-cart' }
  )
)
