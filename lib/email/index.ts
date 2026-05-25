import 'server-only'
import { Resend } from 'resend'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

let _resend: Resend | null = null
function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? 'MORIA Barbearia <noreply@moriabarbearia.com.br>'

function base(title: string, body: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head><body style="margin:0;padding:0;background:#0A0A0A;font-family:'Segoe UI',Arial,sans-serif;color:#E5E5E5">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:32px auto;background:#111111;border-radius:12px;border:1px solid #2A2A2A;overflow:hidden">
    <tr><td style="background:#111111;padding:28px 32px;border-bottom:1px solid #2A2A2A;text-align:center">
      <span style="font-size:22px;font-weight:900;letter-spacing:4px;color:#C9A84C">MORIA</span>
      <span style="display:block;font-size:10px;letter-spacing:3px;color:#8B0000;margin-top:2px;text-transform:uppercase">Barbearia</span>
    </td></tr>
    <tr><td style="padding:32px">${body}</td></tr>
    <tr><td style="padding:16px 32px;border-top:1px solid #2A2A2A;text-align:center">
      <p style="margin:0;font-size:11px;color:#555">© ${new Date().getFullYear()} MORIA Barbearia · Todos os direitos reservados</p>
    </td></tr>
  </table>
</body></html>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#E5E5E5">${text}</h1>`
}
function gold(text: string) {
  return `<span style="color:#C9A84C;font-weight:600">${text}</span>`
}
function pill(text: string) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:#C9A84C22;border:1px solid #C9A84C55;color:#C9A84C;font-size:13px;font-weight:600">${text}</span>`
}
function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:13px 28px;background:#C9A84C;color:#0A0A0A;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none">${label}</a>`
}
function row(label: string, value: string) {
  return `<tr><td style="padding:10px 0;color:#888;font-size:13px;border-bottom:1px solid #222">${label}</td><td style="padding:10px 0;text-align:right;font-weight:600;font-size:13px;border-bottom:1px solid #222">${value}</td></tr>`
}

// ─── Templates ──────────────────────────────────────────────────────────────

type AppointmentEmailParams = {
  to:          string
  clientName:  string
  barberName:  string
  serviceName: string
  scheduledAt: Date
  totalPrice:  number
  appUrl:      string
}

export async function sendAppointmentConfirmedEmail(p: AppointmentEmailParams) {
  const dateStr = format(p.scheduledAt, "EEEE',' dd 'de' MMMM 'às' HH:mm", { locale: ptBR })

  const body = `
    ${h1('Agendamento confirmado!')}
    <p style="margin:0 0 24px;color:#999;font-size:14px">Olá, ${gold(p.clientName)}! Seu horário está reservado.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
      ${row('Serviço',  p.serviceName)}
      ${row('Barbeiro', p.barberName)}
      ${row('Data',     dateStr)}
      ${row('Valor',    p.totalPrice === 0 ? 'Coberto pelo plano' : `R$ ${p.totalPrice.toFixed(2).replace('.', ',')}`)}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#666">Precisa cancelar? Acesse o app com até 2h de antecedência.</p>
    ${btn(p.appUrl + '/appointments', 'Ver meus agendamentos')}
  `
  return getResend()?.emails.send({ from: FROM, to: p.to, subject: '✂️ Agendamento confirmado — MORIA', html: base('Agendamento confirmado', body) })
}

// ─── Reminder 24h ────────────────────────────────────────────────────────────

type ReminderEmailParams = {
  to:          string
  clientName:  string
  barberName:  string
  serviceName: string
  scheduledAt: Date
  appUrl:      string
}

export async function sendAppointmentReminderEmail(p: ReminderEmailParams) {
  const dateStr = format(p.scheduledAt, "EEEE',' dd 'de' MMMM 'às' HH:mm", { locale: ptBR })

  const body = `
    ${h1('Lembrete: seu horário é amanhã!')}
    <p style="margin:0 0 24px;color:#999;font-size:14px">Olá, ${gold(p.clientName)}! Só passando para lembrar do seu agendamento.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
      ${row('Serviço',  p.serviceName)}
      ${row('Barbeiro', p.barberName)}
      ${row('Data',     dateStr)}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#666">Nos vemos em breve! Qualquer dúvida, fale pelo WhatsApp.</p>
    ${btn(p.appUrl + '/appointments', 'Ver meu agendamento')}
  `
  return getResend()?.emails.send({ from: FROM, to: p.to, subject: '🔔 Lembrete: seu horário é amanhã — MORIA', html: base('Lembrete de agendamento', body) })
}

// ─── Boas-vindas ao barbeiro (definir senha) ─────────────────────────────────

type BarberWelcomeParams = {
  to:              string
  name:            string
  setPasswordLink: string
}

export async function sendBarberWelcomeEmail(p: BarberWelcomeParams) {
  const body = `
    ${h1('Bem-vindo à MORIA!')}
    <p style="margin:0 0 12px;color:#999;font-size:14px">Olá, ${gold(p.name)}!</p>
    <p style="margin:0 0 24px;color:#999;font-size:14px">Você foi adicionado(a) como barbeiro no sistema MORIA. Para acessar sua conta pela primeira vez, defina sua senha clicando abaixo:</p>
    <div style="text-align:center">${btn(p.setPasswordLink, 'Definir minha senha')}</div>
    <p style="margin:24px 0 0;font-size:12px;color:#666;text-align:center">Este link expira em 1 hora. Se expirar, peça à administração para reenviar.</p>
  `
  return getResend()?.emails.send({
    from:    FROM,
    to:      p.to,
    subject: '🪒 Bem-vindo à MORIA — defina sua senha',
    html:    base('Bem-vindo à MORIA', body),
  })
}

// ─── Subscription active ─────────────────────────────────────────────────────

type SubscriptionActiveParams = {
  to:         string
  clientName: string
  planName:   string
  expiresAt:  Date
}

export async function sendSubscriptionActiveEmail(p: SubscriptionActiveParams) {
  const expStr = format(p.expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const body = `
    ${h1('Assinatura ativada!')}
    <p style="margin:0 0 24px;color:#999;font-size:14px">Olá, ${gold(p.clientName)}! Sua assinatura foi confirmada com sucesso.</p>
    <div style="text-align:center;margin:24px 0">${pill(p.planName)}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
      ${row('Plano',    p.planName)}
      ${row('Status',   '✅ Ativo')}
      ${row('Validade', expStr)}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#666">Aproveite seus benefícios! Use o QR Code no app para validar seus serviços.</p>
    ${btn(appUrl + '/wallet', 'Ver minha carteira')}
  `
  return getResend()?.emails.send({ from: FROM, to: p.to, subject: '👑 Assinatura ativada — MORIA', html: base('Assinatura ativada', body) })
}
