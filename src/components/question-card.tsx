"use client"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScoreDisplay } from "./score-display"
import type { QAPair } from "@/lib/session-types"

interface QuestionCardProps {
  questionNumber: number
  qa: QAPair
}

export function QuestionCard({ questionNumber, qa }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false)

  if (qa.status === "skipped") {
    return (
      <div className="pt-6 pb-2">
        <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
          Question {questionNumber}
        </p>
        <p className="font-heading text-xl font-light leading-snug text-foreground mb-6">
          {qa.questionText}
        </p>
        <div className="bg-muted/40 rounded px-4 py-3">
          <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1.5">
            Skipped
          </p>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            You skipped this question, so there&apos;s nothing to score. Redo this stage to take it on.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-6 pb-2">
      <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
        Question {questionNumber}
      </p>
      <p className="font-heading text-xl font-light leading-snug text-foreground mb-6">
        {qa.questionText}
      </p>

      {/* Criterion donuts */}
      {qa.scores && qa.scores.length > 0 && (
        <div className="flex gap-4 mb-6 flex-wrap">
          {qa.scores.map((score) => (
            <ScoreDisplay
              key={score.criterion}
              criterion={score.criterion}
              level={score.level}
              rationale={score.rationale}
            />
          ))}
        </div>
      )}

      {/* Answer toggle */}
      <div className="mb-5">
        <button
          onClick={() => setShowAnswer(v => !v)}
          className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors tracking-[0.08em] uppercase"
        >
          {showAnswer ? "Hide your answer ↑" : "Show your answer ↓"}
        </button>
        {showAnswer && (
          <div className="mt-3 bg-muted/50 rounded px-4 py-3">
            <p className="font-sans text-sm text-foreground leading-relaxed whitespace-pre-wrap">{qa.userAnswer}</p>
          </div>
        )}
      </div>

      {/* What worked */}
      {qa.whatWorked && (
        <div className="bg-[var(--state-positive)]/30 rounded px-4 py-3 mb-3">
          <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-[var(--state-positive-foreground)] mb-1.5">
            What worked
          </p>
          <p className="font-sans text-sm text-foreground leading-relaxed">{qa.whatWorked}</p>
        </div>
      )}

      {/* What to improve */}
      {qa.whatToImprove && (
        <div className="bg-[var(--state-warning)]/30 rounded px-4 py-3 mb-3">
          <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-[var(--state-warning-foreground)] mb-1.5">
            What to improve
          </p>
          <p className="font-sans text-sm text-foreground leading-relaxed">{qa.whatToImprove}</p>
        </div>
      )}

      {/* Stronger answer */}
      {qa.sampleAnswer && (
        <Accordion>
          <AccordionItem value="sample" className="border-none">
            <AccordionTrigger className="font-sans text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground hover:no-underline py-2">
              See a stronger answer — adapt in your own voice
            </AccordionTrigger>
            <AccordionContent>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed pt-1 italic">{qa.sampleAnswer}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
