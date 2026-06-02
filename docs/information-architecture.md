# Rehearse — Information Architecture

---

## 1. Screen Hierarchy

Rehearse has no navigational hierarchy — it's a **linear wizard** with a single re-entry branch at the end. The structure is flat by design.

```
/ .......................... Home
/setup ..................... Context Intake
/research .................. Research (Loading → Results)
/simulation ................ Interview Simulation
/report .................... Feedback Report
```

Depth: **1 level**. No nested sections. No orphaned screens. Every screen is reachable in sequence from the entry point, and the feedback report provides the only branching — back to `/setup` or back to `/`.

---

## 2. Content Inventory — Per Screen

---

### `/` — Home

| Content | Type | Notes |
|---|---|---|
| App name | Heading | "Rehearse" |
| Value proposition | Body copy | 1–2 sentences max |
| Primary CTA | Button | "Start Session" |

Nothing else. No footer, no nav, no secondary links. The home screen has one job.

---

### `/setup` — Context Intake

| Content | Type | Notes |
|---|---|---|
| Step indicator | Progress UI | "Step 1 of 2" or equivalent |
| Resume upload | File input | PDF only, drag & drop supported |
| Portfolio URL | Text input | URL validation |
| Job posting URL | Text input | URL validation |
| Interview stage selector | Radio / segmented control | Recruiter · Hiring Manager · Portfolio Review |
| Field-level validation errors | Inline error states | Per field, not a toast |
| Primary CTA | Button | "Research Company" |
| Back link | Ghost link | Returns to Home |

---

### `/research` — Research (Loading → Results)

Two states, one route. Loading transitions into results without navigation.

**Loading state:**

| Content | Type | Notes |
|---|---|---|
| Company name | Heading | Parsed from job posting URL |
| Status message | Animated text | "Searching Glassdoor…" "Checking Reddit…" etc. |
| Progress indicator | Animated UI | Not a bare spinner — shows what's happening |

**Results state:**

| Content | Type | Notes |
|---|---|---|
| Company name + role | Heading | |
| Data coverage indicator | Status badge | 🟢 Rich · 🟡 Sparse · 🔴 None |
| Coverage explanation | Body copy | What was found and what wasn't |
| Company insights | Summary block | Only shown if coverage is rich or sparse |
| Disclaimer | Callout | Shown if sparse or none — "questions will be less company-specific" |
| Selected stage reminder | Label | Confirms what they're preparing for |
| Primary CTA | Button | "Begin Simulation" |
| Secondary action | Ghost link | "Change inputs" → back to /setup |

---

### `/simulation` — Interview Simulation

| Content | Type | Notes |
|---|---|---|
| Stage + persona label | Subheading | e.g. "Recruiter Screen" |
| Persona name / framing | Body | Short 1-line persona intro |
| Question progress | Progress indicator | "Question 3 of 7" |
| Current question | Prominent text | Large, readable, clearly primary |
| Voice input | Mic button | Active by default if supported |
| Live transcript | Text display | Updates in real time during speech |
| Transcript confirmation | Editable field | Shown after speech ends, before submit |
| Text input | Textarea | Fallback if voice unavailable, or on toggle |
| Input mode toggle | Toggle | Voice ↔ Text |
| Transcription error state | Inline error | With retry and switch-to-text options |
| Submit button | Button | Disabled until answer present |

No back navigation from this screen. Leaving the simulation is a dead end — there is no "save and resume."

---

### `/report` — Feedback Report

| Content | Type | Notes |
|---|---|---|
| Session summary | Header block | Company · Role · Stage |
| Overall impression | Summary score | Single rating + 1-line summary |
| Per-question breakdown | Repeating block | One block per question |
| Next action options | 3 buttons | Redo this stage · Prep a different stage · Start fresh |

**Per-question block:**

| Content | Type |
|---|---|
| Question text | Label |
| User's answer | Quoted transcript |
| Scores per criterion | Score display (clarity / specificity / relevance / AI fluency / impression) |
| What worked | Positive callout |
| What to improve | Improvement callout |
| Sample stronger answer | Expandable block |

---

## 3. Navigation Model

**Type: Linear wizard — no global navigation**

| Navigation type | Present? | Implementation |
|---|---|---|
| Global nav (header/tabs) | ❌ No | None — would imply free navigation between steps |
| Local nav (breadcrumbs/sidebar) | ❌ No | Not needed at this depth |
| Step progress indicator | ✅ Yes | Visible on /setup and /simulation |
| Back navigation | ✅ Limited | Home → Setup only; Research Results → Setup only |
| Forward navigation | ✅ CTA-only | Users advance only via explicit button actions |
| Re-entry points | ✅ 3 | On /report: redo · new stage · new company |
| Escape hatch | ✅ Implicit | Browser back / refresh = session reset (expected, not a bug) |

**Key navigation decisions:**

- **No back from /simulation** — interrupting an interview mid-session produces no useful state to return to. The escape hatch is the browser.
- **"Change inputs" on /research** — the only mid-flow back path. Lets users correct a wrong URL without restarting entirely.
- **Three post-report exits are equal weight** — none is more prominent than the others. The user decides what's next; the app doesn't assume.
- **Direct URL access mid-session redirects to `/`** — no persisted state to restore, so deep links are meaningless.
