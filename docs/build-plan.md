# Rehearse — Build Plan

*Written 2026-06-02. Build phases in order — do not jump ahead.*

---

## How to use this plan

Each phase is a discrete unit of work with clear inputs and outputs. A phase is done when every checkbox is checked and the app builds without type errors. Do not start the next phase until the current one is complete.

Reference files:
- Component specs: `/docs/component-spec.md`
- User flow: `/docs/user-flow.md`
- IA: `/docs/information-architecture.md`
- Next.js notes: `/AGENTS.md`

---

## Phase 1 — Foundation

**Goal:** Establish the session state layer and environment config that every subsequent phase depends on. No new UI. No visible changes.

### Files to create

- [ ] `src/lib/config.ts` — typed env var access. All `process.env` access in the app goes through here. Throws at startup if required keys are missing.
- [ ] `src/lib/session-types.ts` — TypeScript types for the full session state object (see below).
- [ ] `src/lib/session-context.tsx` — React Context + `useSession` hook + `SessionProvider`. Uses `sessionStorage` to survive Next.js client-side navigation between routes.
- [ ] Update `src/app/layout.tsx` — wrap children with `SessionProvider`.

### Session state shape

```ts
// src/lib/session-types.ts

export type InterviewStage = 'recruiter' | 'hiring-manager' | 'portfolio-review'
export type CoverageLevel = 'rich' | 'sparse' | 'none'
export type ScoreLevel = 'strong' | 'moderate' | 'weak'

export interface SetupData {
  resumeText: string          // extracted text from PDF
  portfolioUrl: string
  jobPostingUrl: string
  jobPostingText: string      // scraped text from job URL
  stage: InterviewStage
}

export interface ResearchData {
  companyName: string
  roleTitle: string
  coverageLevel: CoverageLevel
  sourceCount: number
  sources: string[]
  insights: string            // formatted company insights (markdown)
  disclaimer?: string         // shown if sparse or none
}

export interface QAPair {
  questionId: string
  questionText: string
  userAnswer: string
  scores: Array<{
    criterion: string
    level: ScoreLevel
    rationale: string
  }>
  whatWorked: string
  whatToImprove: string
  sampleAnswer: string
}

export interface SimulationData {
  personaName: string
  personaRole: string
  behaviorNote: string
  questions: string[]         // question texts in order
  answers: QAPair[]           // filled in as simulation progresses
}

export interface ReportData {
  overallImpressionLevel: ScoreLevel
  overallImpressionSummary: string
  generatedAt: string         // ISO timestamp
}

export interface SessionState {
  setup?: SetupData
  research?: ResearchData
  simulation?: SimulationData
  report?: ReportData
}
```

### SessionProvider behavior

- Reads from `sessionStorage` on mount (key: `rehearse-session`)
- Writes to `sessionStorage` on every state update
- Exposes `session`, `updateSetup`, `updateResearch`, `updateSimulation`, `updateReport`, `clearSession`
- On clear: wipes `sessionStorage` and resets to `{}`

### Notes

- `sessionStorage` is intentional — clears on tab close, which matches "single session, no persistence" in the brief.
- `config.ts` must export `getConfig()` returning `{ anthropicApiKey, serperApiKey }`. Import this only in API routes and `/src/lib/api/` — never in components.

---

## Phase 2 — Custom Components

**Goal:** Build all 7 custom components. All can be previewed on `/design-system` when done.

Build in this order (each depends on the previous):

### 2.1 PipelineIndicator

- [ ] `src/components/pipeline-indicator.tsx`
- Props: `currentStage: 'setup' | 'research' | 'simulation' | 'report'`
- 4 labeled steps, horizontal. Current = primary color. Completed = muted + checkmark. Future = muted foreground.
- Display only, no interaction.
- Add to `/design-system` page for preview.

### 2.2 CoverageIndicator

- [ ] `src/components/coverage-indicator.tsx`
- Props: `level: CoverageLevel`, `sourceCount?: number`, `className?: string`
- Uses `--state-positive`, `--state-warning`, `--state-negative` tokens — never raw Tailwind colors.
- Badge must have `aria-label` in plain language.
- Add to `/design-system` page.

### 2.3 PersonaCard

- [ ] `src/components/persona-card.tsx`
- Props per spec: `stage`, `personaName`, `personaRole`, `behaviorNote`, `questionCount`, `onBegin`
- Stage overline → persona name (h2) → role/company (body-sm) → behavior note (body-sm muted) → question count + estimated time → Begin CTA.
- Add to `/design-system` page.

### 2.4 VoiceInput + LiveTranscript

Build these together — they are tightly coupled. `VoiceInput` owns the speech recognition state machine; `LiveTranscript` is a controlled display component fed by `VoiceInput`.

- [ ] `src/components/live-transcript.tsx` — build first (simpler, no browser API dependency)
  - Props: `transcript`, `interimTranscript?`, `state: 'streaming' | 'editable' | 'locked' | 'empty'`, `onChange?`
  - Interim text shown muted/italic. Editable state = `<textarea>`. Locked = read-only quoted block. Empty = placeholder text.

- [ ] `src/components/voice-input.tsx` — build second
  - State machine: `idle → recording → processing → transcript-ready → confirmed` (+ error + unavailable branches)
  - Check `window.SpeechRecognition || window.webkitSpeechRecognition` on mount. If unavailable → `unavailable` state, render nothing, call `onSwitchToText`.
  - `continuous = false`, `interimResults = true`
  - Interim results feed `LiveTranscript` in real time
  - Mic button: `aria-label` updates per state. `aria-live="polite"` region for status. Error state: `role="alert"`.

- [ ] Add both to `/design-system` page with all state variants visible (use Storybook-style static props to show each state).

### 2.5 ScoreDisplay

- [ ] `src/components/score-display.tsx`
- Props: `criterion`, `level: ScoreLevel`, `rationale`
- Uses `--state-positive` / `--state-warning` / `--state-negative` tokens.
- Add to `/design-system` page.

### 2.6 QuestionCard

- [ ] `src/components/question-card.tsx`
- Props per spec: `questionNumber`, `questionText`, `userAnswer`, `scores[]`, `whatWorked`, `whatToImprove`, `sampleAnswer`
- Renders 5 × `ScoreDisplay` components.
- "Sample stronger answer" uses shadcn `Accordion` for expand/collapse. Label: "See a stronger answer — adapt in your own voice."
- "What to improve" must follow gap + fix pattern. Enforce in the component with a comment on the prop.
- Add to `/design-system` page with sample data.

---

## Phase 3 — /research Screen

**Goal:** First new functional route. Researches the company from the session's job URL, displays results, lets user proceed to simulation.

### Files to create

- [ ] `src/lib/api/serper.ts` — Serper API client. `searchCompanyInterviews(companyName: string): Promise<SerperResult[]>`. Uses `getConfig().serperApiKey`. Throws on non-200. Never called outside `/src/lib/api/`.
- [ ] `src/lib/api/research.ts` — orchestration layer. Takes `SetupData`, runs Serper searches (Glassdoor, Reddit, Blind, LinkedIn, company blog — parallel), classifies coverage level, formats insights using Claude. Returns `ResearchData`.
- [ ] `src/app/api/research/route.ts` — POST handler. Reads `SetupData` from request body, calls `research.ts`, returns `ResearchData`. Streams status updates as SSE so the UI can show live "Searching Glassdoor…" messages.
- [ ] `src/app/research/page.tsx` — Research page.

### Page behavior

**State A — Researching** (auto-starts on mount):
- Reads `session.setup` from context. If missing → redirect to `/`.
- Calls `/api/research` and consumes the SSE stream.
- Displays live status messages as each source is searched ("Searching Glassdoor…", "Checking Reddit…", etc.)
- Shows sources as they are found, building in real time.
- Never shows a silent spinner — always contextual text.

**State B — Company Brief** (when research completes):
- Sets `session.research` in context.
- Shows `CoverageIndicator` component.
- Shows company insights if coverage is rich or sparse.
- Shows disclaimer callout if sparse or none: "We couldn't find detailed interview data for this company. Questions will be well-crafted but not company-specific."
- Shows sources list.
- "Change inputs" ghost link → `/setup`.
- "Begin Simulation" button → `/simulation`. Triggers persona + question generation (system call) before navigating.

### PipelineIndicator placement

Add `<PipelineIndicator currentStage="research" />` at the top of both states.

---

## Phase 4 — /simulation Screen

**Goal:** Core product interaction. Stage-specific persona, 7-question Q&A loop, voice and text input, silent per-answer evaluation.

### Files to create

- [ ] `src/lib/api/claude.ts` — Claude client using Vercel AI SDK (`ai` package). Exports:
  - `generateQuestions(setup: SetupData, research: ResearchData): Promise<{ personaName, personaRole, behaviorNote, questions: string[] }>`
  - `evaluateAnswer(question: string, answer: string, stage: InterviewStage): Promise<QAPair['scores'] & { whatWorked, whatToImprove, sampleAnswer }>`
  - `generateReport(simulation: SimulationData): Promise<ReportData>`
  - Model: `claude-sonnet-4-5` per CLAUDE.md.

- [ ] `src/app/api/generate-questions/route.ts` — POST. Accepts `{ setup, research }`, returns persona + questions. Called once when leaving `/research`.
- [ ] `src/app/api/evaluate/route.ts` — POST. Accepts `{ question, answer, stage }`, returns evaluation. Called after each answer submission. Uses streaming response so the UI can show a loading state with context.
- [ ] `src/app/simulation/page.tsx` — Simulation page.

### Page behavior

**State A — Ready:**
- Reads `session.setup` and `session.research` from context. If either missing → redirect to `/`.
- Reads persona + questions from `session.simulation`. If not yet generated: calls `/api/generate-questions`, stores result in `session.simulation`, then renders.
- Renders `PersonaCard` with persona data.
- Checks voice support (`window.SpeechRecognition || window.webkitSpeechRecognition`) — if unavailable, shows text-only notice.
- "Begin Interview" → State B.

**State B — In Progress:**
- Shows current question (large, clearly primary).
- Shows "Question N of 7" progress indicator.
- Renders `VoiceInput` + `LiveTranscript` if voice is supported, `Textarea` if not.
- Input mode toggle: Voice ↔ Text.
- Submit button disabled until answer is present (transcript confirmed or text non-empty).
- On submit:
  1. Calls `/api/evaluate` with question + answer.
  2. Shows loading state with context ("Thinking…") — not a silent spinner.
  3. Stores `QAPair` result silently in `session.simulation.answers`. **Does not display scores.**
  4. Advances to next question, or → State C if all answered.

**State C — Complete:**
- Shows: "Session complete. Generating your report…"
- Calls `/api/generate-questions` is already done — calls `/api/report` (Phase 5 API route).
- Animated loading indicator with context.
- On completion → navigate to `/report`.

### PipelineIndicator placement

`<PipelineIndicator currentStage="simulation" />` — shown in States A and C. Hidden during State B (not needed while in the flow).

### Mid-simulation exit

On `beforeunload` or browser back during State B: session is abandoned. The `ABANDONED` behavior (redirect to `/`) is handled by the route guard — if `/simulation` is loaded with no valid session, redirect to `/`.

---

## Phase 5 — /report Screen

**Goal:** Final screen. Renders the structured feedback report from accumulated session data.

### Files to create

- [ ] `src/lib/api/report.ts` — report compilation. Takes full `SimulationData`, calls Claude to generate overall impression + any per-question pieces not yet generated. Returns `ReportData`.
- [ ] `src/app/api/report/route.ts` — POST. Accepts `SimulationData`, returns `ReportData`. Streaming preferred.
- [ ] `src/app/report/page.tsx` — Report page.

### Page behavior

- Reads `session.simulation` and `session.report` from context. If either missing → redirect to `/`.
- Shows session summary header: Company name · Role title · Stage.
- Shows overall impression (`ScoreLevel` badge + one-line summary).
- Renders `QuestionCard` for each answered question (uses `session.simulation.answers`).
- Shows session-end notice callout: "This report lives only in this session. Copy it before you leave."
- "Copy report" button: formats all Q&A pairs + scores + feedback as plain text, copies to clipboard. No auth, no export file.
- 3 exit buttons at bottom:
  - "Redo this stage" → clears `simulation` + `report` from session, navigates to `/simulation` (re-triggers question generation)
  - "Prep a different stage" → clears `simulation` + `report` from session, navigates to `/setup`
  - "Start fresh" → calls `clearSession()`, navigates to `/`

### PipelineIndicator placement

`<PipelineIndicator currentStage="report" />` at top.

---

## Phase 6 — Route Guards + Polish

**Goal:** Make the app shippable. No new features — only correctness and resilience.

### Route guards

- [ ] `src/middleware.ts` — Next.js middleware that checks for session state on protected routes (`/research`, `/simulation`, `/report`). If no valid session in `sessionStorage` equivalent (note: middleware runs server-side, so use a cookie or query param signal if needed — or handle per-page in `useEffect`).

**Simpler alternative:** Handle per-page with a `useEffect` guard at the top of each page:
```ts
useEffect(() => {
  if (!session.setup) router.replace('/')
}, [])
```
This is acceptable for V1 given the app is client-side and single-session.

- [ ] Verify all 4 protected routes (`/setup`, `/research`, `/simulation`, `/report`) redirect to `/` when accessed without valid prior state.

### Error states review

Walk through every error state from the IA doc and verify each is handled:

- [ ] Invalid resume PDF → inline error on `/setup`, retry upload
- [ ] Job URL unreachable → inline error on `/setup`, retry
- [ ] Portfolio URL unreachable → warning (not blocker) on `/setup`
- [ ] Research API failure → `/research` State B shows 🔴 No data badge, user informed
- [ ] Voice transcription failure → inline error in `VoiceInput`, retry + switch-to-text
- [ ] Evaluation API timeout → loading state with context on `/simulation` State B
- [ ] Report generation failure → inline error with retry on `/simulation` State C

### Loading states review

Every system call must show contextual loading — never a silent spinner:

- [ ] `/research` State A: live search status messages
- [ ] Question generation: brief loading on `/simulation` State A
- [ ] Per-answer evaluation: "Thinking…" on `/simulation` State B
- [ ] Report generation: "Generating your report…" on `/simulation` State C

### Final checks

- [ ] `ANTHROPIC_API_KEY` and `SERPER_API_KEY` wired through `config.ts`
- [ ] `.env.example` with both keys documented
- [ ] `config.ts` throws with a clear message if keys are missing at startup
- [ ] All routes build without type errors
- [ ] `/design-system` shows all 7 custom components in all their states

---

## Dependency map

```
Phase 1 (Foundation)
  └── Phase 2 (Components)
        ├── Phase 3 (/research)
        │     └── Phase 4 (/simulation)
        │           └── Phase 5 (/report)
        │                 └── Phase 6 (Guards + Polish)
        └── [also needed by] Phase 4 and Phase 5
```

API call chain per session:
```
/setup (user input)
  → POST /api/research         [Phase 3] — Serper search + Claude formatting
  → POST /api/generate-questions [Phase 4] — Claude: persona + question set
  → POST /api/evaluate ×N      [Phase 4] — Claude: per-answer scores (silent)
  → POST /api/report           [Phase 5] — Claude: overall impression + report
```
