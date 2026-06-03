"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PipelineIndicator } from "@/components/pipeline-indicator"
import { useSession } from "@/lib/session-context"
import type { InterviewStage } from "@/lib/session-types"

const stages: { id: InterviewStage; label: string; description: string }[] = [
  {
    id: "recruiter",
    label: "Recruiter Screen",
    description: "Initial call — culture fit, logistics, compensation range",
  },
  {
    id: "hiring-manager",
    label: "Hiring Manager Round",
    description: "Deep dive on your process, decisions, and point of view on AI",
  },
  {
    id: "portfolio-review",
    label: "Portfolio Review",
    description: "Walkthrough of your work — the why behind the what",
  },
]

interface FormErrors {
  resume?: string
  portfolioUrl?: string
  jobPostingUrl?: string
  submit?: string
}

export default function SetupPage() {
  const router = useRouter()
  const { updateSetup } = useSession()

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [portfolioUrl, setPortfolioUrl] = useState("")
  const [jobPostingUrl, setJobPostingUrl] = useState("")
  const [stage, setStage] = useState<InterviewStage>("hiring-manager")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, resume: "Please upload a PDF file." }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, resume: "File must be under 10 MB." }))
      return
    }
    setResumeFile(file)
    setErrors((prev) => ({ ...prev, resume: undefined }))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!resumeFile) next.resume = "Please upload your resume."
    if (portfolioUrl && !isValidUrl(portfolioUrl)) next.portfolioUrl = "Enter a valid URL (e.g. https://yourname.com)"
    if (!jobPostingUrl) {
      next.jobPostingUrl = "Please enter the job posting URL."
    } else if (!isValidUrl(jobPostingUrl)) {
      next.jobPostingUrl = "Enter a valid URL (e.g. https://company.com/jobs/role)"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !resumeFile) return
    setIsSubmitting(true)

    try {
      // Parse PDF
      const formData = new FormData()
      formData.append("file", resumeFile)
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        setErrors({ submit: data.error ?? "Failed to read your resume. Try a different PDF." })
        setIsSubmitting(false)
        return
      }

      updateSetup({
        resumeText: data.text,
        portfolioUrl: portfolioUrl ? normalizeUrl(portfolioUrl) : "",
        jobPostingUrl: normalizeUrl(jobPostingUrl),
        stage,
      })

      router.push("/research")
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." })
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="w-full h-px bg-foreground/10" />

      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 px-8 py-14 max-w-xl">
        <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
          Session setup
        </p>
        <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight text-foreground mb-3">
          Tell us about<br />
          <em>your prep</em>
        </h1>
        <p className="font-sans text-sm text-muted-foreground mb-12 leading-relaxed max-w-sm">
          We'll research the company and tailor your questions to your background, the role, and the stage you're preparing for.
        </p>

        <div className="flex flex-col gap-10">

          {/* Resume */}
          <div className="flex flex-col gap-3">
            <Label className="font-sans text-xs tracking-[0.15em] uppercase text-foreground">
              Resume
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
            <Card
              className={`border-dashed cursor-pointer transition-colors duration-200 ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : errors.resume
                  ? "border-destructive"
                  : resumeFile
                  ? "border-primary"
                  : "border-border hover:border-primary"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <CardContent className="flex flex-col items-start gap-2 py-8 px-6">
                {resumeFile ? (
                  <>
                    <p className="font-sans text-sm font-medium text-foreground">
                      {resumeFile.name}
                    </p>
                    <p className="font-sans text-xs text-muted-foreground">
                      {(resumeFile.size / 1024).toFixed(0)} KB · Click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-sans text-sm font-medium text-foreground">
                      Upload PDF
                    </p>
                    <p className="font-sans text-xs text-muted-foreground">
                      Drag and drop or click to browse
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 font-sans text-xs tracking-[0.1em] uppercase"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    >
                      Choose file
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            {errors.resume && (
              <p className="font-sans text-xs text-destructive">{errors.resume}</p>
            )}
          </div>

          {/* Portfolio URL */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="portfolio" className="font-sans text-xs tracking-[0.15em] uppercase text-foreground">
              Portfolio URL
              <span className="ml-2 normal-case tracking-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="portfolio"
              type="url"
              placeholder="https://yourname.com"
              value={portfolioUrl}
              onChange={(e) => {
                setPortfolioUrl(e.target.value)
                if (errors.portfolioUrl) setErrors((prev) => ({ ...prev, portfolioUrl: undefined }))
              }}
              className={`font-sans text-sm ${errors.portfolioUrl ? "border-destructive" : ""}`}
            />
            {errors.portfolioUrl && (
              <p className="font-sans text-xs text-destructive">{errors.portfolioUrl}</p>
            )}
          </div>

          {/* Job Posting URL */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="job-posting" className="font-sans text-xs tracking-[0.15em] uppercase text-foreground">
              Job posting URL
            </Label>
            <Input
              id="job-posting"
              type="url"
              placeholder="https://jobs.company.com/role"
              value={jobPostingUrl}
              onChange={(e) => {
                setJobPostingUrl(e.target.value)
                if (errors.jobPostingUrl) setErrors((prev) => ({ ...prev, jobPostingUrl: undefined }))
              }}
              className={`font-sans text-sm ${errors.jobPostingUrl ? "border-destructive" : ""}`}
            />
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              The full URL of the role you're applying for. We'll parse the job description directly.
            </p>
            {errors.jobPostingUrl && (
              <p className="font-sans text-xs text-destructive">{errors.jobPostingUrl}</p>
            )}
          </div>

          {/* Interview Stage */}
          <div className="flex flex-col gap-3">
            <Label className="font-sans text-xs tracking-[0.15em] uppercase text-foreground">
              Interview stage
            </Label>
            <p className="font-sans text-xs text-muted-foreground -mt-1">
              Which round are you preparing for?
            </p>
            <RadioGroup
              value={stage}
              onValueChange={(v) => setStage(v as InterviewStage)}
              className="flex flex-col gap-2 mt-1"
            >
              {stages.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-start gap-4 px-4 py-4 border cursor-pointer transition-colors duration-200 ${
                    stage === s.id ? "border-primary" : "border-border hover:border-primary"
                  }`}
                  onClick={() => setStage(s.id)}
                >
                  <RadioGroupItem value={s.id} id={s.id} className="mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor={s.id} className="font-sans text-sm font-medium cursor-pointer">
                      {s.label}
                    </Label>
                    <span className="font-sans text-xs text-muted-foreground leading-relaxed">
                      {s.description}
                    </span>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Session notice */}
          <Alert>
            <AlertDescription className="font-sans text-xs text-muted-foreground leading-relaxed">
              Once you begin the interview, the session runs as one continuous flow. Your report is only available in this session.
            </AlertDescription>
          </Alert>

          {/* Submit error */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription className="font-sans text-xs">{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/" />}
              nativeButton={false}
              className="font-sans text-xs tracking-[0.1em] uppercase text-muted-foreground"
            >
              ← Back
            </Button>
            <Button
              size="lg"
              className="font-sans text-sm tracking-[0.1em] uppercase px-8"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Reading resume…" : "Research Company →"}
            </Button>
          </div>

        </div>
      </div>

      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Session setup</p>
      </div>
    </main>
  )
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return false
  try {
    const url = new URL(normalizeUrl(value))
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
