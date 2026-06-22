import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateQuestions } from "@/lib/api/claude"
import { getConfigSafe } from "@/lib/config"

// Optional cross-session context built client-side. Validated defensively here:
// if it's malformed or partial, it's dropped and generation proceeds as standard.
const priorContextSchema = z.object({
  company: z.string(),
  sessionCount: z.number(),
  weakestCriteria: z.array(z.string()),
  coveredTopics: z.array(z.string()),
  lastStage: z.string(),
})

export async function POST(req: NextRequest) {
  const { setup, context, research, priorContext } = await req.json()

  if (!setup || !context || !research) {
    return NextResponse.json({ error: "setup, context, and research are required" }, { status: 400 })
  }

  const { anthropicApiKey } = getConfigSafe()

  if (!anthropicApiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to your environment variables to enable the simulation." },
      { status: 503 }
    )
  }

  // Use prior context only if it fully validates; otherwise silently ignore it.
  const parsedPrior = priorContext ? priorContextSchema.safeParse(priorContext) : null
  const validPrior = parsedPrior?.success ? parsedPrior.data : undefined

  try {
    const data = await generateQuestions(setup, context, research, anthropicApiKey, validPrior)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[generate-questions]", err)
    return NextResponse.json({ error: "Failed to generate questions. Please try again." }, { status: 500 })
  }
}
