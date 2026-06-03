'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="p-5 rounded-3xl bg-destructive/10 border border-destructive/20">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">{error.message ?? 'An unexpected error occurred'}</p>
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  )
}
