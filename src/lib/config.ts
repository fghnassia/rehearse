// Read an env var, tolerating values that were pasted into a hosting dashboard
// (e.g. Vercel) with surrounding quotes or stray whitespace. Vercel stores env
// values literally — a pasted `"https://…"` keeps its quotes and breaks clients
// like Upstash that validate the raw string. We strip one layer of matching
// quotes and trim whitespace so the app is robust to that mistake.
function readEnv(name: string): string | undefined {
  const raw = process.env[name]
  if (raw == null) return undefined
  const cleaned = raw.trim().replace(/^(['"])([\s\S]*)\1$/, "$2").trim()
  return cleaned.length > 0 ? cleaned : undefined
}

export function getConfig() {
  const anthropicApiKey = readEnv("ANTHROPIC_API_KEY")
  const serperApiKey = readEnv("SERPER_API_KEY")

  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local.')
  }
  if (!serperApiKey) {
    throw new Error('SERPER_API_KEY is not set. Add it to .env.local.')
  }

  return { anthropicApiKey, serperApiKey }
}

export function getConfigSafe() {
  return {
    anthropicApiKey: readEnv("ANTHROPIC_API_KEY") ?? null,
    serperApiKey: readEnv("SERPER_API_KEY") ?? null,
  }
}

export function getGroqApiKey(): string {
  const key = readEnv("GROQ_API_KEY")
  if (!key) throw new Error('GROQ_API_KEY is not set. Add it to .env.local.')
  return key
}

export function getUpstashConfig() {
  const url = readEnv("UPSTASH_REDIS_REST_URL")
  const token = readEnv("UPSTASH_REDIS_REST_TOKEN")
  if (!url) throw new Error('UPSTASH_REDIS_REST_URL is not set. Add it to .env.local.')
  if (!token) throw new Error('UPSTASH_REDIS_REST_TOKEN is not set. Add it to .env.local.')
  return { url, token }
}

export function getResendApiKey(): string {
  const key = readEnv("RESEND_API_KEY")
  if (!key) throw new Error('RESEND_API_KEY is not set. Add it to .env.local.')
  return key
}

export function getAppUrl(): string {
  return readEnv("NEXT_PUBLIC_APP_URL") ?? 'http://localhost:3000'
}
