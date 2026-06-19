"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PipelineIndicator } from "@/components/pipeline-indicator"
import { PersonaCard } from "@/components/persona-card"
import { VoiceInput } from "@/components/voice-input"
import { useSession } from "@/lib/session-context"
import type { SimulationData, QAPair } from "@/lib/session-types"

type SimPhase = "loading" | "ready" | "interview" | "evaluating" | "complete" | "error"

export default function SimulationPage() {
  const router = useRouter()
  const { session, hydrated, updateSimulation } = useSession()

  const [phase, setPhase] = useState<SimPhase>("loading")
  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice")
  const [textAnswer, setTextAnswer] = useState("")
  const [voiceConfirmed, setVoiceConfirmed] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown")
  const hasFetched = useRef(false)

  const requestMicPermission = () => {
    // Use SpeechRecognition directly — getUserMedia permission is separate and
    // doesn't always carry over to the Web Speech API in all browsers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) {
      setMicPermission("denied")
      setInputMode("text")
      return
    }
    const probe = new SR()
    probe.maxAlternatives = 1
    probe.onstart = () => {
      probe.stop()
      setMicPermission("granted")
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    probe.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicPermission("denied")
        setInputMode("text")
      } else {
        // Any other error (no-speech, network, etc.) means permission was granted
        setMicPermission("granted")
      }
    }
    probe.onend = () => {
      // If onstart already fired it's granted; if not, treat as granted
      // (browser ended without error = permission OK, just no audio captured)
      setMicPermission(prev => prev === "unknown" ? "granted" : prev)
    }
    try { probe.start() } catch {
      setMicPermission("denied")
      setInputMode("text")
    }
  }

  // Guard + fetch questions
  useEffect(() => {
    if (!hydrated) return
    if (!session.setup || !session.context || !session.research) {
      router.replace("/")
      return
    }
    if (hasFetched.current) return
    hasFetched.current = true

    // If we already have simulation data (e.g. from a redo), use it
    if (session.simulation?.questions.length) {
      setSimulation(session.simulation)
      setPhase("ready")
      return
    }

    fetch("/api/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setup: session.setup,
        context: session.context,
        research: session.research,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(d.error ?? "Failed to generate questions"))
        return r.json()
      })
      .then((data) => {
        const sim: SimulationData = {
          personaName: data.personaName,
          personaRole: data.personaRole,
          behaviorNote: data.behaviorNote,
          questions: data.questions,
          answers: [],
        }
        updateSimulation(sim)
        setSimulation(sim)
        setPhase("ready")
      })
      .catch((msg: string) => {
        setErrorMessage(typeof msg === "string" ? msg : "Failed to load the simulation.")
        setPhase("error")
      })
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentAnswer = voiceConfirmed ?? textAnswer

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !simulation || !session.setup || !session.context) return

    setPhase("evaluating")

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: simulation.questions[currentQ],
          answer: currentAnswer.trim(),
          stage: session.setup.stage,
          companyName: session.context.companyName,
          roleTitle: session.context.roleTitle,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Evaluation failed")
      }

      const evalData = await res.json()

      const qaPair: QAPair = {
        questionId: `q${currentQ}`,
        questionText: simulation.questions[currentQ],
        userAnswer: currentAnswer.trim(),
        scores: evalData.scores,
        whatWorked: evalData.whatWorked,
        whatToImprove: evalData.whatToImprove,
        sampleAnswer: evalData.sampleAnswer,
      }

      const updatedAnswers = [...simulation.answers, qaPair]
      const updatedSim = { ...simulation, answers: updatedAnswers }
      setSimulation(updatedSim)
      updateSimulation(updatedSim)

      if (currentQ + 1 < simulation.questions.length) {
        setCurrentQ((q) => q + 1)
        setTextAnswer("")
        setVoiceConfirmed(null)
        setPhase("interview")
      } else {
        setPhase("complete")
        setTimeout(() => router.push("/report"), 1500)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Evaluation failed. Try submitting again.")
      setPhase("interview")
    }
  }

  const progressLabel = simulation
    ? `Question ${currentQ + 1} of ${simulation.questions.length}`
    : ""

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="w-full h-px bg-foreground/10" />

      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
          Rehearse
        </span>
        {phase !== "interview" && phase !== "evaluating" && (
          <PipelineIndicator currentStage="simulation" />
        )}
        {(phase === "interview" || phase === "evaluating") && simulation && (
          <p className="font-sans text-xs text-muted-foreground">{progressLabel}</p>
        )}
      </div>

      <div className="w-full h-px bg-foreground/5" />

      <div className="flex-1 px-8 py-14 max-w-xl">

        {/* Loading questions */}
        {phase === "loading" && (
          <>
            <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Preparing your interview
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight mb-8">
              One moment…
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="font-sans text-sm text-muted-foreground">Generating your questions…</p>
            </div>
          </>
        )}

        {/* State A — Ready */}
        {phase === "ready" && simulation && (
          <>
            <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-10">
              Your interviewer
            </p>
            <PersonaCard
              stage={session.setup!.stage}
              personaName={simulation.personaName}
              personaRole={simulation.personaRole}
              behaviorNote={simulation.behaviorNote}
              questionCount={simulation.questions.length}
              onBegin={() => setPhase("interview")}
            />

            {/* Mic permission — ask before interview starts */}
            {micPermission === "unknown" && (
              <div className="mt-10 pt-8 border-t border-border flex flex-col gap-3">
                <p className="font-sans text-sm text-foreground font-medium">Allow microphone access</p>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                  This interview uses voice input. Allow access now so you won't be interrupted mid-answer.
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <Button size="sm" onClick={requestMicPermission} className="font-sans text-xs tracking-[0.1em] uppercase">
                    Allow microphone
                  </Button>
                  <button
                    onClick={() => { setMicPermission("denied"); setInputMode("text") }}
                    className="font-sans text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Use text instead
                  </button>
                </div>
              </div>
            )}
            {micPermission === "granted" && (
              <p className="font-sans text-xs text-muted-foreground mt-6">✓ Microphone ready</p>
            )}
            {micPermission === "denied" && (
              <p className="font-sans text-xs text-muted-foreground mt-6">Text input mode — microphone not available</p>
            )}
          </>
        )}

        {/* State B — Interview in progress */}
        {(phase === "interview" || phase === "evaluating") && simulation && (
          <>
            {/* Question */}
            <div className="mb-10">
              <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
                {simulation.personaName} asks
              </p>
              <p className="font-heading text-2xl font-light leading-snug text-foreground">
                {simulation.questions[currentQ]}
              </p>
            </div>

            {/* Input */}
            {inputMode === "voice" ? (
              <VoiceInput
                disabled={phase === "evaluating"}
                onTranscriptConfirmed={(t) => {
                  setVoiceConfirmed(t)
                }}
                onSwitchToText={() => {
                  setInputMode("text")
                  setVoiceConfirmed(null)
                }}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <Textarea
                  placeholder="Type your answer…"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={phase === "evaluating"}
                  className="font-sans text-sm min-h-[140px] resize-none leading-relaxed"
                  autoFocus
                />
                <button
                  onClick={() => { setInputMode("voice"); setTextAnswer("") }}
                  className="font-sans text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors self-start"
                >
                  Switch to voice input
                </button>
              </div>
            )}

            {/* Evaluation error */}
            {errorMessage && phase === "interview" && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription className="font-sans text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <div className="mt-8 flex items-center gap-4">
              <Button
                size="lg"
                className="font-sans text-sm tracking-[0.1em] uppercase px-8"
                disabled={!currentAnswer.trim() || phase === "evaluating"}
                onClick={handleSubmitAnswer}
              >
                {phase === "evaluating" ? "Evaluating…" : currentQ + 1 < (simulation?.questions.length ?? 0) ? "Submit →" : "Finish →"}
              </Button>
              {phase === "evaluating" && (
                <p className="font-sans text-xs text-muted-foreground">Thinking…</p>
              )}
            </div>
          </>
        )}

        {/* State C — Complete */}
        {phase === "complete" && (
          <>
            <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Session complete
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight mb-8">
              Generating<br /><em>your report…</em>
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="font-sans text-sm text-muted-foreground">Compiling your feedback…</p>
            </div>
          </>
        )}

        {/* Error */}
        {phase === "error" && (
          <>
            <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Something went wrong
            </p>
            <Alert variant="destructive" className="mb-8">
              <AlertDescription className="font-sans text-sm leading-relaxed">{errorMessage}</AlertDescription>
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
                render={<Link href="/research" />}
                nativeButton={false}
              >
                ←
              </Button>
            </div>
          </>
        )}

      </div>

      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Interview simulation</p>
      </div>
    </main>
  )
}
