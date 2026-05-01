'use client'

import { useTransition } from 'react'
import { toggleBarberActive } from '@/actions/admin'
import { ToggleSwitch } from './toggle-switch'

interface BarberToggleProps {
  barberId: string
  isActive: boolean
}

export function BarberToggle({ barberId, isActive }: BarberToggleProps) {
  return (
    <ToggleSwitch
      checked={isActive}
      onToggle={async (v) => {
        await toggleBarberActive(barberId, v)
        window.location.reload()
      }}
      size="sm"
    />
  )
}
