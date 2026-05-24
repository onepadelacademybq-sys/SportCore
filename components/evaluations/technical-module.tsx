'use client'

import { useState } from 'react'
import { STROKE_GROUPS } from '@/lib/eval-strokes'

export type ShotState = Record<string, boolean[]>

export function initShotState(): ShotState {
  const state: ShotState = {}
  for (const { strokes } of STROKE_GROUPS) {
    for (const s of strokes) {
      state[s] = [false, false, false, false, false]
    }
  }
  return state
}

interface Props {
  value:    ShotState
  onChange: (v: ShotState) => void
}

const lightClass = (pct: number) =>
  pct >= 70 ? 'text-emerald-500 bg-emerald-500/10' :
  pct >= 40 ? 'text-amber-500 bg-amber-500/10'    :
              'text-red-400 bg-red-500/10'

const pctClass = (pct: number) =>
  pct >= 80 ? 'text-emerald-500' :
  pct >= 60 ? 'text-amber-500'   :
  pct >  0  ? 'text-red-400'     :
              'text-muted-foreground'

export function TechnicalModule({ value, onChange }: Props) {
  const [shots, setShots] = useState<ShotState>(value)

  function toggle(stroke: string, idx: number) {
    const current = shots[stroke] ?? [false, false, false, false, false]
    const next = [...current] as boolean[]
    next[idx] = !next[idx]
    const newShots = { ...shots, [stroke]: next }
    setShots(newShots)
    onChange(newShots)
  }

  return (
    <div className="space-y-8">
      {STROKE_GROUPS.map(({ group, label, strokes }) => {
        const totalHits = strokes.reduce(
          (sum, s) => sum + (shots[s] ?? []).filter(Boolean).length, 0,
        )
        const totalPossible = strokes.length * 5
        const groupPct = totalPossible > 0 ? Math.round(totalHits / totalPossible * 100) : 0

        return (
          <div key={group}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{label}</h3>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${lightClass(groupPct)}`}>
                {totalHits}/{totalPossible} · {groupPct}%
              </span>
            </div>

            <div className="rounded-lg border border-border overflow-x-auto">
              {/* Header */}
              <div
                className="grid text-[10px] font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 uppercase tracking-wide min-w-[420px]"
                style={{ gridTemplateColumns: '1fr 32px 32px 32px 32px 32px 44px 44px' }}
              >
                <span>Golpe</span>
                <span className="text-center">S1</span>
                <span className="text-center">S2</span>
                <span className="text-center">S3</span>
                <span className="text-center">S4</span>
                <span className="text-center">S5</span>
                <span className="text-center">Hits</span>
                <span className="text-center">%</span>
              </div>

              {strokes.map((stroke) => {
                const attempts = shots[stroke] ?? [false, false, false, false, false]
                const hits = attempts.filter(Boolean).length
                const pct  = hits / 5 * 100

                return (
                  <div
                    key={stroke}
                    className="grid border-t border-border px-3 py-2 items-center min-w-[420px]"
                    style={{ gridTemplateColumns: '1fr 32px 32px 32px 32px 32px 44px 44px' }}
                  >
                    <span className="text-xs pr-2">{stroke}</span>
                    {attempts.map((checked, i) => (
                      <div key={i} className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggle(stroke, i)}
                          aria-pressed={checked}
                          className={`w-6 h-6 rounded border text-xs font-bold transition-colors ${
                            checked
                              ? 'border-[#00C4CC] bg-[#00C4CC] text-white'
                              : 'border-border bg-background text-transparent hover:border-[#00C4CC]/60'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                    <span className="text-center text-xs font-medium tabular-nums">{hits}/5</span>
                    <span className={`text-center text-xs font-medium tabular-nums ${pctClass(pct)}`}>
                      {hits > 0 ? `${Math.round(pct)}%` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
