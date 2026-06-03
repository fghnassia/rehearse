import { NextRequest, NextResponse } from "next/server"
import { evaluateAnswer } from "@/lib/api/claude"
import { getConfigSafe } from "@/lib/config"

export async function POST(req: NextRequest) {
  const { question, answer, stage, companyName, roleTitle } = await req.json()

  if (!question || !answer || !stage) {
    return NextResponse.json({ error: "question, answer, and stage are required" }, { status: 400 })
  }

  const { anthropicApiKey } = getConfigSafe()

  if (!anthropicApiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 503 }
    )
  }

  try {
    const data = await evaluateAnswer(
      question,
      answer,
      stage,
      companyName || "the company",
      roleTitle || "Product Designer",
      anthropicApiKey
    )
    return NextResponse.json(data)
  } catch (err) {
    console.error("[evaluate]", err)
    return NextResponse.json({ error: "Failed to evaluate answer. Please try again." }, { status: 500 })
  }
}
