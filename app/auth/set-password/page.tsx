import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { Logo } from '@/components/shared/logo'
import { SetPasswordForm } from '@/components/auth/set-password-form'

export const metadata = { title: 'Definir senha — MORIA' }

export default async function SetPasswordPage() {
  // O usuário só chega aqui via fluxo de recovery (/auth/callback troca code
  // por sessão antes). Sem sessão = manda pro login.
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-moria-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center"><Logo /></div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">Defina sua senha</h1>
          <p className="text-sm text-muted-foreground">
            Crie uma senha segura para acessar o sistema.
          </p>
        </div>
        <SetPasswordForm />
      </div>
    </div>
  )
}
