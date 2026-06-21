# Rehearse — Claude Code Instructions

## Project
AI-powered interview coach for product designers pursuing AI-native roles. Users submit a resume, portfolio URL, job posting URL, and interview stage — the app researches the company, runs a live interview simulation, and returns a scored feedback report.

Anonymous-first, save-by-choice. No passwords, no accounts. Email magic link for optional session persistence.

## Tech Stack
- Next.js App Router + TypeScript
- Vercel AI SDK — `generateObject` with Zod schemas for structured Claude output
- Claude API — model: `claude-sonnet-4-5` only, no other models
- Groq Whisper API — voice transcription (`/api/transcribe`); `MediaRecorder` captures audio in browser, Whisper Large v3 transcribes server-side
- Serper API — company research via web search
- Upstash Redis (`@upstash/redis`) — session + token persistence via REST API
- Resend — transactional email (magic links, debrief reminders); sender: `onboarding@resend.dev` until domain verified
- Tailwind CSS — no other styling
- Base UI — accordion primitive (not radix)
- Vercel — deployment at `https://rehearse-swart.vercel.app`

## Architecture

### Session Flow
`/` → `/setup` → `/confirm` → `/research` → `/simulation` → `/report`

All session state lives in `sessionStorage` via `SessionContext` (`src/lib/session-context.tsx`). Key: `rehearse-session`. Each page redirects to `/` if required session state is missing.

### Deferred Evaluation Pattern
Raw answers are stored during simulation (`userAnswer` only). At report time, all answers are evaluated in parallel via `Promise.all` — each answer scored across 5 criteria (structure, specificity, relevance, communication, AI fluency) as `strong | moderate | weak`.

### Persistence (optional, save-by-choice)
- User enters email on `/report` → POST `/api/auth/save` → creates token (UUID) + session slug (10-char) in Upstash Redis → sends magic link via Resend → returns `{ tokenId, slug }`
- Token stored in `localStorage` (`rehearse_token`) for same-device recall
- Magic link: `/sessions?t={tokenId}` — writes token to localStorage, shows session history
- Saved report: `/r/[slug]` — reads from KV, full report UI + morning-of compact view (`?compact=true`)
- Session history: `/sessions` — grouped by company, 3-slot stage arc, score delta, debrief nudge

### KV Key Structure
- `token:{uuid}` → `{ email, expires, sessionSlugs[] }` — 90 days
- `session:{slug}` → `SavedSession` — 1 year
- `email:{email}` → `{ tokenId }` — 90 days

## Conventions
- File naming: kebab-case for everything (`pipeline-indicator.tsx`, `session-types.ts`)
- Components export a PascalCase name from a kebab-case file
- Custom components: `src/components/` — shadcn/Base UI primitives: `src/components/ui/` (don't edit manually)
- All external API calls: `src/lib/api/` only — never inline in components or route handlers
- All `process.env` access: `src/lib/config.ts` only — never direct in components or routes
- Styling: Tailwind only. No inline styles. No CSS modules.
- Page-level padding: `px-8` — never `px-6` at layout level
- State: `useState` + `useContext` only
- Add `"use client"` to any file using interactive components, `useState`, `useEffect`, or event handlers
- Error handling: caught in `src/lib/api/`, always surfaced to UI — never swallowed silently

## Do Not
- No auth walls, no passwords — magic link only
- No features outside the current build phase without asking first
- No new component if an existing one covers it
- No AI model other than `claude-sonnet-4-5`
- No gamification (badges, streaks, XP)
- No third-party speech library
- No per-answer scores visible during simulation — scores surface in `/report` only
- No rendering of `/setup`, `/confirm`, `/research`, `/simulation`, `/report` without valid session — redirect to `/`

## Env Vars Required
```
ANTHROPIC_API_KEY
GROQ_API_KEY
SERPER_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY
NEXT_PUBLIC_APP_URL   # https://rehearse-swart.vercel.app in prod, http://localhost:3000 locally
```

## Current Status
**All phases complete through Phase 6 (persistence).**

Built and shipped:
- `/` — home, returning user strip (token detection)
- `/setup` — resume + job URL + stage input
- `/confirm` — job details confirmation
- `/research` — company research via Serper
- `/simulation` — persona card with question count slider (3–15), voice + text answers, skip, real-time evaluation
- `/report` — overall score (X/10), spectrum bar, 3-col question grid, question detail with criteria donuts, export (MD/DOCX/PDF), save prompt
- `/r/[slug]` — persistent report (KV), morning-of compact view (`?compact=true`)
- `/sessions` — session history grouped by company, 3-slot stage arc, score delta, debrief nudge, morning-of link
- All API routes: `/api/generate-questions`, `/api/evaluate-answer`, `/api/generate-report`, `/api/transcribe`, `/api/research`, `/api/auth/save`, `/api/auth/verify`, `/api/auth/request-link`, `/api/sessions/[slug]`, `/api/sessions/[slug]/debrief`

**Next steps (in order):**
1. Run `design-critique-evaluation` + `ux-writing` skills — UX/copy audit across all screens
2. Build hiring manager + portfolio review stage questions (currently recruiter only is tuned)
3. Filler word detection — post-transcription, surface in report
4. Readiness calibration — one-line verdict ("Ready for recruiter screen. Not yet for hiring manager.")
5. Figma design system + shadcn theme switcher (home page only, deferred post-user-feedback)

## References
- Product vision: `/ProjectBrief.md`
- Build phases: `/docs/build-plan.md`
- Component specs: `/docs/component-spec.md`
- Strategy brief: `/docs/rehearse-strategy-brief.docx`
- Next.js notes: `/AGENTS.md` — read before writing any Next.js code
