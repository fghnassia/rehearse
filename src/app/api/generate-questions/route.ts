import { NextRequest, NextResponse } from "next/server"
import { generateQuestions } from "@/lib/api/claude"
import { getConfigSafe } from "@/lib/config"

export async function POST(req: NextRequest) {
  const { setup, context, research } = await req.json()

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

  try {
    const data = await generateQuestions(setup, context, research, anthropicApiKey)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[generate-questions]", err)
    return NextResponse.json({ error: "Failed to generate questions. Please try again." }, { status: 500 })
  }
}
