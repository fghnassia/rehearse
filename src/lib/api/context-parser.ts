import type { ContextData, JobInsight } from "../session-types"

// ---------------------------------------------------------------------------
// Company logo
// Uses Clearbit autocomplete to resolve company name → domain,
// then builds a Google favicon URL (128px, always served, reliable).
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
    // Google's favicon service — returns 128px image, always available
    return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Job content — Serper search (used when direct fetch fails, e.g. LinkedIn)
// ---------------------------------------------------------------------------

interface SerperSearchResult {
  title: string
  snippet: string
  link: string
}

async function searchJobContent(
  companyName: string,
  jobUrl: string,
  serperApiKey: string
): Promise<SerperSearchResult[]> {
  // Two queries: one targeting the specific URL, one for the job role
  const queries = [
    `site:linkedin.com "${companyName}" product designer job`,
    `"${companyName}" "product designer" job description responsibilities`,
  ]

  // If there's a LinkedIn job ID in the URL, add it as a targeted query
  try {
    const u = new URL(jobUrl)
    const jobId = u.searchParams.get("currentJobId")
    if (jobId) queries.unshift(`linkedin.com/jobs/view/${jobId}`)
  } catch {}

  const results: SerperSearchResult[] = []

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
      const organic: SerperSearchResult[] = data?.organic ?? []
      results.push(...organic)
      if (results.length >= 3) break
    } catch {
      continue
    }
  }

  return results
}

function extractRoleFromSnippets(snippets: SerperSearchResult[]): string {
  const roleTitles = [
    "Principal Product Designer",
    "Staff Product Designer",
    "Senior Product Designer",
    "Lead Product Designer",
    "Product Design Manager",
    "Head of Product Design",
    "Product Designer",
    "Senior Designer",
    "UX Designer",
    "UI Designer",
  ]

  const allText = snippets.map((s) => `${s.title} ${s.snippet}`).join(" ")

  for (const title of roleTitles) {
    if (allText.toLowerCase().includes(title.toLowerCase())) return title
  }

  // Try to extract from titles like "Senior Product Designer at Vercel"
  for (const s of snippets) {
    const m = s.title.match(/^(.+?)\s+(?:at|@)\s+.+$/i)
    if (m) return m[1].trim()
  }

  return ""
}

function extractJobInsights(snippets: SerperSearchResult[]): JobInsight[] {
  const allText = snippets.map((s) => s.snippet).join(" ")
  const sentences = allText
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 200)

  const insights: JobInsight[] = []

  // --- Key qualities ---
  const qualityPatterns = [
    /you.ll|you will|you bring|you have|you.re|we.re looking|we need|ideal candidate/i,
    /\d+\+?\s*years?\s+(of\s+)?(experience|background)/i,
    /experience (in|with|designing|leading|building)/i,
    /strong (understanding|background|skills|experience)/i,
  ]
  const qualityPoints = dedupe(
    sentences.filter((s) => qualityPatterns.some((re) => re.test(s))).slice(0, 3)
  )
  if (qualityPoints.length > 0) {
    insights.push({ category: "Key qualities", points: qualityPoints })
  }

  // --- Work location ---
  const locationPatterns: Array<[RegExp, string]> = [
    [/\bfully remote\b/i, "Fully remote"],
    [/\bremote[\s-]first\b/i, "Remote-first"],
    [/\bhybrid\b/i, "Hybrid"],
    [/\bin[\s-]?office\b|\bon[\s-]?site\b|\bin[\s-]?person\b/i, "In-office"],
    [/\bremote\b/i, "Remote"],
  ]
  for (const [re, label] of locationPatterns) {
    if (re.test(allText)) {
      // Find the sentence that mentions it
      const ctx = sentences.find((s) => re.test(s))
      insights.push({
        category: "Location",
        points: [ctx ? cleanInsightPoint(ctx) : label],
      })
      break
    }
  }

  // --- Compensation ---
  const salaryPatterns = [
    /\$[\d,]+\s*[-–—]\s*\$[\d,]+/,
    /\$[\d,.]+[kK]\s*[-–—]\s*\$[\d,.]+[kK]/,
    /salary.{0,50}\$[\d,]+/i,
    /compensation.{0,80}/i,
    /equity|stock options|RSU/i,
  ]
  const salaryPoints = dedupe(
    sentences
      .filter((s) => salaryPatterns.some((re) => re.test(s)))
      .slice(0, 2)
  )
  if (salaryPoints.length > 0) {
    insights.push({ category: "Compensation", points: salaryPoints })
  }

  return insights
}

function cleanInsightPoint(text: string): string {
  return text.replace(/^[-•·▪▸*"']+\s*/, "").replace(/\s{2,}/g, " ").trim()
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>()
  return arr
    .map(cleanInsightPoint)
    .filter((s) => {
      const key = s.toLowerCase().slice(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

// ---------------------------------------------------------------------------
// Direct page fetch (works for Greenhouse, Lever, direct company sites)
// ---------------------------------------------------------------------------

interface JobPageResult {
  companyName: string
  roleTitle: string
}

async function fetchJobPage(jobUrl: string): Promise<JobPageResult | null> {
  try {
    const res = await fetch(jobUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Rehearse/1.0)" },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const html = await res.text()

    const og = extractOgTags(html)
    if (og.company && og.role) return { companyName: og.company, roleTitle: og.role }

    const fromTitle = extractFromTitle(html)
    if (fromTitle.role) {
      return {
        companyName: fromTitle.company || extractDomainCompany(jobUrl),
        roleTitle: fromTitle.role,
      }
    }
  } catch {}
  return null
}

function extractOgTags(html: string): { company: string; role: string } {
  const get = (prop: string) => {
    const m =
      html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ??
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, "i"))
    return m?.[1]?.trim() ?? ""
  }
  return parseRoleAtCompany(get("title"))
}

function extractFromTitle(html: string): { company: string; role: string } {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return parseRoleAtCompany(m?.[1]?.trim() ?? "")
}

function parseRoleAtCompany(text: string): { company: string; role: string } {
  if (!text) return { company: "", role: "" }
  const cleaned = text
    .replace(/\s*\|\s*(LinkedIn|Greenhouse|Lever|Ashby|Workday|Indeed|Glassdoor|Apply)\s*$/i, "")
    .trim()

  const atMatch = cleaned.match(/^(.+?)\s+(?:at|@|-)\s+(.+)$/i)
  if (atMatch) return { role: atMatch[1].trim(), company: atMatch[2].trim() }

  const pipeMatch = cleaned.match(/^([^|]+)\s*[|–—]\s*(.+)$/)
  if (pipeMatch) {
    const a = pipeMatch[1].trim()
    const b = pipeMatch[2].trim()
    return a.length <= b.length ? { company: a, role: b } : { company: b, role: a }
  }

  return { company: "", role: cleaned }
}

function extractDomainCompany(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "")
    const parts = hostname.split(".")
    const jobBoards = ["greenhouse", "lever", "ashby", "workday", "icims", "taleo", "bamboohr", "workable", "smartrecruiters"]
    const candidate = parts[parts.length - 2] ?? ""
    if (jobBoards.includes(candidate.toLowerCase())) {
      const forParam = new URL(url).searchParams.get("for")
      if (forParam) return titleCase(forParam)
    }
    return titleCase(candidate)
  } catch {
    return "the company"
  }
}

// ---------------------------------------------------------------------------
// LinkedIn URL helpers
// ---------------------------------------------------------------------------

function getLinkedInCompanyName(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes("linkedin.com")) return null
    const keywords = u.searchParams.get("keywords")
    if (keywords) return keywords.trim()
    // /jobs/view/[id]/[slug]
    const slug = u.pathname.split("/").filter(Boolean).pop() ?? ""
    const atIdx = slug.lastIndexOf("-at-")
    if (atIdx !== -1) {
      return titleCase(slug.slice(atIdx + 4).replace(/-\d+$/, "").replace(/-/g, " "))
    }
    return null
  } catch {
    return null
  }
}

function isGatedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return ["linkedin.com", "glassdoor.com", "indeed.com", "blind.com"].some((h) => host.includes(h))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Resume summarising
// ---------------------------------------------------------------------------

export function summariseResume(resumeText: string): string[] {
  const lines = resumeText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && l.length < 200)

  const bullets: string[] = []

  const presentLine = lines.find((l) => /present|current/i.test(l) && /\d{4}/.test(l))
  if (presentLine) bullets.push(cleanBullet(presentLine))

  const titlePatterns = /designer|researcher|director|lead|manager|engineer|strategist|consultant|founder|head of/i
  const titleLine = lines.find((l) => titlePatterns.test(l) && l.split(" ").length <= 8)
  if (titleLine && !bullets.includes(cleanBullet(titleLine))) bullets.push(cleanBullet(titleLine))

  const yearsLine = lines.find((l) => /\d+[\+]?\s*years?\s+(of\s+)?experience/i.test(l))
  if (yearsLine) bullets.push(cleanBullet(yearsLine))

  const aiLine = lines.find((l) => /\bai\b|machine learning|llm|generative|figma|design system/i.test(l))
  if (aiLine && bullets.length < 4) bullets.push(cleanBullet(aiLine))

  for (const line of lines) {
    if (bullets.length >= 4) break
    const cleaned = cleanBullet(line)
    if (!bullets.includes(cleaned) && line.split(" ").length >= 4) bullets.push(cleaned)
  }

  return bullets.slice(0, 4)
}

function cleanBullet(text: string): string {
  return text.replace(/^[-•·▪▸*]\s*/, "").replace(/\s{2,}/g, " ").trim()
}

function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function parseContext(
  resumeText: string,
  jobPostingUrl: string,
  serperApiKey?: string | null
): Promise<ContextData> {
  // Step 1 — Get company name from URL
  const linkedInCompany = getLinkedInCompanyName(jobPostingUrl)
  const gated = isGatedUrl(jobPostingUrl)

  // Step 2 — Run in parallel: direct page fetch + logo lookup + Serper job search
  const [pageResult, logoUrl, serperResults] = await Promise.all([
    gated ? Promise.resolve(null) : fetchJobPage(jobPostingUrl),
    fetchCompanyLogo(linkedInCompany ?? extractDomainCompany(jobPostingUrl)),
    serperApiKey && (gated || true)
      ? searchJobContent(linkedInCompany ?? extractDomainCompany(jobPostingUrl), jobPostingUrl, serperApiKey)
      : Promise.resolve([]),
  ])

  // Step 3 — Determine company name and role title
  const companyName =
    pageResult?.companyName ||
    linkedInCompany ||
    extractDomainCompany(jobPostingUrl)

  const roleFromPage = pageResult?.roleTitle ?? ""
  const roleFromSerper = serperResults.length > 0 ? extractRoleFromSnippets(serperResults) : ""
  const roleTitle = roleFromSerper || roleFromPage || "Product Designer"

  // Step 4 — Structured job insights from Serper snippets
  const jobInsights = extractJobInsights(serperResults)

  // Step 5 — Resume bullets
  const resumeBullets = summariseResume(resumeText)

  return {
    companyName,
    roleTitle,
    logoUrl: logoUrl ?? undefined,
    jobInsights,
    resumeBullets,
  }
}
