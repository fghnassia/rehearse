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
  location: z.string().nullable().describe("Office cities + remote info on one line, e.g. 'Seattle, New York, South San Francisco · Remote in US'. Null if not found."),
  compensation: z.string().describe("Salary range extracted verbatim, e.g. '$175,200 - $262,800'. Use 'Not specified' if no figures are mentioned — never omit this field."),
  responsibilities: z.string().nullable().describe("One sentence (max 20 words) on what this person will do day-to-day. Specific, not generic."),
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
    prompt: `Extract three specific pieces of information from this job posting for a ${roleTitle} role at ${companyName}.

Job content:
${jobText.slice(0, 10000)}

Instructions:
- location: List office city/cities, then remote eligibility after a · if applicable. Use the exact city names from the posting. Example: "Seattle, New York, South San Francisco · Remote in US". Set null if not mentioned.
- compensation: Copy the salary range verbatim from the text (e.g. "$175,200 - $262,800"). Do not rephrase. Use "Not specified" if no dollar figures are present — always fill this field.
- responsibilities: One sentence max 20 words on what this person actually does. Be specific using details from the posting.`,
  })

  const results: JobInsight[] = []
  if (object.location) results.push({ category: "Location", points: [object.location] })
  results.push({ category: "Compensation", points: [object.compensation] })
  if (object.responsibilities) results.push({ category: "Responsibilities", points: [object.responsibilities] })
  return results
}

const resumeSchema = z.object({
  title: z.string().describe("Job title + company + timing in one line. If current: 'Senior Product Designer · Eventbrite, since Oct 2025'. If most recent but past: 'Senior Product Designer · Bazaart, 2022–2025'. Use exact names and dates from the resume."),
  experience: z.string().describe("Years of experience + what they specialise in. Format: '[X] years · specialising in [2-3 specific areas from their actual work, e.g. AI-native products, consumer apps, design systems, 0→1, B2B SaaS]'. Pull from the actual role descriptions, not just a job title."),
  highlight: z.string().describe("The single most impressive or specific thing in this resume. Prefer a quantified result with context ('Grew feature adoption 300% through motion UX at Bazaart'). If no numbers exist, write one sentence on their strongest design domain with specifics ('Deep experience designing LLM-powered features and agentic flows across consumer and enterprise products'). Never generic."),
})

async function summarizeResumeWithClaude(
  resumeText: string,
  anthropicApiKey: string
): Promise<import("../session-types").ResumeProfile> {
  const client = createAnthropic({ apiKey: anthropicApiKey })
  const { object } = await generateObject({
    model: client("claude-sonnet-4-5"),
    schema: resumeSchema,
    prompt: `Read this resume carefully and extract three things. Be specific — use actual company names, dates, products, and metrics from the resume. No generic filler.

Resume:
${resumeText.slice(0, 4000)}

- title: job title + company + timing. Current role: "Senior Product Designer · Eventbrite, since Oct 2025". Past role: "Senior Product Designer · Bazaart, 2022–2025".
- experience: total years + what they actually specialise in based on the roles they've held and the work described. E.g. "9 years · specialising in AI products, consumer apps, and design systems". Pull specifics from role descriptions.
- highlight: the single most compelling line from this resume. If there's a quantified result, lead with that and give it context. If not, write one precise sentence on their strongest area using specifics from the resume. Never write something that could apply to any designer.`,
  })
  return object
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

async function fetchJobPage(jobUrl: string): Promise<{ companyName: string; roleTitle: string; bodyText: string } | null> {
  try {
    const res = await fetch(jobUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Rehearse/1.0)" },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // Extract JSON-LD structured data first — job pages often put salary, location,
    // and description here even when the page is JS-rendered
    const jsonLdText = extractJsonLd(html)

    // Strip scripts/styles for visible body text
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 10000)

    // JSON-LD is the most reliable source — prepend it
    const combinedText = [jsonLdText, bodyText].filter(Boolean).join("\n\n").slice(0, 10000)

    const og = extractOgTitle(html)
    if (og.roleTitle) return { ...og, bodyText: combinedText }
    const title = extractPageTitle(html)
    if (title.roleTitle) return { ...title, bodyText: combinedText }
    return { companyName: "", roleTitle: "", bodyText: combinedText }
  } catch {}
  return null
}

function extractJsonLd(html: string): string {
  const chunks: string[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1])
      // Flatten to readable key: value pairs
      chunks.push(jsonToText(parsed))
    } catch {}
  }
  return chunks.join("\n")
}

function jsonToText(obj: unknown, depth = 0): string {
  if (depth > 3) return ""
  if (typeof obj === "string") return obj
  if (typeof obj === "number") return String(obj)
  if (Array.isArray(obj)) return obj.map((v) => jsonToText(v, depth)).join(", ")
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>)
      .filter(([k]) => !["@context", "@type", "url", "image", "logo", "sameAs"].includes(k))
      .map(([k, v]) => `${k}: ${jsonToText(v, depth + 1)}`)
      .join("\n")
  }
  return ""
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
  const atMatch = cleaned.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i)
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
    serperApiKey
      ? searchJobContent(linkedInCompany ?? extractDomainCompany(jobPostingUrl), jobPostingUrl, serperApiKey)
      : Promise.resolve([]),
  ])

  const companyName = pageResult?.companyName || linkedInCompany || extractDomainCompany(jobPostingUrl)
  const roleFromPage = pageResult?.roleTitle ?? ""
  const roleFromSerper = serperResults.length > 0 ? extractRoleFromSnippets(serperResults) : ""
  // Page title is authoritative — Serper snippets only fill in if page fetch failed
  const roleTitle = roleFromPage || roleFromSerper || "Product Designer"

  // Build job text for Claude — page body takes priority, Serper snippets fill gaps
  const pageBodyText = pageResult?.bodyText ?? ""
  const serperText = serperResults.map(r => `${r.title}\n${r.snippet}`).join("\n\n")
  const jobText = [pageBodyText, serperText].filter(Boolean).join("\n\n")

  // Claude-powered analysis (when key available), else heuristic fallback
  const [jobInsights, resumeProfile] = await Promise.all([
    anthropicApiKey && jobText
      ? analyzeJobWithClaude(jobText, companyName, roleTitle, anthropicApiKey).catch(() => heuristicInsights(serperResults))
      : Promise.resolve(heuristicInsights(serperResults)),
    anthropicApiKey
      ? summarizeResumeWithClaude(resumeText, anthropicApiKey).catch(() => heuristicProfile(resumeText))
      : Promise.resolve(heuristicProfile(resumeText)),
  ])

  return { companyName, roleTitle, logoUrl, portfolioOgImage, jobInsights, resumeProfile }
}

function heuristicProfile(resumeText: string): import("../session-types").ResumeProfile {
  const lines = resumeText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 5 && l.length < 200)
  const titleLine = lines.find(l => /designer|researcher|director|lead|manager/i.test(l) && l.split(" ").length <= 8)
  const yearsLine = lines.find(l => /\d+[\+]?\s*years?\s+(of\s+)?experience/i.test(l))
  const impactLine = lines.find(l => /\d+%|\$\d|increased|reduced|grew|launched/i.test(l))
  return {
    title: titleLine ? clean(titleLine) : "Product Designer",
    experience: yearsLine ? clean(yearsLine) : "Experience not found — check your resume PDF",
    highlight: impactLine ? clean(impactLine) : "Design",
  }
}

function clean(text: string): string {
  return text.replace(/^[-•·▪▸*]\s*/, "").replace(/\s{2,}/g, " ").trim()
}
