import { NextRequest, NextResponse } from "next/server"
import {
  getToken, setToken, setTokenIdForEmail, getTokenIdForEmail,
  setSession, addSessionToToken, generateSlug, generateTokenId,
  type SavedSession,
} from "@/lib/api/kv"
import { sendMagicLink } from "@/lib/api/email"
import type { SetupData, ContextData, SimulationData, ReportData } from "@/lib/session-types"

export async function POST(req: NextRequest) {
  const { email, setup, context, simulation, report } = await req.json() as {
    email: string
    setup: SetupData
    context: ContextData
    simulation: SimulationData
    report: ReportData
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const slug = generateSlug()
  const now = Date.now()
  const expires = now + 1000 * 60 * 60 * 24 * 90

  // Reuse existing token for this email, or create a new one
  let tokenId = await getTokenIdForEmail(email)
  if (tokenId) {
    const existing = await getToken(tokenId)
    if (!existing || existing.expires < now) {
      tokenId = null // expired — create fresh
    }
  }

  if (!tokenId) {
    tokenId = generateTokenId()
    await setToken(tokenId, { email, expires, sessionSlugs: [] })
    await setTokenIdForEmail(email, tokenId)
  }

  const session: SavedSession = {
    slug,
    createdAt: new Date().toISOString(),
    email,
    setup,
    context,
    simulation,
    report,
  }

  await setSession(session)
  await addSessionToToken(tokenId, slug)

  await sendMagicLink({
    to: email,
    tokenId,
    sessionSlug: slug,
    companyName: context.companyName,
    stage: setup.stage,
  })

  return NextResponse.json({ slug, tokenId })
}
