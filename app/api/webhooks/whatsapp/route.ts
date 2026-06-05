import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookToken } from '@/lib/whatsapp'
import { logIncomingWhatsApp } from '@/actions/crm'

// ── GET — Verificación del webhook por Meta ────────────────────────────────
// Meta llama a este endpoint con hub.challenge al registrar el webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token && verifyWebhookToken(token)) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// ── POST — Recepción de mensajes y actualizaciones de estado ──────────────
export async function POST(req: NextRequest) {
  let body: WaWebhookPayload

  try {
    body = await req.json()
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Meta siempre envía object = 'whatsapp_business_account'
  if (body.object !== 'whatsapp_business_account') {
    return new NextResponse('OK', { status: 200 })
  }

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value

      // Mensajes entrantes
      for (const message of value.messages ?? []) {
        const from    = message.from       // número del remitente
        const waId    = message.id
        const text    = message.type === 'text' ? message.text?.body : `[${message.type}]`
        const contact = value.contacts?.[0]?.profile?.name ?? from

        // Registra en la tabla interactions de forma asíncrona (no bloquea la respuesta)
        logIncomingWhatsApp({ from, waId, text: text ?? '', contactName: contact }).catch(
          (err) => console.error('[WA webhook] logIncomingWhatsApp error:', err)
        )
      }

      // Actualizaciones de estado (sent, delivered, read, failed)
      for (const status of value.statuses ?? []) {
        // En una iteración futura se puede actualizar WaMessageStatus en Interaction
        console.log(`[WA] Status update: ${status.id} → ${status.status}`)
      }
    }
  }

  // Meta requiere siempre 200 OK o reintenta indefinidamente
  return new NextResponse('OK', { status: 200 })
}

// ── Tipos internos del payload de Meta ────────────────────────────────────

type WaWebhookPayload = {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: { display_phone_number: string; phone_number_id: string }
        contacts?: Array<{ profile: { name: string }; wa_id: string }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: { body: string }
        }>
        statuses?: Array<{
          id: string
          status: string
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}
