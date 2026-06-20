export function getConfig() {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const serperApiKey = process.env.SERPER_API_KEY

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
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? null,
    serperApiKey: process.env.SERPER_API_KEY ?? null,
  }
}

export function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is not set. Add it to .env.local.')
  return key
}

export function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url) throw new Error('UPSTASH_REDIS_REST_URL is not set. Add it to .env.local.')
  if (!token) throw new Error('UPSTASH_REDIS_REST_TOKEN is not set. Add it to .env.local.')
  return { url, token }
}

export function getResendApiKey(): string {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set. Add it to .env.local.')
  return key
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}
