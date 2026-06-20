"use client"

import { useState, useRef, useCallback, useEffect } from "react"

type RecordingState = "idle" | "recording" | "processing" | "error"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const accumulatedRef = useRef(0)
  const clipStartRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (state === "recording") {
      clipStartRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsedSeconds(accumulatedRef.current + Math.floor((Date.now() - clipStartRef.current) / 1000))
      }, 500)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (state === "processing") {
        accumulatedRef.current += Math.floor((Date.now() - clipStartRef.current) / 1000)
        setElapsedSeconds(accumulatedRef.current)
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state])

  const startRecording = useCallback(async () => {
    setErrorMessage("")
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMessage("Microphone access denied — type your answer below.")
      setState("error")
      return
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm"

    const recorder = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      setState("processing")
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const formData = new FormData()
      formData.append("audio", blob)
      try {
        const res = await fetch("/api/transcribe", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok || !data.transcript) throw new Error(data.error ?? "Transcription failed")
        onTranscript(data.transcript.trim())
        setState("idle")
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Transcription failed.")
        setState("error")
      }
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setState("recording")
  }, [onTranscript])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
  }, [])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="flex items-center gap-3">
      <button
        aria-label={state === "recording" ? "Stop recording" : state === "processing" ? "Transcribing…" : "Start recording"}
        disabled={disabled || state === "processing"}
        onClick={state === "recording" ? stopRecording : startRecording}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${state === "recording"
            ? "bg-destructive/10 text-destructive ring-2 ring-destructive/30"
            : state === "processing"
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-foreground text-background hover:bg-foreground/80"
          }`}
      >
        {state === "recording" ? (
          <span className="w-3 h-3 bg-destructive rounded-sm" />
        ) : state === "processing" ? (
          <span className="w-3 h-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
        ) : (
          <MicIcon />
        )}
        {state === "recording" && (
          <span className="absolute inset-0 rounded-full ring-2 ring-destructive/40 animate-ping" />
        )}
      </button>

      <div className="flex flex-col gap-0.5">
        <p className="font-sans text-sm text-muted-foreground" aria-live="polite">
          {state === "idle" && "Click to record"}
          {state === "recording" && "Recording — click to stop"}
          {state === "processing" && "Transcribing…"}
          {state === "error" && <span className="text-destructive text-xs">{errorMessage}</span>}
        </p>
        {(state === "recording" || state === "processing") && elapsedSeconds > 0 && (
          <p className="font-sans text-xs tabular-nums text-muted-foreground/60">{formatTime(elapsedSeconds)}</p>
        )}
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 8 1Z" />
      <path d="M3.5 7.5a.5.5 0 0 1 .5.5 4 4 0 0 0 8 0 .5.5 0 0 1 1 0 5 5 0 0 1-4.5 4.975V14.5h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-1.525A5 5 0 0 1 3 8a.5.5 0 0 1 .5-.5Z" />
    </svg>
  )
}
