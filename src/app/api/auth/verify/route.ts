import { NextRequest, NextResponse } from "next/server"
import { getToken, getSessionsForToken } from "@/lib/api/kv"
import type { SavedSession } from "@/lib/api/kv"
import type { ScoreLevel } from "@/lib/session-types"

export async function GET(req: NextRequest) {
  const tokenId = req.nextUrl.searchParams.get("t")
  if (!tokenId) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const record = await getToken(tokenId)
  if (!record) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  if (record.expires < Date.now()) return NextResponse.json({ error: "Token expired" }, { status: 401 })

  const sessions = await getSessionsForToken(tokenId)

  return NextResponse.json({
    email: record.email,
    sessions: sessions.map(s => ({
      slug: s.slug,
      createdAt: s.createdAt,
      companyName: s.context.companyName,
      roleTitle: s.context.roleTitle,
      stage: s.setup.stage,
      overallLevel: s.report.overallImpressionLevel,
      score: computeScore(s),
      scoreDelta: null, // computed client-side from grouped data
      weakSpots: computeWeakSpots(s),
      hasDebrief: !!s.debrief,
    })),
  })
}

const levelValue: Record<string, number> = { weak: 1, moderate: 2, strong: 3 }

function computeScore(session: SavedSession): number | null {
  const scores = session.simulation.answers
    .filter(a => a.scores && a.scores.length > 0)
    .map(a => {
      const sum = a.scores!.reduce((acc, s) => acc + (levelValue[s.level] ?? 2), 0)
      return Math.round((sum / (a.scores!.length * 3)) * 10 * 10) / 10
    })
  if (scores.length === 0) return null
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}

function computeWeakSpots(session: SavedSession): string[] {
  const criterionCounts: Record<string, { weak: number; total: number }> = {}
  for (const qa of session.simulation.answers) {
    if (!qa.scores) continue
    for (const s of qa.scores) {
      if (!criterionCounts[s.criterion]) criterionCounts[s.criterion] = { weak: 0, total: 0 }
      criterionCounts[s.criterion].total++
      if (s.level === "weak") criterionCounts[s.criterion].weak++
    }
  }
  return Object.entries(criterionCounts)
    .filter(([, v]) => v.weak / v.total >= 0.5)
    .sort((a, b) => b[1].weak - a[1].weak)
    .slice(0, 2)
    .map(([criterion]) => criterion)
}
