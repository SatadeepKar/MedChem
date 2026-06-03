'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/cart-store'
import { getCompatibleUnits, priceInUnit, convertToBase } from '@/lib/units'
import { formatINR } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ShoppingCart, Trash2, Package, FileText, Send } from 'lucide-react'
import Link from 'next/link'

export default function CartPage() {
  const { items, updateItem, removeItem, clearCart, total } = useCartStore()
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  const placeOrder = (status: 'pending' | 'draft') => {
    startTransition(async () => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
          items: items.map((i) => ({
            productId: i.productId,
            orderedUnit: i.orderedUnit,
            orderedQuantity: i.orderedQuantity,
          })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        clearCart()
        toast.success(
          status === 'draft' ? 'Order saved as draft' : 'Order placed successfully!'
        )
        router.push(`/dashboard/orders/${data.data.id}`)
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to place order')
      }
    })
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="p-6 rounded-3xl bg-muted/30 border border-border/50">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/40" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground mt-1">Add products from the catalogue to get started</p>
        </div>
        <Link href="/dashboard/products">
          <Button className="gap-2"><Package className="w-4 h-4" /> Browse Catalogue</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cart</h1>
          <p className="text-muted-foreground text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-2"
          onClick={() => { if (confirm('Clear cart?')) clearCart() }}>
          <Trash2 className="w-4 h-4" /> Clear Cart
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const compatUnits = getCompatibleUnits(item.baseUnit)
          const pricePerUnit = priceInUnit(item.basePricePerUnit, item.orderedUnit)

          return (
            <div key={item.productId} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{item.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeItem(item.productId)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Quantity</label>
                  <Input
                    type="number" min="0.001" step="any"
                    value={item.orderedQuantity}
                    onChange={(e) => updateItem(item.productId, parseFloat(e.target.value) || 0, item.orderedUnit)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Unit</label>
                  <Select
                    value={item.orderedUnit}
                    onValueChange={(u) => updateItem(item.productId, item.orderedQuantity, u)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {compatUnits.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price breakdown */}
                <div className="sm:col-span-2 bg-muted/30 rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Rate</span>
                    <span>{formatINR(pricePerUnit)} / {item.orderedUnit}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs mt-1">
                    <span>Base qty</span>
                    <span className="font-mono">{item.baseQuantity.toFixed(4)} {item.baseUnit}</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-1 pt-1 border-t border-border/50">
                    <span>Line Total</span>
                    <span className="text-primary">{formatINR(item.lineTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Notes */}
      <div className="glass rounded-2xl p-5 space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" /> Order Notes (optional)
        </label>
        <Textarea
          placeholder="Any special instructions or notes for this order…"
          value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Summary + Actions */}
      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Order Total</p>
          <p className="text-3xl font-bold gradient-text">{formatINR(total())}</p>
          <p className="text-xs text-muted-foreground mt-1">{items.length} product{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" disabled={isPending} onClick={() => placeOrder('draft')} className="gap-2">
            <FileText className="w-4 h-4" /> Save as Draft
          </Button>
          <Button disabled={isPending} onClick={() => placeOrder('pending')} className="gap-2 min-w-36">
            <Send className="w-4 h-4" />
            {isPending ? 'Placing…' : 'Place Order'}
          </Button>
        </div>
      </div>
    </div>
  )
}
