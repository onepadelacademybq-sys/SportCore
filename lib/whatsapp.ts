const WA_API_URL = 'https://graph.facebook.com/v20.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!

// ── Tipos ──────────────────────────────────────────────────────────────────

export type WaTextPayload = {
  to: string
  text: string
}

export type WaTemplateParam = { type: 'text'; text: string }

export type WaTemplatePayload = {
  to: string
  templateName: string
  languageCode?: string
  components?: Array<{
    type: 'body' | 'header' | 'button'
    parameters: WaTemplateParam[]
  }>
}

export type WaSendResult = {
  success: boolean
  messageId?: string
  error?: string
}

// ── Cliente base ───────────────────────────────────────────────────────────

async function waPost(body: object): Promise<WaSendResult> {
  try {
    const res = await fetch(`${WA_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.error?.message ?? 'Error desconocido' }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// Normaliza número colombiano → formato E.164 sin '+'
// Acepta: 3001234567, +573001234567, 573001234567
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length === 12) return digits
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
  return digits
}

// ── Mensajes de texto libre (ventana de 24h activa) ───────────────────────

export async function sendTextMessage({ to, text }: WaTextPayload): Promise<WaSendResult> {
  return waPost({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizePhone(to),
    type: 'text',
    text: { preview_url: false, body: text },
  })
}

// ── Mensajes de plantilla (fuera de ventana 24h) ──────────────────────────

export async function sendTemplate({
  to,
  templateName,
  languageCode = 'es',
  components = [],
}: WaTemplatePayload): Promise<WaSendResult> {
  return waPost({
    messaging_product: 'whatsapp',
    to: normalizePhone(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  })
}

// ── Plantillas predefinidas ────────────────────────────────────────────────

// Template "booking_confirmed" — debe estar aprobado en Meta Business
// Variables: {{1}} nombre, {{2}} fecha, {{3}} hora, {{4}} recurso (cama/cancha)
export function sendBookingConfirmed(
  phone: string,
  nombre: string,
  fecha: string,
  hora: string,
  recurso: string
) {
  return sendTemplate({
    to: phone,
    templateName: 'booking_confirmed',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: nombre },
        { type: 'text', text: fecha },
        { type: 'text', text: hora },
        { type: 'text', text: recurso },
      ],
    }],
  })
}

// Template "class_reminder" — recordatorio 2h antes
// Variables: {{1}} nombre, {{2}} hora, {{3}} nombre academia
export function sendClassReminder(
  phone: string,
  nombre: string,
  hora: string,
  academia: string
) {
  return sendTemplate({
    to: phone,
    templateName: 'class_reminder',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: nombre },
        { type: 'text', text: hora },
        { type: 'text', text: academia },
      ],
    }],
  })
}

// Template "payment_due" — vencimiento de membresía
// Variables: {{1}} nombre, {{2}} fecha vencimiento, {{3}} monto, {{4}} link de pago
export function sendPaymentDue(
  phone: string,
  nombre: string,
  fechaVencimiento: string,
  monto: string,
  linkPago: string
) {
  return sendTemplate({
    to: phone,
    templateName: 'payment_due',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: nombre },
        { type: 'text', text: fechaVencimiento },
        { type: 'text', text: monto },
        { type: 'text', text: linkPago },
      ],
    }],
  })
}

// Template "retention_alert" — estudiante inactivo
// Variables: {{1}} nombre, {{2}} días sin asistir, {{3}} link de reserva
export function sendRetentionAlert(
  phone: string,
  nombre: string,
  diasInactivo: number,
  linkReserva: string
) {
  return sendTemplate({
    to: phone,
    templateName: 'retention_alert',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: nombre },
        { type: 'text', text: String(diasInactivo) },
        { type: 'text', text: linkReserva },
      ],
    }],
  })
}

// Template "welcome_member" — bienvenida a nuevo estudiante
// Variables: {{1}} nombre, {{2}} nombre academia, {{3}} link app
export function sendWelcome(
  phone: string,
  nombre: string,
  academia: string,
  linkApp: string
) {
  return sendTemplate({
    to: phone,
    templateName: 'welcome_member',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: nombre },
        { type: 'text', text: academia },
        { type: 'text', text: linkApp },
      ],
    }],
  })
}

// ── Verificación del webhook (Meta requiere GET con challenge) ─────────────

export function verifyWebhookToken(token: string): boolean {
  return token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
}
