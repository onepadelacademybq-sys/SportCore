'use client'

import { useState } from 'react'
import { Copy, Check, Banknote } from 'lucide-react'

const BANK_ACCOUNT = '876-000008-69'
const ACCOUNT_RAW  = '87600000869'

function formatCOP(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('es-CO')
}

function orderNumber(bookingId: string): string {
  return 'OP-' + bookingId.slice(0, 8).toUpperCase()
}

interface Props {
  bookingId: string
  price:     number | string
}

export function PaymentCard({ bookingId, price }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyAccount() {
    await navigator.clipboard.writeText(ACCOUNT_RAW)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-[#00C4CC]/30 bg-[#00C4CC]/5 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Banknote className="h-4 w-4 text-[#00C4CC] shrink-0" />
        <span className="text-sm font-semibold">Datos de pago</span>
      </div>

      {/* Order + amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-background border border-border px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
            Número de orden
          </p>
          <p className="text-sm font-mono font-semibold tracking-wider">
            {orderNumber(bookingId)}
          </p>
        </div>
        <div className="rounded-lg bg-background border border-border px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
            Monto a pagar
          </p>
          <p className="text-sm font-bold text-[#00C4CC]">{formatCOP(Number(price))}</p>
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
            title="Copiar número de cuenta"
            className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-0.5"
          >
            {copied
              ? <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-500">Copiado</span></>
              : <><Copy className="h-3.5 w-3.5" />Copiar</>
            }
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

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Una vez realices el pago, sube el comprobante aquí abajo para confirmar tu reserva
      </p>
    </div>
  )
}
