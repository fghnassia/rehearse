# Rehearse
## Project Brief — V1

---

## What It Is

Rehearse is an AI-powered interview coach for product designers pursuing AI-native roles. It takes three inputs — a resume, a portfolio URL, and a job posting — and builds a complete, personalized prep session: real-time company research, stage-specific questions, a live interview simulation with voice input, and structured feedback on performance.

It is built for any product designer — senior, staff, or principal — who is actively interviewing and wants to walk in having already practiced, not just having thought about practicing.

---

## Target User

A senior, staff, or principal product designer actively interviewing for AI product roles. They know their craft — but knowing your work and being able to articulate it under interview pressure, in a field where the expected answers have recently changed, are two different things. What they need is a realistic practice environment that meets them where they are and tells them honestly how they're coming across.

Key frustrations the app addresses:

- Generic interview prep resources don't account for the company's specific culture, values, or interview format
- AI product design roles are new enough that most candidates don't know what the new rules are — the design process changed, the expected answers changed, and no one published the updated playbook
- AI-role interviews require demonstrating a point of view on AI — which is hard to rehearse without a thinking partner
- There's no low-stakes environment to hear yourself answer difficult questions before the real thing
- Feedback from practice sessions is usually vague ("be more specific") or nonexistent

---

## Feature Scope (V1)

**Context intake**
Users provide four inputs: a resume (PDF upload), a portfolio URL, a job posting URL, and their current interview stage (Recruiter screen, Hiring Manager round, or Portfolio review). Rehearse parses these to build a candidate profile and role context that drives everything downstream — which persona runs the simulation, what question types are generated, and how answers are evaluated.

**Company research**
Rehearse searches the web in real time to surface what's publicly known about the company's interview process — format, typical questions, what interviewers have said they look for. Sources include Glassdoor, Blind, Reddit, LinkedIn, and company blogs. Before the simulation begins, the user sees a data coverage indicator: how much company-specific information was found. If data is sparse — because the company is small, new, or underrepresented online — the user is told explicitly, and questions are framed as informed best-guesses rather than company-verified specifics. Rehearse never fabricates.

**Interview simulation**
Users conduct a simulated interview with one of three stage personas — Recruiter, Hiring Manager, or Portfolio reviewer. Each persona has a distinct voice, priority, and line of questioning. Questions are generated from the candidate's profile and the job posting, not from a generic bank. Users respond by voice (transcribed in real time via the Web Speech API) or by typing. Rehearse responds in character throughout.

**Response evaluation**
After each answer, Rehearse evaluates the response against criteria relevant to the stage: clarity, specificity, relevance, AI fluency, and overall impression. Evaluation is per-answer and accumulates across the session.

**Feedback report**
At the end of each simulation session, the user receives a structured report: a per-question breakdown of what worked and what didn't, scores against stage-specific criteria, and concrete direction on what to strengthen before the real interview. Where relevant, the report shows what a stronger answer might have looked like — not to script the user, but to calibrate their instincts.

Out of scope for V1: user accounts or authentication, saved session history, mobile app, payment or subscription, email or calendar integrations.

**A note on failure states**
Rehearse is AI-dependent throughout — search, simulation, and evaluation all rely on external calls. The product should degrade gracefully: slow responses get a loading state with context, not a silent spinner; failed searches surface clearly rather than quietly falling back to generic questions; voice transcription errors let the user correct before submitting. Handling these paths is part of V1, not a stretch goal.

---

## Design Principles

**Honest over encouraging.** Rehearse should tell users what they need to hear, not what feels good to hear. Vague positive feedback is worthless — the product earns trust by being direct.

**Specific over generic.** Every output — questions, feedback, company research — should feel like it was made for this person, this role, this company. If it could have been generated for anyone, it wasn't good enough.

**Calm and focused.** The interface should feel like a quiet, well-lit room — not a dashboard. No unnecessary UI. No gamification. The product gets out of the way of the preparation.

**Considered over comprehensive.** Every element earns its place. When two design options are in tension, choose the one that does more with less — fewer components, better-crafted interactions, nothing decorative that doesn't also function.
