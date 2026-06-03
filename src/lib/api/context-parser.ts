import type { ContextData } from "../session-types"

// ---------------------------------------------------------------------------
// Job page parsing
// ---------------------------------------------------------------------------

interface JobPageResult {
  companyName: string
  roleTitle: string
}

/** Fetch the job posting page and extract company + role from the HTML title / OG tags. */
export async function parseJobPage(jobUrl: string): Promise<JobPageResult> {
  // LinkedIn special-case: the page requires login for server-side fetches.
  // Extract from the URL query params instead.
  const linkedInResult = tryLinkedIn(jobUrl)
  if (linkedInResult) return linkedInResult

  try {
    const res = await fetch(jobUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Rehearse/1.0)",
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`${res.status}`)
    const html = await res.text()

    // Try OG tags first (most reliable)
    const og = extractOgTags(html)
    if (og.company && og.role) return { companyName: og.company, roleTitle: og.role }

    // Fall back to <title> parsing
    const fromTitle = extractFromTitle(html)
    if (fromTitle.company || fromTitle.role) {
      return {
        companyName: fromTitle.company || extractDomainCompany(jobUrl),
        roleTitle: fromTitle.role || "Product Designer",
      }
    }
  } catch {
    // Fetch failed — fall through to domain extraction
  }

  return {
    companyName: extractDomainCompany(jobUrl),
    roleTitle: "Product Designer",
  }
}

function tryLinkedIn(url: string): JobPageResult | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes("linkedin.com")) return null

    // keywords param often holds the company name in job search URLs
    const keywords = u.searchParams.get("keywords")
    if (keywords) {
      return { companyName: keywords.trim(), roleTitle: "Product Designer" }
    }
    // /jobs/view/[id]/[slug] format — slug is "role-at-company-id"
    const slug = u.pathname.split("/").filter(Boolean).pop() ?? ""
    const atIdx = slug.lastIndexOf("-at-")
    if (atIdx !== -1) {
      const rolePart = slug.slice(0, atIdx).replace(/-/g, " ")
      const companyPart = slug.slice(atIdx + 4).replace(/-\d+$/, "").replace(/-/g, " ")
      return {
        companyName: titleCase(companyPart),
        roleTitle: titleCase(rolePart),
      }
    }
    return null
  } catch {
    return null
  }
}

function extractOgTags(html: string): { company: string; role: string } {
  const get = (prop: string) => {
    const m = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
      ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, "i"))
    return m?.[1]?.trim() ?? ""
  }

  const title = get("title")
  // Common formats: "Senior Product Designer at Vercel | Greenhouse"
  // or "Vercel | Senior Product Designer"
  return parseRoleAtCompany(title)
}

function extractFromTitle(html: string): { company: string; role: string } {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = m?.[1]?.trim() ?? ""
  return parseRoleAtCompany(title)
}

/** Parse "Role at Company" or "Company | Role" style strings */
function parseRoleAtCompany(text: string): { company: string; role: string } {
  if (!text) return { company: "", role: "" }

  // Remove trailing " | Platform" suffixes (LinkedIn, Greenhouse, etc.)
  const cleaned = text.replace(/\s*\|\s*(LinkedIn|Greenhouse|Lever|Ashby|Workday|Indeed|Glassdoor|Apply)\s*$/i, "").trim()

  // "Role at Company" or "Role - Company"
  const atMatch = cleaned.match(/^(.+?)\s+(?:at|@|-)\s+(.+)$/i)
  if (atMatch) {
    return { role: atMatch[1].trim(), company: atMatch[2].trim() }
  }

  // "Company | Role" or "Company - Role"
  const pipeMatch = cleaned.match(/^([^|]+)\s*[|–—]\s*(.+)$/)
  if (pipeMatch) {
    // heuristic: shorter part is usually company name
    const a = pipeMatch[1].trim()
    const b = pipeMatch[2].trim()
    return a.length <= b.length
      ? { company: a, role: b }
      : { company: b, role: a }
  }

  return { company: "", role: cleaned }
}

function extractDomainCompany(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "")
    const parts = hostname.split(".")
    const jobBoards = ["greenhouse", "lever", "ashby", "workday", "icims", "taleo", "bamboohr", "workable", "myworkday", "smartrecruiters"]
    const candidate = parts[parts.length - 2] ?? ""
    if (jobBoards.includes(candidate.toLowerCase())) {
      // Try to get company from path, e.g. greenhouse.io/embed/job_app?for=stripe
      const u = new URL(url)
      const forParam = u.searchParams.get("for")
      if (forParam) return titleCase(forParam)
    }
    return titleCase(candidate)
  } catch {
    return "the company"
  }
}

// ---------------------------------------------------------------------------
// Resume summarising
// ---------------------------------------------------------------------------

/** Extract key bullet points from raw resume text without requiring an AI API. */
export function summariseResume(resumeText: string): string[] {
  const lines = resumeText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && l.length < 200)

  const bullets: string[] = []

  // 1. Most recent role / company (look for "at [Company]" or "[Year] – present")
  const presentLine = lines.find((l) => /present|current/i.test(l) && /\d{4}/.test(l))
  if (presentLine) bullets.push(cleanBullet(presentLine))

  // 2. Title line — first line that looks like a job title
  const titlePatterns = /designer|researcher|director|lead|manager|engineer|strategist|consultant|founder|head of/i
  const titleLine = lines.find((l) => titlePatterns.test(l) && l.split(" ").length <= 8)
  if (titleLine && !bullets.includes(cleanBullet(titleLine))) {
    bullets.push(cleanBullet(titleLine))
  }

  // 3. Years of experience
  const yearsLine = lines.find((l) => /\d+[\+]?\s*years?\s+(of\s+)?experience/i.test(l))
  if (yearsLine) bullets.push(cleanBullet(yearsLine))

  // 4. AI / notable skills line
  const aiLine = lines.find((l) => /\bai\b|machine learning|llm|generative|figma|design system/i.test(l))
  if (aiLine && bullets.length < 4) bullets.push(cleanBullet(aiLine))

  // 5. Pad with first substantive non-duplicate lines if we have fewer than 3 bullets
  for (const line of lines) {
    if (bullets.length >= 4) break
    const cleaned = cleanBullet(line)
    if (!bullets.includes(cleaned) && line.split(" ").length >= 4) {
      bullets.push(cleaned)
    }
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

export async function parseContext(resumeText: string, jobPostingUrl: string): Promise<ContextData> {
  const [jobResult] = await Promise.all([parseJobPage(jobPostingUrl)])
  const resumeBullets = summariseResume(resumeText)

  return {
    companyName: jobResult.companyName,
    roleTitle: jobResult.roleTitle,
    resumeBullets,
  }
}
