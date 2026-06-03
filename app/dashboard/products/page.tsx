'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input as NumberInput } from '@/components/ui/input'
import { useCartStore } from '@/lib/cart-store'
import { getCompatibleUnits, priceInUnit, UNIT_DEFINITIONS } from '@/lib/units'
import { formatINR } from '@/lib/format'
import { Search, ShoppingCart, AlertTriangle, Package } from 'lucide-react'

interface Product {
  id: string; name: string; sku: string; description?: string
  baseUnit: string; basePricePerUnit: string; stockQuantity: string
  lowStockThreshold: string; isActive: boolean
  category?: { id: string; name: string } | null
}
interface Category { id: string; name: string }

function AddToCartDialog({
  product, open, onClose,
}: { product: Product | null; open: boolean; onClose: () => void }) {
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('')

  useEffect(() => {
    if (product) { setUnit(product.baseUnit); setQty('1') }
  }, [product])

  if (!product) return null
  const compatUnits = getCompatibleUnits(product.baseUnit)
  const displayUnit = unit || product.baseUnit
  const pricePerDisplayUnit = priceInUnit(parseFloat(product.basePricePerUnit), displayUnit)
  const quantity = parseFloat(qty) || 0
  const estimatedTotal = pricePerDisplayUnit * quantity

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      baseUnit: product.baseUnit,
      basePricePerUnit: parseFloat(product.basePricePerUnit),
      orderedUnit: displayUnit,
      orderedQuantity: quantity,
    })
    toast.success(`${product.name} added to cart`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-border/50 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Add to Cart</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="font-semibold">{product.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
          </div>

          {/* Price preview */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-sm space-y-1">
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Price preview</p>
            <p className="font-semibold">
              {quantity} {displayUnit} × {formatINR(pricePerDisplayUnit)}/{displayUnit} ={' '}
              <span className="text-primary">{formatINR(estimatedTotal)}</span>
            </p>
            {displayUnit !== product.baseUnit && (
              <p className="text-xs text-muted-foreground">
                (Base: {formatINR(parseFloat(product.basePricePerUnit))}/{product.baseUnit})
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantity *</Label>
              <Input
                id="qty-input"
                type="number" min="0.001" step="any" value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={displayUnit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {compatUnits.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={quantity <= 0} className="gap-2">
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const compatUnits = getCompatibleUnits(product.baseUnit)
  const basePrice = parseFloat(product.basePricePerUnit)
  const isLowStock = parseFloat(product.stockQuantity) < parseFloat(product.lowStockThreshold)

  // Primary display unit (e.g., kg for g-base products)
  const displayUnit = compatUnits.find((u) => u !== product.baseUnit && UNIT_DEFINITIONS[u]?.factor > 1) ?? product.baseUnit
  const displayPrice = priceInUnit(basePrice, displayUnit)

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/30 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{product.name}</p>
            {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.sku}</p>
          {product.category && (
            <Badge variant="outline" className="mt-2 text-xs">{product.category.name}</Badge>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Package className="w-4 h-4 text-primary" />
        </div>
      </div>

      {product.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
      )}

      {/* Units available */}
      <div className="flex flex-wrap gap-1">
        {compatUnits.map((u) => (
          <span key={u} className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border/50 font-mono">{u}</span>
        ))}
      </div>

      {/* Pricing */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Per {product.baseUnit}</span>
          <span className="font-semibold">{formatINR(basePrice)}</span>
        </div>
        {displayUnit !== product.baseUnit && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Per {displayUnit}</span>
            <span className="font-semibold text-primary">{formatINR(displayPrice)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Stock</span>
          <span className={isLowStock ? 'text-amber-400' : ''}>
            {parseFloat(product.stockQuantity).toFixed(2)} {product.baseUnit}
          </span>
        </div>
      </div>

      <Button
        className="w-full gap-2 mt-auto"
        onClick={() => onAddToCart(product)}
        id={`add-to-cart-${product.id}`}
      >
        <ShoppingCart className="w-4 h-4" /> Add to Cart
      </Button>
    </div>
  )
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const cartCount = useCartStore((s) => s.items.length)

  // Debounce search 300ms
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (activeCategory) params.set('categoryId', activeCategory)
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/products?${params}`), fetch('/api/categories'),
    ])
    const [pData, cData] = await Promise.all([pRes.json(), cRes.json()])
    setProducts(pData.data ?? [])
    setCategories(cData.data ?? [])
    setLoading(false)
  }, [debouncedSearch, activeCategory])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Catalogue</h1>
          <p className="text-muted-foreground text-sm">Browse and add products to your cart</p>
        </div>
        <a href="/dashboard/cart">
          <Button variant="outline" className="gap-2">
            <ShoppingCart className="w-4 h-4" /> Cart
            {cartCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </a>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="product-search"
          placeholder="Search by name, SKU, or description…"
          className="pl-9 max-w-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            !activeCategory ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(activeCategory === c.id ? '' : c.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeCategory === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={setSelectedProduct} />
          ))}
        </div>
      )}

      <AddToCartDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
