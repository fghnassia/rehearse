import { NextRequest, NextResponse } from "next/server"
import { appendDebrief, type DebriefData } from "@/lib/api/kv"

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const body = await req.json() as DebriefData

  if (!body.overallFeel || !body.completedAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const ok = await appendDebrief(slug, body)
  if (!ok) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  return NextResponse.json({ success: true })
}
