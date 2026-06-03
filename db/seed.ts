import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import bcrypt from 'bcryptjs'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  console.log('🌱 Seeding database...')

  // ── Categories ─────────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Solvents', description: 'Organic and inorganic solvents' },
    { name: 'Acids & Bases', description: 'Acids, bases, and buffers' },
    { name: 'Reagents', description: 'Chemical reagents and catalysts' },
    { name: 'Lab Supplies', description: 'Consumables and equipment supplies' },
    { name: 'APIs', description: 'Active Pharmaceutical Ingredients' },
  ]

  const insertedCategories = await db
    .insert(schema.categories)
    .values(categoryData)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ Categories: ${insertedCategories.length} inserted`)

  // Use either inserted or existing categories
  const allCats = insertedCategories.length > 0 ? insertedCategories : await db.select().from(schema.categories)
  const catMap = Object.fromEntries(allCats.map((c) => [c.name, c.id]))

  // ── Products ───────────────────────────────────────────────────────────────
  const productData = [
    {
      name: 'Ethanol (Absolute)',
      sku: 'SOL-20240101-ETH1',
      description: 'Absolute ethanol, 99.9% purity',
      categoryId: catMap['Solvents'],
      baseUnit: 'mL',
      basePricePerUnit: '0.00450000',
      stockQuantity: '50000',
      lowStockThreshold: '5000',
    },
    {
      name: 'Methanol (HPLC Grade)',
      sku: 'SOL-20240101-MET1',
      description: 'HPLC grade methanol',
      categoryId: catMap['Solvents'],
      baseUnit: 'mL',
      basePricePerUnit: '0.00320000',
      stockQuantity: '30000',
      lowStockThreshold: '3000',
    },
    {
      name: 'Hydrochloric Acid (36%)',
      sku: 'ACI-20240101-HCL1',
      description: 'Concentrated hydrochloric acid 36%',
      categoryId: catMap['Acids & Bases'],
      baseUnit: 'mL',
      basePricePerUnit: '0.00180000',
      stockQuantity: '20000',
      lowStockThreshold: '2000',
    },
    {
      name: 'Sodium Hydroxide Pellets',
      sku: 'ACI-20240101-NAO1',
      description: 'NaOH pellets, reagent grade',
      categoryId: catMap['Acids & Bases'],
      baseUnit: 'g',
      basePricePerUnit: '0.00120000',
      stockQuantity: '10000',
      lowStockThreshold: '1000',
    },
    {
      name: 'Silica Gel (60-mesh)',
      sku: 'REA-20240101-SIG1',
      description: 'Column chromatography silica gel',
      categoryId: catMap['Reagents'],
      baseUnit: 'g',
      basePricePerUnit: '0.00850000',
      stockQuantity: '5000',
      lowStockThreshold: '500',
    },
    {
      name: 'Acetonitrile (HPLC)',
      sku: 'SOL-20240101-ACN1',
      description: 'HPLC grade acetonitrile',
      categoryId: catMap['Solvents'],
      baseUnit: 'mL',
      basePricePerUnit: '0.00680000',
      stockQuantity: '2000',
      lowStockThreshold: '5000', // intentionally low stock to demo alert
    },
    {
      name: 'Disposable Gloves (Medium)',
      sku: 'LAB-20240101-GLV1',
      description: 'Nitrile gloves, box of 100',
      categoryId: catMap['Lab Supplies'],
      baseUnit: 'unit',
      basePricePerUnit: '4.50000000',
      stockQuantity: '500',
      lowStockThreshold: '100',
    },
    {
      name: 'Aspirin API',
      sku: 'API-20240101-ASP1',
      description: 'Acetylsalicylic acid, USP grade',
      categoryId: catMap['APIs'],
      baseUnit: 'g',
      basePricePerUnit: '0.85000000',
      stockQuantity: '2000',
      lowStockThreshold: '200',
    },
  ]

  const insertedProducts = await db
    .insert(schema.products)
    .values(productData)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ Products: ${insertedProducts.length} inserted`)

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 12)
  const sellerHash = await bcrypt.hash('Seller@123', 12)

  const userData = [
    {
      name: 'Admin User',
      email: 'admin@aasa.dev',
      passwordHash: adminHash,
      role: 'admin',
    },
    {
      name: 'Seller User',
      email: 'seller@aasa.dev',
      passwordHash: sellerHash,
      role: 'seller',
    },
  ]

  const insertedUsers = await db
    .insert(schema.users)
    .values(userData)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ Users: ${insertedUsers.length} inserted`)
  console.log('')
  console.log('🎉 Seed complete!')
  console.log('   Admin:  admin@aasa.dev  / Admin@123')
  console.log('   Seller: seller@aasa.dev / Seller@123')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
