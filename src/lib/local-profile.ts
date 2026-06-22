import type { LocalProfileData, InferredIdentity, CompanyResearchSummary, ScoreSnapshot } from "./session-types"

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

export function inferTargetField(companyName: string): string {
  const name = companyName.toLowerCase()
  if (["mercury", "stripe", "plaid", "brex", "robinhood", "chime", "square", "paypal", "wise", "klarna", "affirm"].some(c => name.includes(c))) return "fintech"
  if (["anthropic", "openai", "cohere", "perplexity", "mistral", "hugging face", "deepmind"].some(c => name.includes(c))) return "ai-infra"
  if (["notion", "linear", "figma", "loom", "slack", "airtable", "coda"].some(c => name.includes(c))) return "productivity"
  if (["cresta", "glean", "moveworks", "writer", "jasper"].some(c => name.includes(c))) return "ai-enterprise"
  return "tech"
}
