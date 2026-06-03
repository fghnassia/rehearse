import type { ContextData } from "../session-types"

// ---------------------------------------------------------------------------
// Company logo — Clearbit (free, no key required)
// ---------------------------------------------------------------------------

export async function fetchCompanyLogo(companyName: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return undefined
    const results = await res.json()
    const match = results?.[0]
    return match?.logo ?? undefined
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

function extractJobQuotes(snippets: SerperSearchResult[]): string[] {
  const quotes: string[] = []
  const seen = new Set<string>()

  // Keywords that signal meaningful job description content
  const qualitySignals = [
    /you.ll|you will|we.re looking|we are looking/i,
    /experience|background|background/i,
    /design|product|collaborate|lead|own|drive/i,
    /responsible|work with|partner|shape/i,
  ]

  for (const result of snippets) {
    // Split snippet into sentences
    const sentences = result.snippet
      .split(/[.!?]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 40 && s.length < 220)

    for (const sentence of sentences) {
      if (quotes.length >= 3) break
      const key = sentence.toLowerCase().slice(0, 60)
      if (seen.has(key)) continue
      if (qualitySignals.some((re) => re.test(sentence))) {
        seen.add(key)
        quotes.push(sentence.replace(/^["']+|["']+$/g, "").trim())
      }
    }
    if (quotes.length >= 3) break
  }

  return quotes
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

  // Step 4 — Job quotes from Serper snippets
  const jobQuotes = extractJobQuotes(serperResults)

  // Step 5 — Resume bullets
  const resumeBullets = summariseResume(resumeText)

  return {
    companyName,
    roleTitle,
    logoUrl: logoUrl ?? undefined,
    jobQuotes,
    resumeBullets,
  }
}
