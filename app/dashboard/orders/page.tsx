'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { formatINR, formatDate } from '@/lib/format'
import { ChevronRight, ClipboardList } from 'lucide-react'

interface Order {
  id: string; orderNumber: string; status: string; totalAmount: string; createdAt: string
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/orders?limit=50')
    const data = await res.json()
    setOrders(data.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground text-sm">Track the status of your orders</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5"><Skeleton className="h-14 w-full" /></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4 text-center">
          <div className="p-5 rounded-3xl bg-muted/30 border border-border/50">
            <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">Head to the catalogue to place your first order</p>
          </div>
          <Link href="/dashboard/products"><Button>Browse Catalogue</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/dashboard/orders/${o.id}`}>
              <div className="glass rounded-2xl p-5 flex items-center justify-between hover:border-primary/30 transition-all group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <ClipboardList className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold group-hover:text-primary transition-colors">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatINR(o.totalAmount)}</span>
                  <StatusBadge status={o.status} />
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
