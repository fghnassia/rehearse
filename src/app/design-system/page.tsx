"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-3">{title}</p>
        <Separator />
      </div>
      {children}
    </section>
  );
}

export default function DesignSystem() {
  return (
    <main className="min-h-screen bg-background">
      <div className="w-full h-px bg-foreground/10" />
      <div className="max-w-2xl mx-auto px-8 py-14 flex flex-col gap-16">

        {/* Header */}
        <div>
          <p className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">Rehearse · Design system</p>
          <h1 className="font-heading text-5xl font-light tracking-tight text-foreground mb-2">Tokens &amp; Components</h1>
          <p className="font-sans text-sm text-muted-foreground">Cormorant Garamond · DM Sans · Forest green · Warm cream · 0.25rem radius</p>
        </div>

        {/* Color tokens */}
        <Section title="Color tokens">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "background", cls: "bg-background border" },
              { label: "foreground", cls: "bg-foreground" },
              { label: "primary", cls: "bg-primary" },
              { label: "primary-fg", cls: "bg-primary-foreground border" },
              { label: "secondary", cls: "bg-secondary border" },
              { label: "muted", cls: "bg-muted border" },
              { label: "muted-fg", cls: "bg-muted-foreground" },
              { label: "accent", cls: "bg-accent border" },
              { label: "border", cls: "bg-border" },
              { label: "ring", cls: "bg-ring" },
              { label: "destructive", cls: "bg-destructive" },
              { label: "card", cls: "bg-card border" },
            ].map(({ label, cls }) => (
              <div key={label} className="flex flex-col gap-2">
                <div className={`h-10 w-full ${cls}`} />
                <span className="font-sans text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Semantic state tokens */}
        <Section title="Semantic state tokens">
          <p className="font-sans text-xs text-muted-foreground -mt-2">Used by CoverageIndicator and ScoreDisplay. Reference via CSS variables — never raw Tailwind color classes.</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-12 w-full rounded-sm flex items-center justify-center" style={{ backgroundColor: "var(--state-positive)", color: "var(--state-positive-foreground)" }}>
                <span className="font-sans text-xs font-medium">Strong · High coverage</span>
              </div>
              <span className="font-sans text-xs text-muted-foreground">--state-positive</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-12 w-full rounded-sm flex items-center justify-center" style={{ backgroundColor: "var(--state-warning)", color: "var(--state-warning-foreground)" }}>
                <span className="font-sans text-xs font-medium">Moderate · Low coverage</span>
              </div>
              <span className="font-sans text-xs text-muted-foreground">--state-warning</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-12 w-full rounded-sm flex items-center justify-center" style={{ backgroundColor: "var(--state-negative)", color: "var(--state-negative-foreground)" }}>
                <span className="font-sans text-xs font-medium">Weak · No coverage</span>
              </div>
              <span className="font-sans text-xs text-muted-foreground">--state-negative</span>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography system">
          <div className="flex flex-col gap-8">
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-display · Cormorant · clamp(3.5rem, 8vw, 7rem) · light</p>
              <p className="font-heading text-[clamp(3.5rem,8vw,7rem)] font-light leading-[0.95] tracking-tight">Know exactly<br /><em className="font-light">what you&apos;re</em><br />walking into.</p>
            </div>
            <Separator />
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-h1 · Cormorant · 5xl · light</p>
              <p className="font-heading text-5xl font-light leading-tight tracking-tight">Tell us about <em>your prep</em></p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-h2 · Cormorant · 3xl · light</p>
              <p className="font-heading text-3xl font-light">Hiring Manager Round</p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-h3 · Cormorant · xl · medium</p>
              <p className="font-heading text-xl font-medium">Question 3 of 7</p>
            </div>
            <Separator />
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-body-lg · DM Sans · lg</p>
              <p className="font-sans text-lg leading-relaxed">Personalized interview prep for product designers pursuing AI roles.</p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-body · DM Sans · base</p>
              <p className="font-sans text-base leading-relaxed">We'll research the company and tailor your questions to your background and the specific role you're going after.</p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-body-sm · DM Sans · sm · muted</p>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">Paste the full URL of the role you're applying for. We'll parse the job description directly.</p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-overline · DM Sans · xs · tracked · uppercase</p>
              <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground">Context intake · Step 1 of 2 · Recruiter screen</p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2 tracking-[0.15em] uppercase">type-ui-sm · DM Sans · xs · tracked uppercase (button labels)</p>
              <p className="font-sans text-xs tracking-[0.1em] uppercase">Start Session · Research Company → · ← Back</p>
            </div>
          </div>
        </Section>

        {/* Border radius */}
        <Section title="Border radius · base 0.25rem">
          <div className="flex gap-6 items-end">
            {[
              { label: "sm\n0.15rem", cls: "rounded-sm" },
              { label: "md\n0.2rem", cls: "rounded-md" },
              { label: "lg\n0.25rem", cls: "rounded-lg" },
              { label: "xl\n0.35rem", cls: "rounded-xl" },
              { label: "2xl\n0.45rem", cls: "rounded-2xl" },
              { label: "full", cls: "rounded-full" },
            ].map(({ label, cls }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`h-12 w-12 bg-primary ${cls}`} />
                <span className="font-sans text-xs text-muted-foreground text-center whitespace-pre-line">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button className="font-sans text-xs tracking-[0.1em] uppercase">Default</Button>
              <Button variant="secondary" className="font-sans text-xs tracking-[0.1em] uppercase">Secondary</Button>
              <Button variant="outline" className="font-sans text-xs tracking-[0.1em] uppercase">Outline</Button>
              <Button variant="ghost" className="font-sans text-xs tracking-[0.1em] uppercase">Ghost</Button>
              <Button variant="destructive" className="font-sans text-xs tracking-[0.1em] uppercase">Destructive</Button>
              <Button variant="link" className="font-sans text-xs">Link</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm" className="font-sans text-xs tracking-[0.1em] uppercase">Small</Button>
              <Button size="default" className="font-sans text-xs tracking-[0.1em] uppercase">Default</Button>
              <Button size="lg" className="font-sans text-sm tracking-[0.1em] uppercase px-8">Large</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button disabled className="font-sans text-xs tracking-[0.1em] uppercase">Disabled</Button>
              <Button variant="outline" disabled className="font-sans text-xs tracking-[0.1em] uppercase">Disabled outline</Button>
            </div>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-3">
            <Badge className="font-sans text-xs">Default</Badge>
            <Badge variant="secondary" className="font-sans text-xs">Secondary</Badge>
            <Badge variant="outline" className="font-sans text-xs">Outline</Badge>
            <Badge variant="destructive" className="font-sans text-xs">Destructive</Badge>
            <Badge className="font-sans text-xs" style={{ backgroundColor: "var(--state-positive)", color: "var(--state-positive-foreground)", border: "1px solid var(--state-positive-foreground)" }}>🟢 High coverage</Badge>
            <Badge className="font-sans text-xs" style={{ backgroundColor: "var(--state-warning)", color: "var(--state-warning-foreground)", border: "1px solid var(--state-warning-foreground)" }}>🟡 Low coverage</Badge>
            <Badge className="font-sans text-xs" style={{ backgroundColor: "var(--state-negative)", color: "var(--state-negative-foreground)", border: "1px solid var(--state-negative-foreground)" }}>🔴 No data found</Badge>
          </div>
        </Section>

        {/* Alert */}
        <Section title="Alert">
          <div className="flex flex-col gap-3">
            <Alert>
              <AlertTitle className="font-sans text-sm font-medium">Coverage disclaimer</AlertTitle>
              <AlertDescription className="font-sans text-sm text-muted-foreground">We found limited information about this company. Your questions will be well-crafted but less company-specific than usual.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle className="font-sans text-sm font-medium">Transcription failed</AlertTitle>
              <AlertDescription className="font-sans text-sm">We couldn't process your audio. Try again or switch to text input.</AlertDescription>
            </Alert>
          </div>
        </Section>

        {/* Form elements */}
        <Section title="Form elements">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label className="font-sans text-xs tracking-[0.15em] uppercase">Default input</Label>
              <Input placeholder="https://yourportfolio.com" className="font-sans text-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="font-sans text-xs tracking-[0.15em] uppercase">Error state</Label>
              <Input placeholder="https://yourportfolio.com" className="font-sans text-sm border-destructive focus-visible:ring-destructive" />
              <p className="font-sans text-xs text-destructive">Please enter a valid URL.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="font-sans text-xs tracking-[0.15em] uppercase">Textarea</Label>
              <Textarea placeholder="Type your answer here..." rows={4} className="font-sans text-sm" />
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl font-medium">Hiring Manager Round</CardTitle>
                <CardDescription className="font-sans text-sm">Deep dive on your experience and approach to AI product design.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-sans text-xs text-muted-foreground tracking-[0.1em] uppercase">7 questions · ~25 minutes · Voice or text</p>
              </CardContent>
            </Card>
            <Card className="border-dashed hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-start gap-2 py-8 px-6">
                <p className="font-sans text-sm font-medium">Upload your resume</p>
                <p className="font-sans text-xs text-muted-foreground">PDF only — drag and drop or click to browse</p>
                <Button variant="outline" size="sm" className="mt-3 font-sans text-xs tracking-[0.1em] uppercase">Choose file</Button>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Accordion */}
        <Section title="Accordion">
          <Accordion multiple={false} className="w-full">
            <AccordionItem value="sample-answer">
              <AccordionTrigger className="font-sans text-sm font-medium">Sample stronger answer</AccordionTrigger>
              <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed">
                Here's what a strong answer covers — adapt it in your own voice. "In that project, I started by defining what 'AI' actually meant in the product context — not just a feature label, but a specific model behavior that needed to be transparent to users. I ran a quick assumption mapping session with the PM to surface where we were guessing versus where we had signal..."
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="coverage-detail">
              <AccordionTrigger className="font-sans text-sm font-medium">Sources found for Vercel</AccordionTrigger>
              <AccordionContent className="font-sans text-sm text-muted-foreground">
                3 Glassdoor interview reviews · 2 Reddit threads (r/cscareerquestions) · 1 blog post by a former PM · LinkedIn job description analysis
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        {/* Progress */}
        <Section title="Progress">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="font-sans text-xs tracking-[0.1em] uppercase text-muted-foreground">Setup → Research → Simulation → Report</span>
              </div>
              <Progress value={25} className="h-px" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="font-sans text-xs text-muted-foreground tracking-[0.1em] uppercase">Question 3 of 7</span>
                <span className="font-sans text-xs text-muted-foreground">43%</span>
              </div>
              <Progress value={43} className="h-1" />
            </div>
          </div>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton (loading states)">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs text-muted-foreground tracking-[0.15em] uppercase mb-1">Research loading</p>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs text-muted-foreground tracking-[0.15em] uppercase mb-1">Report generating</p>
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </Section>

        {/* Radio group */}
        <Section title="Radio group">
          <RadioGroup defaultValue="hiring-manager" className="flex flex-col gap-2">
            {[
              { id: "recruiter", label: "Recruiter Screen", desc: "Initial call — culture fit, logistics, compensation" },
              { id: "hiring-manager", label: "Hiring Manager Round", desc: "Deep dive on your process and point of view on AI" },
              { id: "portfolio-review", label: "Portfolio Review", desc: "Walkthrough of your work — the why behind the what" },
            ].map((item) => (
              <div key={item.id} className="flex items-start gap-4 px-4 py-4 border border-border hover:border-primary cursor-pointer transition-colors duration-200">
                <RadioGroupItem value={item.id} id={`ds-${item.id}`} className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor={`ds-${item.id}`} className="font-sans text-sm font-medium cursor-pointer">{item.label}</Label>
                  <span className="font-sans text-xs text-muted-foreground">{item.desc}</span>
                </div>
              </div>
            ))}
          </RadioGroup>
        </Section>

      </div>
      <div className="w-full h-px bg-foreground/10" />
      <div className="max-w-2xl mx-auto px-8 py-4">
        <p className="font-sans text-xs text-muted-foreground">Rehearse · Design system · v2</p>
      </div>
    </main>
  );
}
