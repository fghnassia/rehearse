"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface LastSession {
  slug: string
  companyName: string
}

export default function Home() {
  const [lastSession, setLastSession] = useState<LastSession | null>(null)

  useEffect(() => {
    const tokenId = localStorage.getItem("rehearse_token")
    if (!tokenId) return
    fetch(`/api/auth/verify?t=${tokenId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.sessions?.length) return
        const latest = data.sessions.sort(
          (a: { createdAt: string }, b: { createdAt: string }) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
        setLastSession({ slug: latest.slug, companyName: latest.companyName })
      })
      .catch(() => {})
  }, [])

  return (
    <main className="min-h-screen bg-background flex flex-col">

      <div className="w-full h-px bg-foreground/10" />

      {/* Nav strip */}
      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
          Rehearse
        </span>
        {lastSession ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Last: {lastSession.companyName}
            </span>
            <Link href={`/r/${lastSession.slug}`} className="text-xs text-foreground border border-border rounded px-3 py-1 hover:border-foreground/40 transition-colors">
              View report →
            </Link>
            <Link href="/sessions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              All sessions
            </Link>
            <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Profile
            </Link>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Interview prep for product designers
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 pb-24">
        <div className="max-w-3xl">

          <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-8">
            AI-powered · Role-specific · Honest
          </p>

          <h1 className="font-heading text-[clamp(3.5rem,8vw,7rem)] font-light leading-[0.95] tracking-tight text-foreground mb-10">
            Know exactly<br />
            <em className="font-light">what you&apos;re</em><br />
            walking into.
          </h1>

          <p className="font-sans text-lg text-muted-foreground max-w-md leading-relaxed mb-12">
            Upload your resume, paste the job posting, pick your stage.
            Rehearse researches the company, simulates the interview, and tells you
            precisely where you stood.
          </p>

          <div className="flex items-center gap-6">
            <Button render={<Link href="/setup" />} nativeButton={false} size="lg" className="font-sans text-sm tracking-[0.1em] uppercase px-8">
              {lastSession ? "New Session" : "Start Session"}
            </Button>
            <span className="text-xs text-muted-foreground">
              No account required
            </span>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-foreground/10" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground">
          Rehearse · Built with Claude · For product designers
        </p>
      </div>

    </main>
  )
}
