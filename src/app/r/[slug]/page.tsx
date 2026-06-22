"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { QuestionCard } from "@/components/question-card"
import type { QAPair, ScoreLevel } from "@/lib/session-types"
import type { SavedSession } from "@/lib/api/kv"

const levelValue: Record<ScoreLevel, number> = { weak: 1, moderate: 2, strong: 3 }

function qaScore(qa: QAPair): number | null {
  if (!qa.scores || qa.scores.length === 0) return null
  const sum = qa.scores.reduce((acc, s) => acc + levelValue[s.level], 0)
  return Math.round((sum / (qa.scores.length * 3)) * 10 * 10) / 10
}

function overallNumericScore(answers: QAPair[]): number | null {
  const scores = answers.map(qaScore).filter((s): s is number => s !== null)
  if (scores.length === 0) return null
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}

function qaLevel(qa: QAPair): ScoreLevel | null {
  const s = qaScore(qa)
  if (s === null) return null
  return s >= 7 ? "strong" : s >= 4 ? "moderate" : "weak"
}

const levelDotColor: Record<ScoreLevel, string> = {
  strong:   "bg-[var(--state-positive-foreground)]",
  moderate: "bg-[var(--state-warning-foreground)]",
  weak:     "bg-[var(--state-negative-foreground)]",
}

const overallConfig: Record<ScoreLevel, { label: string; bg: string; text: string }> = {
  strong:   { label: "Strong performance", bg: "bg-[var(--state-positive)]",  text: "text-[var(--state-positive-foreground)]" },
  moderate: { label: "Solid with gaps",    bg: "bg-[var(--state-warning)]",   text: "text-[var(--state-warning-foreground)]" },
  weak:     { label: "Needs more prep",    bg: "bg-[var(--state-negative)]",  text: "text-[var(--state-negative-foreground)]" },
}

function SavedReportContent() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const compact = searchParams.get("compact") === "true"
  const [session, setSession] = useState<SavedSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedQ, setSelectedQ] = useState(0)
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/sessions/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error("Not found")
        return r.json()
      })
      .then((data: SavedSession) => setSession(data))
      .catch(() => setError("This report link has expired or doesn't exist."))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-sans text-sm text-muted-foreground animate-pulse">Loading report…</p>
      </main>
    )
  }

  if (error || !session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-8">
        <p className="font-sans text-sm text-muted-foreground">{error || "Report not found."}</p>
        <a href="/" className="font-sans text-xs tracking-[0.08em] uppercase border border-border rounded px-4 py-2 hover:border-foreground/40 transition-colors">
          Start a new session →
        </a>
      </main>
    )
  }

  const answers = session.simulation.answers
  const numericScore = overallNumericScore(answers)
  const overallLevel = session.report.overallImpressionLevel
  // Derive level from numeric score so badge and summary are consistent.
  // Fall back to AI-generated level only when no answered questions exist.
  const derivedLevel: ScoreLevel = numericScore !== null
    ? (numericScore >= 7 ? "strong" : numericScore >= 4 ? "moderate" : "weak")
    : overallLevel
  const overall = overallConfig[overallLevel]
  const scorePercent = numericScore !== null ? Math.round((numericScore / 10) * 100) : 50

  // Compact (morning-of) view
  if (compact) {
    const compactOverall = overallConfig[derivedLevel]
    const weakQs = answers.filter(qa => {
      if (!qa.scores || qa.scores.length === 0) return false
      const sum = qa.scores.reduce((acc, s) => acc + levelValue[s.level], 0)
      const score = (sum / (qa.scores.length * 3)) * 10
      return score < 4
    })
    return (
      <main className="min-h-screen flex flex-col">
        <div className="w-full h-px bg-foreground/10" />
        <div className="flex items-center justify-between px-8 py-5">
          <div>
            <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">{session.context.companyName}</p>
            <p className="font-sans text-xs text-muted-foreground/60">{session.setup.stage.replace("-", " ")} · morning of</p>
          </div>
          <a href={`/r/${slug}`} className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
            Full report →
          </a>
        </div>
        <div className="flex-1 px-8 max-w-2xl mx-auto w-full py-8">
          <div className="flex items-center gap-3 mb-10">
            <span className={`font-sans text-xs font-medium tracking-[0.1em] uppercase px-2.5 py-1 rounded ${compactOverall.bg} ${compactOverall.text}`}>
              {compactOverall.label}
            </span>
            {numericScore !== null && (
              <span className="font-heading text-2xl font-light">{numericScore}<span className="text-muted-foreground text-sm">/10</span></span>
            )}
          </div>

          {weakQs.length === 0 ? (
            <p className="font-sans text-sm text-muted-foreground">No weak questions — you were solid across the board.</p>
          ) : (
            <div className="flex flex-col gap-8">
              <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
                Focus on these today
              </p>
              {weakQs.map((qa, i) => (
                <div key={qa.questionId} className="flex flex-col gap-3">
                  <p className="font-sans text-xs text-muted-foreground/60">Q{answers.indexOf(qa) + 1}</p>
                  <p className="font-sans text-sm text-foreground leading-relaxed">{qa.questionText}</p>
                  {qa.sampleAnswer && (
                    <div className="pl-4 border-l-2 border-border mt-1">
                      <p className="font-sans text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground mb-1">Stronger answer</p>
                      <p className="font-sans text-sm text-muted-foreground leading-relaxed italic">{qa.sampleAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w-full h-px bg-foreground/10 mt-auto" />
        <div className="px-8 py-4">
          <p className="text-xs text-muted-foreground font-sans">Rehearse · Morning of · {session.context.companyName}</p>
        </div>
      </main>
    )
  }

  const handleSelectQ = (i: number) => {
    setSelectedQ(i)
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 px-8 py-12 max-w-3xl mx-auto w-full">

        <div className="mb-10">
          <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
            Feedback report
          </p>
          <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight mb-2">
            {session.context.companyName}
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            {session.context.roleTitle} · {session.setup.stage.replace("-", " ")}
          </p>
          <p className="font-sans text-xs text-muted-foreground/60 mt-1">
            {new Date(session.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="mb-10 p-6 border border-border rounded">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex flex-col gap-2">
              <span className={`self-start font-sans text-xs font-medium tracking-[0.1em] uppercase px-2.5 py-1 rounded ${overall.bg} ${overall.text}`}>
                {overall.label}
              </span>
              <p className="font-sans text-sm text-foreground leading-relaxed max-w-md">{session.report.overallImpressionSummary}</p>
            </div>
            {numericScore !== null && (
              <div className="shrink-0 flex flex-col items-end gap-2">
                <p className="font-heading text-4xl font-light text-foreground leading-none">
                  {numericScore}<span className="text-muted-foreground text-lg">/10</span>
                </p>
                <div className="relative w-28 h-1 rounded-full overflow-hidden"
                  style={{ background: "linear-gradient(to right, var(--state-negative-foreground), var(--state-warning-foreground), var(--state-positive-foreground))" }}>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-background border-2 border-foreground rounded-full -translate-x-1/2"
                    style={{ left: `${scorePercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-2">
          <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">Questions</p>
          <div className="grid grid-cols-3 gap-3">
            {answers.map((qa, i) => {
              const level = qaLevel(qa)
              const score = qaScore(qa)
              const isSelected = selectedQ === i
              return (
                <button
                  key={qa.questionId}
                  onClick={() => handleSelectQ(i)}
                  className={`text-left p-4 rounded border transition-colors ${
                    isSelected ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/40 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">Q{i + 1}</span>
                    <div className="flex items-center gap-1.5">
                      {level && <span className={`inline-block w-2 h-2 rounded-full ${levelDotColor[level]}`} />}
                      {score !== null && <span className="font-sans text-xs text-muted-foreground">{score}</span>}
                    </div>
                  </div>
                  <p className="font-sans text-xs text-foreground leading-snug line-clamp-2">{qa.questionText}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div ref={detailRef} className="border-t border-border/60 mb-12">
          <QuestionCard
            key={answers[selectedQ]?.questionId}
            questionNumber={selectedQ + 1}
            qa={answers[selectedQ]}
          />
        </div>

        <div className="pt-6 border-t border-border flex items-center gap-4 flex-wrap">
          <a href="/sessions" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Session history
          </a>
          <a href={`/r/${slug}?compact=true`} className="font-sans text-xs tracking-[0.08em] uppercase border border-border rounded px-4 py-2 hover:border-foreground/40 transition-colors">
            Morning of ↗
          </a>
          <a href="/setup" className="font-sans text-xs tracking-[0.08em] uppercase border border-border rounded px-4 py-2 hover:border-foreground/40 transition-colors">
            New session →
          </a>
        </div>

      </div>

      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Feedback report</p>
      </div>
    </main>
  )
}

export default function SavedReportPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-sans text-sm text-muted-foreground animate-pulse">Loading report…</p>
      </main>
    }>
      <SavedReportContent />
    </Suspense>
  )
}
