'use client'

import { useState } from 'react'
import { getPaymentProofUrl } from '@/actions/bookings'

interface Props {
  bookingId:   string
  storagePath: string
}

export function ViewProofButton({ bookingId, storagePath }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(false)

  async function handleClick() {
    setLoading(true)
    setError(false)
    const url = await getPaymentProofUrl(bookingId, storagePath)
    setLoading(false)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      setError(true)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-brand hover:underline disabled:opacity-50 disabled:cursor-wait"
    >
      {loading ? 'Abriendo...' : error ? 'Error — reintentar' : 'Ver comprobante'}
    </button>
  )
}
