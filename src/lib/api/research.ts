import { searchCompanyInterviews, type SerperResult } from "./serper"
import type { ResearchData, CoverageLevel } from "../session-types"

function classifyCoverage(results: SerperResult[]): CoverageLevel {
  if (results.length >= 6) return "rich"
  if (results.length >= 2) return "sparse"
  return "none"
}

function summarizeInsights(results: SerperResult[]): string {
  if (!results.length) return ""
  return results
    .slice(0, 5)
    .map((r) => `**${r.source}** — ${r.title}\n${r.snippet}`)
    .join("\n\n")
}

function extractCompanyName(jobPostingUrl: string): string {
  try {
    const hostname = new URL(jobPostingUrl).hostname.replace("www.", "")
    const parts = hostname.split(".")
    // e.g. jobs.stripe.com → Stripe; greenhouse.io fallback → use first path segment
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 2]
      // filter out known job board domains
      const jobBoards = ["greenhouse", "lever", "ashby", "workday", "icims", "taleo", "bamboohr", "workable"]
      if (!jobBoards.includes(candidate.toLowerCase())) {
        return candidate.charAt(0).toUpperCase() + candidate.slice(1)
      }
    }
    return hostname
  } catch {
    return "the company"
  }
}

export async function runResearch(
  jobPostingUrl: string,
  serperApiKey: string,
  companyName?: string
): Promise<ResearchData> {
  const resolvedCompanyName = companyName || extractCompanyName(jobPostingUrl)
  const results = await searchCompanyInterviews(resolvedCompanyName, serperApiKey)
  const coverageLevel = classifyCoverage(results)

  const disclaimer =
    coverageLevel === "none"
      ? "We couldn't find detailed interview data for this company. Questions will be well-crafted but not company-specific."
      : coverageLevel === "sparse"
      ? "We found limited interview data for this company. Questions will be partially tailored — some may be more general."
      : undefined

  return {
    companyName: resolvedCompanyName,
    roleTitle: "Product Designer",
    coverageLevel,
    sourceCount: results.length,
    sources: results.slice(0, 8).map((r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      source: r.source,
    })),
    insights: summarizeInsights(results),
    disclaimer,
  }
}
