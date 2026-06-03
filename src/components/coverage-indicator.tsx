import type { CoverageLevel } from "@/lib/session-types"

interface CoverageIndicatorProps {
  level: CoverageLevel
  sourceCount?: number
  className?: string
}

const config: Record<CoverageLevel, { icon: string; label: string; explanation: string; colorClass: string }> = {
  rich: {
    icon: "●",
    label: "High coverage",
    explanation: "We found detailed interview data for this company.",
    colorClass: "bg-[var(--state-positive)] text-[var(--state-positive-foreground)]",
  },
  sparse: {
    icon: "●",
    label: "Limited coverage",
    explanation: "We found some data — questions will be less company-specific.",
    colorClass: "bg-[var(--state-warning)] text-[var(--state-warning-foreground)]",
  },
  none: {
    icon: "●",
    label: "No data found",
    explanation: "No interview data found — questions will be general but well-crafted.",
    colorClass: "bg-[var(--state-negative)] text-[var(--state-negative-foreground)]",
  },
}

export function CoverageIndicator({ level, sourceCount, className }: CoverageIndicatorProps) {
  const { icon, label, explanation, colorClass } = config[level]
  const ariaLabel = `Coverage: ${label}. ${explanation}${sourceCount != null ? ` ${sourceCount} sources found.` : ""}`

  return (
    <div className={className}>
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium font-sans ${colorClass}`}
        aria-label={ariaLabel}
        role="status"
      >
        <span aria-hidden="true" className="text-[0.5rem]">{icon}</span>
        <span>{label}</span>
        {sourceCount != null && (
          <span className="opacity-70">· {sourceCount} source{sourceCount !== 1 ? "s" : ""}</span>
        )}
      </div>
      <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed">
        {explanation}
      </p>
    </div>
  )
}
