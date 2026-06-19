import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import type { SetupData, ContextData, ResearchData, InterviewStage, ScoreLevel } from "../session-types"

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
  questions: z.array(z.string()).length(5),
})

export async function generateQuestions(
  setup: SetupData,
  context: ContextData,
  research: ResearchData,
  apiKey: string
): Promise<{ personaName: string; personaRole: string; behaviorNote: string; questions: string[] }> {
  const persona = stagePersonas[setup.stage]
  const client = getClient(apiKey)

  const jobDescription = context.jobDescriptionOverride
    || `Role: ${context.roleTitle} at ${context.companyName}\n\nJob posting URL: ${setup.jobPostingUrl}`

  const researchContext = research.coverageLevel !== "none"
    ? `Company research summary:\n${research.insights || research.sources.map(s => `${s.title}: ${s.snippet}`).join("\n")}`
    : `No specific interview data was found for ${context.companyName}. Generate well-crafted general questions appropriate for this role.`

  const stageInstructions: Record<InterviewStage, string> = {
    recruiter: `Generate 5 recruiter screen questions in this exact order:
1. A warm open-ended opener — "Tell me about yourself and your background as a designer" or "Walk me through what you're currently working on."
2. A follow-up on their recent experience — what they're doing now, what kind of work, team size.
3. Why this company and this role specifically — what drew them to it.
4. Logistics — availability, timeline, location/remote preferences.
5. Compensation expectations or one soft culture-fit question.
Keep the tone conversational, not interrogative. These should feel like a real recruiter call, not an exam.`,
    "hiring-manager": "Generate 5 hiring manager questions covering: design process and decision-making, a specific project challenge with AI relevance, cross-functional collaboration, how they'd approach a key challenge at this company, and their point of view on AI in product design. Questions should be substantive and push for specifics.",
    "portfolio-review": "Generate 5 portfolio review questions covering: a specific project walkthrough prompt, a decision they'd make differently, how they handled a stakeholder conflict or constraint, how AI shaped their design process in a recent project, and what impact their work had. Questions should prompt deep reflection.",
  }

  const { object } = await generateObject({
    model: client(MODEL),
    schema: questionsSchema,
    prompt: `You are ${persona.name}, ${persona.role} at ${context.companyName}, conducting a ${setup.stage.replace("-", " ")} interview.

Candidate resume excerpt:
${setup.resumeText.slice(0, 2000)}

${jobDescription}

${researchContext}

${stageInstructions[setup.stage]}

Important:
- Make questions specific to ${context.companyName} and the ${context.roleTitle} role where possible
- Reference the candidate's background when relevant
- Do not ask generic questions that could be for any company
- Do not number the questions
- Each question should be 1-2 sentences maximum`,
  })

  return {
    personaName: persona.name,
    personaRole: `${persona.role} at ${context.companyName}`,
    behaviorNote: persona.behaviorNote,
    questions: object.questions,
  }
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
