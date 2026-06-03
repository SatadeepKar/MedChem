/**
 * Formatting & helper utilities for AASA MedChem
 */

/** Indian currency formatter — ₹1,23,456.78 */
export function formatINR(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  if (isNaN(num)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/** Format a date as "DD MMM YYYY" */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

/** Generate a SKU suggestion: CAT-YYYYMMDD-XXXX */
export function generateSKU(categoryName?: string): string {
  const prefix = categoryName
    ? categoryName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    : 'GEN'
  const date = new Date()
  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${dateStr}-${rand}`
}

/** Status badge color mapping */
export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  fulfilled: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Truncate long text */
export function truncate(str: string, maxLen = 40): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
