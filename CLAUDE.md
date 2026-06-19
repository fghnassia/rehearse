# Rehearse — Claude Code Instructions

## Project
AI-powered interview coach for product designers pursuing AI-native roles. Users submit a resume, portfolio URL, job posting URL, and interview stage — the app researches the company, runs a live interview simulation, and returns a scored feedback report. Single-session, no auth, no persistent accounts.

## Tech Stack
- Next.js App Router + TypeScript
- Vercel AI SDK — streaming Claude responses
- Claude API — model: `claude-sonnet-4-5` only, no other models
- Groq Whisper API — voice transcription (`/api/transcribe`); `MediaRecorder` captures audio in browser, Whisper Large v3 transcribes server-side
- Serper API — company research via web search
- Tailwind CSS — no other styling
- Vercel — deployment

## Conventions
- File naming: kebab-case for everything (`pipeline-indicator.tsx`, `session-types.ts`)
- Components export a PascalCase name from a kebab-case file
- Custom components: `src/components/` — shadcn primitives: `src/components/ui/` (don't edit manually)
- All external API calls: `src/lib/api/` only — never inline in components or route handlers
- All `process.env` access: `src/lib/config.ts` only — never direct in components or routes
- Styling: Tailwind only. No inline styles. No CSS modules.
- Page-level padding: `px-8` — never `px-6` at layout level
- State: `useState` + `useContext` only
- Add `"use client"` to any file using shadcn interactive components, `useState`, `useEffect`, or event handlers
- Error handling: caught in `src/lib/api/`, always surfaced to UI — never swallowed silently

## Do Not
- No auth, no user accounts — single-session only
- No features outside the current build phase without asking first
- No new component if an existing one covers it
- No AI model other than `claude-sonnet-4-5`
- No gamification (badges, streaks, XP)
- No third-party speech library
- No per-answer scores visible during simulation — scores surface in `/report` only
- No rendering of `/setup`, `/confirm`, `/research`, `/simulation`, `/report` without valid session — redirect to `/`

## References
- Product vision: `/ProjectBrief.md`
- Build phases: `/docs/build-plan.md` — follow in order, don't skip ahead
- Component specs: `/docs/component-spec.md`
- UX docs: `/docs/journey-map.md`, `/docs/information-architecture.md`, `/docs/user-flow.md`
- Next.js notes: `/AGENTS.md` — read before writing any Next.js code

## Current Status
Built: `/` `/setup` `/confirm` `/research` `/simulation` and all supporting lib, API routes, and custom components except `score-display` and `question-card`.

**Next step: Phase 5 — `/report` screen + report generation.**
