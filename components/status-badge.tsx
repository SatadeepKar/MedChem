import { cn } from '@/lib/utils'
import { STATUS_COLORS, capitalize } from '@/lib/format'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
        className
      )}
    >
      {capitalize(status)}
    </span>
  )
}
