import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  baseUnit: z.enum(['g', 'kg', 'mg', 'mL', 'L', 'µL', 'unit', 'dozen', 'pack']),
  basePricePerUnit: z.number().positive('Price must be greater than 0'),
  stockQuantity: z.number().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
})

export const updateProductSchema = createProductSchema.partial()

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export const createOrderSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending']).default('pending'),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      orderedUnit: z.string(),
      orderedQuantity: z.number().positive(),
    })
  ).min(1, 'Order must have at least one item'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'confirmed', 'fulfilled', 'cancelled']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
