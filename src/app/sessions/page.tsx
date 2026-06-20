"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import type { ScoreLevel } from "@/lib/session-types"

interface SessionSummary {
  slug: string
  createdAt: string
  companyName: string
  roleTitle: string
  stage: string
  overallLevel: ScoreLevel
  score: number | null
  hasDebrief: boolean
}

const levelDot: Record<ScoreLevel, string> = {
  strong:   "bg-[var(--state-positive-foreground)]",
  moderate: "bg-[var(--state-warning-foreground)]",
  weak:     "bg-[var(--state-negative-foreground)]",
}

const levelLabel: Record<ScoreLevel, string> = {
  strong: "Strong",
  moderate: "Solid",
  weak: "Needs work",
}

function SessionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenFromUrl = searchParams.get("t")

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<"loading" | "sessions" | "email-form" | "email-sent" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    const tokenId = tokenFromUrl ?? localStorage.getItem("rehearse_token")
    if (!tokenId) {
      setPhase("email-form")
      return
    }
    if (tokenFromUrl) {
      localStorage.setItem("rehearse_token", tokenFromUrl)
    }
    fetch(`/api/auth/verify?t=${tokenId}`)
      .then(r => {
        if (!r.ok) throw new Error("Invalid or expired token")
        return r.json()
      })
      .then(data => {
        setSessions(data.sessions ?? [])
        setPhase("sessions")
      })
      .catch(() => {
        localStorage.removeItem("rehearse_token")
        setPhase("email-form")
      })
  }, [tokenFromUrl])

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
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-sans text-sm text-muted-foreground animate-pulse">Loading…</p>
      </div>
    )
  }

  if (phase === "email-form") {
    return (
      <div className="py-12">
        <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
          Session history
        </p>
        <p className="font-sans text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
          Enter your email to receive a link to your saved sessions.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
            placeholder="your@email.com"
            className="font-sans text-sm bg-background border border-border rounded px-3 py-2 w-56 focus:outline-none focus:border-foreground/40 transition-colors"
          />
          <button
            onClick={handleEmailSubmit}
            disabled={loading || !email.includes("@")}
            className="font-sans text-xs tracking-[0.08em] uppercase px-4 py-2 border border-border rounded hover:border-foreground/40 transition-colors disabled:opacity-40"
          >
            {loading ? "Sending…" : "Send link →"}
          </button>
        </div>
        {error && <p className="font-sans text-xs text-destructive mt-2">{error}</p>}
      </div>
    )
  }

  if (phase === "email-sent") {
    return (
      <div className="py-12">
        <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-2">
          Session history
        </p>
        <p className="font-sans text-sm text-muted-foreground">
          Check your email — your session link is on its way.
        </p>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="flex items-baseline justify-between mb-8">
        <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground">
          Session history
        </p>
        <p className="font-sans text-xs text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
      </div>

      {sessions.length === 0 ? (
        <p className="font-sans text-sm text-muted-foreground">No sessions saved yet.</p>
      ) : (
        <div className="flex flex-col gap-px border border-border rounded overflow-hidden">
          {sessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(s => (
              <a
                key={s.slug}
                href={`/r/${s.slug}`}
                className="flex items-center justify-between px-5 py-4 bg-background hover:bg-muted/20 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${levelDot[s.overallLevel]}`} />
                  <div>
                    <p className="font-sans text-sm text-foreground">{s.companyName}</p>
                    <p className="font-sans text-xs text-muted-foreground">
                      {s.roleTitle} · {s.stage.replace("-", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {s.score !== null && (
                    <p className="font-heading text-xl font-light text-foreground">
                      {s.score}<span className="text-muted-foreground text-sm">/10</span>
                    </p>
                  )}
                  <div className="text-right">
                    <p className="font-sans text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="font-sans text-[10px] text-muted-foreground/60">
                      {levelLabel[s.overallLevel]}
                    </p>
                  </div>
                  <span className="font-sans text-xs text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">→</span>
                </div>
              </a>
            ))}
        </div>
      )}

      <div className="mt-8">
        <a href="/" className="font-sans text-xs tracking-[0.08em] uppercase border border-border rounded px-4 py-2 hover:border-foreground/40 transition-colors inline-block">
          Start a new session →
        </a>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 px-8 max-w-3xl mx-auto w-full">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
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
