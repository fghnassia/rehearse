"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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

type SimPhase = "loading" | "ready" | "interview" | "evaluating" | "transitioning" | "skipping" | "complete" | "error"

export default function SimulationPage() {
  const router = useRouter()
  const { session, hydrated, updateSimulation } = useSession()

  const [phase, setPhase] = useState<SimPhase>("loading")
  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [textAnswer, setTextAnswer] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showEndModal, setShowEndModal] = useState(false)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [transitionMessage, setTransitionMessage] = useState("")

  const answersMapRef = useRef<Record<number, QAPair>>({})
  const textMapRef = useRef<Record<number, string>>({})
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    if (!session.setup || !session.context || !session.research) { router.replace("/"); return }
    if (hasFetched.current) return
    hasFetched.current = true

    if (session.simulation?.questions.length) {
      setSimulation(session.simulation)
      session.simulation.answers.forEach((qa) => {
        const idx = parseInt(qa.questionId.replace("q", ""))
        answersMapRef.current[idx] = qa
        textMapRef.current[idx] = qa.userAnswer
      })
      setPhase("ready")
      return
    }

    fetch("/api/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setup: session.setup, context: session.context, research: session.research }),
    })
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error ?? "Failed")))
      .then((data) => {
        const sim: SimulationData = {
          personaName: data.personaName,
          personaRole: data.personaRole,
          behaviorNote: data.behaviorNote,
          questions: data.questions,
          answers: [],
          skippedQuestions: [],
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

  const currentAnswer = textAnswer.trim()

  const persistAndAdvance = useCallback((qaPair: QAPair, sim: SimulationData) => {
    const isNew = !(currentQ in answersMapRef.current)
    answersMapRef.current[currentQ] = qaPair
    const updatedAnswers = Object.entries(answersMapRef.current)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([, v]) => v)
    const updatedSim = { ...sim, answers: updatedAnswers }
    setSimulation(updatedSim)
    updateSimulation(updatedSim)
    if (isNew) setAnsweredCount(c => c + 1)
    return updatedSim
  }, [currentQ, updateSimulation])

  const handleSubmitAnswer = () => {
    if (!currentAnswer || !simulation) return
    textMapRef.current[currentQ] = currentAnswer
    setTransitionMessage("Saving your answer…")
    setPhase("transitioning")

    const qaPair: QAPair = {
      questionId: `q${currentQ}`,
      questionText: simulation.questions[currentQ],
      userAnswer: currentAnswer,
    }

    const updatedSim = persistAndAdvance(qaPair, simulation)

    if (currentQ + 1 < simulation.questions.length) {
      setTransitionMessage("Loading next question…")
      setTimeout(() => {
        setCurrentQ(q => q + 1)
        setTextAnswer("")
        setPhase("interview")
      }, 600)
    } else {
      updateSimulation(updatedSim)
      setPhase("complete")
      setTimeout(() => router.push("/report"), 1500)
    }
  }

  const handleBack = () => {
    if (currentQ === 0) return
    const prevQ = currentQ - 1
    setCurrentQ(prevQ)
    setTextAnswer(textMapRef.current[prevQ] ?? "")
    setPhase("interview")
  }

  const handleSkip = async () => {
    if (!simulation || !session.setup || !session.context) return
    setPhase("skipping")
    const skipped = { questionId: `q${currentQ}`, questionText: simulation.questions[currentQ] }
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup: session.setup, context: session.context, exclude: simulation.questions }),
      })
      if (!res.ok) throw new Error()
      const { question } = await res.json()
      const newQuestions = [...simulation.questions]
      newQuestions[currentQ] = question
      const updatedSim: SimulationData = {
        ...simulation,
        questions: newQuestions,
        skippedQuestions: [...(simulation.skippedQuestions ?? []), skipped],
      }
      setSimulation(updatedSim)
      updateSimulation(updatedSim)
      setTextAnswer("")
      setPhase("interview")
    } catch {
      setPhase("interview")
    }
  }

  const handleEndSession = (generateReport: boolean) => {
    setShowEndModal(false)
    if (generateReport) {
      setPhase("complete")
      setTimeout(() => router.push("/report"), 1500)
    } else {
      router.push("/")
    }
  }

  const progressLabel = simulation ? `Question ${currentQ + 1} of ${simulation.questions.length}` : ""
  const isActive = phase === "interview" || phase === "evaluating" || phase === "skipping" || phase === "transitioning"
  const isEvaluating = (phase as string) === "evaluating"

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="w-full h-px bg-foreground/10" />

      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
          Rehearse
        </span>
        {!isActive && <PipelineIndicator currentStage="simulation" />}
        {isActive && simulation && (
          <p className="font-sans text-xs text-muted-foreground">{progressLabel}</p>
        )}
      </div>

      <div className="w-full h-px bg-foreground/5" />

      <div className="flex-1 px-8 py-14 max-w-xl">

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

        {phase === "transitioning" && simulation && (
          <>
            <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Question {currentQ + 1} of {simulation.questions.length}
            </p>
            <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight mb-8">
              One<br /><em>moment…</em>
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="font-sans text-sm text-muted-foreground transition-all duration-300">{transitionMessage}</p>
            </div>
          </>
        )}

        {phase === "ready" && simulation && (
          <PersonaCard
            stage={session.setup!.stage}
            personaName={simulation.personaName}
            personaRole={simulation.personaRole}
            behaviorNote={simulation.behaviorNote}
            questionCount={simulation.questions.length}
            onBegin={() => setPhase("interview")}
          />
        )}

        {(phase === "interview" || phase === "skipping") && simulation && (
          <>
            <div className="mb-10">
              <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
                {simulation.personaName} asks
              </p>
              <p className="font-heading text-2xl font-light leading-snug text-foreground">
                {phase === "skipping" ? "Finding a new question…" : simulation.questions[currentQ]}
              </p>
            </div>

            {phase !== "skipping" && (
              <>
                <div className="flex flex-col gap-3">
                  <VoiceInput
                    key={currentQ}
                    disabled={isEvaluating}
                    onTranscript={(t) => setTextAnswer(prev => prev ? `${prev} ${t}` : t)}
                  />
                  <Textarea
                    placeholder="Or type directly…"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    disabled={isEvaluating}
                    className="font-sans text-sm min-h-[120px] resize-none leading-relaxed"
                  />
                </div>

                {errorMessage && phase === "interview" && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription className="font-sans text-xs">{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Submit row */}
                <div className="mt-8 flex items-center gap-4">
                  {currentQ > 0 && (
                    <button
                      onClick={handleBack}
                      disabled={isEvaluating}
                      className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                    >
                      ←
                    </button>
                  )}
                  <Button
                    size="lg"
                    className="font-sans text-sm tracking-[0.1em] uppercase px-8"
                    disabled={!currentAnswer || isEvaluating}
                    onClick={handleSubmitAnswer}
                  >
                    {currentQ + 1 < simulation.questions.length ? "Submit →" : "Finish →"}
                  </Button>
                  <button
                    onClick={handleSkip}
                    disabled={isEvaluating}
                    className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 ml-2"
                  >
                    Skip
                  </button>
                </div>

                {/* End session — separated, low prominence */}
                <div className="mt-12 pt-6 border-t border-border/40">
                  <button
                    onClick={() => setShowEndModal(true)}
                    className="font-sans text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    End session
                  </button>
                </div>
              </>
            )}
          </>
        )}

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

        {phase === "error" && (
          <>
            <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
              Something went wrong
            </p>
            <Alert variant="destructive" className="mb-8">
              <AlertDescription className="font-sans text-sm leading-relaxed">{errorMessage}</AlertDescription>
            </Alert>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => { hasFetched.current = false; setPhase("loading") }}>
                Try again
              </Button>
              <Button variant="ghost" render={<Link href="/research" />} nativeButton={false}>←</Button>
            </div>
          </>
        )}

      </div>

      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Interview simulation</p>
      </div>

      {/* End session modal */}
      {showEndModal && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowEndModal(false)}
        >
          <div
            className="bg-background border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                End session
              </p>
              <button onClick={() => setShowEndModal(false)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" aria-label="Close">✕</button>
            </div>
            <p className="font-sans text-sm text-foreground mb-6 leading-relaxed">
              You've answered {answeredCount} of {simulation?.questions.length ?? 5} questions. You can still generate a partial report.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleEndSession(true)}
                disabled={answeredCount === 0}
                className="font-sans text-xs tracking-[0.1em] uppercase w-full"
              >
                Generate report
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleEndSession(false)}
                className="font-sans text-xs tracking-[0.1em] uppercase text-muted-foreground w-full"
              >
                Exit without saving
              </Button>
            </div>
            {answeredCount === 0 && (
              <p className="font-sans text-xs text-muted-foreground mt-3 text-center">
                Answer at least one question to generate a report.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
