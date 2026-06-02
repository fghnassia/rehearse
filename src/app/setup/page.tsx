"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";

const stages = [
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
];

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">

      <div className="w-full h-px bg-foreground/10" />

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">
          ← Rehearse
        </Link>
        <span className="text-xs text-muted-foreground font-sans">
          Step 1 of 2
        </span>
      </div>

      <div className="w-full h-px bg-foreground/5" />

      {/* Progress bar */}
      <div className="w-1/2 h-px bg-primary" />

      {/* Content */}
      <div className="flex-1 px-8 py-14 max-w-xl">

        {/* Section heading */}
        <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-6">
          Context intake
        </p>
        <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight tracking-tight text-foreground mb-3">
          Tell us about<br /><em>your prep</em>
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
            <Card className="border-border border-dashed cursor-pointer hover:border-primary transition-colors duration-200">
              <CardContent className="flex flex-col items-start gap-2 py-8 px-6">
                <p className="font-sans text-sm font-medium text-foreground">
                  Upload PDF
                </p>
                <p className="font-sans text-xs text-muted-foreground">
                  Drag and drop or click to browse
                </p>
                <Button variant="outline" size="sm" className="mt-3 font-sans text-xs tracking-[0.1em] uppercase">
                  Choose file
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio URL */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="portfolio" className="font-sans text-xs tracking-[0.15em] uppercase text-foreground">
              Portfolio URL
            </Label>
            <Input
              id="portfolio"
              type="url"
              placeholder="https://yourname.com"
              className="font-sans text-sm"
            />
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
              className="font-sans text-sm"
            />
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              The full URL of the role you're applying for. We'll parse the job description directly.
            </p>
          </div>

          {/* Interview Stage */}
          <div className="flex flex-col gap-3">
            <Label className="font-sans text-xs tracking-[0.15em] uppercase text-foreground">
              Interview stage
            </Label>
            <p className="font-sans text-xs text-muted-foreground -mt-1">
              Which round are you preparing for?
            </p>
            <RadioGroup defaultValue="hiring-manager" className="flex flex-col gap-2 mt-1">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-start gap-4 px-4 py-4 border border-border hover:border-primary cursor-pointer transition-colors duration-200"
                >
                  <RadioGroupItem
                    value={stage.id}
                    id={stage.id}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <Label
                      htmlFor={stage.id}
                      className="font-sans text-sm font-medium cursor-pointer"
                    >
                      {stage.label}
                    </Label>
                    <span className="font-sans text-xs text-muted-foreground leading-relaxed">
                      {stage.description}
                    </span>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" size="sm" render={<Link href="/" />} nativeButton={false} className="font-sans text-xs tracking-[0.1em] uppercase text-muted-foreground">
              ← Back
            </Button>
            <Button size="lg" className="font-sans text-sm tracking-[0.1em] uppercase px-8">
              Research Company →
            </Button>
          </div>

        </div>
      </div>

      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Context intake</p>
      </div>

    </main>
  );
}
