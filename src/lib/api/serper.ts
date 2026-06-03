export interface SerperResult {
  title: string
  link: string
  snippet: string
  source?: string
}

export async function searchCompanyInterviews(
  companyName: string,
  serperApiKey: string
): Promise<SerperResult[]> {
  const queries = [
    `${companyName} product designer interview process`,
    `${companyName} design interview Glassdoor`,
    `${companyName} design interview Reddit`,
  ]

  const results = await Promise.allSettled(
    queries.map((q) =>
      fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": serperApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q, num: 5 }),
      }).then((r) => {
        if (!r.ok) throw new Error(`Serper returned ${r.status}`)
        return r.json()
      })
    )
  )

  const all: SerperResult[] = []
  for (const result of results) {
    if (result.status === "fulfilled") {
      const items = result.value?.organic ?? []
      for (const item of items) {
        all.push({
          title: item.title ?? "",
          link: item.link ?? "",
          snippet: item.snippet ?? "",
          source: extractDomain(item.link ?? ""),
        })
      }
    }
  }

  // Deduplicate by link
  const seen = new Set<string>()
  return all.filter((r) => {
    if (seen.has(r.link)) return false
    seen.add(r.link)
    return true
  })
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}
