"use client"

import { useState } from "react"
import type { SetupData, ContextData, SimulationData, ReportData } from "@/lib/session-types"

interface SavePromptProps {
  setup: SetupData
  context: ContextData
  simulation: SimulationData
  report: ReportData
  onSaved?: (tokenId: string, slug: string) => void
}

type SaveState = "idle" | "saving" | "done" | "error"

export function SavePrompt({ setup, context, simulation, report, onSaved }: SavePromptProps) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<SaveState>("idle")
  const [error, setError] = useState("")
  const [emailSent, setEmailSent] = useState(true)

  const handleSave = async () => {
    if (!email.trim() || !email.includes("@")) return
    setState("saving")
    setError("")

    try {
      const res = await fetch("/api/auth/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), setup, context, simulation, report }),
      })
      if (!res.ok) throw new Error("Save failed")
      const { tokenId, slug, emailSent: sent } = await res.json()

      // Store token locally so this device is already "logged in"
      localStorage.setItem("rehearse_token", tokenId)

      setEmailSent(sent !== false)
      setState("done")
      onSaved?.(tokenId, slug)
    } catch {
      setError("Something went wrong. Try again.")
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <div className="pt-6 border-t border-border/40">
        <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">
          Report saved
        </p>
        <p className="font-sans text-sm text-muted-foreground">
          {emailSent
            ? "Check your email — your report link is on its way. You can close this tab."
            : "Your report is saved and will reload on this device. We couldn't email the link this time — bookmark this page to revisit it."}
        </p>
      </div>
    )
  }

  return (
    <div className="pt-6 border-t border-border/40">
      <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">
        Save this report
      </p>
      <p className="font-sans text-xs text-muted-foreground mb-4 leading-relaxed">
        Get a permanent link and track your progress across sessions.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="your@email.com"
          disabled={state === "saving"}
          className="font-sans text-sm bg-background border border-border rounded px-3 py-2 w-56 focus:outline-none focus:border-foreground/40 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSave}
          disabled={state === "saving" || !email.trim() || !email.includes("@")}
          className="font-sans text-xs tracking-[0.08em] uppercase px-4 py-2 border border-border rounded hover:border-foreground/40 transition-colors disabled:opacity-40"
        >
          {state === "saving" ? "Saving…" : "Save →"}
        </button>
      </div>
      {(state === "error") && (
        <p className="font-sans text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  )
}
