import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import type { ContextData, JobInsight } from "../session-types"

// ---------------------------------------------------------------------------
// Portfolio OG image
// ---------------------------------------------------------------------------

export async function fetchOgImage(url: string): Promise<string | undefined> {
  if (!url) return undefined
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Rehearse/1.0)" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return undefined
    const html = await res.text()
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    const raw = m?.[1]?.trim()
    if (!raw) return undefined
    // Make relative URLs absolute
    if (raw.startsWith("//")) return `https:${raw}`
    if (raw.startsWith("/")) return `${new URL(url).origin}${raw}`
    return raw
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Company logo (Clearbit domain → Google favicon)
// ---------------------------------------------------------------------------

export async function fetchCompanyLogo(companyName: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return undefined
    const results = await res.json()
    const domain = results?.[0]?.domain as string | undefined
    if (!domain) return undefined
    return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Serper job search
// ---------------------------------------------------------------------------

interface SerperResult {
  title: string
  snippet: string
  link: string
}

async function searchJobContent(
  companyName: string,
  jobUrl: string,
  serperApiKey: string
): Promise<SerperResult[]> {
  const queries = [
    `"${companyName}" "product designer" job description responsibilities`,
    `site:linkedin.com "${companyName}" product designer job`,
  ]
  try {
    const u = new URL(jobUrl)
    const jobId = u.searchParams.get("currentJobId")
    if (jobId) queries.unshift(`linkedin.com/jobs/view/${jobId}`)
  } catch {}

  const results: SerperResult[] = []
  for (const q of queries.slice(0, 2)) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": serperApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 5 }),
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) continue
      const data = await res.json()
      results.push(...(data?.organic ?? []))
      if (results.length >= 5) break
    } catch { continue }
  }
  return results
}

// ---------------------------------------------------------------------------
// Claude-powered analysis
// ---------------------------------------------------------------------------

const insightsSchema = z.object({
  insights: z.array(z.object({
    category: z.string(),
    points: z.array(z.string()),
  })),
})

async function analyzeJobWithClaude(
  jobText: string,
  companyName: string,
  roleTitle: string,
  anthropicApiKey: string
): Promise<JobInsight[]> {
  const client = createAnthropic({ apiKey: anthropicApiKey })
  const { object } = await generateObject({
    model: client("claude-sonnet-4-5"),
    schema: insightsSchema,
    prompt: `Analyze this job posting content for a ${roleTitle} role at ${companyName}.

Job content:
${jobText.slice(0, 3000)}

Extract up to 4 structured insight categories. Only include categories where you found real information — skip categories with no data. Use these categories when applicable:
- "Key qualities" — specific skills, traits, or experience they're looking for
- "Location" — remote, hybrid, in-office, or specific city
- "Compensation" — salary range, equity, or benefits if mentioned
- "About the role" — 1-2 sentences summarizing what this person will actually do

Each category should have 1-3 concise bullet points. Be specific and direct — no generic filler.`,
  })
  return object.insights
}

const resumeSchema = z.object({
  bullets: z.array(z.string()).min(2).max(5),
})

async function summarizeResumeWithClaude(
  resumeText: string,
  anthropicApiKey: string
): Promise<string[]> {
  const client = createAnthropic({ apiKey: anthropicApiKey })
  const { object } = await generateObject({
    model: client("claude-sonnet-4-5"),
    schema: resumeSchema,
    prompt: `Read this resume and extract 3-4 concise bullet points that capture who this person is as a designer.

Resume:
${resumeText.slice(0, 3000)}

Write bullets that cover: their current or most recent role, years of experience, notable companies or projects, and any AI/design system/product expertise. Each bullet should be one short sentence. Be specific — use their actual job titles and company names, not generic descriptions.`,
  })
  return object.bullets
}

// ---------------------------------------------------------------------------
// Role extraction from Serper results
// ---------------------------------------------------------------------------

function extractRoleFromSnippets(snippets: SerperResult[]): string {
  const roleTitles = [
    "Principal Product Designer", "Staff Product Designer", "Senior Product Designer",
    "Lead Product Designer", "Product Design Manager", "Head of Product Design",
    "Product Designer", "Senior Designer", "UX Designer",
  ]
  const allText = snippets.map((s) => `${s.title} ${s.snippet}`).join(" ")
  for (const title of roleTitles) {
    if (allText.toLowerCase().includes(title.toLowerCase())) return title
  }
  for (const s of snippets) {
    const m = s.title.match(/^(.+?)\s+(?:at|@)\s+.+$/i)
    if (m) return m[1].trim()
  }
  return ""
}

// ---------------------------------------------------------------------------
// Direct page fetch
// ---------------------------------------------------------------------------

async function fetchJobPage(jobUrl: string): Promise<{ companyName: string; roleTitle: string } | null> {
  try {
    const res = await fetch(jobUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Rehearse/1.0)" },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const og = extractOgTitle(html)
    if (og.roleTitle) return og
    const title = extractPageTitle(html)
    if (title.roleTitle) return title
  } catch {}
  return null
}

function extractOgTitle(html: string) {
  const m =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
  return parseRoleAtCompany(m?.[1]?.trim() ?? "")
}

function extractPageTitle(html: string) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return parseRoleAtCompany(m?.[1]?.trim() ?? "")
}

function parseRoleAtCompany(text: string): { companyName: string; roleTitle: string } {
  if (!text) return { companyName: "", roleTitle: "" }
  const cleaned = text
    .replace(/\s*\|\s*(LinkedIn|Greenhouse|Lever|Ashby|Workday|Indeed|Glassdoor|Apply)\s*$/i, "")
    .trim()
  const atMatch = cleaned.match(/^(.+?)\s+(?:at|@|-)\s+(.+)$/i)
  if (atMatch) return { roleTitle: atMatch[1].trim(), companyName: atMatch[2].trim() }
  const pipeMatch = cleaned.match(/^([^|]+)\s*[|–—]\s*(.+)$/)
  if (pipeMatch) {
    const a = pipeMatch[1].trim(), b = pipeMatch[2].trim()
    return a.length <= b.length ? { companyName: a, roleTitle: b } : { companyName: b, roleTitle: a }
  }
  return { companyName: "", roleTitle: cleaned }
}

// ---------------------------------------------------------------------------
// Company name helpers
// ---------------------------------------------------------------------------

function getLinkedInCompanyName(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes("linkedin.com")) return null
    const kw = u.searchParams.get("keywords")
    if (kw) return kw.trim()
    const slug = u.pathname.split("/").filter(Boolean).pop() ?? ""
    const atIdx = slug.lastIndexOf("-at-")
    if (atIdx !== -1)
      return titleCase(slug.slice(atIdx + 4).replace(/-\d+$/, "").replace(/-/g, " "))
    return null
  } catch { return null }
}

function isGatedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return ["linkedin.com", "glassdoor.com", "indeed.com", "blind.com"].some((h) => host.includes(h))
  } catch { return false }
}

function extractDomainCompany(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.hostname.replace("www.", "").split(".")
    const jobBoards = ["greenhouse", "lever", "ashby", "workday", "icims", "taleo", "bamboohr", "workable", "smartrecruiters"]
    const candidate = parts[parts.length - 2] ?? ""
    if (jobBoards.includes(candidate.toLowerCase())) {
      // 1. Try "for" query param (some boards use ?for=company)
      const forParam = u.searchParams.get("for")
      if (forParam) return titleCase(forParam)
      // 2. Try first path segment — Greenhouse: /vercel/jobs/123, Lever: /vercel/12345
      const pathSlug = u.pathname.split("/").filter(Boolean)[0]
      if (pathSlug && pathSlug !== "jobs" && pathSlug !== "embed") return titleCase(pathSlug)
    }
    return titleCase(candidate)
  } catch { return "the company" }
}

function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

// ---------------------------------------------------------------------------
// Fallback heuristic insights (when no Claude key)
// ---------------------------------------------------------------------------

function heuristicInsights(snippets: SerperResult[]): JobInsight[] {
  const allText = snippets.map((s) => s.snippet).join(" ")
  const insights: JobInsight[] = []

  const qualitySentences = allText.split(/[.!?]\s+/).filter(s =>
    s.length > 30 && /you.ll|you have|we.re looking|experience|strong/i.test(s)
  ).slice(0, 2).map(s => s.trim())
  if (qualitySentences.length) insights.push({ category: "Key qualities", points: qualitySentences })

  const locationPatterns: [RegExp, string][] = [
    [/fully remote/i, "Fully remote"], [/remote.first/i, "Remote-first"],
    [/hybrid/i, "Hybrid"], [/in.office|on.site/i, "In-office"],
  ]
  for (const [re, label] of locationPatterns) {
    if (re.test(allText)) { insights.push({ category: "Location", points: [label] }); break }
  }

  return insights
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function parseContext(
  resumeText: string,
  jobPostingUrl: string,
  portfolioUrl?: string | null,
  serperApiKey?: string | null,
  anthropicApiKey?: string | null
): Promise<ContextData> {
  const linkedInCompany = getLinkedInCompanyName(jobPostingUrl)
  const gated = isGatedUrl(jobPostingUrl)

  // Run parallel fetches
  const [pageResult, logoUrl, portfolioOgImage, serperResults] = await Promise.all([
    gated ? Promise.resolve(null) : fetchJobPage(jobPostingUrl),
    fetchCompanyLogo(linkedInCompany ?? extractDomainCompany(jobPostingUrl)),
    portfolioUrl ? fetchOgImage(portfolioUrl) : Promise.resolve(undefined),
    serperApiKey && gated
      ? searchJobContent(linkedInCompany ?? extractDomainCompany(jobPostingUrl), jobPostingUrl, serperApiKey)
      : Promise.resolve([]),
  ])

  const companyName = pageResult?.companyName || linkedInCompany || extractDomainCompany(jobPostingUrl)
  const roleFromPage = pageResult?.roleTitle ?? ""
  const roleFromSerper = serperResults.length > 0 ? extractRoleFromSnippets(serperResults) : ""
  const roleTitle = roleFromSerper || roleFromPage || "Product Designer"

  // Build job text for Claude (Serper snippets + any pasted override used downstream)
  const jobText = serperResults.map(r => `${r.title}\n${r.snippet}`).join("\n\n")

  // Claude-powered analysis (when key available), else heuristic fallback
  const [jobInsights, resumeBullets] = await Promise.all([
    anthropicApiKey && jobText
      ? analyzeJobWithClaude(jobText, companyName, roleTitle, anthropicApiKey).catch(() => heuristicInsights(serperResults))
      : Promise.resolve(heuristicInsights(serperResults)),
    anthropicApiKey
      ? summarizeResumeWithClaude(resumeText, anthropicApiKey).catch(() => heuristicBullets(resumeText))
      : Promise.resolve(heuristicBullets(resumeText)),
  ])

  return { companyName, roleTitle, logoUrl, portfolioOgImage, jobInsights, resumeBullets }
}

function heuristicBullets(resumeText: string): string[] {
  const lines = resumeText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 10 && l.length < 200)
  const bullets: string[] = []
  const presentLine = lines.find(l => /present|current/i.test(l) && /\d{4}/.test(l))
  if (presentLine) bullets.push(clean(presentLine))
  const titleLine = lines.find(l => /designer|researcher|director|lead|manager/i.test(l) && l.split(" ").length <= 8)
  if (titleLine && !bullets.includes(clean(titleLine))) bullets.push(clean(titleLine))
  const yearsLine = lines.find(l => /\d+[\+]?\s*years?\s+(of\s+)?experience/i.test(l))
  if (yearsLine) bullets.push(clean(yearsLine))
  for (const line of lines) {
    if (bullets.length >= 4) break
    const c = clean(line)
    if (!bullets.includes(c) && line.split(" ").length >= 4) bullets.push(c)
  }
  return bullets.slice(0, 4)
}

function clean(text: string): string {
  return text.replace(/^[-•·▪▸*]\s*/, "").replace(/\s{2,}/g, " ").trim()
}
