import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-3">
          {title}
        </p>
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
          <p className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
            Rehearse · Design system
          </p>
          <h1 className="font-heading text-5xl font-light tracking-tight text-foreground mb-1">
            Tokens &amp; Components
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Cormorant Garamond · DM Sans · Forest green · Warm cream
          </p>
        </div>

        {/* Colors */}
        <Section title="Color tokens">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "background", cls: "bg-background border" },
              { label: "foreground", cls: "bg-foreground" },
              { label: "primary", cls: "bg-primary" },
              { label: "primary-fg", cls: "bg-primary-foreground border" },
              { label: "card", cls: "bg-card border" },
              { label: "secondary", cls: "bg-secondary border" },
              { label: "muted", cls: "bg-muted border" },
              { label: "muted-fg", cls: "bg-muted-foreground" },
              { label: "accent", cls: "bg-accent border" },
              { label: "border", cls: "bg-border" },
              { label: "ring", cls: "bg-ring" },
              { label: "destructive", cls: "bg-destructive" },
            ].map(({ label, cls }) => (
              <div key={label} className="flex flex-col gap-2">
                <div className={`h-10 w-full ${cls}`} />
                <span className="font-sans text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2">Cormorant Garamond · Display</p>
              <p className="font-heading text-6xl font-light leading-tight tracking-tight">
                Know what you&apos;re<br /><em>walking into.</em>
              </p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2">Cormorant · 3xl · light</p>
              <p className="font-heading text-3xl font-light">Tell us about your prep</p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2">DM Sans · lg · regular</p>
              <p className="font-sans text-lg leading-relaxed">
                Personalized interview prep for product designers pursuing AI roles.
              </p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2">DM Sans · sm · regular</p>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                We'll research the company and tailor your questions to your background and the specific role you're going after.
              </p>
            </div>
            <div>
              <p className="font-sans text-xs text-muted-foreground mb-2">DM Sans · xs · uppercase · tracked</p>
              <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground">
                Section label · Step 1 of 2 · Context intake
              </p>
            </div>
          </div>
        </Section>

        {/* Border Radius */}
        <Section title="Border radius">
          <div className="flex gap-6 items-end">
            {[
              { label: "sm · 0.15rem", cls: "rounded-sm" },
              { label: "md · 0.2rem", cls: "rounded-md" },
              { label: "lg · 0.25rem", cls: "rounded-lg" },
              { label: "xl · 0.35rem", cls: "rounded-xl" },
              { label: "full", cls: "rounded-full" },
            ].map(({ label, cls }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`h-12 w-12 bg-primary ${cls}`} />
                <span className="font-sans text-xs text-muted-foreground text-center">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-col gap-5">
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
            <Badge className="font-sans text-xs bg-green-100 text-green-800 border-green-200">🟢 High coverage</Badge>
            <Badge className="font-sans text-xs bg-yellow-100 text-yellow-800 border-yellow-200">🟡 Low coverage</Badge>
            <Badge className="font-sans text-xs bg-red-100 text-red-800 border-red-200">🔴 No data found</Badge>
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
              <Label className="font-sans text-xs tracking-[0.15em] uppercase">With helper text</Label>
              <Input placeholder="https://jobs.company.com/role" className="font-sans text-sm" />
              <p className="font-sans text-xs text-muted-foreground">Paste the full URL of the role you're applying for.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="font-sans text-xs tracking-[0.15em] uppercase">Error state</Label>
              <Input
                placeholder="https://yourportfolio.com"
                className="font-sans text-sm border-destructive focus-visible:ring-destructive"
              />
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
                <p className="font-sans text-xs text-muted-foreground tracking-wide">7 questions · ~25 minutes · Voice or text</p>
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

        {/* Progress */}
        <Section title="Progress">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="font-sans text-xs text-muted-foreground tracking-[0.1em] uppercase">Step 1 of 2</span>
                <span className="font-sans text-xs text-muted-foreground">50%</span>
              </div>
              <Progress value={50} className="h-px" />
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

        {/* Radio Group */}
        <Section title="Radio group">
          <RadioGroup defaultValue="hiring-manager" className="flex flex-col gap-2">
            {[
              { id: "recruiter", label: "Recruiter Screen", desc: "Initial call — culture fit, logistics, compensation" },
              { id: "hiring-manager", label: "Hiring Manager Round", desc: "Deep dive on your process and point of view on AI" },
              { id: "portfolio-review", label: "Portfolio Review", desc: "Walkthrough of your work — the why behind the what" },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 px-4 py-4 border border-border hover:border-primary cursor-pointer transition-colors duration-200"
              >
                <RadioGroupItem value={item.id} id={`ds-${item.id}`} className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor={`ds-${item.id}`} className="font-sans text-sm font-medium cursor-pointer">
                    {item.label}
                  </Label>
                  <span className="font-sans text-xs text-muted-foreground">{item.desc}</span>
                </div>
              </div>
            ))}
          </RadioGroup>
        </Section>

      </div>
      <div className="w-full h-px bg-foreground/10" />
      <div className="max-w-2xl mx-auto px-8 py-4">
        <p className="font-sans text-xs text-muted-foreground">Rehearse · Design system · v1</p>
      </div>
    </main>
  );
}
