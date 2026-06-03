"use client"

import { Textarea } from "@/components/ui/textarea"

interface LiveTranscriptProps {
  transcript: string
  interimTranscript?: string
  state: "streaming" | "editable" | "locked" | "empty"
  onChange?: (value: string) => void
}

export function LiveTranscript({ transcript, interimTranscript, state, onChange }: LiveTranscriptProps) {
  if (state === "empty") {
    return (
      <p className="font-sans text-sm text-muted-foreground/50 italic">
        Your answer will appear here as you speak…
      </p>
    )
  }

  if (state === "locked") {
    return (
      <div className="bg-muted/40 rounded px-4 py-3 border border-border">
        <p className="font-sans text-sm text-foreground leading-relaxed">{transcript}</p>
      </div>
    )
  }

  if (state === "streaming") {
    return (
      <div className="bg-background rounded px-4 py-3 border border-primary/30 min-h-[80px]">
        <span className="font-sans text-sm text-foreground leading-relaxed">{transcript}</span>
        {interimTranscript && (
          <span className="font-sans text-sm text-muted-foreground/60 italic"> {interimTranscript}</span>
        )}
      </div>
    )
  }

  // editable
  return (
    <Textarea
      value={transcript}
      onChange={(e) => onChange?.(e.target.value)}
      className="font-sans text-sm min-h-[100px] resize-none leading-relaxed"
      placeholder="Edit your answer if needed…"
    />
  )
}
