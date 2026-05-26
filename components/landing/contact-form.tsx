'use client'

import { useActionState } from 'react'
import { sendContactMessage } from '@/actions/contact'
import { Send } from 'lucide-react'

const INIT = { error: null }

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, INIT)

  if (state.success) {
    return (
      <div className="rounded-2xl border border-[#00C4CC]/30 bg-[#00C4CC]/5 p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-[#00C4CC]/10 flex items-center justify-center mx-auto">
          <Send className="h-6 w-6 text-[#00C4CC]" />
        </div>
        <h3 className="font-heading text-xl font-semibold">¡Mensaje enviado!</h3>
        <p className="text-muted-foreground text-sm">{state.success}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-4 py-2.5">
          {state.error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Nombre *</label>
          <input
            name="name"
            required
            placeholder="Tu nombre completo"
            className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#00C4CC]/50 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Email *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#00C4CC]/50 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">Teléfono / WhatsApp</label>
        <input
          name="phone"
          type="tel"
          placeholder="+57 300 000 0000"
          className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#00C4CC]/50 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">Mensaje *</label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="¿En qué podemos ayudarte? Cuéntanos tu nivel, disponibilidad o cualquier pregunta…"
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#00C4CC]/50 transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-[#00C4CC] text-black text-sm font-semibold hover:bg-[#00b3ba] transition-colors disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {pending ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
