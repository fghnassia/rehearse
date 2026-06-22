import type { LocalProfileData, InferredIdentity, CompanyResearchSummary, ScoreSnapshot, PriorSessionContext } from "./session-types"

const PROFILE_KEY = "rehearse_local_profile"

function generateId(): string {
  return crypto.randomUUID()
}

export function getLocalProfile(): LocalProfileData {
  try {
    const stored = localStorage.getItem(PROFILE_KEY)
    if (stored) return JSON.parse(stored) as LocalProfileData
  } catch {}
  return { profileId: generateId(), researchSummaries: {}, scoreSnapshots: [] }
}

function saveLocalProfile(data: LocalProfileData): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data))
  } catch {}
}

export function persistInferredIdentity(identity: InferredIdentity): void {
  const profile = getLocalProfile()
  saveLocalProfile({ ...profile, inferredIdentity: identity })
}

export function persistResearchSummary(summary: CompanyResearchSummary): void {
  const profile = getLocalProfile()
  const key = summary.companyName.toLowerCase().trim()
  saveLocalProfile({
    ...profile,
    researchSummaries: { ...profile.researchSummaries, [key]: summary },
  })
}

export function appendScoreSnapshot(snapshot: ScoreSnapshot): void {
  const profile = getLocalProfile()
  saveLocalProfile({
    ...profile,
    scoreSnapshots: [...profile.scoreSnapshots, snapshot],
  })
}

// ── Cross-session question awareness ─────────────────────────────────────────
// Built entirely client-side from prior completed sessions (ScoreSnapshots) for
// the same company, then handed to the stateless generate-questions API. Returns
// null when this is the first session for the company (no context to pass).

const CRITERION_READABLE: Record<keyof ScoreSnapshot["criteriaScores"], string> = {
  structure: "structure",
  specificity: "specificity",
  relevance: "relevance",
  communication: "communication",
  aiFluency: "AI fluency",
}

const STAGE_READABLE: Record<ScoreSnapshot["stage"], string> = {
  recruiter: "recruiter screen",
  hiring_manager: "hiring manager round",
  portfolio_review: "portfolio review",
}

export function buildPriorSessionContext(companyName: string): PriorSessionContext | null {
  if (!companyName) return null
  const key = companyName.toLowerCase().trim()
  const matching = getLocalProfile().scoreSnapshots.filter(
    s => s.company.toLowerCase().trim() === key
  )
  // Every ScoreSnapshot is a completed session by definition — none here means
  // first session for this company, so no context is passed.
  if (matching.length === 0) return null

  const criteria = ["structure", "specificity", "relevance", "communication", "aiFluency"] as const
  const weakestCriteria = criteria
    .map(c => ({
      name: CRITERION_READABLE[c],
      avg: matching.reduce((sum, s) => sum + s.criteriaScores[c], 0) / matching.length,
    }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 2)
    .map(x => x.name)

  const coveredTopics = [
    ...new Set(matching.flatMap(s => s.questions ?? []).map(q => q.trim()).filter(Boolean)),
  ].slice(0, 8)

  const lastSnap = [...matching].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0]

  return {
    company: companyName,
    sessionCount: matching.length,
    weakestCriteria,
    coveredTopics,
    lastStage: STAGE_READABLE[lastSnap.stage] ?? lastSnap.stage,
  }
}

export function inferTargetField(companyName: string): string {
  const name = companyName.toLowerCase()
  if (["mercury", "stripe", "plaid", "brex", "robinhood", "chime", "square", "paypal", "wise", "klarna", "affirm"].some(c => name.includes(c))) return "fintech"
  if (["anthropic", "openai", "cohere", "perplexity", "mistral", "hugging face", "deepmind"].some(c => name.includes(c))) return "ai-infra"
  if (["notion", "linear", "figma", "loom", "slack", "airtable", "coda"].some(c => name.includes(c))) return "productivity"
  if (["cresta", "glean", "moveworks", "writer", "jasper"].some(c => name.includes(c))) return "ai-enterprise"
  return "tech"
}
