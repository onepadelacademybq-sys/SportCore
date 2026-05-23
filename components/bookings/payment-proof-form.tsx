'use client'

import { useRef, useState, useActionState } from 'react'
import { uploadPaymentProofAction } from '@/actions/bookings'
import type { BookingState } from '@/actions/bookings'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, X } from 'lucide-react'

const ACCEPT      = '.jpg,.jpeg,.png,.pdf'
const MAX_BYTES   = 5 * 1024 * 1024
const VALID_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

interface Props {
  bookingId: string
}

export function PaymentProofForm({ bookingId }: Props) {
  const [state, action, isPending] = useActionState(
    uploadPaymentProofAction,
    { error: null } as BookingState,
  )

  const inputRef                    = useRef<HTMLInputElement>(null)
  const [file, setFile]             = useState<File | null>(null)
  const [preview, setPreview]       = useState<string | null>(null)
  const [dragOver, setDragOver]     = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  // Validates and applies a file to both React state and the real <input> element
  function applyFile(f: File) {
    setClientError(null)
    if (!VALID_TYPES.includes(f.type)) {
      setClientError('Solo se aceptan archivos JPG, PNG o PDF')
      return
    }
    if (f.size > MAX_BYTES) {
      setClientError('El archivo no puede superar 5 MB')
      return
    }
    // Sync file into the actual <input> so the FormData the server action receives has it
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

  if (state.success) {
    return <p className="text-xs text-emerald-500 font-medium py-1">{state.success}</p>
  }

  const displayError = clientError ?? state.error

  return (
    <form action={action} className="space-y-2 mt-2">
      <input type="hidden" name="bookingId" value={bookingId} />

      {/* The real file input — always mounted so FormData picks it up on submit */}
      <input
        ref={inputRef}
        type="file"
        name="paymentProof"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) applyFile(f) }}
      />

      {displayError && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{displayError}</AlertDescription>
        </Alert>
      )}

      {!file ? (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
            px-4 py-6 cursor-pointer transition-colors text-center select-none
            ${dragOver
              ? 'border-[#00C4CC] bg-[#00C4CC]/10'
              : 'border-border hover:border-[#00C4CC]/50 hover:bg-muted/30'
            }
          `}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium">Arrastrá o hacé clic para seleccionar</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG o PDF · máx 5 MB</p>
          </div>
        </div>
      ) : (
        /* File selected — show preview */
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
          {preview ? (
            <div className="rounded-md overflow-hidden bg-muted max-h-48 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Comprobante" className="object-contain max-h-48 w-full" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{file.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground truncate">{file.name}</p>
            <button
              type="button"
              onClick={clearFile}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <Button type="submit" size="sm" disabled={isPending || !file} className="w-full">
        {isPending ? 'Enviando...' : 'Enviar comprobante'}
      </Button>
    </form>
  )
}
