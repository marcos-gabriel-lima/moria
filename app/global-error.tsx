'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ background: '#0A0A0A', color: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: '#C9A84C', fontWeight: 900, letterSpacing: 4, fontSize: 20, marginBottom: 8 }}>MORIA</p>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>O erro foi registrado automaticamente.</p>
          <button onClick={reset} style={{ padding: '10px 24px', background: '#C9A84C', color: '#0A0A0A', fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
