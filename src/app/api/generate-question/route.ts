import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { getConfig } from "@/lib/config"
import type { SetupData, ContextData } from "@/lib/session-types"

export async function POST(req: NextRequest) {
  const { setup, context, exclude } = await req.json() as {
    setup: SetupData
    context: ContextData
    exclude: string[]
  }

  const { anthropicApiKey } = getConfig()
  const client = createAnthropic({ apiKey: anthropicApiKey })

  const { object } = await generateObject({
    model: client("claude-sonnet-4-5"),
    schema: z.object({ question: z.string() }),
    prompt: `You are generating a replacement interview question for a ${setup.stage.replace("-", " ")} interview.
Role: ${context.roleTitle} at ${context.companyName}.

Generate one fresh question that is different from these already asked:
${exclude.map((q, i) => `${i + 1}. ${q}`).join("\n")}

The question should be appropriate for the ${setup.stage} stage and specific to this role and company.
Return only the question text, no numbering.`,
  })

  return NextResponse.json({ question: object.question })
}
