import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { orders, products } from '@/db/schema'
import { eq, sql, and, lt } from 'drizzle-orm'

// GET /api/dashboard/stats
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role === 'admin') {
      const [totalProducts] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.isActive, true))

      const [totalOrders] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)

      const [pendingOrders] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, 'pending'))

      const lowStockProducts = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            sql`${products.stockQuantity}::numeric < ${products.lowStockThreshold}::numeric`
          )
        )
        .limit(10)

      const recentOrders = await db
        .select({ order: orders })
        .from(orders)
        .orderBy(sql`${orders.createdAt} desc`)
        .limit(10)

      return NextResponse.json({
        data: {
          totalProducts: Number(totalProducts?.count ?? 0),
          totalOrders: Number(totalOrders?.count ?? 0),
          pendingOrders: Number(pendingOrders?.count ?? 0),
          lowStockCount: lowStockProducts.length,
          lowStockProducts,
          recentOrders: recentOrders.map((r) => r.order),
        },
      })
    } else {
      // Seller stats
      const [myOrders] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.userId, session.user.id))

      const [myPending] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(
          and(eq(orders.userId, session.user.id), eq(orders.status, 'pending'))
        )

      return NextResponse.json({
        data: {
          myTotalOrders: Number(myOrders?.count ?? 0),
          myPendingOrders: Number(myPending?.count ?? 0),
        },
      })
    }
  } catch (error) {
    console.error('[GET /api/dashboard/stats]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
