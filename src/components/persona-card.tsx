import { Button } from "@/components/ui/button"

interface PersonaCardProps {
  stage: "recruiter" | "hiring-manager" | "portfolio-review"
  personaName: string
  personaRole: string
  behaviorNote: string
  questionCount: number
  onBegin: () => void
}

const stageLabels: Record<string, string> = {
  recruiter: "Recruiter Screen",
  "hiring-manager": "Hiring Manager Round",
  "portfolio-review": "Portfolio Review",
}

export function PersonaCard({
  stage,
  personaName,
  personaRole,
  behaviorNote,
  questionCount,
  onBegin,
}: PersonaCardProps) {
  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <div className="flex flex-col gap-1">
        <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground">
          {stageLabels[stage]}
        </p>
        <h2 className="font-heading text-3xl font-light leading-tight">{personaName}</h2>
        <p className="font-sans text-sm text-muted-foreground">{personaRole}</p>
      </div>

      <p className="font-sans text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-4">
        {behaviorNote}
      </p>

      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-0.5">
          <p className="font-sans text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Questions</p>
          <p className="font-sans text-sm text-foreground">{questionCount}</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-sans text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Est. time</p>
          <p className="font-sans text-sm text-foreground">{Math.ceil(questionCount * 2.5)} min</p>
        </div>
      </div>

      <Button
        size="lg"
        className="font-sans text-sm tracking-[0.1em] uppercase px-8 self-start"
        onClick={onBegin}
      >
        Begin Interview →
      </Button>
    </div>
  )
}
