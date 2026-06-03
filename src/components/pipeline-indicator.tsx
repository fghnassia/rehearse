type Stage = "setup" | "research" | "simulation" | "report"

const stages: { id: Stage; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "research", label: "Research" },
  { id: "simulation", label: "Simulation" },
  { id: "report", label: "Report" },
]

interface PipelineIndicatorProps {
  currentStage: Stage
}

export function PipelineIndicator({ currentStage }: PipelineIndicatorProps) {
  const currentIndex = stages.findIndex((s) => s.id === currentStage)

  return (
    <nav aria-label="Session progress" className="flex items-center gap-1">
      {stages.map((stage, i) => {
        const isCompleted = i < currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={stage.id} className="flex items-center gap-1">
            <span
              className={
                isCurrent
                  ? "font-sans text-xs font-medium text-foreground"
                  : isCompleted
                  ? "font-sans text-xs text-muted-foreground"
                  : "font-sans text-xs text-muted-foreground/40"
              }
              aria-current={isCurrent ? "step" : undefined}
            >
              {isCompleted ? "✓ " : ""}{stage.label}
            </span>
            {i < stages.length - 1 && (
              <span className="font-sans text-xs text-muted-foreground/30 mx-1">·</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
