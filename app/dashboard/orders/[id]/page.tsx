'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { formatINR, formatDate } from '@/lib/format'
import { ArrowLeft, Package } from 'lucide-react'

interface OrderDetail {
  id: string; orderNumber: string; status: string; notes?: string
  totalAmount: string; createdAt: string
  items: Array<{
    id: string; orderedUnit: string; orderedQuantity: string; baseQuantity: string
    unitPriceAtOrder: string; lineTotal: string
    product?: { name: string; sku: string; baseUnit: string } | null
  }>
}

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d.data); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )

  if (!order) return <div className="text-center py-24 text-muted-foreground">Order not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground text-sm">Placed {formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="glass rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Order Total</p>
          <p className="text-3xl font-bold gradient-text">{formatINR(order.totalAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Status</p>
          <StatusBadge status={order.status} className="text-sm px-3 py-1" />
        </div>
      </div>

      {order.notes && (
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm">{order.notes}</p>
        </div>
      )}

      {/* Line items */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Items ({order.items.length})</h2>
        </div>
        <div className="divide-y divide-border/30">
          {order.items.map((item) => (
            <div key={item.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium">{item.product?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground font-mono">{item.product?.sku}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {parseFloat(item.orderedQuantity).toFixed(4)} {item.orderedUnit}
                  {' → '}
                  <span className="font-mono">{parseFloat(item.baseQuantity).toFixed(4)} {item.product?.baseUnit}</span>
                </p>
              </div>
              <div className="text-right sm:text-right">
                <p className="text-xs text-muted-foreground">{formatINR(item.unitPriceAtOrder)} / {item.product?.baseUnit}</p>
                <p className="font-semibold">{formatINR(item.lineTotal)}</p>
              </div>
            </div>
          ))}
          <div className="px-5 py-4 flex justify-between items-center bg-muted/20">
            <p className="font-semibold">Total</p>
            <p className="text-xl font-bold">{formatINR(order.totalAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
