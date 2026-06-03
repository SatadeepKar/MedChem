import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { categories } from '@/db/schema'
import { createCategorySchema } from '@/lib/validations'

// GET /api/categories
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db.select().from(categories).orderBy(categories.name)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[GET /api/categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/categories — admin only
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const [category] = await db
      .insert(categories)
      .values(parsed.data)
      .returning()

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error: any) {
    if (error?.message?.includes('unique')) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 })
    }
    console.error('[POST /api/categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
