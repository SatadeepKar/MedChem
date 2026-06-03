import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { products, categories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { updateProductSchema } from '@/lib/validations'

// GET /api/products/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const [row] = await db
      .select({ product: products, category: categories })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1)

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: { ...row.product, category: row.category } })
  } catch (error) {
    console.error('[GET /api/products/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/products/[id] — admin only
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
    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const updates: Record<string, any> = { updatedAt: new Date() }
    if (data.name !== undefined) updates.name = data.name
    if (data.sku !== undefined) updates.sku = data.sku
    if (data.description !== undefined) updates.description = data.description
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId ?? null
    if (data.baseUnit !== undefined) updates.baseUnit = data.baseUnit
    if (data.basePricePerUnit !== undefined) updates.basePricePerUnit = String(data.basePricePerUnit)
    if (data.stockQuantity !== undefined) updates.stockQuantity = String(data.stockQuantity)
    if (data.lowStockThreshold !== undefined) updates.lowStockThreshold = String(data.lowStockThreshold)
    if (data.isActive !== undefined) updates.isActive = data.isActive

    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning()

    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[PUT /api/products/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/products/[id] — admin only (soft delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const [product] = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()

    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[DELETE /api/products/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
