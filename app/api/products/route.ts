import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { products, categories } from '@/db/schema'
import { eq, ilike, and, or, desc, sql } from 'drizzle-orm'
import { createProductSchema, updateProductSchema } from '@/lib/validations'

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') ?? ''
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const includeInactive = searchParams.get('includeInactive') === 'true' && session.user.role === 'admin'
    const offset = (page - 1) * limit

    const conditions = []
    if (!includeInactive) conditions.push(eq(products.isActive, true))
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      )
    }
    if (categoryId) conditions.push(eq(products.categoryId, categoryId))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db
        .select({
          product: products,
          category: categories,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(where)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where),
    ])

    return NextResponse.json({
      data: rows.map((r) => ({ ...r.product, category: r.category })),
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count ?? 0),
        totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/products — admin only
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const [product] = await db
      .insert(products)
      .values({
        name: data.name,
        sku: data.sku,
        description: data.description,
        categoryId: data.categoryId ?? null,
        baseUnit: data.baseUnit,
        basePricePerUnit: String(data.basePricePerUnit),
        stockQuantity: String(data.stockQuantity),
        lowStockThreshold: String(data.lowStockThreshold ?? 0),
        isActive: data.isActive ?? true,
      })
      .returning()

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error: any) {
    if (error?.message?.includes('unique')) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
    }
    console.error('[POST /api/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
