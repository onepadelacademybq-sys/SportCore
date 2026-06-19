'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { CourtForm } from './court-form'
import { Button } from '@/components/ui/button'

export function CreateCourtButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button className="gap-2 shrink-0" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nuevo espacio
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-semibold">Crear espacio reservable</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                <CourtForm onSuccess={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
