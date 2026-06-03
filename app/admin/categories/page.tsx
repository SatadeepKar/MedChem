'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'

interface Category { id: string; name: string; description?: string | null }

function CategoryDialog({
  open, onClose, onSaved, category,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; category?: Category | null
}) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    setName(category?.name ?? '')
    setDescription(category?.description ?? '')
  }, [category, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const url = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (res.ok) { toast.success(category ? 'Category updated' : 'Category created'); onSaved(); onClose() }
      else { const err = await res.json(); toast.error(err.error ?? 'Error') }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-border/50">
        <DialogHeader><DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Saving…' : category ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"? Products in this category will become uncategorized.`)) return
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Category deleted'); load() }
    else { const err = await res.json(); toast.error(err.error ?? 'Error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm">Organize products into categories</p>
        </div>
        <Button onClick={() => { setEditCat(null); setDialogOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            No categories yet.{' '}
            <button className="text-primary underline" onClick={() => { setEditCat(null); setDialogOpen(true) }}>
              Create one?
            </button>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="glass rounded-2xl p-5 hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    {cat.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="w-7 h-7"
                    onClick={() => { setEditCat(cat); setDialogOpen(true) }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive"
                    onClick={() => handleDelete(cat)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CategoryDialog
        open={dialogOpen} onClose={() => setDialogOpen(false)}
        onSaved={load} category={editCat}
      />
    </div>
  )
}
