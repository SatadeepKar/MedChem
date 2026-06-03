'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/status-badge'
import { formatINR, formatDate } from '@/lib/format'
import { ArrowLeft, User, Calendar, Hash, Package } from 'lucide-react'

interface OrderDetail {
  id: string; orderNumber: string; status: string; notes?: string
  totalAmount: string; createdAt: string; updatedAt: string
  seller?: { name: string; email: string } | null
  items: Array<{
    id: string; orderedUnit: string; orderedQuantity: string; baseQuantity: string
    unitPriceAtOrder: string; lineTotal: string
    product?: { name: string; sku: string; baseUnit: string } | null
  }>
}

const NEXT_STATUSES: Record<string, string[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['fulfilled', 'cancelled'],
  fulfilled: [],
  cancelled: [],
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d.data); setLoading(false) })
  }, [id])

  const updateStatus = () => {
    if (!newStatus) return
    startTransition(async () => {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Order status updated to "${newStatus}"`)
        const d = await fetch(`/api/orders/${id}`).then((r) => r.json())
        setOrder(d.data); setNewStatus('')
      } else {
        const err = await res.json(); toast.error(err.error ?? 'Error')
      }
    })
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl"/>)}</div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
  if (!order) return <div className="text-center py-24 text-muted-foreground">Order not found</div>

  const allowedTransitions = NEXT_STATUSES[order.status] ?? []

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

      {/* Meta cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Seller</p>
            <p className="font-semibold">{order.seller?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{order.seller?.email}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-chart-2/10 border border-chart-2/20">
            <Calendar className="w-4 h-4 text-chart-2" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created / Updated</p>
            <p className="font-semibold">{formatDate(order.createdAt)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(order.updatedAt)}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-chart-3/10 border border-chart-3/20">
            <Hash className="w-4 h-4 text-chart-3" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Order Total</p>
            <p className="text-2xl font-bold">{formatINR(order.totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm">{order.notes}</p>
        </div>
      )}

      {/* Status update */}
      {allowedTransitions.length > 0 && (
        <div className="glass rounded-2xl p-5 flex items-center gap-4">
          <p className="text-sm font-medium">Update status:</p>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {allowedTransitions.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={updateStatus} disabled={!newStatus || isPending}>
            {isPending ? 'Updating…' : 'Update'}
          </Button>
        </div>
      )}

      {/* Line items */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Order Items ({order.items.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              {['Product', 'SKU', 'Ordered Qty', 'Base Qty', 'Unit Price', 'Line Total'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-border/30">
                <td className="px-4 py-3 font-medium">{item.product?.name ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.product?.sku}</td>
                <td className="px-4 py-3 font-mono">
                  {parseFloat(item.orderedQuantity).toFixed(4)} {item.orderedUnit}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {parseFloat(item.baseQuantity).toFixed(4)} {item.product?.baseUnit}
                </td>
                <td className="px-4 py-3">{formatINR(item.unitPriceAtOrder)} / {item.product?.baseUnit}</td>
                <td className="px-4 py-3 font-semibold">{formatINR(item.lineTotal)}</td>
              </tr>
            ))}
            <tr className="bg-muted/20">
              <td colSpan={5} className="px-4 py-3 text-right font-semibold">Grand Total</td>
              <td className="px-4 py-3 font-bold text-lg">{formatINR(order.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
