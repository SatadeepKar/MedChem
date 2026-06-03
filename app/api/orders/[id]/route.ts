import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { orders, orderItems, products, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const [orderRow] = await db
      .select({ order: orders, seller: users })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, id))
      .limit(1)

    if (!orderRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Sellers can only view their own orders
    if (session.user.role !== 'admin' && orderRow.order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const items = await db
      .select({ item: orderItems, product: products })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id))

    return NextResponse.json({
      data: {
        ...orderRow.order,
        seller: orderRow.seller
          ? { id: orderRow.seller.id, name: orderRow.seller.name, email: orderRow.seller.email }
          : null,
        items: items.map((i) => ({ ...i.item, product: i.product })),
      },
    })
  } catch (error) {
    console.error('[GET /api/orders/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
