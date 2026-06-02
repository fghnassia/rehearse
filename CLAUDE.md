# Rehearse — Claude Code Instructions

## 1. Project
Rehearse is an AI-powered interview coach for product designers interviewing for AI-native roles. Users provide a resume, portfolio URL, job posting URL, and interview stage — Rehearse researches the target company, simulates a live interview with a stage-specific persona, and returns a structured feedback report with per-answer scoring.

Single-session app. No authentication in V1. No persistent user accounts.

## 2. Tech Stack
- Next.js (App Router) — frontend UI and API routes
- TypeScript — required throughout, no plain JS files
- Vercel AI SDK (`ai` package) — streaming Claude API responses in Next.js App Router
- Claude API (claude-sonnet-4-5) — interview simulation, question generation, response evaluation, feedback report
- Web Speech API — browser-native voice input and transcription, no third-party library
- Serper API — real-time web search for company interview research
- Tailwind CSS — styling
- Vercel — deployment

## 3. Conventions
- Components: PascalCase filenames, one component per file, /src/components/
- Utilities: camelCase, /src/lib/
- API calls: /src/lib/api/ only — never inline in components or route handlers
- Environment variables: accessed through /src/lib/config.ts only — never referenced directly in components or routes
- Styling: Tailwind only. No inline styles. No CSS modules.
- Layout padding: px-8 for all page-level outer padding — never px-6 at the layout level
- State: useState and useContext only. No Redux, no Zustand.
- Add "use client" to any page or component that uses shadcn interactive components (RadioGroup, Accordion, Sonner, etc.), useState, useEffect, or event handlers
- File naming: kebab-case for all non-component files
- API routes: /src/app/api/, one route per file
- Error handling: caught and handled in /src/lib/api/ — never swallowed silently, always surface to the UI with a clear message

## 4. Do Not
- Do not add authentication or user accounts — V1 is single-session only
- Do not add features outside the current build phase without asking first
- Do not create new components when an existing component covers the use case
- Do not use CSS other than Tailwind
- Do not use any AI model other than claude-sonnet-4-5
- Do not make external API calls outside /src/lib/api/
- Do not add gamification — no badges, streaks, leaderboards, or XP systems
- Do not install a third-party speech library — use the Web Speech API
- Do not display per-answer evaluation scores during simulation — evaluate silently, surface scores only in /report
- Do not render /setup, /research, /simulation, or /report without valid session state — redirect to / if accessed directly

## 5. References
- Project context: See /ProjectBrief.md — product vision, target user, feature scope, design principles
- Build plan: See /docs/build-plan.md — build phase by phase, do not jump ahead
- Component library: See /docs/component-spec.md — typography roles, layout conventions, semantic tokens, and specs for all 7 custom components
- UX docs: See /docs/journey-map.md, /docs/information-architecture.md, /docs/user-flow.md
- Next.js version notes: See /AGENTS.md — read before writing any Next.js code

## 6. Current Status

**Last completed:** Build plan written — `/docs/build-plan.md`.

**What's built:**
- `/` — Home screen
- `/setup` — Context Intake (Session Setup)
- `/design-system` — Design system preview page
- `/src/components/ui/` — All shadcn components installed: button, input, label, card, badge, progress, radio-group, separator, textarea, accordion, alert, skeleton, sonner

**What's NOT built yet (see /docs/build-plan.md for full detail):**
- Phase 1: `src/lib/config.ts`, `src/lib/session-types.ts`, `src/lib/session-context.tsx`
- Phase 2: Custom components — PipelineIndicator, CoverageIndicator, PersonaCard, VoiceInput, LiveTranscript, ScoreDisplay, QuestionCard
- Phase 3: `/research` screen + Serper API integration
- Phase 4: `/simulation` screen + Claude question generation + evaluation
- Phase 5: `/report` screen + report generation
- Phase 6: Route guards + error states + polish

**API keys needed (not yet configured):**
- `ANTHROPIC_API_KEY` — Claude API
- `SERPER_API_KEY` — Web search

**Immediate next step:** Phase 1 — Foundation (session state + config)
