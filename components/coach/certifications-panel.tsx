'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, BadgeCheck, ExternalLink } from 'lucide-react'
import { addCertification, removeCertification } from '@/actions/coach-profile'
import type { CoachCertification } from '@/actions/coach-profile'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'

function CertRow({ cert, onRemove }: { cert: CoachCertification; onRemove: (id: string) => void }) {
  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{cert.title}</p>
          {cert.is_validated && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
              <BadgeCheck className="h-3 w-3" /> Validada
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{cert.issuing_organization}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(cert.obtained_at + 'T12:00:00')}
          {cert.expires_at && ` · Vence ${formatDate(cert.expires_at + 'T12:00:00')}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {cert.document_url && (
          <a
            href={cert.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Ver documento"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <button
          type="button"
          onClick={() => onRemove(cert.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

function AddForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(addCertification, { error: null })

  useEffect(() => {
    if (state.success) onSuccess()
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="space-y-3 pt-3 border-t border-border">
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nombre de la certificación *</label>
          <input
            name="title"
            required
            placeholder="Ej: Nivel 2 FEP"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Entidad certificadora *</label>
          <input
            name="issuing_organization"
            required
            placeholder="Ej: Federación Española de Pádel"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Fecha de obtención *</label>
          <input
            name="obtained_at"
            type="date"
            required
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Fecha de vencimiento</label>
          <input
            name="expires_at"
            type="date"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">URL del documento</label>
          <input
            name="document_url"
            type="url"
            placeholder="https://..."
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Guardando…' : 'Agregar certificación'}
        </Button>
      </div>
    </form>
  )
}

export function CertificationsPanel({ certifications }: { certifications: CoachCertification[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeCertification(id)
      router.refresh()
    })
  }

  function handleSuccess() {
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Formación y certificaciones</h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          {open ? 'Cancelar' : 'Agregar'}
        </button>
      </div>

      {certifications.length === 0 && !open ? (
        <p className="text-xs text-muted-foreground">Sin certificaciones registradas.</p>
      ) : (
        <ul className="divide-y divide-border">
          {certifications.map((c) => (
            <CertRow key={c.id} cert={c} onRemove={handleRemove} />
          ))}
        </ul>
      )}

      {open && <AddForm onSuccess={handleSuccess} />}
    </div>
  )
}
