import { NextRequest, NextResponse } from "next/server"
import { getConfig } from "@/lib/config"
import { evaluateAnswer } from "@/lib/api/claude"
import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import type { SimulationData, QAPair, InterviewStage } from "@/lib/session-types"

export async function POST(req: NextRequest) {
  const { simulation, stage, companyName, roleTitle } = await req.json() as {
    simulation: SimulationData
    stage: InterviewStage
    companyName: string
    roleTitle: string
  }

  const { anthropicApiKey } = getConfig()

  const skippedCount = simulation.answers.filter(qa => qa.status === "skipped").length
  const answerable = simulation.answers.filter(qa => qa.status !== "skipped")

  // Evaluate answered questions in parallel; pass skipped through as-is
  const evaluatedAnswered = await Promise.all(
    answerable.map(async (qa): Promise<QAPair> => {
      if (qa.scores) return qa
      const result = await evaluateAnswer(
        qa.questionText,
        qa.userAnswer,
        stage,
        companyName,
        roleTitle,
        anthropicApiKey
      )
      return { ...qa, ...result }
    })
  )

  // Reconstruct full list preserving original order
  const evaluatedMap = new Map(evaluatedAnswered.map(qa => [qa.questionId, qa]))
  const evaluated = simulation.answers.map(qa =>
    qa.status === "skipped" ? qa : (evaluatedMap.get(qa.questionId) ?? qa)
  )

  // Generate overall impression
  const client = createAnthropic({ apiKey: anthropicApiKey })
  const { object } = await generateObject({
    model: client("claude-sonnet-4-5"),
    schema: z.object({
      overallImpressionLevel: z.enum(["strong", "moderate", "weak"]),
      overallImpressionSummary: z.string(),
    }),
    prompt: `You are evaluating the overall performance of a candidate in a ${stage.replace("-", " ")} interview for ${roleTitle} at ${companyName}.

Here are their answers and scores (${skippedCount} question${skippedCount === 1 ? "" : "s"} skipped):
${evaluatedAnswered.map((qa, i) => `
Q${i + 1}: ${qa.questionText}
Answer: ${qa.userAnswer}
Scores: ${qa.scores?.map(s => `${s.criterion}: ${s.level}`).join(", ")}
`).join("\n")}

Give an overall impression:
- level: "strong", "moderate", or "weak" — based on the pattern across answered questions
- summary: 2 sentences max. Be direct and coaching-focused.${skippedCount > 0 ? ` Note that ${skippedCount} question${skippedCount === 1 ? " was" : "s were"} skipped.` : ""} Mention the most important pattern (positive or negative) and the single highest-leverage thing they should work on before the real interview.`,
  })

  return NextResponse.json({
    evaluatedAnswers: evaluated,
    overallImpressionLevel: object.overallImpressionLevel,
    overallImpressionSummary: object.overallImpressionSummary,
    generatedAt: new Date().toISOString(),
  })
}
