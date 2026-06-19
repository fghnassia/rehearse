"use client"

import Link from "next/link"
import { useSession } from "@/lib/session-context"

type Stage = "setup" | "research" | "simulation" | "report"

const stages: { id: Stage; label: string; route: string }[] = [
  { id: "setup",      label: "Setup",      route: "/confirm"    },
  { id: "research",   label: "Research",   route: "/research"   },
  { id: "simulation", label: "Simulation", route: "/simulation" },
  { id: "report",     label: "Report",     route: "/report"     },
]

interface PipelineIndicatorProps {
  currentStage: Stage
}

export function PipelineIndicator({ currentStage }: PipelineIndicatorProps) {
  const { session } = useSession()
  const currentIndex = stages.findIndex((s) => s.id === currentStage)

  function isCompleted(index: number, stageId: Stage): boolean {
    if (index >= currentIndex) return false
    if (stageId === "setup")      return !!session.context
    if (stageId === "research")   return !!session.research
    if (stageId === "simulation") return !!session.simulation
    if (stageId === "report")     return !!session.report
    return false
  }

  return (
    <nav aria-label="Session progress" className="flex items-center gap-1">
      {stages.map((stage, i) => {
        const completed = isCompleted(i, stage.id)
        const isCurrent = i === currentIndex

        const label = (
          <span
            className={
              isCurrent
                ? "font-sans text-xs font-medium text-foreground"
                : completed
                ? "font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
                : "font-sans text-xs text-muted-foreground/40"
            }
            aria-current={isCurrent ? "step" : undefined}
          >
            {completed ? "✓ " : ""}{stage.label}
          </span>
        )

        return (
          <div key={stage.id} className="flex items-center gap-1">
            {completed ? (
              <Link href={stage.route}>{label}</Link>
            ) : (
              label
            )}
            {i < stages.length - 1 && (
              <span className="font-sans text-xs text-muted-foreground/30 mx-1">·</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
