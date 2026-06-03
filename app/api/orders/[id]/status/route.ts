import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { updateOrderStatusSchema } from '@/lib/validations'

// PUT /api/orders/[id]/status — admin only
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = updateOrderStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { status } = parsed.data

    // Get current order
    const [currentOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!currentOrder) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If transitioning to 'fulfilled', deduct stock
    if (status === 'fulfilled' && currentOrder.status !== 'fulfilled') {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, id))

      for (const item of items) {
        if (!item.productId || !item.baseQuantity) continue
        const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1)
        if (!product) continue
        const newStock = parseFloat(product.stockQuantity) - parseFloat(item.baseQuantity)
        await db
          .update(products)
          .set({ stockQuantity: String(Math.max(0, newStock)), updatedAt: new Date() })
          .where(eq(products.id, item.productId))
      }
    }

    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PUT /api/orders/[id]/status]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
