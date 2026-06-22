"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PipelineIndicator } from "@/components/pipeline-indicator"
import { CoverageIndicator } from "@/components/coverage-indicator"
import { ThumbsDown, X, Info } from "@phosphor-icons/react"
import { useSession } from "@/lib/session-context"
import type { ResearchData, ResearchSource } from "@/lib/session-types"
import { persistResearchSummary } from "@/lib/local-profile"

const statusMessages = [
  "Searching Glassdoor…",
  "Checking Reddit threads…",
  "Scanning Blind…",
  "Looking at LinkedIn…",
  "Reviewing company blog…",
  "Compiling what we found…",
]

export default function ResearchPage() {
  const router = useRouter()
  const { session, hydrated, updateResearch } = useSession()

  const [phase, setPhase] = useState<"searching" | "results" | "error">("searching")
  const [statusIndex, setStatusIndex] = useState(0)
  const [research, setResearch] = useState<ResearchData | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const hasFetched = useRef(false)

  // Cycle through status messages while searching — kept in its own effect so the
  // rotation survives StrictMode's mount/cleanup/mount cycle (the fetch guard below
  // would otherwise orphan an interval created inside it).
  useEffect(() => {
    if (phase !== "searching") return
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % statusMessages.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (!hydrated) return
    // Redirect if arrived without setup data
    if (!session.setup || !session.context) {
      router.replace("/")
      return
    }

    // Prevent double-fetch in React StrictMode
    if (hasFetched.current) return
    hasFetched.current = true

    fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobPostingUrl: session.setup.jobPostingUrl,
        companyName: session.context?.companyName,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(d.error ?? "Research failed"))
        return r.json()
      })
      .then((data: ResearchData) => {
        updateResearch(data)
        setResearch(data)
        if (data.synthesizedTakeaways && data.synthesizedTakeaways.length > 0) {
          persistResearchSummary({
            companyName: data.companyName,
            synthesizedTakeaways: data.synthesizedTakeaways,
            sourceCount: data.sourceCount,
            researchedAt: new Date().toISOString(),
          })
        }
        setPhase("results")
      })
      .catch((msg: string) => {
        setErrorMessage(typeof msg === "string" ? msg : "Research failed. Please try again.")
        setPhase("error")
      })
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="w-full h-px bg-foreground/10" />

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
          Rehearse
        </span>
        <PipelineIndicator currentStage="research" />
      </div>

      <div className="w-full h-px bg-foreground/5" />

      <div className="flex-1 px-8 py-14 max-w-xl">

        {/* State A — Searching */}
        {phase === "searching" && (
          <>
            <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Company research
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight text-foreground mb-3">
              Researching<br />
              <em>the company</em>
            </h1>
            <p className="font-sans text-sm text-muted-foreground mb-12 leading-relaxed">
              We're searching public sources for interview data. This takes a moment.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="font-sans text-sm text-foreground transition-all duration-300">
                  {statusMessages[statusIndex]}
                </p>
              </div>
            </div>
          </>
        )}

        {/* State B — Results */}
        {phase === "results" && research && (
          <>
            <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Company research
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight text-foreground mb-2">
              {research.companyName}
            </h1>
            <p className="font-sans text-sm text-muted-foreground mb-8">
              {research.roleTitle}
            </p>

            <CoverageIndicator
              level={research.coverageLevel}
              sourceCount={research.sourceCount}
              className="mb-8"
            />

            {research.synthesizedTakeaways && research.synthesizedTakeaways.length > 0 && (
              <div className="mb-8">
                <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-3">
                  What we found
                </p>
                <ul className="flex flex-col gap-2">
                  {research.synthesizedTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-foreground/40 shrink-0" />
                      <p className="font-sans text-sm text-foreground leading-relaxed">{takeaway}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {research.disclaimer && (
              <Alert className="mb-8">
                <AlertDescription className="font-sans text-xs text-muted-foreground leading-relaxed">
                  {research.disclaimer}
                </AlertDescription>
              </Alert>
            )}

            {research.sources.length > 0 && (
              <SourcesSummary
                sources={research.sources}
                onSourcesChange={(updated) => {
                  const next = { ...research, sources: updated }
                  updateResearch(next)
                  setResearch(next)
                }}
              />
            )}

            <Separator className="mb-8" />

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/confirm" />}
                nativeButton={false}
                className="font-sans text-xs tracking-[0.1em] uppercase text-muted-foreground"
              >
                ←
              </Button>
              <Button
                size="lg"
                className="font-sans text-sm tracking-[0.1em] uppercase px-8"
                onClick={() => router.push("/simulation")}
              >
                Start simulation →
              </Button>
            </div>
          </>
        )}

        {/* State — Error */}
        {phase === "error" && (
          <>
            <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Company research
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight text-foreground mb-8">
              Something went wrong
            </h1>
            <Alert variant="destructive" className="mb-8">
              <AlertDescription className="font-sans text-xs">{errorMessage}</AlertDescription>
            </Alert>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  hasFetched.current = false
                  setPhase("searching")
                  setStatusIndex(0)
                }}
              >
                Try again
              </Button>
              <Button
                variant="ghost"
                render={<Link href="/setup" />}
                nativeButton={false}
              >
                ← Change inputs
              </Button>
            </div>
          </>
        )}

      </div>

      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Company research</p>
      </div>
    </main>
  )
}

function SourcesSummary({
  sources,
  onSourcesChange,
}: {
  sources: ResearchSource[]
  onSourcesChange: (updated: ResearchSource[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [downvotedIndex, setDownvotedIndex] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackSent, setFeedbackSent] = useState(false)


  const domains = [...new Set(
    sources.map(s => { try { return new URL(s.url).hostname.replace("www.", "") } catch { return null } })
      .filter(Boolean)
  )].slice(0, 6) as string[]

  function removeSource(index: number) {
    onSourcesChange(sources.filter((_, i) => i !== index))
  }

  async function submitFeedback() {
    const source = downvotedIndex !== null ? sources[downvotedIndex] : null
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, feedback: feedbackText, companyName: sources[0]?.title }),
    }).catch(() => {})
    setFeedbackSent(true)
    setTimeout(() => {
      setDownvotedIndex(null)
      setFeedbackText("")
      setFeedbackSent(false)
    }, 1500)
  }

  return (
    <div className="mb-8">
      <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">
        Sources
      </p>

      {/* Compact summary row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="font-sans text-sm text-foreground font-medium">
          {sources.length} source{sources.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1.5">
          {domains.map((domain) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={domain}
              src={`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=32`}
              alt={domain}
              title={domain}
              className="w-4 h-4 rounded-sm opacity-70"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          ))}
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="font-sans text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          {open ? "Hide" : "See titles"}
        </button>
      </div>

      {/* Expandable list with feedback controls */}
      {open && (
        <div className="flex flex-col gap-1 mb-4">
          {sources.map((source, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${source.url}&size=32`}
                alt=""
                className="w-3.5 h-3.5 rounded-sm shrink-0 opacity-60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
              <span className="font-sans text-sm text-foreground leading-snug flex-1 min-w-0 truncate">
                {source.title}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {/* (i) — why this source appears */}
                <div className="relative group/tooltip">
                  <button className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors" aria-label="Why this source">
                    <Info size={13} />
                  </button>
                  {source.snippet && (
                    <div className="absolute right-0 bottom-full mb-1.5 w-56 bg-foreground text-background font-sans text-xs leading-relaxed p-2.5 rounded shadow-lg z-10 hidden group-hover/tooltip:block">
                      {source.snippet.slice(0, 160)}{source.snippet.length > 160 ? "…" : ""}
                    </div>
                  )}
                </div>
                {/* thumbs down → feedback modal */}
                <button
                  onClick={() => setDownvotedIndex(i)}
                  className="p-1 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
                  aria-label="Not helpful"
                >
                  <ThumbsDown size={13} />
                </button>
                <button
                  onClick={() => removeSource(i)}
                  className="p-1 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
                  aria-label="Remove source"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Thumbs-down feedback modal */}
          {downvotedIndex !== null && (
            <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDownvotedIndex(null)}>
              <div className="bg-background border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">What did we miss?</p>
                  <button onClick={() => setDownvotedIndex(null)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" aria-label="Close">✕</button>
                </div>
                {feedbackSent ? (
                  <p className="font-sans text-sm text-foreground">Thanks — we'll look into it.</p>
                ) : (
                  <>
                    <textarea
                      autoFocus
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="e.g. Wrong company, not specific enough, outdated…"
                      className="w-full font-sans text-sm border border-border rounded p-3 min-h-[100px] resize-none bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-4"
                    />
                    <button
                      onClick={submitFeedback}
                      disabled={!feedbackText.trim()}
                      className="font-sans text-xs tracking-[0.1em] uppercase bg-foreground text-background px-4 py-2 rounded disabled:opacity-40 hover:bg-foreground/80 transition-colors w-full"
                    >
                      Send feedback
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

