"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { LiveTranscript } from "./live-transcript"

type VoiceState = "idle" | "recording" | "processing" | "transcript-ready" | "confirmed" | "error" | "unavailable"

interface VoiceInputProps {
  onTranscriptConfirmed: (transcript: string) => void
  onSwitchToText: () => void
  disabled?: boolean
}

export function VoiceInput({ onTranscriptConfirmed, onSwitchToText, disabled }: VoiceInputProps) {
  const [state, setState] = useState<VoiceState>("idle")
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Check availability on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setState("unavailable")
      onSwitchToText()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let interim = ""
      let final = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          final += text
        } else {
          interim += text
        }
      }
      if (final) setTranscript((prev) => (prev + " " + final).trim())
      setInterimTranscript(interim)
    }

    recognition.onend = () => {
      setInterimTranscript("")
      setState((prev) => (prev === "recording" ? "transcript-ready" : prev))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (e.error === "no-speech") {
        setState("transcript-ready")
        return
      }
      setErrorMessage(
        e.error === "not-allowed"
          ? "Microphone access was denied. Allow mic access in your browser settings, or switch to text."
          : "Recording failed. Try again or switch to text input."
      )
      setState("error")
    }

    recognitionRef.current = recognition
  }, [onSwitchToText])

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript("")
    setInterimTranscript("")
    setErrorMessage("")
    setState("recording")
    recognitionRef.current.start()
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setState("processing")
  }, [])

  const confirmTranscript = useCallback(() => {
    if (!transcript.trim()) return
    setState("confirmed")
    onTranscriptConfirmed(transcript.trim())
  }, [transcript, onTranscriptConfirmed])

  const reRecord = useCallback(() => {
    setTranscript("")
    setState("idle")
  }, [])

  // Unavailable — render nothing (caller shows text input)
  if (state === "unavailable") return null

  const transcriptState =
    state === "recording" ? "streaming"
    : state === "processing" ? "streaming"
    : state === "transcript-ready" || state === "confirmed" ? (state === "confirmed" ? "locked" : "editable")
    : "empty"

  return (
    <div className="flex flex-col gap-4" aria-label="Voice answer input">
      {/* Status + mic button */}
      <div className="flex items-center gap-4">
        <button
          aria-label={
            state === "recording" ? "Stop recording" :
            state === "processing" ? "Processing…" :
            "Start recording"
          }
          disabled={disabled || state === "processing" || state === "confirmed"}
          onClick={state === "recording" ? stopRecording : startRecording}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            ${state === "recording"
              ? "bg-destructive/10 text-destructive ring-2 ring-destructive/30"
              : state === "processing" || state === "confirmed"
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-foreground text-background hover:bg-foreground/80"
            }`}
        >
          {state === "recording" ? (
            <span className="w-3 h-3 bg-destructive rounded-sm" />
          ) : (
            <MicIcon />
          )}
          {state === "recording" && (
            <span className="absolute inset-0 rounded-full ring-2 ring-destructive/40 animate-ping" />
          )}
        </button>

        <p
          className="font-sans text-sm text-muted-foreground"
          aria-live="polite"
        >
          {state === "idle" && "Click the mic to start recording"}
          {state === "recording" && "Recording… click to stop"}
          {state === "processing" && "Processing…"}
          {state === "transcript-ready" && "Review your answer — edit if needed"}
          {state === "confirmed" && "Answer confirmed"}
        </p>
      </div>

      {/* Transcript */}
      {(state === "recording" || state === "processing" || state === "transcript-ready" || state === "confirmed") && (
        <LiveTranscript
          transcript={transcript}
          interimTranscript={interimTranscript}
          state={transcriptState as "streaming" | "editable" | "locked" | "empty"}
          onChange={state === "transcript-ready" ? setTranscript : undefined}
        />
      )}

      {state === "transcript-ready" && (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={confirmTranscript}
            disabled={!transcript.trim()}
            className="font-sans text-xs tracking-[0.1em] uppercase"
          >
            Confirm answer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={reRecord}
            className="font-sans text-xs text-muted-foreground"
          >
            Re-record
          </Button>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div role="alert" className="flex flex-col gap-2">
          <p className="font-sans text-xs text-destructive">{errorMessage}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setState("idle")} className="font-sans text-xs">
              Retry
            </Button>
            <Button variant="ghost" size="sm" onClick={onSwitchToText} className="font-sans text-xs text-muted-foreground">
              Switch to text
            </Button>
          </div>
        </div>
      )}

      {/* Switch to text */}
      {(state === "idle" || state === "transcript-ready") && (
        <button
          onClick={onSwitchToText}
          className="font-sans text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors self-start"
        >
          Switch to text input
        </button>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 8 1Z" />
      <path d="M3.5 7.5a.5.5 0 0 1 .5.5 4 4 0 0 0 8 0 .5.5 0 0 1 1 0 5 5 0 0 1-4.5 4.975V14.5h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-1.525A5 5 0 0 1 3 8a.5.5 0 0 1 .5-.5Z" />
    </svg>
  )
}
