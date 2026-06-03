import { NextRequest, NextResponse } from "next/server"
import { parseContext } from "@/lib/api/context-parser"
import { getConfigSafe } from "@/lib/config"

export async function POST(req: NextRequest) {
  const { resumeText, jobPostingUrl } = await req.json()

  if (!resumeText || !jobPostingUrl) {
    return NextResponse.json({ error: "resumeText and jobPostingUrl are required" }, { status: 400 })
  }

  const { serperApiKey } = getConfigSafe()

  try {
    const data = await parseContext(resumeText, jobPostingUrl, serperApiKey)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[parse-context]", err)
    return NextResponse.json({ error: "Failed to parse context." }, { status: 500 })
  }
}
