# Rehearse — Complete Project Brief
*For use in Claude.ai chat sessions. Last updated: June 2026.*

---

## What is Rehearse?

Rehearse is an AI-powered interview coach built specifically for product designers pursuing AI-native roles. It is a single-session web app — no signup, no account required. The user submits their resume, a job posting URL, and picks their interview stage. Rehearse researches the company, simulates a live interview with a realistic AI persona, and delivers a scored feedback report.

The core promise: **know exactly what you're walking into.**

---

## Who is it for?

Mid-to-senior product designers actively pursuing roles at AI-first companies (Anthropic, Linear, Stripe, etc.). They are:
- Skeptical of generic interview prep tools
- High craft standards — they'll notice if the UI is sloppy
- Time-pressured — one session before an interview, not a habit loop
- Motivated by specificity, not encouragement

---

## Core Design Principles

1. **Specificity over genericism** — every output is tied to the real company, real job posting, real resume
2. **Honesty over encouragement** — scores are real, feedback is direct, no false positivity
3. **One-session completeness** — everything the user needs in a single flow, no account required
4. **Artifact value** — the report is something worth keeping and reviewing
5. **Design-craft fluency** — the product understands what product designers actually do

---

## The Full User Flow

```
/ (home)
  ↓
/setup — resume text, portfolio URL, job posting URL, interview stage
  ↓
/confirm — extracted job details confirmed by user
  ↓
/research — AI researches company via Serper web search
  ↓
/simulation — AI persona interviews user (voice + text), 3–15 questions
  ↓
/report — scored feedback report (X/10, per-question breakdown)
  ↓
[optional] save report → email magic link → /sessions (history) / /r/[slug] (permanent report)
```

---

## Interview Stages

Three stages are supported:

**Recruiter Screen** — conversational, focuses on background, motivation, logistics, compensation. Persona is warm but efficient.

**Hiring Manager Round** — substantive, digs into design process, AI perspective, cross-functional work, specific project decisions. Persona pushes for specifics.

**Portfolio Review** — deep dive into past work, decisions, impact, AI integration in process. Persona wants reflection, not just description.

Each stage generates 15 questions. The user picks how many to answer (slider: 3–15 min). Time estimate updates live (~2.5 min per question).

---

## The Simulation

- An AI persona is generated with a name, role, and behavior note (e.g. "Jordan, Head of Product Design at Stripe — pushes on vague answers, expects a clear point of view on AI")
- User answers by voice (Groq Whisper transcription) or text
- Answers are stored raw during simulation — no scores shown
- All answers evaluated in parallel at report time (deferred evaluation pattern)

---

## The Report

- **Overall score** — X/10, calculated from per-question criterion scores
- **Spectrum bar** — visual position between weak/moderate/strong
- **Overall level** — Strong performance / Solid with gaps / Needs more prep
- **Per-question grid** — 3 columns, each card shows question, score dot, numeric score
- **Question detail** — clicking a card shows: 5 criteria scores (structure, specificity, relevance, communication, AI fluency), "What worked", "What to improve", "See a stronger answer" (accordion)
- **Export** — Download transcript (MD/DOCX), Download feedback (MD/DOCX/PDF), Copy
- **Save prompt** — email input, one-click save, sends magic link, no account created

---

## Scoring System

Each answer is scored across 5 criteria:
- **Structure** — clarity of narrative arc
- **Specificity** — concrete examples vs. vague generalities
- **Relevance** — fit to the question and role
- **Communication** — clarity, concision, confidence
- **AI fluency** — genuine perspective on AI in design, not buzzwords

Each criterion is `strong | moderate | weak`. Numeric conversion: strong=3, moderate=2, weak=1. Score = (sum / max) × 10, rounded to 1 decimal.

---

## Persistence Model

**Anonymous-first, save-by-choice.**

- Default: session lives only in sessionStorage — disappears when tab closes
- User can optionally enter email on the report page → Rehearse saves the session to Upstash Redis and sends a magic link via email
- Token (UUID) stored in localStorage for 90 days → same device auto-recognizes returning user
- Magic link = recovery for other devices — no password ever
- No "account" language anywhere in the UI

### What gets saved
- Full session data (setup, context, simulation answers + scores, report)
- Accessible at `/r/[slug]` permanently
- Session history at `/sessions` — grouped by company, shows stage arc, score delta vs. previous session, debrief nudge

---

## Session History Screen (/sessions)

Designed as a **briefing folder**, not a dashboard. Key design decisions:

- **Grouped by company** (primary org model — emotionally resonant: "my Stripe prep")
- **3-slot stage arc per company** — Recruiter → Hiring Mgr → Portfolio, fixed order, not-yet-attempted slots shown as "not started" with "Start →"
- **Score delta** — shows +/- vs. previous session for the same stage (only when 2+ sessions exist)
- **Weak spots** — top 2 weakest criteria shown inline
- **Debrief nudge** — if session is >24h old and no debrief filed: "How did it go? →"
- **Morning of ↗** — links to compact view optimized for night-before review

---

## Morning-Of Compact View (/r/[slug]?compact=true)

Strips the full report down to:
- Overall score + level badge
- Only the weak questions (score < 4/10)
- Sample answers surfaced by default (no accordion, already open)
- No exports, no save prompt, no clutter
- One link back to full report

Built for the anxious night-before moment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router + TypeScript |
| AI | Claude API (`claude-sonnet-4-5` only) via Vercel AI SDK |
| Structured output | `generateObject` with Zod schemas |
| Voice | Groq Whisper Large v3 |
| Company research | Serper web search API |
| Persistence | Upstash Redis (REST) |
| Email | Resend (magic links + debrief reminders) |
| Styling | Tailwind CSS only |
| Components | shadcn/ui + Base UI primitives |
| Deployment | Vercel — `https://rehearse-swart.vercel.app` |

---

## What's Built (as of June 2026)

✅ All 5 core screens: `/` `/setup` `/confirm` `/research` `/simulation` `/report`  
✅ Voice input (Groq Whisper)  
✅ Question count slider (3–15, live time estimate)  
✅ Full scoring + feedback report  
✅ Export (MD / DOCX / PDF)  
✅ Optional email persistence (Upstash + Resend)  
✅ Permanent saved report (`/r/[slug]`)  
✅ Session history (`/sessions`) — company grouping, stage arc, score delta, debrief nudge, morning-of view  
✅ Returning user strip on home page  

---

## What's Next (prioritized)

1. **UX/copy audit** — run design-critique-evaluation + ux-writing skills across all screens
2. **Hiring manager + portfolio review tuning** — stage-specific question prompts need deeper calibration
3. **Filler word detection** — detect "um", "like", "you know" post-transcription, surface count in report
4. **Readiness calibration** — one-line verdict at bottom of report ("Ready for recruiter screen. Not yet for hiring manager.")
5. **Figma design system** — rebuild design tokens in Figma, swap into app
6. **Theme switcher** — shadcn CSS variable presets, 4-5 named themes, floating toggle on home page only (not inside interview flow). Built for designers who want aesthetic control. Implemented as CSS vars in localStorage, applied to `document.documentElement` on load.

---

## Strategic Context

### North Star
Rehearse is the night-before ritual for product designers who take interviews seriously. Not a habit loop, not a learning platform — a high-stakes preparation tool used once per interview, valued for its specificity and honesty.

### Key Differentiators vs. Competitors
- **Role-specific** — built only for product designers, not generic
- **Context-specific** — uses real resume + real job posting + real company research
- **Stage-specific** — different simulation for recruiter vs. hiring manager vs. portfolio review
- **Honest scoring** — no encouragement theater, real criteria, real gaps named

### What Competitors Do That Rehearse Doesn't (yet)
- Portfolio parsing (read the actual portfolio URL, generate questions from it)
- Delivery + content split (filler words, pacing vs. content quality)
- Multi-round continuity (memory across rounds for same company)

### What No Competitor Does That Rehearse Could Own
- Morning-of compact view
- Post-interview debrief (close the loop on what actually happened)
- Designer-specific AI fluency scoring
- Theme switcher (wink to the designer audience)

---

## Key Files

```
src/
  app/
    page.tsx                          — home, returning user strip
    setup/page.tsx                    — resume + job input
    confirm/page.tsx                  — job details confirmation
    research/page.tsx                 — company research
    simulation/page.tsx               — interview simulation
    report/page.tsx                   — scored feedback report
    r/[slug]/page.tsx                 — persistent saved report
    sessions/page.tsx                 — session history
    api/
      generate-questions/route.ts     — Claude: persona + 15 questions
      evaluate-answer/route.ts        — Claude: score one answer
      generate-report/route.ts        — Claude: overall summary
      transcribe/route.ts             — Groq Whisper
      research/route.ts               — Serper company research
      auth/save/route.ts              — save session, create token, send magic link
      auth/verify/route.ts            — validate token, return session list
      auth/request-link/route.ts      — recovery: send magic link by email
      sessions/[slug]/route.ts        — get full saved session
      sessions/[slug]/debrief/route.ts — append post-interview debrief
  lib/
    session-context.tsx               — SessionContext, sessionStorage, SESSION_KEY
    session-types.ts                  — all TypeScript interfaces
    config.ts                         — all env var access
    api/
      claude.ts                       — generateQuestions, evaluateAnswer, generateReport
      kv.ts                           — Upstash Redis CRUD (tokens, sessions, email mapping)
      email.ts                        — Resend: sendMagicLink, sendDebriefReminder
      research.ts                     — Serper search
  components/
    persona-card.tsx                  — pre-interview screen with slider
    question-card.tsx                 — per-question feedback with criteria donuts
    score-display.tsx                 — DonutChart + ScoreDisplay
    save-prompt.tsx                   — email input, save to KV
    pipeline-indicator.tsx            — step progress nav
    voice-input.tsx                   — MediaRecorder + Groq transcription
```
