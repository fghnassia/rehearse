import { NextRequest, NextResponse } from "next/server"
import { getToken, getSessionsForToken } from "@/lib/api/kv"

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
      hasDebrief: !!s.debrief,
    })),
  })
}

function computeScore(session: { simulation: { answers: Array<{ scores?: Array<{ level: string }> }> } }): number | null {
  const levelValue: Record<string, number> = { weak: 1, moderate: 2, strong: 3 }
  const scores = session.simulation.answers
    .filter(a => a.scores && a.scores.length > 0)
    .map(a => {
      const sum = a.scores!.reduce((acc, s) => acc + (levelValue[s.level] ?? 2), 0)
      return Math.round((sum / (a.scores!.length * 3)) * 10 * 10) / 10
    })
  if (scores.length === 0) return null
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}
