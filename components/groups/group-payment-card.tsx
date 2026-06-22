'use client'

import { useRef, useState, useActionState } from 'react'
import { uploadGroupProofAction } from '@/actions/groups'
import type { GroupActionState } from '@/actions/groups'
import { Banknote, Copy, Check, Upload, FileText, X, Clock } from 'lucide-react'

const BANK_ACCOUNT = '876-000008-69'
const ACCOUNT_RAW  = '87600000869'

interface Props {
  memberId:    string
  groupName:   string
  monthlyFee:  number | string
  proofSent:   boolean  // payment_status === 'paid'
}

export function GroupPaymentCard({ memberId, groupName, monthlyFee, proofSent }: Props) {
  const [copied, setCopied]           = useState(false)
  const [file, setFile]               = useState<File | null>(null)
  const [preview, setPreview]         = useState<string | null>(null)
  const [dragOver, setDragOver]       = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)

  const [state, action, isPending] = useActionState(
    uploadGroupProofAction,
    { error: null } as GroupActionState,
  )

  async function copyAccount() {
    await navigator.clipboard.writeText(ACCOUNT_RAW)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function applyFile(f: File) {
    setClientError(null)
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(f.type)) {
      setClientError('Solo se aceptan archivos JPG, PNG o PDF')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setClientError('El archivo no puede superar 5 MB')
      return
    }
    if (inputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(f)
      inputRef.current.files = dt.files
    }
    setFile(f)
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    setClientError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) applyFile(f)
  }

  const fee = `$${Math.round(Number(monthlyFee)).toLocaleString('es-CO')}`
  const order = 'GP-' + memberId.slice(0, 8).toUpperCase()

  // If proof was already sent (payment_status = 'paid')
  if (proofSent || state.success) {
    return (
      <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-3">
        <Clock className="h-4 w-4 text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">Comprobante enviado</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {state.success ?? 'El administrador verificará tu pago y activará tu inscripción.'}
          </p>
        </div>
      </div>
    )
  }

  const displayError = clientError ?? state.error

  return (
    <div className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Banknote className="h-4 w-4 text-brand shrink-0" />
        <span className="text-sm font-semibold">Completa tu pago para confirmar la inscripción</span>
      </div>

      {/* Order + amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background border border-border px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Número de orden</p>
          <p className="text-sm font-mono font-semibold tracking-wider">{order}</p>
        </div>
        <div className="rounded-lg bg-background border border-border px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Mensualidad</p>
          <p className="text-sm font-bold text-brand">{fee}</p>
        </div>
      </div>

      {/* Bank details */}
      <div className="rounded-lg bg-background border border-border divide-y divide-border text-sm">
        <div className="flex items-start justify-between gap-3 px-3 py-2.5">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">🏦 Bancolombia — Cuenta de Ahorros</p>
            <p className="font-mono font-medium">{BANK_ACCOUNT}</p>
          </div>
          <button
            type="button"
            onClick={copyAccount}
            className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-0.5"
          >
            {copied
              ? <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-500">Copiado</span></>
              : <><Copy className="h-3.5 w-3.5" />Copiar</>}
          </button>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">👤 A nombre de</p>
          <p className="font-medium">Juan Sebastián Sedano</p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">📱 Bre-B / Nequi / Daviplata</p>
          <p className="font-mono font-medium">301 657 5440</p>
        </div>
      </div>

      {/* Upload proof */}
      <form action={action} className="space-y-2">
        <input type="hidden" name="memberId" value={memberId} />
        <input
          ref={inputRef}
          type="file"
          name="paymentProof"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) applyFile(f) }}
        />

        {displayError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{displayError}</p>
        )}

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
              px-4 py-5 cursor-pointer transition-colors text-center select-none
              ${dragOver ? 'border-brand bg-brand/10' : 'border-border hover:border-brand/50 hover:bg-muted/30'}`}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">Arrastrá o hacé clic para seleccionar</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG o PDF · máx 5 MB</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            {preview ? (
              <div className="rounded-md overflow-hidden bg-muted max-h-40 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Comprobante" className="object-contain max-h-40 w-full" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{file.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground truncate">{file.name}</p>
              <button type="button" onClick={clearFile} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !file}
          className="w-full py-2.5 rounded-lg bg-brand text-black text-sm font-semibold
            hover:bg-[#00b3ba] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Enviando…' : 'Enviar comprobante'}
        </button>
      </form>
    </div>
  )
}
