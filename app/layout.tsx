import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  // metadataBase resolve URLs relativas em OG/twitter/icons.
  // Sem isso, build em Vercel reclama e previews ficam quebrados.
  metadataBase: new URL(APP_URL),
  title: {
    default: 'MORIA Barbearia',
    template: '%s | MORIA',
  },
  description: 'Barbearia premium com planos de assinatura. Cortes e barbas ilimitados.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MORIA',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title:       'MORIA Barbearia',
    description: 'Barbearia premium com planos de assinatura. Cortes e barbas ilimitados.',
    type:        'website',
    locale:      'pt_BR',
    siteName:    'MORIA',
    images: [{
      url:    '/icons/icon-512.png',
      width:  512,
      height: 512,
      alt:    'MORIA Barbearia',
    }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'MORIA Barbearia',
    description: 'Barbearia premium com planos de assinatura. Cortes e barbas ilimitados.',
    images:      ['/icons/icon-512.png'],
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor:    '#0A0A0A',
  width:         'device-width',
  initialScale:  1,
  // NÃO usamos maximumScale=1 (era WCAG 1.4.4 violation — impedia zoom acessível).
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased bg-moria-black min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
