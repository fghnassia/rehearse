"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PipelineIndicator } from "@/components/pipeline-indicator"
import { CoverageIndicator } from "@/components/coverage-indicator"
import { useSession } from "@/lib/session-context"
import type { ResearchData, ResearchSource } from "@/lib/session-types"

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

    // Cycle through status messages while fetching
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % statusMessages.length)
    }, 1200)

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
        clearInterval(interval)
        updateResearch(data)
        setResearch(data)
        setPhase("results")
      })
      .catch((msg: string) => {
        clearInterval(interval)
        setErrorMessage(typeof msg === "string" ? msg : "Research failed. Please try again.")
        setPhase("error")
      })

    return () => clearInterval(interval)
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="w-full h-px bg-foreground/10" />

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5">
        <Link
          href="/"
          className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Rehearse
        </Link>
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

            {research.disclaimer && (
              <Alert className="mb-8">
                <AlertDescription className="font-sans text-xs text-muted-foreground leading-relaxed">
                  {research.disclaimer}
                </AlertDescription>
              </Alert>
            )}

            {research.sources.length > 0 && (
              <SourcesSummary sources={research.sources} />
            )}

            <Separator className="mb-8" />

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/setup" />}
                nativeButton={false}
                className="font-sans text-xs tracking-[0.1em] uppercase text-muted-foreground"
              >
                ← Change inputs
              </Button>
              <Button
                size="lg"
                className="font-sans text-sm tracking-[0.1em] uppercase px-8"
                onClick={() => router.push("/simulation")}
              >
                Begin Simulation →
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

function SourcesSummary({ sources }: { sources: ResearchSource[] }) {
  const [open, setOpen] = useState(false)

  // Dedupe domains for favicon strip
  const domains = [...new Set(
    sources.map(s => { try { return new URL(s.url).hostname.replace("www.", "") } catch { return null } })
      .filter(Boolean)
  )].slice(0, 6) as string[]

  return (
    <div className="mb-8">
      <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">
        Sources
      </p>

      {/* Compact summary row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="font-sans text-sm text-foreground font-medium">{sources.length} source{sources.length !== 1 ? "s" : ""}</span>
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

      {/* Expandable title list — no external links */}
      {open && (
        <ul className="flex flex-col gap-2 border-l-2 border-border pl-4">
          {sources.map((source, i) => (
            <li key={i} className="flex items-start gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${source.url}&size=32`}
                alt=""
                className="w-3.5 h-3.5 rounded-sm mt-0.5 shrink-0 opacity-60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
              <span className="font-sans text-sm text-foreground leading-snug">{source.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

