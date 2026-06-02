import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col">

      {/* Thin top rule */}
      <div className="w-full h-px bg-foreground/10" />

      {/* Nav strip */}
      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground">
          Rehearse
        </span>
        <span className="text-xs text-muted-foreground">
          Interview prep for product designers
        </span>
      </div>

      {/* Main content — asymmetric, generous */}
      <div className="flex-1 flex flex-col justify-center px-8 pb-24">
        <div className="max-w-3xl">

          {/* Overline */}
          <p className="text-xs font-sans font-medium tracking-[0.25em] uppercase text-muted-foreground mb-8">
            AI-powered · Role-specific · Honest
          </p>

          {/* Display heading */}
          <h1 className="font-heading text-[clamp(3.5rem,8vw,7rem)] font-light leading-[0.95] tracking-tight text-foreground mb-10">
            Know exactly<br />
            <em className="font-light">what you&apos;re</em><br />
            walking into.
          </h1>

          {/* Value prop */}
          <p className="font-sans text-lg text-muted-foreground max-w-md leading-relaxed mb-12">
            Upload your resume, paste the job posting, pick your stage.
            Rehearse researches the company, simulates the interview, and tells you
            precisely where you stood.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-6">
            <Button render={<Link href="/setup" />} nativeButton={false} size="lg" className="font-sans text-sm tracking-[0.1em] uppercase px-8">
              Start Session
            </Button>
            <span className="text-xs text-muted-foreground">
              No account required
            </span>
          </div>
        </div>
      </div>

      {/* Bottom rule + footnote */}
      <div className="w-full h-px bg-foreground/10" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground">
          Rehearse · Built with Claude · For product designers
        </p>
      </div>

    </main>
  );
}
