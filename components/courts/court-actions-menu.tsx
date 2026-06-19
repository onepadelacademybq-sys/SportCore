'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { MoreHorizontal, Wrench, LayoutGrid, XCircle, Pencil, X } from 'lucide-react'
import { setCourtStatusAction, type Court, type CourtStatus } from '@/actions/courts'
import { CourtForm } from './court-form'
import { Button } from '@/components/ui/button'

export function CourtActionsMenu({ court }: { court: Court }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function changeStatus(status: CourtStatus) {
    setMenuOpen(false)
    startTransition(async () => {
      await setCourtStatusAction(court.id, status)
    })
  }

  return (
    <>
      {/* Trigger + popover menu */}
      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isPending}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 min-w-40 rounded-lg border bg-popover shadow-md py-1">
            <button
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => { setMenuOpen(false); setEditOpen(true) }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <div className="my-1 border-t" />
            {court.status !== 'active' && (
              <button
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => changeStatus('active')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Marcar activo
              </button>
            )}
            {court.status !== 'maintenance' && (
              <button
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => changeStatus('maintenance')}
              >
                <Wrench className="h-3.5 w-3.5" />
                En mantenimiento
              </button>
            )}
            {court.status !== 'closed' && (
              <button
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-accent hover:text-destructive transition-colors"
                onClick={() => changeStatus('closed')}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cerrar espacio
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit modal overlay */}
      {editOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setEditOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-semibold">Editar espacio</h2>
                <button
                  onClick={() => setEditOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                <CourtForm court={court} onSuccess={() => setEditOpen(false)} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
