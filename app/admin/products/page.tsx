'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/status-badge'
import { formatINR, generateSKU } from '@/lib/format'
import { UNIT_DEFINITIONS, getCompatibleUnits } from '@/lib/units'
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  id: string; name: string; sku: string; description?: string; categoryId?: string
  baseUnit: string; basePricePerUnit: string; stockQuantity: string
  lowStockThreshold: string; isActive: boolean; category?: { id: string; name: string } | null
}
interface Category { id: string; name: string }

const BASE_UNITS = Object.keys(UNIT_DEFINITIONS)

function ProductFormDialog({
  open, onClose, onSaved, product, categories,
}: {
  open: boolean; onClose: () => void; onSaved: () => void
  product?: Product | null; categories: Category[]
}) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', sku: '', description: '', categoryId: '', baseUnit: 'g',
    basePricePerUnit: '', stockQuantity: '0', lowStockThreshold: '0', isActive: true,
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, sku: product.sku, description: product.description ?? '',
        categoryId: product.categoryId ?? '', baseUnit: product.baseUnit,
        basePricePerUnit: product.basePricePerUnit, stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold ?? '0', isActive: product.isActive,
      })
    } else {
      setForm({ name: '', sku: '', description: '', categoryId: '', baseUnit: 'g',
        basePricePerUnit: '', stockQuantity: '0', lowStockThreshold: '0', isActive: true })
    }
  }, [product, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          categoryId: form.categoryId || null,
          basePricePerUnit: parseFloat(form.basePricePerUnit),
          stockQuantity: parseFloat(form.stockQuantity),
          lowStockThreshold: parseFloat(form.lowStockThreshold),
        }),
      })
      if (res.ok) {
        toast.success(product ? 'Product updated' : 'Product created')
        onSaved(); onClose()
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Something went wrong')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl glass border-border/50">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <div className="flex gap-2">
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                <Button type="button" variant="outline" size="sm" className="shrink-0"
                  onClick={() => setForm({ ...form, sku: generateSKU(categories.find(c => c.id === form.categoryId)?.name) })}>
                  Gen
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Base Unit *</Label>
              <Select value={form.baseUnit} onValueChange={(v) => setForm({ ...form, baseUnit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BASE_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u} ({UNIT_DEFINITIONS[u].dimension})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Price / {form.baseUnit} (INR) *</Label>
              <Input type="number" step="0.00000001" min="0" value={form.basePricePerUnit}
                onChange={(e) => setForm({ ...form, basePricePerUnit: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Stock ({form.baseUnit}) *</Label>
              <Input type="number" step="0.00000001" min="0" value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Low Stock Threshold</Label>
              <Input type="number" step="0.00000001" min="0" value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Saving…' : product ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '15', includeInactive: 'true' })
    if (search) params.set('search', search)
    if (categoryFilter) params.set('categoryId', categoryFilter)
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/products?${params}`), fetch('/api/categories'),
    ])
    const [pData, cData] = await Promise.all([pRes.json(), cRes.json()])
    setProducts(pData.data ?? [])
    setTotalPages(pData.pagination?.totalPages ?? 1)
    setCategories(cData.data ?? [])
    setLoading(false)
  }, [page, search, categoryFilter])

  useEffect(() => { load() }, [load])

  // Debounced search
  useEffect(() => { setPage(1) }, [search, categoryFilter])

  async function toggleStatus(product: Product) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !product.isActive }),
    })
    if (res.ok) { toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`); load() }
    else toast.error('Failed to update status')
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Deactivate "${product.name}"?`)) return
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Product deactivated'); load() }
    else toast.error('Failed to deactivate product')
  }

  const isLowStock = (p: Product) =>
    parseFloat(p.stockQuantity) < parseFloat(p.lowStockThreshold)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">Manage your chemical inventory</p>
        </div>
        <Button onClick={() => { setEditProduct(null); setDialogOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or SKU…" className="pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              {['SKU', 'Name', 'Category', 'Unit', 'Price / unit', 'Stock', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/30">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-muted-foreground">
                No products found. <button className="text-primary underline" onClick={() => { setEditProduct(null); setDialogOpen(true) }}>Add one?</button>
              </td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-b border-border/30 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isLowStock(p) && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-xs">{p.baseUnit}</Badge></td>
                <td className="px-4 py-3 font-semibold">{formatINR(parseFloat(p.basePricePerUnit))}</td>
                <td className={`px-4 py-3 font-mono ${isLowStock(p) ? 'text-destructive' : ''}`}>
                  {parseFloat(p.stockQuantity).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.isActive ? 'confirmed' : 'cancelled'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="w-7 h-7"
                      onClick={() => { setEditProduct(p); setDialogOpen(true) }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary"
                      onClick={() => toggleStatus(p)}>
                      {p.isActive ? <ToggleRight className="w-4 h-4 text-chart-2" /> : <ToggleLeft className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteProduct(p)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ProductFormDialog
        open={dialogOpen} onClose={() => setDialogOpen(false)}
        onSaved={load} product={editProduct} categories={categories}
      />
    </div>
  )
}
