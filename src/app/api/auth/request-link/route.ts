import { NextRequest, NextResponse } from "next/server"
import { getTokenIdForEmail, getToken } from "@/lib/api/kv"
import { sendMagicLink } from "@/lib/api/email"

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const tokenId = await getTokenIdForEmail(email)
  if (!tokenId) {
    // No account found — send a "nothing to recover" email or silently succeed
    return NextResponse.json({ ok: true })
  }

  const record = await getToken(tokenId)
  if (!record || record.expires < Date.now()) {
    return NextResponse.json({ ok: true })
  }

  await sendMagicLink({
    to: email,
    tokenId,
    sessionSlug: record.sessionSlugs[record.sessionSlugs.length - 1] ?? "",
    companyName: "your sessions",
    stage: "",
  })

  return NextResponse.json({ ok: true })
}
