import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── users ───────────────────────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('seller'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [check('role_check', sql`${table.role} IN ('admin','seller')`)]
)

// ─── categories ──────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  description: text('description'),
})

// ─── products ────────────────────────────────────────────────────────────────
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sku: text('sku').unique().notNull(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id),
  baseUnit: text('base_unit').notNull(),
  basePricePerUnit: numeric('base_price_per_unit', { precision: 20, scale: 8 }).notNull(),
  stockQuantity: numeric('stock_quantity', { precision: 20, scale: 8 }).notNull().default('0'),
  lowStockThreshold: numeric('low_stock_threshold', { precision: 20, scale: 8 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ─── orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').unique().notNull(),
    userId: uuid('user_id').references(() => users.id),
    status: text('status').notNull().default('pending'),
    notes: text('notes'),
    totalAmount: numeric('total_amount', { precision: 20, scale: 8 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      'status_check',
      sql`${table.status} IN ('draft','pending','confirmed','fulfilled','cancelled')`
    ),
  ]
)

// ─── order_items ─────────────────────────────────────────────────────────────
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: uuid('product_id').references(() => products.id),
  orderedUnit: text('ordered_unit').notNull(),
  orderedQuantity: numeric('ordered_quantity', { precision: 20, scale: 8 }),
  baseQuantity: numeric('base_quantity', { precision: 20, scale: 8 }),
  unitPriceAtOrder: numeric('unit_price_at_order', { precision: 20, scale: 8 }),
  lineTotal: numeric('line_total', { precision: 20, scale: 8 }),
})

// ─── TypeScript types ────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
