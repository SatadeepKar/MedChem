import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { orders, orderItems, products, users } from '@/db/schema'
import { eq, desc, and, inArray, sql } from 'drizzle-orm'
import { createOrderSchema } from '@/lib/validations'
import { convertToBase } from '@/lib/units'

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const offset = (page - 1) * limit

    const conditions = []
    // Sellers only see their own orders
    if (session.user.role !== 'admin') {
      conditions.push(eq(orders.userId, session.user.id))
    }
    if (status) conditions.push(eq(orders.status, status))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db
        .select({ order: orders, seller: users })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(where),
    ])

    return NextResponse.json({
      data: rows.map((r) => ({
        ...r.order,
        seller: r.seller ? { id: r.seller.id, name: r.seller.name, email: r.seller.email } : null,
      })),
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count ?? 0),
        totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/orders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { items, notes, status } = parsed.data

    // Load all products in the order
    const productIds = items.map((i) => i.productId)
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds))

    const productMap = Object.fromEntries(productRows.map((p) => [p.id, p]))

    // Validate all products exist and are active
    for (const item of items) {
      const p = productMap[item.productId]
      if (!p) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      if (!p.isActive) return NextResponse.json({ error: `Product ${p.name} is inactive` }, { status: 400 })
    }

    // Generate order number: ORD-YYYY-NNNN
    const year = new Date().getFullYear()
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
    const seq = Number(countResult[0]?.count ?? 0) + 1
    const orderNumber = `ORD-${year}-${String(seq).padStart(4, '0')}`

    // Calculate items and total
    let totalAmount = 0
    const orderItemsData = items.map((item) => {
      const p = productMap[item.productId]
      const baseQty = convertToBase(item.orderedQuantity, item.orderedUnit)
      const unitPriceAtOrder = parseFloat(p.basePricePerUnit)
      const lineTotal = baseQty * unitPriceAtOrder
      totalAmount += lineTotal

      return {
        productId: item.productId,
        orderedUnit: item.orderedUnit,
        orderedQuantity: String(item.orderedQuantity),
        baseQuantity: String(baseQty),
        unitPriceAtOrder: String(unitPriceAtOrder),
        lineTotal: String(lineTotal),
      }
    })

    // Insert order + items in a transaction-like sequence
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: session.user.id,
        status: status ?? 'pending',
        notes: notes ?? null,
        totalAmount: String(totalAmount),
      })
      .returning()

    await db.insert(orderItems).values(
      orderItemsData.map((item) => ({ ...item, orderId: order.id }))
    )

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
