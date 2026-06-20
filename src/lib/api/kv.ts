import { Redis } from "@upstash/redis"
import { getUpstashConfig } from "@/lib/config"
import type { SetupData, ContextData, SimulationData, ReportData } from "@/lib/session-types"

let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    const { url, token } = getUpstashConfig()
    _redis = new Redis({ url, token })
  }
  return _redis
}

const TTL_TOKEN   = 60 * 60 * 24 * 90   // 90 days
const TTL_SESSION = 60 * 60 * 24 * 365  // 1 year
const TTL_EMAIL   = 60 * 60 * 24 * 90   // 90 days

export interface TokenRecord {
  email: string
  expires: number
  sessionSlugs: string[]
}

export interface DebriefData {
  overallFeel: "well" | "ok" | "rough"
  surprisingQuestions: string
  wouldSayDifferently: string
  completedAt: string
}

export interface SavedSession {
  slug: string
  createdAt: string
  email: string
  setup: SetupData
  context: ContextData
  simulation: SimulationData
  report: ReportData
  debrief?: DebriefData
}

export interface EmailRecord {
  tokenId: string
}

// ── Token ──────────────────────────────────────────────────────────

export async function getToken(tokenId: string): Promise<TokenRecord | null> {
  return getRedis().get<TokenRecord>(`token:${tokenId}`)
}

export async function setToken(tokenId: string, record: TokenRecord): Promise<void> {
  await getRedis().set(`token:${tokenId}`, record, { ex: TTL_TOKEN })
}

export async function addSessionToToken(tokenId: string, slug: string): Promise<void> {
  const record = await getToken(tokenId)
  if (!record) return
  if (!record.sessionSlugs.includes(slug)) {
    record.sessionSlugs = [slug, ...record.sessionSlugs]
  }
  await setToken(tokenId, record)
}

// ── Email → Token mapping ──────────────────────────────────────────

export async function getTokenIdForEmail(email: string): Promise<string | null> {
  const rec = await getRedis().get<EmailRecord>(`email:${email.toLowerCase()}`)
  return rec?.tokenId ?? null
}

export async function setTokenIdForEmail(email: string, tokenId: string): Promise<void> {
  await getRedis().set(`email:${email.toLowerCase()}`, { tokenId }, { ex: TTL_EMAIL })
}

// ── Sessions ───────────────────────────────────────────────────────

export async function getSession(slug: string): Promise<SavedSession | null> {
  return getRedis().get<SavedSession>(`session:${slug}`)
}

export async function setSession(session: SavedSession): Promise<void> {
  await getRedis().set(`session:${session.slug}`, session, { ex: TTL_SESSION })
}

export async function appendDebrief(slug: string, debrief: DebriefData): Promise<boolean> {
  const session = await getSession(slug)
  if (!session) return false
  await setSession({ ...session, debrief })
  return true
}

export async function getSessionsForToken(tokenId: string): Promise<SavedSession[]> {
  const record = await getToken(tokenId)
  if (!record || record.sessionSlugs.length === 0) return []
  const sessions = await Promise.all(record.sessionSlugs.map(slug => getSession(slug)))
  return sessions.filter((s): s is SavedSession => s !== null)
}

// ── Slug generation ────────────────────────────────────────────────

export function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10)
}

export function generateTokenId(): string {
  return crypto.randomUUID()
}
