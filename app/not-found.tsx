import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-moria-black flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <Logo className="mx-auto" />
        <div className="space-y-2">
          <p className="text-6xl font-black text-moria-border">404</p>
          <p className="text-xl font-bold">Página não encontrada</p>
          <p className="text-sm text-muted-foreground">Esta página não existe ou foi removida.</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gold-gradient text-black font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
