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
- State: useState and useContext only. No Redux, no Zustand.
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

## 5. References
- Project context: See /ProjectBrief.md — product vision, target user, feature scope, design principles
- Build plan: See /docs/build-plan.md — build phase by phase, do not jump ahead
- Component library: See /docs/component-spec.md — use existing components before creating new ones
- Next.js version notes: See /AGENTS.md — read before writing any Next.js code
