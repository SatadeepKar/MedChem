import { Suspense } from 'react'
import { formatINR, formatDate } from '@/lib/format'
import { StatusBadge } from '@/components/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ShoppingCart, Clock, AlertTriangle } from 'lucide-react'

async function getDashboardStats() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/dashboard/stats`, {
    cache: 'no-store',
    headers: { Cookie: '' },
  })
  return res.ok ? res.json() : { data: {} }
}

function StatCard({
  label, value, icon, glowClass, sub,
}: {
  label: string; value: string | number; icon: React.ReactNode; glowClass: string; sub?: string
}) {
  return (
    <div className={`glass rounded-2xl p-6 flex items-start gap-4 ${glowClass}`}>
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default async function AdminDashboard() {
  const { data } = await getDashboardStats().catch(() => ({ data: {} }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of inventory and orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Products" value={data?.totalProducts ?? '—'} icon={<Package className="w-5 h-5 text-primary" />} glowClass="glow-blue" />
        <StatCard label="Total Orders" value={data?.totalOrders ?? '—'} icon={<ShoppingCart className="w-5 h-5 text-chart-2" />} glowClass="glow-green" />
        <StatCard label="Pending Orders" value={data?.pendingOrders ?? '—'} icon={<Clock className="w-5 h-5 text-chart-3" />} glowClass="glow-amber" />
        <StatCard label="Low Stock Alerts" value={data?.lowStockCount ?? '—'} icon={<AlertTriangle className="w-5 h-5 text-destructive" />} glowClass="glow-red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" /> Recent Orders
          </h2>
          {data?.recentOrders?.length ? (
            <div className="space-y-2">
              {data.recentOrders.map((order: any) => (
                <a key={order.id} href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatINR(order.totalAmount)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No orders yet</p>
          )}
        </div>

        {/* Low Stock */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Low Stock Products
          </h2>
          {data?.lowStockProducts?.length ? (
            <div className="space-y-2">
              {data.lowStockProducts.map((p: any) => (
                <a key={p.id} href={`/admin/products/${p.id}/edit`}
                  className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{parseFloat(p.stockQuantity).toFixed(2)} {p.baseUnit}</p>
                    <p className="text-xs text-muted-foreground">threshold: {parseFloat(p.lowStockThreshold).toFixed(2)}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              <span className="text-chart-2">✓</span> All products are well stocked
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
