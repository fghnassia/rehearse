import { NextRequest, NextResponse } from "next/server"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse")

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file")

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const result = await pdf(buffer)
    const text = result.text.trim()
    if (!text) {
      return NextResponse.json({ error: "Could not extract text from this PDF. Try a text-based PDF, not a scanned image." }, { status: 422 })
    }
    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ error: "Failed to parse PDF. Make sure it's a valid PDF file." }, { status: 422 })
  }
}
