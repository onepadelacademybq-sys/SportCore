import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'SportCore <noreply@sportcore.app>'
const APP    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportcore.app'

// ── Helper base ────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) console.error('[Email] Resend error:', error)
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="font-family:sans-serif;background:#f4f4f5;padding:32px 0;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7">
    <div style="background:#0d5c63;padding:24px 32px">
      <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px">SportCore</p>
      <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase">Plataforma de Gestión Deportiva</p>
    </div>
    <div style="padding:32px">${body}</div>
    <div style="padding:16px 32px;background:#f9f9fb;border-top:1px solid #e4e4e7">
      <p style="margin:0;font-size:11px;color:#71717a;text-align:center">
        SportCore · ${APP} · Este correo es automático, no responder.
      </p>
    </div>
  </div>
</body></html>`
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#0d5c63;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">${text}</a>`
}

// ── Emails de suscripción SaaS ─────────────────────────────────────────────

export function sendSubscriptionActivated(to: string, name: string, plan: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px">¡Bienvenido a SportCore, ${name}! 🎉</h2>
    <p style="color:#52525b;line-height:1.6">Tu suscripción al plan <strong>${plan.toUpperCase()}</strong> está activa. Ya puedes acceder a todas las funcionalidades de tu academia.</p>
    ${btn('Ir a mi academia →', APP)}
    <p style="margin-top:24px;font-size:12px;color:#71717a">¿Tienes preguntas? Escríbenos por WhatsApp o al correo de soporte.</p>`
  return send(to, '¡Tu suscripción a SportCore está activa!', layout('Bienvenido a SportCore', body))
}

export function sendPaymentFailed(to: string, name: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#dc2626">Problema con tu pago, ${name}</h2>
    <p style="color:#52525b;line-height:1.6">No pudimos procesar el pago de tu suscripción. Tu cuenta ha sido suspendida temporalmente.</p>
    <p style="color:#52525b;line-height:1.6">Por favor actualiza tu método de pago para reactivar el servicio.</p>
    ${btn('Actualizar método de pago →', `${APP}/admin/billing`)}
    <p style="margin-top:24px;font-size:12px;color:#71717a">Si crees que es un error, contáctanos.</p>`
  return send(to, '⚠️ Problema con tu pago — SportCore', layout('Pago fallido', body))
}

export function sendTrialEnding(to: string, name: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px">Tu período de prueba termina en 3 días</h2>
    <p style="color:#52525b;line-height:1.6">Hola ${name}, tu prueba gratuita de SportCore termina pronto. Para continuar sin interrupciones, activa tu suscripción ahora.</p>
    ${btn('Activar suscripción →', `${APP}/admin/billing`)}
    <p style="margin-top:24px;font-size:12px;color:#71717a">Plan Starter desde $430.000 COP/mes.</p>`
  return send(to, '⏰ Tu prueba de SportCore termina en 3 días', layout('Prueba terminando', body))
}

// ── Emails transaccionales (para estudiantes/miembros) ─────────────────────

export function sendBookingConfirmedEmail(to: string, name: string, fecha: string, hora: string, recurso: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px">¡Reserva confirmada! ✅</h2>
    <p style="color:#52525b;line-height:1.6">Hola ${name}, tu reserva ha sido confirmada:</p>
    <div style="background:#f0f9fa;border:1px solid #d0e8ea;border-radius:8px;padding:16px;margin:16px 0">
      <p style="margin:0;font-size:14px"><strong>Fecha:</strong> ${fecha}</p>
      <p style="margin:8px 0 0;font-size:14px"><strong>Hora:</strong> ${hora}</p>
      <p style="margin:8px 0 0;font-size:14px"><strong>Espacio:</strong> ${recurso}</p>
    </div>
    <p style="color:#52525b;font-size:13px">Recuerda llegar 5 minutos antes. ¡Te esperamos!</p>`
  return send(to, '✅ Reserva confirmada — SportCore', layout('Reserva confirmada', body))
}

export function sendClassReminderEmail(to: string, name: string, hora: string, academia: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px">⏰ Recordatorio de clase</h2>
    <p style="color:#52525b;line-height:1.6">Hola ${name}, tienes una clase hoy a las <strong>${hora}</strong> en ${academia}.</p>
    <p style="color:#52525b;font-size:13px">¡No olvides llevar ropa cómoda y agua!</p>`
  return send(to, `⏰ Tienes clase hoy a las ${hora}`, layout('Recordatorio de clase', body))
}

export function sendPaymentDueEmail(to: string, name: string, fechaVencimiento: string, monto: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px">💳 Tu membresía vence pronto</h2>
    <p style="color:#52525b;line-height:1.6">Hola ${name}, tu membresía vence el <strong>${fechaVencimiento}</strong>.</p>
    <p style="color:#52525b;line-height:1.6">Monto a pagar: <strong>${monto}</strong></p>
    ${btn('Renovar membresía →', `${APP}/player/bookings`)}
    <p style="margin-top:16px;font-size:12px;color:#71717a">Si ya realizaste el pago, ignora este mensaje.</p>`
  return send(to, '💳 Tu membresía vence pronto', layout('Vencimiento de membresía', body))
}

export function sendWelcomeEmail(to: string, name: string, academia: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px">¡Bienvenido/a a ${academia}! 🎉</h2>
    <p style="color:#52525b;line-height:1.6">Hola ${name}, tu cuenta está lista. Ya puedes reservar clases, ver tu progreso y gestionar tu membresía.</p>
    ${btn('Acceder a mi cuenta →', APP)}
    <p style="margin-top:24px;font-size:12px;color:#71717a">¿Necesitas ayuda? Contáctanos por WhatsApp.</p>`
  return send(to, `¡Bienvenido/a a ${academia}!`, layout('Bienvenida', body))
}

export function sendRetentionEmail(to: string, name: string, diasInactivo: number) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px">¡Te extrañamos, ${name}! 🤸</h2>
    <p style="color:#52525b;line-height:1.6">Hace <strong>${diasInactivo} días</strong> que no te vemos en clase. ¿Todo bien?</p>
    <p style="color:#52525b;line-height:1.6">Tenemos disponibilidad esta semana. ¡Reserva ahora y retoma tu ritmo!</p>
    ${btn('Ver horarios disponibles →', `${APP}/player/bookings`)}  `
  return send(to, '¡Te extrañamos en clase! Vuelve pronto 🤸', layout('Te extrañamos', body))
}
