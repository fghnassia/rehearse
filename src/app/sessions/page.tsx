"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import type { ScoreLevel } from "@/lib/session-types"

interface SessionSummary {
  slug: string
  createdAt: string
  companyName: string
  roleTitle: string
  stage: "recruiter" | "hiring-manager" | "portfolio-review"
  overallLevel: ScoreLevel
  score: number | null
  weakSpots: string[]
  hasDebrief: boolean
}

interface CompanyGroup {
  companyName: string
  roleTitle: string
  lastActive: string
  stages: {
    recruiter: SessionSummary | null
    "hiring-manager": SessionSummary | null
    "portfolio-review": SessionSummary | null
  }
}

const DEMO_SESSIONS: SessionSummary[] = [
  { slug: "stripe-rec-1", createdAt: new Date(Date.now() - 1000*60*60*72).toISOString(), companyName: "Stripe", roleTitle: "Senior Product Designer, AI Platform", stage: "recruiter", overallLevel: "weak", score: 4.8, weakSpots: ["structure", "specificity"], hasDebrief: false },
  { slug: "stripe-rec-2", createdAt: new Date(Date.now() - 1000*60*60*24).toISOString(), companyName: "Stripe", roleTitle: "Senior Product Designer, AI Platform", stage: "recruiter", overallLevel: "moderate", score: 6.6, weakSpots: ["specificity"], hasDebrief: false },
  { slug: "stripe-hm-1", createdAt: new Date(Date.now() - 1000*60*60*2).toISOString(), companyName: "Stripe", roleTitle: "Senior Product Designer, AI Platform", stage: "hiring-manager", overallLevel: "moderate", score: 5.9, weakSpots: ["impact"], hasDebrief: false },
  { slug: "linear-rec-1", createdAt: new Date(Date.now() - 1000*60*60*48).toISOString(), companyName: "Linear", roleTitle: "Product Designer", stage: "recruiter", overallLevel: "strong", score: 8.2, weakSpots: [], hasDebrief: true },
]

const stageLabel: Record<string, string> = {
  recruiter: "Recruiter",
  "hiring-manager": "Hiring Mgr",
  "portfolio-review": "Portfolio",
}

const stageOrder: Array<"recruiter" | "hiring-manager" | "portfolio-review"> = [
  "recruiter", "hiring-manager", "portfolio-review"
]

const levelDot: Record<ScoreLevel, string> = {
  strong: "bg-[var(--state-positive-foreground)]",
  moderate: "bg-[var(--state-warning-foreground)]",
  weak: "bg-[var(--state-negative-foreground)]",
}

function groupByCompany(sessions: SessionSummary[]): CompanyGroup[] {
  const map = new Map<string, CompanyGroup>()

  for (const s of sessions) {
    const key = s.companyName.toLowerCase().trim()
    if (!map.has(key)) {
      map.set(key, {
        companyName: s.companyName,
        roleTitle: s.roleTitle,
        lastActive: s.createdAt,
        stages: { recruiter: null, "hiring-manager": null, "portfolio-review": null },
      })
    }
    const group = map.get(key)!
    // Keep most recent per stage
    const existing = group.stages[s.stage]
    if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
      group.stages[s.stage] = s
    }
    if (new Date(s.createdAt) > new Date(group.lastActive)) {
      group.lastActive = s.createdAt
      group.roleTitle = s.roleTitle
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  )
}

function scoreDelta(sessions: SessionSummary[], stage: string, currentSlug: string): number | null {
  const same = sessions
    .filter(s => s.stage === stage)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const idx = same.findIndex(s => s.slug === currentSlug)
  if (idx === -1 || idx === same.length - 1) return null
  const current = same[idx].score
  const prev = same[idx + 1].score
  if (current === null || prev === null) return null
  return Math.round((current - prev) * 10) / 10
}

function isOldEnoughForDebrief(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > 1000 * 60 * 60 * 24
}

function SessionsContent() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get("t")

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<"loading" | "sessions" | "email-form" | "email-sent">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      setSessions(DEMO_SESSIONS)
      setPhase("sessions")
      return
    }
    const tokenId = tokenFromUrl ?? localStorage.getItem("rehearse_token")
    if (!tokenId) { setPhase("email-form"); return }
    if (tokenFromUrl) localStorage.setItem("rehearse_token", tokenFromUrl)

    fetch(`/api/auth/verify?t=${tokenId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setSessions(data.sessions ?? []); setPhase("sessions") })
      .catch(() => { localStorage.removeItem("rehearse_token"); setPhase("email-form") })
  }, [tokenFromUrl, searchParams])

  const handleEmailSubmit = async () => {
    if (!email.includes("@")) return
    setLoading(true)
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setPhase("email-sent")
    } catch { setError("Something went wrong. Try again.") }
    finally { setLoading(false) }
  }

  if (phase === "loading") return (
    <div className="py-24 flex items-center justify-center">
      <p className="font-sans text-sm text-muted-foreground animate-pulse">Loading…</p>
    </div>
  )

  if (phase === "email-form") return (
    <div className="py-12">
      <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">Session history</p>
      <p className="font-sans text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
        Enter your email to access your saved sessions.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
          placeholder="your@email.com"
          className="font-sans text-sm bg-background border border-border rounded px-3 py-2 w-56 focus:outline-none focus:border-foreground/40 transition-colors"
        />
        <button
          onClick={handleEmailSubmit} disabled={loading || !email.includes("@")}
          className="font-sans text-xs tracking-[0.08em] uppercase px-4 py-2 border border-border rounded hover:border-foreground/40 transition-colors disabled:opacity-40"
        >
          {loading ? "Sending…" : "Send link →"}
        </button>
      </div>
      {error && <p className="font-sans text-xs text-destructive mt-2">{error}</p>}
    </div>
  )

  if (phase === "email-sent") return (
    <div className="py-12">
      <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-2">Session history</p>
      <p className="font-sans text-sm text-muted-foreground">Check your email — your session link is on its way.</p>
    </div>
  )

  const groups = groupByCompany(sessions)

  return (
    <div className="py-12">
      <div className="mb-10">
        <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-1">
          Session history
        </p>
        {sessions.length === 0 && (
          <p className="font-sans text-sm text-muted-foreground mt-6">
            You haven&apos;t saved any sessions yet.{" "}
            <a href="/setup" className="underline underline-offset-2 hover:text-foreground transition-colors">Start a session →</a>
          </p>
        )}
      </div>

      {groups.length > 0 && (
        <div className="flex flex-col gap-8">
          {groups.map(group => (
            <div key={group.companyName} className="border border-border rounded overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-4 border-b border-border/60 flex items-baseline justify-between">
                <div>
                  <p className="font-sans text-sm font-medium text-foreground">{group.companyName}</p>
                  <p className="font-sans text-xs text-muted-foreground">{group.roleTitle}</p>
                </div>
                <p className="font-sans text-xs text-muted-foreground/60">
                  {new Date(group.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>

              {/* Stage rows */}
              {stageOrder.map((stage, i) => {
                const s = group.stages[stage]
                const isLast = i === stageOrder.length - 1

                if (!s) {
                  return (
                    <div key={stage} className={`px-5 py-3 flex items-center justify-between ${!isLast ? "border-b border-border/40" : ""}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-xs text-muted-foreground/40 w-20">{stageLabel[stage]}</span>
                        <span className="font-sans text-xs text-muted-foreground/30">not started</span>
                      </div>
                      <a href="/setup" className="font-sans text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                        Start →
                      </a>
                    </div>
                  )
                }

                const delta = scoreDelta(sessions, stage, s.slug)
                const showDebrief = !s.hasDebrief && isOldEnoughForDebrief(s.createdAt)

                return (
                  <div key={stage} className={`px-5 py-3 hover:bg-muted/10 transition-colors ${!isLast ? "border-b border-border/40" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-xs text-muted-foreground w-20 shrink-0">{stageLabel[stage]}</span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${levelDot[s.overallLevel]}`} />
                        {s.score !== null && (
                          <span className="font-sans text-sm text-foreground">{s.score}</span>
                        )}
                        {delta !== null && (
                          <span className={`font-sans text-xs ${delta >= 0 ? "text-[var(--state-positive-foreground)]" : "text-[var(--state-negative-foreground)]"}`}>
                            {delta >= 0 ? `+${delta}` : delta}
                          </span>
                        )}
                        {s.weakSpots.length > 0 && (
                          <span className="font-sans text-xs text-muted-foreground/60 hidden sm:inline">
                            weak: {s.weakSpots.join(", ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {showDebrief && (
                          <a
                            href={`/r/${s.slug}?debrief=1`}
                            className="font-sans text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                          >
                            How did it go? →
                          </a>
                        )}
                        <a
                          href={`/r/${s.slug}?compact=true`}
                          className="font-sans text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        >
                          Morning of ↗
                        </a>
                        <a
                          href={`/r/${s.slug}`}
                          className="font-sans text-xs text-foreground hover:text-muted-foreground transition-colors"
                        >
                          Review →
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <a href="/setup" className="font-sans text-xs tracking-[0.08em] uppercase border border-border rounded px-4 py-2 hover:border-foreground/40 transition-colors inline-block">
          Start a new session →
        </a>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="w-full h-px bg-foreground/10" />
      <div className="flex items-center justify-between px-8 py-5">
        <a href="/" className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">
          Rehearse
        </a>
      </div>
      <div className="flex-1 px-8 max-w-3xl mx-auto w-full">
        <Suspense fallback={
          <div className="py-24 flex items-center justify-center">
            <p className="font-sans text-sm text-muted-foreground animate-pulse">Loading…</p>
          </div>
        }>
          <SessionsContent />
        </Suspense>
      </div>
      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Session history</p>
      </div>
    </main>
  )
}
