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
