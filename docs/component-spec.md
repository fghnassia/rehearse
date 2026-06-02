# Rehearse — Component Specification
*Read this before creating any new component. Use existing patterns before building new ones.*

---

## Typography System

### Named Type Roles

Always use these role names consistently. Do not derive sizes ad-hoc.

| Role | Tailwind classes | Font | Used for |
|---|---|---|---|
| `type-display` | `font-heading text-[clamp(3.5rem,8vw,7rem)] font-light leading-[0.95] tracking-tight` | Cormorant Garamond | Hero headings on Home only |
| `type-h1` | `font-heading text-5xl font-light leading-tight tracking-tight` | Cormorant Garamond | Primary page heading |
| `type-h2` | `font-heading text-3xl font-light leading-tight` | Cormorant Garamond | Section heading |
| `type-h3` | `font-heading text-xl font-medium` | Cormorant Garamond | Card title, subsection heading |
| `type-body-lg` | `font-sans text-lg leading-relaxed` | DM Sans | Lead paragraph, value proposition |
| `type-body` | `font-sans text-base leading-relaxed` | DM Sans | Default body copy |
| `type-body-sm` | `font-sans text-sm text-muted-foreground leading-relaxed` | DM Sans | Helper text, descriptions |
| `type-overline` | `font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground` | DM Sans | Section labels, step indicators, overlines |
| `type-caption` | `font-sans text-xs text-muted-foreground` | DM Sans | Timestamps, footnotes, fine print |
| `type-ui` | `font-sans text-sm font-medium` | DM Sans | Button labels, form labels |
| `type-ui-sm` | `font-sans text-xs tracking-[0.1em] uppercase` | DM Sans | Small button labels, badge text |

### Cormorant Italic Rule

Cormorant Garamond italic (`font-heading italic` or `<em>` inside a heading) is used **only** in display-level and h1 headings to create a conversational pause or emphasis. 

**Correct:** `<h1>Tell us about <em>your prep</em></h1>`

**Never use in:** body copy, labels, UI text, card titles, helper text, overlines.

### Heading Responsiveness

`type-display` uses `clamp()` — responsive by default.
`type-h1` through `type-h3` use fixed sizes. On screens below `sm` breakpoint, step down one level: h1 → use h2 classes, h2 → use h3 classes.

---

## Layout Conventions

- **Outer page padding:** `px-8` — always. Never `px-6` at the layout level.
- **Max content width:** `max-w-xl` for single-column forms, `max-w-2xl` for content pages.
- **Vertical page padding:** `py-14` to `py-16` for main content areas.
- **Section gaps:** `gap-10` between form sections, `gap-6` between related items within a section.

---

## Semantic State Tokens

Used by `CoverageIndicator` and `ScoreDisplay`. Reference these tokens — never use raw Tailwind color classes for state colors.

| Token | Purpose | Light value |
|---|---|---|
| `--state-positive` / `--state-positive-foreground` | High coverage · Strong score | Muted green |
| `--state-warning` / `--state-warning-foreground` | Low coverage · Moderate score | Muted amber |
| `--state-negative` / `--state-negative-foreground` | No coverage · Weak score | Muted red |

In Tailwind: `bg-[var(--state-positive)] text-[var(--state-positive-foreground)]`

---

## Component Inventory

### Installed (shadcn/ui — do not rebuild)

`Button` · `Input` · `Label` · `Card` · `Badge` · `Progress` · `RadioGroup` · `Separator` · `Textarea` · `Accordion` · `Alert` · `Skeleton` · `Sonner`

---

### Custom Components (Rehearse-specific)

---

#### `PipelineIndicator`

**Purpose:** Shows the user where they are in the 4-stage session flow. Reduces anxiety by making the full path visible.

**Location:** `src/components/pipeline-indicator.tsx`

**Anatomy:**
- 4 stage labels: Setup · Research · Simulation · Report
- Current stage highlighted (primary color)
- Completed stages: muted with a check or dimmed text
- Future stages: muted foreground

**Props:**
```ts
type Stage = 'setup' | 'research' | 'simulation' | 'report'
interface PipelineIndicatorProps {
  currentStage: Stage
}
```

**States:** No interactive states — display only.

**Usage:** Appears on `/setup`, `/research`, `/simulation`, `/report`. Not on `/`.

---

#### `CoverageIndicator`

**Purpose:** Tells the user honestly how much company-specific data was found. Prevents the product from misleading users about research quality.

**Location:** `src/components/coverage-indicator.tsx`

**Anatomy:**
- Status badge (icon + label)
- One-line explanation
- Source count (optional)

**Props:**
```ts
type CoverageLevel = 'rich' | 'sparse' | 'none'
interface CoverageIndicatorProps {
  level: CoverageLevel
  sourceCount?: number
  className?: string
}
```

**States and content:**

| Level | Icon | Label | Explanation |
|---|---|---|---|
| `rich` | 🟢 | High coverage | "We found detailed interview data for this company." |
| `sparse` | 🟡 | Limited coverage | "We found some data — questions will be less company-specific." |
| `none` | 🔴 | No data found | "No interview data found — questions will be general but well-crafted." |

**Token usage:** `--state-positive`, `--state-warning`, `--state-negative`

**Accessibility:** Badge must have `aria-label` describing the coverage level in plain language.

---

#### `PersonaCard`

**Purpose:** Introduces the interviewer persona before the simulation begins. Establishes the voice and expectations for the conversation.

**Location:** `src/components/persona-card.tsx`

**Anatomy:**
- Stage label (overline)
- Persona name (h2)
- Role / company description (body-sm)
- Brief behavioral note (body-sm, muted) — e.g. "Asks follow-up questions. Expects concrete examples."
- Question count + estimated time
- Begin CTA

**Props:**
```ts
interface PersonaCardProps {
  stage: 'recruiter' | 'hiring-manager' | 'portfolio-review'
  personaName: string
  personaRole: string
  behaviorNote: string
  questionCount: number
  onBegin: () => void
}
```

---

#### `VoiceInput`

**Purpose:** Captures the user's spoken interview answer via the Web Speech API and delivers a confirmed transcript for submission.

**Location:** `src/components/voice-input.tsx`

**This is the most complex component in the system. Build it last, spec it first.**

**States:**

| State | Visual | User action available |
|---|---|---|
| `idle` | Mic button, default appearance | Click to start recording |
| `recording` | Mic button active (pulsing border or ring), "Recording…" label | Click to stop |
| `processing` | Mic button disabled, spinner, "Processing…" | None — wait |
| `transcript-ready` | Mic button reset, transcript shown in LiveTranscript | Edit transcript, confirm, or re-record |
| `confirmed` | Transcript locked, submit enabled | Submit answer |
| `error` | Error message inline, retry option | Retry or switch to text |
| `unavailable` | Text-only mode notice, mic button hidden | Type answer instead |

**State machine:**
```
idle → recording → processing → transcript-ready → confirmed
                                                  ↘ re-record → recording
processing → error → idle (retry) or unavailable (switch)
unavailable → (text input takes over — VoiceInput renders nothing)
```

**Props:**
```ts
interface VoiceInputProps {
  onTranscriptConfirmed: (transcript: string) => void
  onSwitchToText: () => void
  disabled?: boolean
}
```

**Accessibility:**
- Mic button: `aria-label="Start recording"` / `"Stop recording"` / `"Recording unavailable"`
- Recording state: `aria-live="polite"` region for status updates
- Error state: `role="alert"`

**Implementation notes:**
- Uses `window.SpeechRecognition || window.webkitSpeechRecognition` — check for availability on mount
- Set `recognition.continuous = false`, `recognition.interimResults = true`
- Interim results → show in transcript in real time (greyed/italic)
- Final result → show confirmed transcript
- Do NOT show evaluation scores during recording — scores are calculated silently after submission

---

#### `LiveTranscript`

**Purpose:** Displays the live and confirmed transcript of the user's spoken answer. Allows one editing pass before submission.

**Location:** `src/components/live-transcript.tsx`

**Anatomy:**
- Transcript text area (read-only during recording, editable after)
- Character count (optional)
- Edit state indicator

**States:**

| State | Behavior |
|---|---|
| `streaming` | Text updates in real time as speech is detected. Read-only. Interim words shown in muted style. |
| `editable` | Recording ended. User can edit the transcript text. One pass only — once submitted, locked. |
| `locked` | Answer submitted. Transcript shown as read-only quote. |
| `empty` | No transcript yet. Shows placeholder. |

**Props:**
```ts
interface LiveTranscriptProps {
  transcript: string
  interimTranscript?: string
  state: 'streaming' | 'editable' | 'locked' | 'empty'
  onChange?: (value: string) => void
}
```

**Rule:** Only one editing pass. After the user clicks confirm/submit, the transcript is locked. Do not allow re-editing — it encourages over-polishing rather than authentic practice.

---

#### `ScoreDisplay`

**Purpose:** Shows the per-criterion evaluation score for a single interview answer in the feedback report.

**Location:** `src/components/score-display.tsx`

**Score format decision: Qualitative (Strong / Moderate / Weak)**

Rationale: Numeric scores (6.5/10) invite calibration debates and shift focus from the feedback to the number. Qualitative labels with a brief explanation keep the user focused on what to fix.

**Anatomy:**
- Criterion name (label)
- Score level badge (Strong / Moderate / Weak)
- One-line rationale (body-sm)

**Criteria evaluated:**
1. Clarity — was the answer easy to follow?
2. Specificity — did it use concrete examples?
3. Relevance — did it actually answer the question?
4. AI fluency — did it demonstrate a genuine point of view on AI?
5. Overall impression — how would an interviewer read this?

**Props:**
```ts
type ScoreLevel = 'strong' | 'moderate' | 'weak'
interface ScoreDisplayProps {
  criterion: string
  level: ScoreLevel
  rationale: string
}
```

**Token usage:** `--state-positive` (strong), `--state-warning` (moderate), `--state-negative` (weak)

---

#### `QuestionCard`

**Purpose:** Shows the complete feedback for a single interview question — the question, the answer, all 5 criterion scores, what worked, what to improve, and a sample stronger answer.

**Location:** `src/components/question-card.tsx`

**Anatomy:**
- Question number + text (overline + h3)
- User's answer (quoted, muted background)
- 5 × `ScoreDisplay` components
- "What worked" callout (positive)
- "What to improve" callout — **gap + fix framing**, not just criticism (e.g. "You described the outcome but didn't connect it to business impact — add one sentence on why it mattered to the company.")
- "Sample stronger answer" — `Accordion` with expand/collapse. Framed as calibration: "Here's what a strong answer covers — adapt in your own voice."

**Props:**
```ts
interface QuestionCardProps {
  questionNumber: number
  questionText: string
  userAnswer: string
  scores: Array<{ criterion: string; level: ScoreLevel; rationale: string }>
  whatWorked: string
  whatToImprove: string
  sampleAnswer: string
}
```

**Important:** "What to improve" must follow the gap + fix pattern: name the gap, then explain the fix. Never just "be more specific." Always "You [did X] but didn't [include Y] — add [Z]."

---

## Component Build Order

Build in this order — each depends on the previous:

1. `PipelineIndicator` — needed on all non-home screens
2. `CoverageIndicator` — needed for /research
3. `PersonaCard` — needed for /simulation State A
4. `VoiceInput` + `LiveTranscript` — build together, needed for /simulation State B
5. `ScoreDisplay` — needed for /report
6. `QuestionCard` — uses ScoreDisplay, needed for /report
