"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PipelineIndicator } from "@/components/pipeline-indicator"
import { QuestionCard } from "@/components/question-card"
import { DonutChart } from "@/components/score-display"
import { useSession } from "@/lib/session-context"
import type { QAPair, ScoreLevel } from "@/lib/session-types"
import { SavePrompt } from "@/components/save-prompt"
import { appendScoreSnapshot } from "@/lib/local-profile"
import { ThemeToggle } from "@/components/theme-toggle"

type ReportPhase = "generating" | "ready" | "error"
type ExportMenu = "transcript" | "feedback" | null

const levelValue: Record<ScoreLevel, number> = { weak: 1, moderate: 2, strong: 3 }

function qaScore(qa: QAPair): number | null {
  // A skipped question counts as 0 toward the overall score — no credit for not answering.
  if (qa.status === "skipped") return 0
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

function buildTranscriptMD(
  companyName: string,
  roleTitle: string,
  stage: string,
  answers: QAPair[]
): string {
  const lines = [
    `# Interview Transcript`,
    `**${companyName}** · ${roleTitle} · ${stage.replace("-", " ")}`,
    ``,
  ]
  answers.forEach((qa, i) => {
    lines.push(`## Q${i + 1}`)
    lines.push(qa.questionText)
    lines.push(``)
    lines.push(`**Your answer:**`)
    lines.push(qa.userAnswer)
    lines.push(``)
  })
  return lines.join("\n")
}

function buildFeedbackMD(
  companyName: string,
  roleTitle: string,
  stage: string,
  overallLevel: ScoreLevel,
  overallSummary: string,
  score: number | null,
  answers: QAPair[]
): string {
  const lines = [
    `# Interview Feedback Report`,
    `**${companyName}** · ${roleTitle} · ${stage.replace("-", " ")}`,
    ``,
    `## Overall${score !== null ? ` — ${score}/10` : ""}`,
    `**${overallConfig[overallLevel].label}**`,
    overallSummary,
    ``,
  ]
  answers.forEach((qa, i) => {
    lines.push(`## Q${i + 1}: ${qa.questionText}`)
    if (qa.scores) {
      lines.push(`**Scores:** ${qa.scores.map(s => `${s.criterion} — ${s.level}`).join(" | ")}`)
    }
    if (qa.whatWorked) lines.push(`\n**What worked:** ${qa.whatWorked}`)
    if (qa.whatToImprove) lines.push(`\n**What to improve:** ${qa.whatToImprove}`)
    if (qa.sampleAnswer) lines.push(`\n**Stronger answer:** ${qa.sampleAnswer}`)
    lines.push(``)
  })
  return lines.join("\n")
}

function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Print an isolated HTML document (its own window) so the output is just this
// content — e.g. a transcript PDF, not the whole report page that window.print() grabs.
function printHtmlDocument(title: string, bodyHtml: string) {
  const w = window.open("", "_blank")
  if (!w) return
  w.document.write(
    `<html><head><meta charset="UTF-8"><title>${title}</title>` +
    `<style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;max-width:700px;margin:40px auto;padding:0 24px;color:#1a1a1a;}` +
    `h1{font-size:20pt;font-weight:600;}h2{font-size:13pt;margin-top:22px;}p{margin:6px 0;}</style></head>` +
    `<body>${bodyHtml}</body></html>`
  )
  w.document.close()
  w.focus()
  // Let the new window paint before invoking the print dialog.
  setTimeout(() => w.print(), 300)
}

function mdToSimpleHtml(md: string): string {
  return md
    .split("\n")
    .map(line => {
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`
      if (line.startsWith("**") && line.endsWith("**")) return `<strong>${line.slice(2, -2)}</strong>`
      if (line === "") return `<br/>`
      return `<p>${line}</p>`
    })
    .join("")
}

export default function ReportPage() {
  const router = useRouter()
  const { session, hydrated, updateSimulation, updateReport, clearSession } = useSession()

  const [phase, setPhase] = useState<ReportPhase>("generating")
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<QAPair[]>([])
  const [overallLevel, setOverallLevel] = useState<ScoreLevel>("moderate")
  const [overallSummary, setOverallSummary] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedQ, setSelectedQ] = useState(0)
  const [openExport, setOpenExport] = useState<ExportMenu>(null)
  const [copied, setCopied] = useState(false)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const hasFetched = useRef(false)
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hydrated) return
    if (!session.simulation || !session.setup || !session.context) {
      router.replace("/")
      return
    }
    if (session.simulation.answers.length === 0) {
      router.replace("/simulation")
      return
    }
    if (hasFetched.current) return
    hasFetched.current = true

    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        simulation: session.simulation,
        stage: session.setup.stage,
        companyName: session.context.companyName,
        roleTitle: session.context.roleTitle,
      }),
    })
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error ?? "Report failed")))
      .then((data) => {
        setEvaluatedAnswers(data.evaluatedAnswers)
        setOverallLevel(data.overallImpressionLevel)
        setOverallSummary(data.overallImpressionSummary)
        updateSimulation({ ...session.simulation!, answers: data.evaluatedAnswers })
        updateReport({
          overallImpressionLevel: data.overallImpressionLevel,
          overallImpressionSummary: data.overallImpressionSummary,
          generatedAt: data.generatedAt,
        })
        setPhase("ready")

        // Persist score snapshot to local profile
        try {
          const answeredWithScores = (data.evaluatedAnswers as QAPair[]).filter(qa => qa.scores && qa.scores.length > 0)
          const criterionMap: Record<string, string> = {
            "Clarity": "structure",
            "Specificity": "specificity",
            "Relevance": "relevance",
            "AI fluency": "aiFluency",
            "Overall impression": "communication",
          }
          const accum: Record<string, { sum: number; count: number }> = {
            structure: { sum: 0, count: 0 },
            specificity: { sum: 0, count: 0 },
            relevance: { sum: 0, count: 0 },
            communication: { sum: 0, count: 0 },
            aiFluency: { sum: 0, count: 0 },
          }
          for (const qa of answeredWithScores) {
            for (const s of qa.scores!) {
              const key = criterionMap[s.criterion]
              if (key && key in accum) {
                accum[key].sum += levelValue[s.level]
                accum[key].count++
              }
            }
          }
          const criteriaScores = Object.fromEntries(
            Object.entries(accum).map(([k, { sum, count }]) => [
              k, count > 0 ? Math.round((sum / (count * 3)) * 10 * 10) / 10 : 0,
            ])
          ) as { structure: number; specificity: number; relevance: number; communication: number; aiFluency: number }

          const overallScoreValue = overallNumericScore(data.evaluatedAnswers)
          const stageMap: Record<string, "recruiter" | "hiring_manager" | "portfolio_review"> = {
            "recruiter": "recruiter",
            "hiring-manager": "hiring_manager",
            "portfolio-review": "portfolio_review",
          }
          appendScoreSnapshot({
            sessionId: crypto.randomUUID(),
            company: session.context!.companyName,
            role: session.context!.roleTitle,
            stage: stageMap[session.setup!.stage] ?? "recruiter",
            date: new Date().toISOString(),
            overallScore: overallScoreValue ?? 0,
            criteriaScores,
            questions: session.simulation?.questions ?? [],
          })
        } catch {
          // Non-fatal: local profile persistence is best-effort
        }
      })
      .catch((msg: string) => {
        setErrorMessage(typeof msg === "string" ? msg : "Failed to generate report.")
        setPhase("error")
      })
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  const numericScore = overallNumericScore(evaluatedAnswers)
  const scorePercent = numericScore !== null ? (numericScore / 10) * 100 : 0

  // Derive the displayed level from the numeric score so the badge (and the exported
  // feedback) can't contradict the X/10 — skipped questions count as 0 and can pull the
  // score well below the AI's holistic impression. Fall back to the AI level if no score.
  const displayLevel: ScoreLevel = numericScore !== null
    ? (numericScore >= 7 ? "strong" : numericScore >= 4 ? "moderate" : "weak")
    : overallLevel

  const handleSelectQ = (idx: number) => {
    setSelectedQ(idx)
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  const handleCopy = () => {
    if (!session.context || !session.setup) return
    const md = buildFeedbackMD(
      session.context.companyName,
      session.context.roleTitle,
      session.setup.stage,
      displayLevel,
      overallSummary,
      numericScore,
      evaluatedAnswers
    )
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    setOpenExport(null)
  }

  const handleDownloadTranscript = (format: "md" | "docx" | "pdf") => {
    if (!session.context || !session.setup) return
    const md = buildTranscriptMD(
      session.context.companyName,
      session.context.roleTitle,
      session.setup.stage,
      evaluatedAnswers
    )
    const slug = session.context.companyName.toLowerCase().replace(/\s+/g, "-")
    if (format === "md") {
      triggerDownload(`${slug}-transcript.md`, md, "text/markdown")
    } else if (format === "pdf") {
      printHtmlDocument(`${slug}-transcript`, mdToSimpleHtml(md))
    } else {
      const html = `<html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;max-width:700px;margin:40px auto;}</style></head><body>${mdToSimpleHtml(md)}</body></html>`
      triggerDownload(`${slug}-transcript.doc`, html, "application/vnd.ms-word")
    }
    setOpenExport(null)
  }

  const handleDownloadFeedback = (format: "md" | "docx" | "pdf") => {
    if (!session.context || !session.setup) return
    if (format === "pdf") {
      setOpenExport(null)
      setTimeout(() => window.print(), 100)
      return
    }
    const md = buildFeedbackMD(
      session.context.companyName,
      session.context.roleTitle,
      session.setup.stage,
      displayLevel,
      overallSummary,
      numericScore,
      evaluatedAnswers
    )
    const slug = session.context.companyName.toLowerCase().replace(/\s+/g, "-")
    if (format === "md") {
      triggerDownload(`${slug}-feedback.md`, md, "text/markdown")
    } else {
      const html = `<html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;max-width:700px;margin:40px auto;}</style></head><body>${mdToSimpleHtml(md)}</body></html>`
      triggerDownload(`${slug}-feedback.doc`, html, "application/vnd.ms-word")
    }
    setOpenExport(null)
  }

  const handleRedo = () => {
    updateSimulation({ ...session.simulation!, answers: [], questions: [] })
    router.push("/simulation")
  }

  const handleDifferentStage = () => {
    updateSimulation({ ...session.simulation!, answers: [], questions: [] })
    router.push("/setup")
  }

  const overall = overallConfig[displayLevel]

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="w-full h-px bg-foreground/10" />

      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
          Rehearse
        </span>
        <PipelineIndicator currentStage="report" />
      </div>

      <div className="w-full h-px bg-foreground/5" />

      <div className="flex-1 px-8 py-14 max-w-3xl">

        {/* Generating */}
        {phase === "generating" && (
          <>
            <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Feedback report
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight mb-8">
              Scoring your<br /><em>answers…</em>
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="font-sans text-sm text-muted-foreground">Evaluating all answers in parallel…</p>
            </div>
          </>
        )}

        {/* Error */}
        {phase === "error" && (
          <>
            <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Feedback report
            </p>
            <Alert variant="destructive" className="mb-8">
              <AlertDescription className="font-sans text-sm">{errorMessage}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => { hasFetched.current = false; setPhase("generating") }}>
              Try again
            </Button>
          </>
        )}

        {/* Report */}
        {phase === "ready" && session.context && session.setup && (
          <>
            {/* Header */}
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
            </div>

            {/* Overall + numeric score */}
            <div className="mb-10 p-6 border border-border rounded">
              <div className="flex items-start justify-between gap-6 mb-4">
                <div className="flex flex-col gap-2">
                  <span className={`self-start font-sans text-xs font-medium tracking-[0.1em] uppercase px-2.5 py-1 rounded ${overall.bg} ${overall.text}`}>
                    {overall.label}
                  </span>
                  <p className="font-sans text-sm text-foreground leading-relaxed max-w-md">{overallSummary}</p>
                </div>
                {numericScore !== null && (
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <p className="font-heading text-4xl font-light text-foreground leading-none">
                      {numericScore}<span className="text-muted-foreground text-lg">/10</span>
                    </p>
                    {/* Spectrum bar */}
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

            {/* Save prompt — above question grid so it's seen */}
            {session.setup && session.context && session.simulation && session.report && (
              <div className="mb-10">
                <SavePrompt
                  setup={session.setup}
                  context={session.context}
                  simulation={session.simulation}
                  report={session.report}
                  onSaved={(_tokenId, slug) => setSavedSlug(slug)}
                />
              </div>
            )}

            {/* Question grid */}
            <div className="mb-2">
              <div className="flex items-baseline gap-3 mb-4">
                <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
                  Questions
                </p>
                {(() => {
                  const skipped = evaluatedAnswers.filter(qa => qa.status === "skipped").length
                  return skipped > 0 ? (
                    <p className="font-sans text-xs text-muted-foreground">
                      {skipped} of {evaluatedAnswers.length} skipped
                    </p>
                  ) : null
                })()}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {evaluatedAnswers.map((qa, i) => {
                  const isSkipped = qa.status === "skipped"
                  const level = isSkipped ? null : qaLevel(qa)
                  const score = isSkipped ? null : qaScore(qa)
                  const isSelected = selectedQ === i
                  return (
                    <button
                      key={qa.questionId}
                      onClick={() => handleSelectQ(i)}
                      className={`text-left p-4 rounded border transition-colors ${
                        isSelected
                          ? "border-foreground bg-muted/40"
                          : "border-border hover:border-foreground/40 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                          Q{i + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isSkipped ? (
                            <span className="font-sans text-[10px] tracking-[0.08em] uppercase text-muted-foreground/60">
                              Skipped
                            </span>
                          ) : (
                            <>
                              {level && (
                                <span className={`inline-block w-2 h-2 rounded-full ${levelDotColor[level]}`} />
                              )}
                              {score !== null && (
                                <span className="font-sans text-xs text-muted-foreground">{score}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <p className="font-sans text-xs text-foreground leading-snug line-clamp-2">
                        {qa.questionText}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Question detail */}
            <div ref={detailRef} className="border-t border-border/60 mb-12">
              <QuestionCard
                key={evaluatedAnswers[selectedQ]?.questionId}
                questionNumber={selectedQ + 1}
                qa={evaluatedAnswers[selectedQ]}
              />
            </div>

            {/* Export section */}
            <div className="mb-12 pt-2">
              <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                Export
              </p>
              <div className="flex flex-wrap items-start gap-3">
                {/* Download transcript */}
                <div className="relative">
                  <button
                    onClick={() => setOpenExport(v => v === "transcript" ? null : "transcript")}
                    className={`font-sans text-xs tracking-[0.08em] uppercase px-4 py-2 border rounded transition-colors flex items-center gap-2 ${
                      openExport === "transcript" ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/40"
                    }`}
                  >
                    Download transcript <span className="text-muted-foreground">→</span>
                  </button>
                  {openExport === "transcript" && (
                    <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded shadow-md py-1 z-10 min-w-[160px]">
                      <button
                        onClick={() => handleDownloadTranscript("md")}
                        className="w-full text-left px-4 py-2 font-sans text-xs text-foreground hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        MD <span className="text-muted-foreground text-[10px]">Best for AI</span>
                      </button>
                      <button
                        onClick={() => handleDownloadTranscript("docx")}
                        className="w-full text-left px-4 py-2 font-sans text-xs text-foreground hover:bg-muted/50 transition-colors"
                      >
                        DOCX
                      </button>
                      <button
                        onClick={() => handleDownloadTranscript("pdf")}
                        className="w-full text-left px-4 py-2 font-sans text-xs text-foreground hover:bg-muted/50 transition-colors"
                      >
                        PDF
                      </button>
                    </div>
                  )}
                </div>

                {/* Download feedback */}
                <div className="relative">
                  <button
                    onClick={() => setOpenExport(v => v === "feedback" ? null : "feedback")}
                    className={`font-sans text-xs tracking-[0.08em] uppercase px-4 py-2 border rounded transition-colors flex items-center gap-2 ${
                      openExport === "feedback" ? "border-foreground bg-muted/40" : "border-border hover:border-foreground/40"
                    }`}
                  >
                    Download feedback <span className="text-muted-foreground">→</span>
                  </button>
                  {openExport === "feedback" && (
                    <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded shadow-md py-1 z-10 min-w-[160px]">
                      <button
                        onClick={() => handleDownloadFeedback("md")}
                        className="w-full text-left px-4 py-2 font-sans text-xs text-foreground hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        MD <span className="text-muted-foreground text-[10px]">Best for AI</span>
                      </button>
                      <button
                        onClick={() => handleDownloadFeedback("docx")}
                        className="w-full text-left px-4 py-2 font-sans text-xs text-foreground hover:bg-muted/50 transition-colors"
                      >
                        DOCX
                      </button>
                      <button
                        onClick={() => handleDownloadFeedback("pdf")}
                        className="w-full text-left px-4 py-2 font-sans text-xs text-foreground hover:bg-muted/50 transition-colors"
                      >
                        PDF
                      </button>
                    </div>
                  )}
                </div>

                {/* Copy */}
                <button
                  onClick={handleCopy}
                  className="font-sans text-xs tracking-[0.08em] uppercase px-4 py-2 border border-border rounded hover:border-foreground/40 transition-colors"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* Close export menus on outside click */}
            {openExport && (
              <div className="fixed inset-0 z-0" onClick={() => setOpenExport(null)} />
            )}

            {/* What's next */}
            <div className="pt-6 border-t border-border mb-10">
              <p className="font-sans text-xs text-muted-foreground mb-4 tracking-[0.1em] uppercase">What&apos;s next?</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  onClick={handleRedo}
                  className="font-sans text-xs tracking-[0.1em] uppercase"
                >
                  Redo this stage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDifferentStage}
                  className="font-sans text-xs tracking-[0.1em] uppercase"
                >
                  Prep a different stage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { clearSession(); router.push("/") }}
                  className="font-sans text-xs tracking-[0.1em] uppercase text-muted-foreground"
                >
                  Start fresh
                </Button>
              </div>
            </div>

            {/* Quiet nav to the cross-session profile (built from local snapshots) */}
            <div className="mb-6">
              <a href="/profile" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
                View your profile →
              </a>
            </div>

            {/* Session notice — resolves with the save prompt above rather than contradicting it */}
            {savedSlug ? (
              <p className="font-sans text-xs text-muted-foreground/60 leading-relaxed">
                Saved. You can reach this report any time from your{" "}
                <a href={`/r/${savedSlug}`} className="underline underline-offset-2 hover:text-foreground transition-colors">
                  permanent link
                </a>{" "}
                or your{" "}
                <a href="/profile" className="underline underline-offset-2 hover:text-foreground transition-colors">
                  profile
                </a>.
              </p>
            ) : (
              <p className="font-sans text-xs text-muted-foreground/60 leading-relaxed">
                This report isn&apos;t saved yet — it&apos;ll disappear when you close the tab. Save it above, or export a copy before you leave.
              </p>
            )}
          </>
        )}

      </div>

      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Feedback report</p>
      </div>

      <ThemeToggle />
    </main>
  )
}
