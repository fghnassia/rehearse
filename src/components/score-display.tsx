"use client"

import type { ScoreLevel } from "@/lib/session-types"

interface ScoreDisplayProps {
  criterion: string
  level: ScoreLevel
  rationale: string
}

const donutConfig: Record<ScoreLevel, { pct: number; color: string; label: string }> = {
  strong:   { pct: 1,    color: "var(--state-positive-foreground)",  label: "Strong" },
  moderate: { pct: 0.58, color: "var(--state-warning-foreground)",   label: "Moderate" },
  weak:     { pct: 0.25, color: "var(--state-negative-foreground)",  label: "Weak" },
}

export function DonutChart({ level, size = 34 }: { level: ScoreLevel; size?: number }) {
  const { pct, color } = donutConfig[level]
  const cx = size / 2
  const r = size * 0.38
  const stroke = size * 0.1
  const circ = 2 * Math.PI * r

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted-foreground/20"
      />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circ * pct} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </svg>
  )
}

export function ScoreDisplay({ criterion, level, rationale }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0" title={rationale}>
      <DonutChart level={level} />
      <p className="font-sans text-[10px] font-medium text-foreground text-center leading-tight line-clamp-2 w-16">{criterion}</p>
      <p className="font-sans text-[10px] text-muted-foreground text-center">{donutConfig[level].label}</p>
    </div>
  )
}
