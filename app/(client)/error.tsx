'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div className="space-y-1">
        <p className="font-bold">Algo deu errado</p>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
      </div>
      <button
        onClick={reset}
        className="bg-gold-gradient text-black font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
      >
        Tentar novamente
      </button>
    </div>
  )
}
