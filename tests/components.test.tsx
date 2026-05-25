import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Crown, Calendar } from 'lucide-react'
import { SubscriberBadge } from '@/components/shared/subscriber-badge'
import { StatsCard } from '@/components/admin/stats-card'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { Logo } from '@/components/shared/logo'

describe('<SubscriberBadge />', () => {
  it('renderiza texto padrão "Assinante" quando planName não é passado', () => {
    render(<SubscriberBadge />)
    expect(screen.getByText('Assinante')).toBeInTheDocument()
  })

  it('renderiza o nome do plano quando passado', () => {
    render(<SubscriberBadge planName="Corte Ilimitado" />)
    expect(screen.getByText('Corte Ilimitado')).toBeInTheDocument()
    expect(screen.queryByText('Assinante')).not.toBeInTheDocument()
  })

  it('aplica classe sm para tamanho pequeno', () => {
    const { container } = render(<SubscriberBadge size="sm" />)
    expect(container.firstChild).toHaveClass('text-[10px]')
  })

  it('aceita className customizada', () => {
    const { container } = render(<SubscriberBadge className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('<StatsCard />', () => {
  it('renderiza label, value e ícone', () => {
    render(
      <StatsCard
        label="Receita do Mês"
        value="R$ 5.000,00"
        icon={Crown}
      />
    )
    expect(screen.getByText('Receita do Mês')).toBeInTheDocument()
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument()
  })

  it('renderiza valor numérico', () => {
    render(<StatsCard label="Assinaturas" value={42} icon={Crown} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renderiza subtexto quando passado', () => {
    render(
      <StatsCard
        label="Receita"
        value="R$ 1000"
        icon={Crown}
        sub="vs mês anterior"
      />
    )
    expect(screen.getByText('vs mês anterior')).toBeInTheDocument()
  })

  it('mostra trend positivo com sinal "+"', () => {
    render(
      <StatsCard
        label="Receita"
        value="R$ 1000"
        icon={Crown}
        trend={{ value: 15, label: 'este mês' }}
      />
    )
    expect(screen.getByText(/\+15% este mês/)).toBeInTheDocument()
  })

  it('mostra trend negativo sem sinal extra', () => {
    render(
      <StatsCard
        label="Receita"
        value="R$ 800"
        icon={Crown}
        trend={{ value: -5, label: 'este mês' }}
      />
    )
    expect(screen.getByText(/-5% este mês/)).toBeInTheDocument()
  })
})

describe('<WhatsAppButton />', () => {
  it('gera link WhatsApp com prefixo 55', () => {
    render(<WhatsAppButton phone="11999998888" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://wa.me/5511999998888')
  })

  it('abre em nova aba (target=_blank) com rel=noopener', () => {
    render(<WhatsAppButton phone="11999998888" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('inclui mensagem URL-encoded no href quando fornecida', () => {
    render(<WhatsAppButton phone="11999998888" message="Olá MORIA" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toContain(encodeURIComponent('Olá MORIA'))
  })

  it('renderiza label customizado', () => {
    render(<WhatsAppButton phone="11999998888" label="Falar com a gente" />)
    expect(screen.getByText('Falar com a gente')).toBeInTheDocument()
  })

  it('variant="icon" não renderiza label visível', () => {
    render(<WhatsAppButton phone="11999998888" label="WhatsApp" variant="icon" />)
    expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
    // mas o title fica acessível
    expect(screen.getByTitle(/WhatsApp: 11999998888/)).toBeInTheDocument()
  })

  it('limpa caracteres não numéricos do telefone', () => {
    render(<WhatsAppButton phone="(11) 99999-8888" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://wa.me/5511999998888')
  })
})

describe('<Logo />', () => {
  it('renderiza o texto MORIA', () => {
    render(<Logo />)
    expect(screen.getByText(/MORIA/i)).toBeInTheDocument()
  })
})
