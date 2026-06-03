"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PipelineIndicator } from "@/components/pipeline-indicator"
import { useSession } from "@/lib/session-context"
import type { ContextData } from "@/lib/session-types"

const stageLabels: Record<string, string> = {
  "recruiter": "Recruiter Screen",
  "hiring-manager": "Hiring Manager Round",
  "portfolio-review": "Portfolio Review",
}

export default function ConfirmPage() {
  const router = useRouter()
  const { session, hydrated, updateContext } = useSession()

  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [context, setContext] = useState<ContextData | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const hasFetched = useRef(false)

  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState("")
  const [pasteSaved, setPasteSaved] = useState(false)

  const handleSavePaste = () => {
    if (!pasteValue.trim() || !context) return
    const updated = { ...context, jobDescriptionOverride: pasteValue.trim() }
    updateContext(updated)
    setContext(updated)
    setPasteSaved(true)
    setPasteOpen(false)
  }

  useEffect(() => {
    if (!hydrated) return
    if (!session.setup) {
      router.replace("/")
      return
    }
    if (hasFetched.current) return
    hasFetched.current = true

    fetch("/api/parse-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: session.setup.resumeText,
        jobPostingUrl: session.setup.jobPostingUrl,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(d.error ?? "Failed"))
        return r.json()
      })
      .then((data: ContextData) => {
        updateContext(data)
        setContext(data)
        setPhase("ready")
      })
      .catch((msg: string) => {
        setErrorMessage(typeof msg === "string" ? msg : "Something went wrong.")
        setPhase("error")
      })
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  const stageLabel = session.setup ? stageLabels[session.setup.stage] ?? session.setup.stage : ""

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="w-full h-px bg-foreground/10" />

      <div className="flex items-center justify-between px-8 py-5">
        <Link
          href="/"
          className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Rehearse
        </Link>
        <PipelineIndicator currentStage="setup" />
      </div>

      <div className="w-full h-px bg-foreground/5" />

      <div className="flex-1 px-8 py-14 max-w-xl">

        {/* Loading */}
        {phase === "loading" && (
          <>
            <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Reading your inputs
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight text-foreground mb-8">
              One moment…
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="font-sans text-sm text-muted-foreground">Parsing your resume and job posting…</p>
            </div>
          </>
        )}

        {/* Ready */}
        {phase === "ready" && context && (
          <>
            <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Did I get that right?
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight text-foreground mb-10">
              Here's what<br />
              <em>I understood</em>
            </h1>

            {/* Company + Role */}
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex flex-col gap-1">
                <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Company
                </p>
                <div className="flex items-center gap-3">
                  {context.logoUrl && (
                    <CompanyLogo src={context.logoUrl} name={context.companyName} />
                  )}
                  <p className="font-sans text-lg font-medium text-foreground">
                    {context.companyName}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                  Role
                </p>
                <p className="font-sans text-lg font-medium text-foreground">
                  {context.roleTitle}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                  Interview stage
                </p>
                <p className="font-sans text-lg font-medium text-foreground">
                  {stageLabel}
                </p>
              </div>
            </div>

            {/* Job insights */}
            <Separator className="mb-10" />
            <div className="flex flex-col gap-6 mb-4">
              <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                What we found in the posting
              </p>
              {context.jobInsights.length > 0 ? (
                context.jobInsights.map((insight, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <p className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
                      {insight.category}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {insight.points.map((point, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className="font-sans text-xs text-muted-foreground mt-1 shrink-0">—</span>
                          <span className="font-sans text-sm text-foreground leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  We couldn't extract structured data from this posting.
                </p>
              )}
            </div>

            {/* Job description paste fallback */}
            <div className="mb-10">
              {pasteSaved ? (
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                  ✓ Job description saved — we'll use it to tailor your questions.
                </p>
              ) : (
                <>
                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                    Not what you expected?{" "}
                    <button
                      onClick={() => setPasteOpen((v) => !v)}
                      className="underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      Paste the job description as plain text
                    </button>{" "}
                    and we'll use that instead.
                  </p>
                  {pasteOpen && (
                    <div className="mt-4 flex flex-col gap-3">
                      <Textarea
                        placeholder="Paste the full job description here…"
                        value={pasteValue}
                        onChange={(e) => setPasteValue(e.target.value)}
                        className="font-sans text-sm min-h-[160px] resize-y"
                        autoFocus
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={handleSavePaste}
                          disabled={!pasteValue.trim()}
                          className="font-sans text-xs tracking-[0.1em] uppercase"
                        >
                          Save description
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setPasteOpen(false); setPasteValue("") }}
                          className="font-sans text-xs text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator className="mb-10" />

            {/* Resume summary */}
            <div className="flex flex-col gap-4 mb-10">
              <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                Your profile
              </p>
              <ul className="flex flex-col gap-3">
                {context.resumeBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-sans text-xs text-muted-foreground mt-1 shrink-0">—</span>
                    <span className="font-sans text-sm text-foreground leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
              <p className="font-sans text-xs text-muted-foreground mt-1 leading-relaxed">
                Not quite right? Go back and check your resume PDF — we read it as plain text.
              </p>
            </div>

            <Separator className="mb-10" />

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
                onClick={() => router.push("/research")}
              >
                Looks right — start research →
              </Button>
            </div>
          </>
        )}

        {/* Error */}
        {phase === "error" && (
          <>
            <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Something went wrong
            </p>
            <Alert variant="destructive" className="mb-8">
              <AlertDescription className="font-sans text-xs">{errorMessage}</AlertDescription>
            </Alert>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  hasFetched.current = false
                  setPhase("loading")
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
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Confirm context</p>
      </div>
    </main>
  )
}

function CompanyLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} logo`}
      className="w-8 h-8 rounded-md object-contain bg-white border border-border p-0.5"
      onError={() => setFailed(true)}
    />
  )
}
