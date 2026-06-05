'use client'

import { useState, useTransition } from 'react'
import { X, Send, MessageCircle } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { sendWhatsAppToProfile, sendWhatsAppToLead } from '@/actions/crm'

const QUICK_MESSAGES = [
  '¡Hola! Te escribimos desde la academia 👋 ¿Tienes alguna pregunta sobre nuestras clases?',
  '🔔 Recuerda que tienes una clase programada. ¡Te esperamos!',
  '💳 Tu membresía está próxima a vencer. ¿Te ayudamos a renovarla?',
  '🤸 ¡Te extrañamos! Tenemos disponibilidad esta semana. ¿Agendamos tu clase?',
  '🎉 ¡Hola! Queremos invitarte a una clase de prueba sin costo. ¿Cuándo puedes venir?',
]

interface Props {
  phone: string
  name: string
  profileId?: string
  leadId?: string
  onClose: () => void
}

export function WhatsAppComposer({ phone, name, profileId, leadId, onClose }: Props) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!message.trim()) return
    setError('')

    startTransition(async () => {
      try {
        if (profileId) {
          await sendWhatsAppToProfile(profileId, message.trim())
        } else if (leadId) {
          await sendWhatsAppToLead(leadId, message.trim())
        }
        setSent(true)
        setTimeout(onClose, 1500)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al enviar')
      }
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-6 right-6 z-50 w-96 bg-card border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-green-600">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs text-green-100">{phone}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {sent ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-medium">Mensaje enviado</p>
              <p className="text-xs text-muted-foreground mt-1">Registrado en el historial</p>
            </div>
          ) : (
            <>
              {/* Quick messages */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Mensajes rápidos</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {QUICK_MESSAGES.map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(msg)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors line-clamp-1"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={3}
                className="resize-none text-sm"
              />

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{message.length} / 1024 caracteres</span>
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <Button
                onClick={handleSend}
                disabled={isPending || !message.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Send className="h-3.5 w-3.5 mr-2" />
                {isPending ? 'Enviando…' : 'Enviar por WhatsApp'}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
