'use client'

import { useRouter } from 'next/navigation'
import { toggleBarberActive } from '@/actions/admin'
import { ToggleSwitch } from './toggle-switch'

interface BarberToggleProps {
  barberId: string
  isActive: boolean
}

export function BarberToggle({ barberId, isActive }: BarberToggleProps) {
  const router = useRouter()
  return (
    <ToggleSwitch
      checked={isActive}
      onToggle={async (v) => {
        await toggleBarberActive(barberId, v)
        router.refresh()
      }}
      size="sm"
    />
  )
}
