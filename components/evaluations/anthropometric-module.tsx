'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AnthropometricData } from '@/actions/evaluations'

interface Props {
  value:    AnthropometricData
  onChange: (v: AnthropometricData) => void
}

type Field = { key: keyof AnthropometricData; label: string; unit: string }

const MACRO: Field[] = [
  { key: 'peso',          label: 'Peso',           unit: 'kg'   },
  { key: 'talla',         label: 'Talla',          unit: 'cm'   },
  { key: 'pctAdiposo',    label: '% Adiposo',      unit: '%'    },
  { key: 'pctMusculo',    label: '% Músculo',      unit: '%'    },
  { key: 'edadBiologica', label: 'Edad biológica', unit: 'años' },
  { key: 'grasaVisceral', label: 'Grasa visceral', unit: ''     },
]

const PLIEGUES: Field[] = [
  { key: 'tricipital',         label: 'Tricipital',   unit: 'mm' },
  { key: 'bicipital',          label: 'Bicipital',    unit: 'mm' },
  { key: 'subescapular',       label: 'Subescapular', unit: 'mm' },
  { key: 'iliocrestal',        label: 'Iliocrestal',  unit: 'mm' },
  { key: 'supraespinal',       label: 'Supraespinal', unit: 'mm' },
  { key: 'abdominal',          label: 'Abdominal',    unit: 'mm' },
  { key: 'musloPliegue',       label: 'Muslo',        unit: 'mm' },
  { key: 'pantorrillaPliegue', label: 'Pantorrilla',  unit: 'mm' },
]

const PERIMETROS: Field[] = [
  { key: 'pechoMinimo', label: 'Pecho mínimo',    unit: 'cm' },
  { key: 'cintura',     label: 'Cintura',         unit: 'cm' },
  { key: 'cadera',      label: 'Cadera',          unit: 'cm' },
  { key: 'bicepsDRel',  label: 'Bíceps D (rel.)', unit: 'cm' },
  { key: 'bicepsDCon',  label: 'Bíceps D (con.)', unit: 'cm' },
  { key: 'bicepsIRel',  label: 'Bíceps I (rel.)', unit: 'cm' },
  { key: 'bicepsICon',  label: 'Bíceps I (con.)', unit: 'cm' },
  { key: 'antebrazoD',  label: 'Antebrazo D',     unit: 'cm' },
  { key: 'antebrazoI',  label: 'Antebrazo I',     unit: 'cm' },
  { key: 'musloD',      label: 'Muslo D',         unit: 'cm' },
  { key: 'musloI',      label: 'Muslo I',         unit: 'cm' },
  { key: 'pantorrillaD', label: 'Pantorrilla D',  unit: 'cm' },
  { key: 'pantorrillaI', label: 'Pantorrilla I',  unit: 'cm' },
]

function FieldInput({ field, value, onChange }: { field: Field; value: AnthropometricData; onChange: (v: AnthropometricData) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {field.label}
        {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
      </Label>
      <Input
        type="number"
        step="0.1"
        min="0"
        placeholder="—"
        value={value[field.key] ?? ''}
        onChange={(e) =>
          onChange({ ...value, [field.key]: e.target.value === '' ? null : parseFloat(e.target.value) })
        }
        className="h-8 text-sm"
      />
    </div>
  )
}

function Section({ title, fields, value, onChange }: { title: string; fields: Field[]; value: AnthropometricData; onChange: (v: AnthropometricData) => void }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <FieldInput key={f.key} field={f} value={value} onChange={onChange} />
        ))}
      </div>
    </div>
  )
}

export function AnthropometricModule({ value, onChange }: Props) {
  return (
    <div className="space-y-8">
      <Section title="Macro índices" fields={MACRO}    value={value} onChange={onChange} />
      <Section title="Pliegues cutáneos (mm)" fields={PLIEGUES}  value={value} onChange={onChange} />
      <Section title="Perímetros (cm)"         fields={PERIMETROS} value={value} onChange={onChange} />
    </div>
  )
}
