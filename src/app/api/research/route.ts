import { NextRequest, NextResponse } from "next/server"
import { runResearch } from "@/lib/api/research"
import { synthesizeResearch } from "@/lib/api/claude"
import { getConfigSafe, getConfig } from "@/lib/config"

export async function POST(req: NextRequest) {
  const { jobPostingUrl, companyName } = await req.json()

  if (!jobPostingUrl) {
    return NextResponse.json({ error: "jobPostingUrl is required" }, { status: 400 })
  }

  const { serperApiKey } = getConfigSafe()

  if (!serperApiKey) {
    return NextResponse.json({
      companyName: companyName || extractCompanyNameFallback(jobPostingUrl),
      roleTitle: "Product Designer",
      coverageLevel: "none",
      sourceCount: 0,
      sources: [],
      insights: "",
      synthesizedTakeaways: [],
      disclaimer: "SERPER_API_KEY is not configured. Add it to .env.local to enable real company research.",
    })
  }

  try {
    const data = await runResearch(jobPostingUrl, serperApiKey, companyName)

    let synthesizedTakeaways: string[] = []
    if (data.insights && data.coverageLevel !== "none") {
      try {
        const { anthropicApiKey } = getConfig()
        synthesizedTakeaways = await synthesizeResearch(
          data.companyName,
          data.roleTitle,
          data.insights,
          anthropicApiKey
        )
      } catch (err) {
        console.error("[research synthesis]", err)
        // Non-fatal: return research without takeaways
      }
    }

    return NextResponse.json({ ...data, synthesizedTakeaways })
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
