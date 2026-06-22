import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import type { SetupData, ContextData, ResearchData, InterviewStage, ScoreLevel, PriorSessionContext } from "../session-types"

const MODEL = "claude-sonnet-4-5"

function getClient(apiKey: string) {
  return createAnthropic({ apiKey })
}

// ---------------------------------------------------------------------------
// Stage-specific persona definitions
// ---------------------------------------------------------------------------

const recruiterNames = ["Alex", "Jordan", "Sam", "Taylor", "Casey", "Morgan", "Riley", "Drew", "Quinn", "Avery"]

function randomRecruiterName(): string {
  return recruiterNames[Math.floor(Math.random() * recruiterNames.length)]
}

const stagePersonas: Record<InterviewStage, { name: string; role: string; behaviorNote: string }> = {
  recruiter: {
    name: randomRecruiterName(),
    role: "Talent Acquisition Partner",
    behaviorNote: "Asks direct, conversational questions. Focuses on communication clarity, motivation, and logistics. Expects concise and confident answers.",
  },
  "hiring-manager": {
    name: "Jordan",
    role: "Head of Product Design",
    behaviorNote: "Pushes on vague answers. Wants to understand your thinking process, not just outcomes. Expects specific examples and a clear point of view on AI.",
  },
  "portfolio-review": {
    name: "Morgan",
    role: "Staff Product Designer",
    behaviorNote: "Asks follow-up questions. Wants to understand the why behind every decision. Comfortable with silence — don't rush.",
  },
}

// ---------------------------------------------------------------------------
// Question generation
// ---------------------------------------------------------------------------

const questionsSchema = z.object({
  questions: z.array(z.string()).min(3).max(25),
})

// A question is "clean" if every character is Latin text (Basic Latin + Latin-1
// Supplement, U+0000–U+00FF) or common typographic punctuation (General
// Punctuation block, U+2000–U+206F — em/en dashes, curly quotes, ellipses).
// Anything else (CJK, Cyrillic, Arabic, emoji, …) marks the question contaminated.
// Iterating with for…of walks code points, so astral characters are handled.
function hasForeignCharacters(question: string): boolean {
  for (const ch of question) {
    const cp = ch.codePointAt(0)!
    const allowed = cp <= 0x00ff || (cp >= 0x2000 && cp <= 0x206f)
    if (!allowed) return true
  }
  return false
}

// Builds the optional cross-session context block. Empty string when there's no
// valid prior context, so first-session prompts are byte-for-byte unchanged.
function buildPriorContextBlock(prior: PriorSessionContext | undefined, companyName: string): string {
  if (!prior || prior.sessionCount < 1) return ""

  const weak = prior.weakestCriteria.length > 0
    ? `\n- Weakest criteria from their prior sessions — weight more questions toward probing these areas: ${prior.weakestCriteria.join(", ")}.`
    : ""

  const topics = prior.coveredTopics.length > 0
    ? `\n- Questions/topics already covered in prior sessions — do NOT repeat these; go deeper or cover new ground instead:\n${prior.coveredTopics.map(t => `  • ${t}`).join("\n")}`
    : ""

  return `

CROSS-SESSION CONTEXT — this candidate has already practised for ${companyName}:
- This is session ${prior.sessionCount + 1} for this company; their most recent completed round was the ${prior.lastStage}.${weak}${topics}

Because they have prior history with this company, this round must build on it rather than repeat surface-level questions. Go deeper on their weak areas and avoid re-asking topics they have already faced.`
}

export async function generateQuestions(
  setup: SetupData,
  context: ContextData,
  research: ResearchData,
  apiKey: string,
  priorContext?: PriorSessionContext
): Promise<{ personaName: string; personaRole: string; behaviorNote: string; questions: string[] }> {
  const persona = stagePersonas[setup.stage]
  const client = getClient(apiKey)

  const jobDescription = context.jobDescriptionOverride
    || `Role: ${context.roleTitle} at ${context.companyName}\n\nJob posting URL: ${setup.jobPostingUrl}`

  const researchContext = research.coverageLevel !== "none"
    ? `Company research summary:\n${research.insights || research.sources.map(s => `${s.title}: ${s.snippet}`).join("\n")}`
    : `No specific interview data was found for ${context.companyName}. Generate well-crafted general questions appropriate for this role.`

  const stageInstructions: Record<InterviewStage, string> = {
    recruiter: `Generate 15 recruiter screen questions. Start with these in order: (1) a warm open-ended opener about background, (2) a follow-up on recent experience and team context, (3) why this company and role specifically, (4) logistics — availability, timeline, location, (5) compensation or a culture-fit question. Then add 10 more questions covering: communication style, career trajectory, handling ambiguity, what they're looking for in a next role, how they work with PMs and engineers, a difficult stakeholder situation, how they stay current in design and AI, what kind of feedback they seek, a proud moment in their career, and one question specific to the company or role from the job description. Keep the tone conversational, not interrogative.`,
    "hiring-manager": "Generate 15 hiring manager questions covering: design process and decision-making, a specific project challenge with AI relevance, cross-functional collaboration, how they'd approach a key challenge at this company, their point of view on AI in product design, handling competing priorities, working with limited resources, a failure they learned from, how they give and receive critique, how they define good design, how they've influenced product strategy, how they measure impact, a time they pushed back on a brief, what makes a great design team, and one question specific to the company or role from the job description. Questions should be substantive and push for specifics.",
    "portfolio-review": "Generate 15 portfolio review questions covering: a specific project walkthrough, a decision they'd make differently, handling a stakeholder conflict or constraint, how AI shaped their design process, the impact of their work, how they chose what to include in their portfolio, a project that didn't go as planned, how they present work to executives vs. peers, how they handle critique on presented work, a project they're most proud of and why, how they balance craft with speed, a time they had to kill a design they loved, what problem they'd most like to solve next, how their design thinking has evolved, and one question specific to the company or role from the job description. Questions should prompt deep reflection.",
  }

  const priorContextBlock = buildPriorContextBlock(priorContext, context.companyName)

  const prompt = `You are ${persona.name}, ${persona.role} at ${context.companyName}, conducting a ${setup.stage.replace("-", " ")} interview.

Candidate resume excerpt:
${setup.resumeText.slice(0, 2000)}

${jobDescription}

${researchContext}

${stageInstructions[setup.stage]}${priorContextBlock}

Important:
- Make questions specific to ${context.companyName} and the ${context.roleTitle} role where possible
- Reference the candidate's background when relevant
- Do not ask generic questions that could be for any company
- Do not number the questions
- Each question should be 1-2 sentences maximum`

  const generate = async (): Promise<string[]> => {
    const { object } = await generateObject({ model: client(MODEL), schema: questionsSchema, prompt })
    return object.questions
  }

  // Claude occasionally injects a foreign-script token mid-question (e.g. a CJK
  // word). Reject the whole set if any question is contaminated and regenerate
  // once with the same prompt. If the retry is still contaminated, log a warning
  // and proceed — never block the user, and never loop more than once.
  let questions = await generate()
  if (questions.some(hasForeignCharacters)) {
    questions = await generate()
    if (questions.some(hasForeignCharacters)) {
      console.warn(
        `[generateQuestions] non-Latin characters persisted after one retry for ${context.companyName}; proceeding anyway.`,
        questions.filter(hasForeignCharacters),
      )
    }
  }

  return {
    personaName: persona.name,
    personaRole: `${persona.role} at ${context.companyName}`,
    behaviorNote: persona.behaviorNote,
    questions,
  }
}

// ---------------------------------------------------------------------------
// Research synthesis
// ---------------------------------------------------------------------------

const synthesisSchema = z.object({
  takeaways: z.array(z.string()).min(2).max(3),
})

export async function synthesizeResearch(
  companyName: string,
  roleTitle: string,
  insights: string,
  apiKey: string
): Promise<string[]> {
  if (!insights.trim()) return []
  const client = getClient(apiKey)
  const { object } = await generateObject({
    model: client(MODEL),
    schema: synthesisSchema,
    prompt: `You are helping a product designer prepare for an interview at ${companyName} for the ${roleTitle} role.

Here is what we found in public sources about their interview process and culture:
${insights.slice(0, 3000)}

Generate exactly 2-3 short, specific bullet points about what this research reveals that is DIRECTLY RELEVANT to preparing for this interview. Focus on:
- What interviewers specifically care about or commonly ask
- Cultural signals or values that come up repeatedly
- A tension or challenge specific to this company that might surface in questions

Rules:
- Each bullet is 1-2 sentences maximum
- Be specific to ${companyName}, not generic interview advice
- Do not start with "The company" or repeat the company name in every bullet
- Write in plain prose, not as interview tips`,
  })
  return object.takeaways
}

// ---------------------------------------------------------------------------
// Sample answer for skipped questions (no scoring — just a model answer to study)
// ---------------------------------------------------------------------------

const sampleAnswerSchema = z.object({ sampleAnswer: z.string() })

export async function generateSampleAnswer(
  question: string,
  stage: InterviewStage,
  companyName: string,
  roleTitle: string,
  apiKey: string
): Promise<string> {
  const client = getClient(apiKey)
  const { object } = await generateObject({
    model: client(MODEL),
    schema: sampleAnswerSchema,
    prompt: `A product designer skipped this question while practising for a ${stage.replace("-", " ")} interview for ${roleTitle} at ${companyName}:

"${question}"

Write a strong model answer (3-5 sentences) they can study before the real interview. Make it specific and concrete — use the kind of structure, examples, and point of view a great candidate would bring. Write it in the first person as calibration, not a rigid script to memorise.`,
  })
  return object.sampleAnswer
}

// ---------------------------------------------------------------------------
// Answer evaluation
// ---------------------------------------------------------------------------

const evaluationSchema = z.object({
  scores: z.array(z.object({
    criterion: z.string(),
    level: z.enum(["strong", "moderate", "weak"]),
    rationale: z.string(),
  })).length(5),
  whatWorked: z.string(),
  whatToImprove: z.string(),
  sampleAnswer: z.string(),
})

export async function evaluateAnswer(
  question: string,
  answer: string,
  stage: InterviewStage,
  companyName: string,
  roleTitle: string,
  apiKey: string
): Promise<{
  scores: Array<{ criterion: string; level: ScoreLevel; rationale: string }>
  whatWorked: string
  whatToImprove: string
  sampleAnswer: string
}> {
  const client = getClient(apiKey)

  const stageContext: Record<InterviewStage, string> = {
    recruiter: "This is a recruiter screen. Prioritise communication clarity, motivation, and logistics fit.",
    "hiring-manager": "This is a hiring manager interview. Prioritise specific examples, process clarity, and AI fluency.",
    "portfolio-review": "This is a portfolio review. Prioritise depth of reflection, the why behind decisions, and outcome clarity.",
  }

  const { object } = await generateObject({
    model: client(MODEL),
    schema: evaluationSchema,
    prompt: `You are evaluating an interview answer from a product designer applying for ${roleTitle} at ${companyName}.

${stageContext[stage]}

Interview question:
"${question}"

Candidate's answer:
"${answer}"

Evaluate on exactly these 5 criteria:
1. Clarity — was the answer easy to follow?
2. Specificity — did it use concrete examples?
3. Relevance — did it actually answer the question asked?
4. AI fluency — did it demonstrate a genuine point of view on AI in design?
5. Overall impression — how would a real interviewer react?

For each criterion provide:
- level: "strong", "moderate", or "weak"
- rationale: one honest sentence explaining the rating

For whatWorked: 1-2 sentences on what was effective. Be specific.

For whatToImprove: follow the gap + fix pattern exactly: "You [did X] but didn't [include Y] — add [Z]." Never just say "be more specific."

For sampleAnswer: 2-3 sentences showing what a strong answer would cover. Frame it as calibration, not a script.`,
  })

  return {
    scores: object.scores as Array<{ criterion: string; level: ScoreLevel; rationale: string }>,
    whatWorked: object.whatWorked,
    whatToImprove: object.whatToImprove,
    sampleAnswer: object.sampleAnswer,
  }
}
