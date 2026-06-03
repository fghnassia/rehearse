import { NextRequest, NextResponse } from "next/server"
import { runResearch } from "@/lib/api/research"
import { getConfigSafe } from "@/lib/config"

export async function POST(req: NextRequest) {
  const { jobPostingUrl } = await req.json()

  if (!jobPostingUrl) {
    return NextResponse.json({ error: "jobPostingUrl is required" }, { status: 400 })
  }

  const { serperApiKey } = getConfigSafe()

  if (!serperApiKey) {
    // Graceful degradation — return a "none" coverage result so the flow continues
    return NextResponse.json({
      companyName: extractCompanyNameFallback(jobPostingUrl),
      roleTitle: "Product Designer",
      coverageLevel: "none",
      sourceCount: 0,
      sources: [],
      insights: "",
      disclaimer: "SERPER_API_KEY is not configured. Add it to .env.local to enable real company research.",
    })
  }

  try {
    const data = await runResearch(jobPostingUrl, serperApiKey)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[research]", err)
    return NextResponse.json({ error: "Research failed. Please try again." }, { status: 500 })
  }
}

function extractCompanyNameFallback(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "")
    const parts = hostname.split(".")
    if (parts.length >= 2) {
      const name = parts[parts.length - 2]
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
    return hostname
  } catch {
    return "the company"
  }
}
