'use client'

import { useState } from 'react'

export interface ChartSeries {
  key:          string
  name:         string
  color:        string
  strokeWidth?: number
}

export interface ChartPoint {
  label: string
  [key: string]: number | null | string
}

interface Props {
  data:    ChartPoint[]
  series:  ChartSeries[]
  yMin?:   number
  yMax?:   number
  yUnit?:  string
  height?: number
}

const VW  = 700
const PAD = { t: 16, r: 24, b: 36, l: 52 }
const BORDER = 'var(--border)'
const MUTED  = 'var(--muted-foreground)'
const CARD   = 'var(--card)'

export function SvgLineChart({ data, series, yMin = 0, yMax = 100, yUnit = '%', height = 260 }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length < 2) return null

  const VH  = height
  const iW  = VW - PAD.l - PAD.r
  const iH  = VH - PAD.t - PAD.b
  const n   = data.length

  const xOf    = (i: number) => PAD.l + (iW / (n - 1)) * i
  const yRange = yMax - yMin || 1
  const yOf    = (v: number) => PAD.t + iH * (1 - (v - yMin) / yRange)

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const raw = yMin + ((yMax - yMin) / 4) * i
    return Math.round(raw * 10) / 10
  })

  const colW = iW / (n - 1)

  const tooltipRight = hovered === null || hovered < n / 2

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={PAD.l} y1={yOf(t)}
            x2={PAD.l + iW} y2={yOf(t)}
            style={{ stroke: BORDER }}
            strokeDasharray="3 3"
            strokeWidth={0.8}
          />
        ))}

        {/* Y labels */}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x={PAD.l - 6} y={yOf(t) + 4}
            textAnchor="end"
            fontSize={10}
            style={{ fill: MUTED }}
          >
            {Number.isInteger(t) ? t : t.toFixed(1)}{yUnit}
          </text>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={xOf(i)} y={VH - 6}
            textAnchor="middle"
            fontSize={10}
            style={{ fill: MUTED }}
          >
            {d.label}
          </text>
        ))}

        {/* Hover vertical line */}
        {hovered !== null && (
          <line
            x1={xOf(hovered)} y1={PAD.t}
            x2={xOf(hovered)} y2={PAD.t + iH}
            style={{ stroke: MUTED }}
            strokeDasharray="4 2"
            strokeWidth={1}
            opacity={0.5}
          />
        )}

        {/* Series: lines then dots */}
        {series.map(s => {
          const pts = data.map((d, i) => {
            const v = d[s.key] as number | null
            return v != null ? { x: xOf(i), y: yOf(v) } : null
          })

          let pathD = ''
          pts.forEach((pt, idx) => {
            if (!pt) return
            const hasPrev = idx > 0 && pts.slice(0, idx).reverse().find(Boolean)
            pathD += hasPrev
              ? ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
              : ` M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
          })

          return (
            <g key={s.key}>
              {pathD && (
                <path
                  d={pathD.trim()}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.strokeWidth ?? 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {pts.map((pt, i) =>
                pt && (
                  <circle
                    key={i}
                    cx={pt.x} cy={pt.y}
                    r={hovered === i ? 5 : 3.5}
                    fill={s.color}
                    style={{ stroke: CARD }}
                    strokeWidth={1.5}
                  />
                ),
              )}
            </g>
          )
        })}

        {/* Transparent hit areas */}
        {data.map((_, i) => {
          const x = i === 0 ? PAD.l : xOf(i) - colW / 2
          return (
            <rect
              key={i}
              x={Math.max(PAD.l, x)} y={PAD.t}
              width={colW} height={iH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (
        <div
          className={`absolute top-2 ${tooltipRight ? 'right-2' : 'left-2'} bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none z-10`}
        >
          <p className="font-semibold text-foreground mb-1.5">{data[hovered].label}</p>
          <div className="space-y-1">
            {series.map(s => {
              const raw = data[hovered][s.key] as number | null
              const display = raw != null
                ? `${Number.isInteger(raw) ? raw : raw.toFixed(2)}${yUnit}`
                : '—'
              return (
                <div key={s.key} className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-muted-foreground">{s.name}:</span>
                  <span className="font-semibold text-foreground tabular-nums">{display}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
