'use client'

import Link from 'next/link'
import { Scissors } from 'lucide-react'

interface FloatingCTAProps {
  whatsappHref: string
}

export function FloatingCTA({ whatsappHref }: FloatingCTAProps) {
  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">

      {/* WhatsApp */}
      <div className="relative pointer-events-auto">
        {/* Ping ring — contido dentro, não vaza para fora */}
        <span className="absolute inset-0 rounded-full bg-green-500/40 animate-ping" style={{ animationDuration: '2s' }} />
        <Link
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          className="relative flex items-center gap-2.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold rounded-full transition-all duration-200"
          style={{ boxShadow: '0 0 24px rgba(34,197,94,0.65), 0 4px 20px rgba(0,0,0,0.5)' }}
        >
          {/* Mobile: só ícone */}
          <span className="flex sm:hidden items-center justify-center w-14 h-14">
            <WhatsAppIcon className="w-6 h-6 fill-white" />
          </span>
          {/* Desktop: pill com label */}
          <span className="hidden sm:flex items-center gap-2.5 px-5 py-3.5">
            <WhatsAppIcon className="w-5 h-5 fill-white shrink-0" />
            <span className="text-sm whitespace-nowrap">Falar no WhatsApp</span>
          </span>
        </Link>
      </div>

      {/* Agendar */}
      <div className="relative pointer-events-auto">
        {/* Ping ring dourado */}
        <span className="absolute inset-0 rounded-full bg-gold-DEFAULT/40 animate-ping" style={{ animationDuration: '2.5s' }} />
        {/* Glow blur estático */}
        <div className="absolute inset-0 rounded-full bg-gold-DEFAULT/20 blur-xl scale-110" />
        <Link
          href="/appointments/new"
          aria-label="Agendar horário"
          className="relative flex items-center gap-2.5 font-black text-black rounded-full transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #F0D060 0%, #C9A84C 55%, #A8893D 100%)',
            boxShadow: '0 0 32px rgba(201,168,76,0.85), 0 0 64px rgba(201,168,76,0.3), 0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          {/* Mobile: só ícone */}
          <span className="flex sm:hidden items-center justify-center w-14 h-14">
            <Scissors className="w-6 h-6" />
          </span>
          {/* Desktop: pill com label */}
          <span className="hidden sm:flex items-center gap-2.5 px-6 py-4">
            <Scissors className="w-5 h-5 shrink-0" />
            <span className="text-sm whitespace-nowrap">Agendar Agora</span>
          </span>
        </Link>
      </div>

    </div>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.77 1.8 6.77L2 30l7.45-1.77A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5c-2.22 0-4.3-.6-6.1-1.65l-.43-.26-4.42 1.05 1.08-4.3-.28-.45A11.45 11.45 0 014.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.29-8.56c-.34-.17-2.02-1-2.34-1.1-.32-.12-.55-.17-.78.17-.23.34-.9 1.1-1.1 1.33-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.74-1.69-1.01-.9-1.7-2.02-1.9-2.36-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.58-.28-.68-.57-.58-.78-.59h-.66c-.23 0-.6.09-.91.43-.32.34-1.21 1.18-1.21 2.88s1.24 3.34 1.41 3.57c.17.23 2.44 3.72 5.91 5.22.83.36 1.47.57 1.97.73.83.26 1.58.23 2.18.14.66-.1 2.02-.83 2.31-1.62.29-.8.29-1.48.2-1.62-.09-.14-.32-.23-.66-.4z"/>
    </svg>
  )
}
