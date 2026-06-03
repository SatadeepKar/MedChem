import { auth } from '@/auth'
import Link from 'next/link'
import { ShoppingCart, ClipboardList, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

async function getSellerStats(userId: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/dashboard/stats`, { cache: 'no-store' })
  return res.ok ? res.json() : { data: {} }
}

export default async function DashboardHome() {
  const session = await auth()
  const { data } = await getSellerStats(session!.user.id).catch(() => ({ data: {} }))

  const firstName = session?.user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div className="glass rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-chart-2/10 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-muted-foreground text-sm">Good day 👋</p>
          <h1 className="text-3xl font-bold mt-1 gradient-text">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground mt-2">Browse the catalogue, build your cart, and place orders.</p>
          <div className="flex gap-3 mt-5">
            <Link href="/dashboard/products">
              <Button className="gap-2">
                <Package className="w-4 h-4" /> Browse Catalogue
              </Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="outline" className="gap-2">
                <ClipboardList className="w-4 h-4" /> My Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 glow-blue flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/15 border border-primary/20">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-3xl font-bold">{data?.myTotalOrders ?? '—'}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-6 glow-amber flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-3/15 border border-chart-3/20">
            <ShoppingCart className="w-5 h-5 text-chart-3" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending Orders</p>
            <p className="text-3xl font-bold">{data?.myPendingOrders ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/products', icon: <Package className="w-5 h-5 text-primary" />, label: 'Browse Products', sub: 'View the full catalogue' },
          { href: '/dashboard/cart', icon: <ShoppingCart className="w-5 h-5 text-chart-2" />, label: 'View Cart', sub: 'Review items before ordering' },
          { href: '/dashboard/orders', icon: <ClipboardList className="w-5 h-5 text-chart-3" />, label: 'My Orders', sub: 'Track your order history' },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">{item.icon}</div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
