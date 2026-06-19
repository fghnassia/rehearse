import { NextRequest, NextResponse } from "next/server"
import { getGroqApiKey } from "@/lib/config"

export async function POST(req: NextRequest) {
  const apiKey = getGroqApiKey()
  const formData = await req.formData()
  const audio = formData.get("audio") as Blob | null

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 })
  }

  const body = new FormData()
  body.append("file", audio, "recording.webm")
  body.append("model", "whisper-large-v3")
  body.append("language", "en")
  body.append("response_format", "json")

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[transcribe] Groq error:", err)
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({ transcript: data.text ?? "" })
}
