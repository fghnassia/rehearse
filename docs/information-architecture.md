# Rehearse — Information Architecture
*Revised after IA skill evaluation*

---

## Screen Hierarchy

Rehearse is a **linear wizard** with a single re-entry branch at the end. Flat structure by design — one level deep.

```
/ ......................... Home
/setup .................... Session Setup
/research ................. Company Research
  ├── State A: Researching  (system process — passive)
  └── State B: Company Brief (user reads, decides — active)
/simulation ............... Interview Simulation
  ├── State A: Ready        (persona intro, pre-start)
  ├── State B: In Progress  (Q&A loop)
  └── State C: Complete     (transition to /report)
/report ................... Your Report
```

**Depth:** 1 level with named sub-states. No orphaned screens. No dead ends.

---

## Content Inventory — Per Screen

---

### `/` — Home

| Content | Type | Notes |
|---|---|---|
| App name | Heading | "Rehearse" |
| Value proposition | Body | Direct and specific — not aspirational |
| Primary CTA | Button | "Start Session" → /setup |

---

### `/setup` — Session Setup

| Content | Type | Notes |
|---|---|---|
| Stage pipeline indicator | Progress UI | Setup → Research → Simulation → Report (all stages visible) |
| Section label | Overline | "Session setup" — not "Context intake" (internal jargon) |
| Resume upload | File input | PDF only, drag and drop |
| Portfolio URL | Text input | URL validation |
| Job posting URL | Text input | URL validation + helper text |
| Stage selector | Radio group | Recruiter / Hiring Manager / Portfolio Review with descriptions |
| Pre-simulation notice | Callout | "Once you begin the interview, the session runs as one continuous flow." |
| Field-level validation errors | Inline states | Per field, not toast |
| Back | Ghost link | → / |
| CTA | Button | "Research Company" → /research |

---

### `/research` — Company Research

**State A — Researching (system process):**

| Content | Type | Notes |
|---|---|---|
| Company name | Heading | Parsed from job posting URL |
| Live status messages | Animated text | "Searching Glassdoor…" — never a silent spinner |
| Sources found (building) | List | Shown as found in real time |

**State B — Company Brief (user decision):**

| Content | Type | Notes |
|---|---|---|
| Company name + role title | Heading | |
| Data coverage indicator | Status badge | 🟢 Rich / 🟡 Sparse / 🔴 None |
| Coverage explanation | Body | What was found and what wasn't |
| Sources list | Reference | Glassdoor reviews found, Reddit threads, etc. |
| Company insights | Summary block | Only shown if coverage is rich or sparse |
| Honest disclaimer | Callout | Shown if sparse or none |
| Stage reminder | Label | Confirms selected stage |
| Back | Ghost link | "Change inputs" → /setup |
| CTA | Button | "Begin Simulation" → /simulation |

---

### `/simulation` — Interview Simulation

**State A — Ready:**

| Content | Type | Notes |
|---|---|---|
| Stage pipeline indicator | Progress UI | Current step highlighted |
| Persona name + stage label | Subheading | e.g. "Hiring Manager · Jordan" |
| Persona brief | Body | 2–3 sentence framing |
| Question count | Label | "7 questions" |
| Input mode notice | Body | Voice default / text fallback explained |
| Begin CTA | Button | "Begin Interview" |

**State B — In Progress:**

| Content | Type | Notes |
|---|---|---|
| Stage + persona label | Persistent label | |
| Question progress | Indicator | "Question 3 of 7" |
| Current question | Prominent text | Large, clearly primary |
| Voice input / mic button | Control | Active by default if supported |
| Live transcript | Text | Updates in real time |
| Transcript confirmation | Editable field | One pass before submit |
| Text input | Textarea | Fallback / toggle |
| Input mode toggle | Toggle | Voice ↔ Text |
| Transcription error | Inline error | Retry + switch-to-text |
| Submit | Button | Disabled until answer present |
| ⚑ Per-answer evaluation | Hidden | Runs silently — scores not shown until /report |

**State C — Complete:**

| Content | Type | Notes |
|---|---|---|
| Completion message | Body | "Session complete. Generating your report." |
| Loading indicator | Animated | With context — not a silent spinner |

---

### `/report` — Your Report

| Content | Type | Notes |
|---|---|---|
| Stage pipeline indicator | Progress UI | Report step highlighted |
| Session summary | Header | Company · Role · Stage |
| Overall impression | Summary | Single rating + 1-line summary |
| Per-question breakdown | Repeating block | × N questions |
| Session-end notice | Callout | "This report lives only in this session. Copy it before you leave." |
| Copy report | Action | Plain text export — no auth required |
| Exit options | 3 buttons | Redo this stage · Prep a different stage · Start fresh |

**Per-question block:**

| Content | Type |
|---|---|
| Question text | Label |
| User's answer | Quoted transcript |
| Scores per criterion | Display (clarity / specificity / relevance / AI fluency / impression) |
| What worked | Positive callout |
| What to improve | Gap + fix framing (not just "be more specific") |
| Sample stronger answer | Expandable — framed as calibration, not script |

---

## Navigation Model

**Type: Linear wizard — no global navigation**

| Navigation type | Present? | Notes |
|---|---|---|
| Global nav | ❌ | Correct — would imply free navigation |
| Stage pipeline indicator | ✅ | All 4 stages visible on all non-home screens |
| Back navigation | ✅ Limited | /setup ← /; /research (State B) ← /setup only |
| Forward navigation | ✅ CTA-only | No free forward navigation |
| Mid-simulation exit | ✅ Defined | Browser back/close = session abandoned → redirect to / |
| Direct URL access | ✅ → / | All routes redirect to / — no state to restore |
| Post-report re-entry | ✅ 3 options | Redo · New stage · New company — equal weight |

---

## Error State Ownership

| Error | Owned by | Behavior |
|---|---|---|
| Invalid resume PDF | /setup | Inline error, retry upload |
| Job URL unreachable | /setup | Inline error, retry |
| Portfolio URL unreachable | /setup | Warning (not blocker) — proceed anyway |
| Company research fails entirely | /research State B | 🔴 No data badge — generic questions, user informed |
| Voice transcription fails | /simulation State B | Inline error — retry or switch to text |
| Evaluation API timeout | /simulation State B | Loading state with context — not a silent hang |
| Report generation fails | /simulation State C | Inline error with retry |

---

## Labeling Notes

- **"Session setup"** not "Context intake" — user vocabulary, not internal process language
- **"Company Research"** not just "Research" — the user is reviewing research, not doing it
- **"Your Report"** not "Feedback Report" — "your" creates ownership; "feedback" can trigger defensiveness
- **Stage selector labels** must include descriptions — "Recruiter Screen" alone is not enough
