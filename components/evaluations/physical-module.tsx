'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PhysicalData } from '@/actions/evaluations'

interface Props {
  value:    PhysicalData
  onChange: (v: PhysicalData) => void
}

type PKey = keyof PhysicalData

function n(v: number | null | undefined): number | null {
  return v ?? null
}

function bestMax(...vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => v != null)
  return nums.length ? Math.max(...nums) : null
}
function bestMin(...vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => v != null)
  return nums.length ? Math.min(...nums) : null
}

function NumInput({ pk, label, value, onChange, step = '0.01' }: {
  pk:       PKey
  label:    string
  value:    PhysicalData
  onChange: (v: PhysicalData) => void
  step?:    string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="number" step={step} min="0" placeholder="—"
        value={value[pk] ?? ''}
        onChange={(e) =>
          onChange({ ...value, [pk]: e.target.value === '' ? null : parseFloat(e.target.value) })
        }
        className="h-8 text-sm"
      />
    </div>
  )
}

function TripleAttempt({
  label,
  unit,
  keys,
  best,
  bestFn,
  value,
  onChange,
}: {
  label:  string
  unit:   string
  keys:   [PKey, PKey, PKey]
  best:   number | null
  bestFn: 'max' | 'min'
  value:  PhysicalData
  onChange: (v: PhysicalData) => void
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs text-muted-foreground">
          Mejor:{' '}
          {best !== null ? (
            <span className="font-semibold text-brand">{best} {unit}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((pk, i) => (
          <NumInput key={pk} pk={pk} label={`Intento ${i + 1} (${unit})`} value={value} onChange={onChange} />
        ))}
      </div>
    </div>
  )
}

export function PhysicalModule({ value, onChange }: Props) {
  const bestSJ       = bestMax(n(value.sj1), n(value.sj2), n(value.sj3))
  const bestCMJ      = bestMax(n(value.cmj1), n(value.cmj2), n(value.cmj3))
  const bestAbalakov = bestMax(n(value.abalakov1), n(value.abalakov2), n(value.abalakov3))
  const bestVel10m   = bestMin(n(value.vel10m1), n(value.vel10m2), n(value.vel10m3))
  const bestBolasLat = bestMin(n(value.bolasLateral1), n(value.bolasLateral2), n(value.bolasLateral3))
  const bestBolasFro = bestMin(n(value.bolasFrontal1), n(value.bolasFrontal2), n(value.bolasFrontal3))
  const bestZigzag   = bestMin(n(value.zigzag1), n(value.zigzag2), n(value.zigzag3))

  // resistencia_5k: stored as total seconds, input as mm:ss
  const r5k   = value.resistencia5k ?? null
  const r5kMm = r5k !== null ? Math.floor(r5k / 60) : ''
  const r5kSs = r5k !== null ? Math.round(r5k % 60) : ''

  function setResistencia(mm: string | number, ss: string | number) {
    const m = typeof mm === 'string' ? parseInt(mm) || 0 : mm
    const s = typeof ss === 'string' ? parseInt(ss) || 0 : ss
    const total = m * 60 + s
    onChange({ ...value, resistencia5k: total > 0 ? total : null })
  }

  return (
    <div className="space-y-8">
      {/* Saltos */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Saltos (cm)</h3>
        <div className="space-y-3">
          <TripleAttempt label="Squat Jump (SJ)" unit="cm" keys={['sj1','sj2','sj3']}
            best={bestSJ} bestFn="max" value={value} onChange={onChange} />
          <TripleAttempt label="Countermovement Jump (CMJ)" unit="cm" keys={['cmj1','cmj2','cmj3']}
            best={bestCMJ} bestFn="max" value={value} onChange={onChange} />
          <TripleAttempt label="Abalakov" unit="cm" keys={['abalakov1','abalakov2','abalakov3']}
            best={bestAbalakov} bestFn="max" value={value} onChange={onChange} />
        </div>
      </div>

      {/* Velocidad */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Velocidad</h3>
        <TripleAttempt label="Sprint 10m" unit="seg" keys={['vel10m1','vel10m2','vel10m3']}
          best={bestVel10m} bestFn="min" value={value} onChange={onChange} />
      </div>

      {/* Agilidad */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Agilidad</h3>
        <div className="space-y-3">
          <TripleAttempt label="8 Bolas Lateral" unit="seg" keys={['bolasLateral1','bolasLateral2','bolasLateral3']}
            best={bestBolasLat} bestFn="min" value={value} onChange={onChange} />
          <TripleAttempt label="8 Bolas Frontal" unit="seg" keys={['bolasFrontal1','bolasFrontal2','bolasFrontal3']}
            best={bestBolasFro} bestFn="min" value={value} onChange={onChange} />

          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium">Desplazamiento Lateral (seg)</p>
            <div className="grid grid-cols-2 gap-2">
              <NumInput pk="desplazLatD" label="Derecha" value={value} onChange={onChange} />
              <NumInput pk="desplazLatI" label="Izquierda" value={value} onChange={onChange} />
            </div>
          </div>

          <TripleAttempt label="Gincana Zig-Zag" unit="seg" keys={['zigzag1','zigzag2','zigzag3']}
            best={bestZigzag} bestFn="min" value={value} onChange={onChange} />
        </div>
      </div>

      {/* Resistencia */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Resistencia</h3>
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">5K</p>
            {r5k !== null && (
              <span className="text-xs font-semibold text-brand">
                {r5kMm}:{String(r5kSs).padStart(2, '0')} min
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Minutos</Label>
              <Input
                type="number" min="0" step="1" placeholder="0"
                value={r5kMm}
                onChange={(e) => setResistencia(e.target.value, r5kSs)}
                className="h-8 w-24 text-sm"
              />
            </div>
            <span className="text-muted-foreground pt-5">:</span>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Segundos</Label>
              <Input
                type="number" min="0" max="59" step="1" placeholder="0"
                value={r5kSs}
                onChange={(e) => setResistencia(r5kMm, e.target.value)}
                className="h-8 w-24 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
