import { NextRequest, NextResponse } from "next/server"
import { parseContext } from "@/lib/api/context-parser"
import { getConfigSafe } from "@/lib/config"

export async function POST(req: NextRequest) {
  const { resumeText, jobPostingUrl, portfolioUrl } = await req.json()

  if (!resumeText || !jobPostingUrl) {
    return NextResponse.json({ error: "resumeText and jobPostingUrl are required" }, { status: 400 })
  }

  const { serperApiKey, anthropicApiKey } = getConfigSafe()

  try {
    const data = await parseContext(resumeText, jobPostingUrl, portfolioUrl, serperApiKey, anthropicApiKey)
    console.log("[parse-context] jobInsights:", JSON.stringify(data.jobInsights))
    console.log("[parse-context] roleTitle:", data.roleTitle)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[parse-context]", err)
    return NextResponse.json({ error: "Failed to parse context." }, { status: 500 })
  }
}
