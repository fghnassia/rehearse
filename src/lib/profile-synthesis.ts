import type { ScoreSnapshot, CriterionTrend, ProfileSynthesis } from "./session-types"

type Criterion = 'structure' | 'specificity' | 'relevance' | 'communication' | 'aiFluency'

const CRITERIA: Criterion[] = ['structure', 'specificity', 'relevance', 'communication', 'aiFluency']

const CRITERION_LABEL: Record<Criterion, string> = {
  structure: 'Structure',
  specificity: 'Specificity',
  relevance: 'Relevance',
  communication: 'Communication',
  aiFluency: 'AI fluency',
}

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function scoreToVerdict(score: number): string {
  if (score >= 7) return "Strong performance"
  if (score >= 4) return "Solid with gaps"
  return "Needs more prep"
}

function computeTrend(scores: number[]): CriterionTrend {
  const sampleSize = scores.length
  const confidence = sampleSize < 3 ? 'low' : sampleSize <= 5 ? 'medium' : 'high'

  if (sampleSize === 0) {
    return { direction: 'flat', confidence: 'low', sampleSize: 0, latestScore: 0, delta: null }
  }

  const latestScore = scores[scores.length - 1]
  const delta = sampleSize > 1 ? Math.round((latestScore - scores[0]) * 10) / 10 : null

  let direction: 'up' | 'down' | 'flat' = 'flat'
  if (delta !== null) {
    if (delta > 0.3) direction = 'up'
    else if (delta < -0.3) direction = 'down'
  }

  return { direction, confidence, sampleSize, latestScore, delta }
}

export function computeProfileSynthesis(snapshots: ScoreSnapshot[]): ProfileSynthesis {
  // Sort chronologically for trend computation
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Trends by criterion
  const trendsByCriterion = Object.fromEntries(
    CRITERIA.map(c => [c, computeTrend(sorted.map(s => s.criteriaScores[c]))])
  ) as ProfileSynthesis['trendsByCriterion']

  // Overall trend
  const overallTrend = computeTrend(sorted.map(s => s.overallScore))

  // Stage groupings — ScoreSnapshot uses underscores
  const byStage = {
    recruiter:        sorted.filter(s => s.stage === 'recruiter'),
    hiring_manager:   sorted.filter(s => s.stage === 'hiring_manager'),
    portfolio_review: sorted.filter(s => s.stage === 'portfolio_review'),
  }

  const recruiterScreen  = avg(byStage.recruiter.map(s => s.overallScore))
  const hiringManager    = avg(byStage.hiring_manager.map(s => s.overallScore))
  const portfolioReview  = avg(byStage.portfolio_review.map(s => s.overallScore))

  // Stage variance flag — fires when any two stage overalls differ by > 1.5
  const stageEntries = [
    { key: 'recruiter',        avg: recruiterScreen },
    { key: 'hiring-manager',   avg: hiringManager },
    { key: 'portfolio-review', avg: portfolioReview },
  ].filter(x => x.avg !== null) as { key: string; avg: number }[]

  let flag: string | null = null
  if (stageEntries.length >= 2) {
    let maxOverallDiff = 0
    let weakerStageKey = ''

    for (let i = 0; i < stageEntries.length; i++) {
      for (let j = i + 1; j < stageEntries.length; j++) {
        const diff = Math.abs(stageEntries[i].avg - stageEntries[j].avg)
        if (diff > maxOverallDiff) {
          maxOverallDiff = diff
          weakerStageKey = stageEntries[i].avg < stageEntries[j].avg
            ? stageEntries[i].key
            : stageEntries[j].key
        }
      }
    }

    if (maxOverallDiff > 1.5) {
      // Find criterion with largest cross-stage variance to name in the flag
      let maxCritVariance = 0
      let flagCriterion: Criterion = 'specificity'

      for (const c of CRITERIA) {
        const cAvgs = [
          avg(byStage.recruiter.map(s => s.criteriaScores[c])),
          avg(byStage.hiring_manager.map(s => s.criteriaScores[c])),
          avg(byStage.portfolio_review.map(s => s.criteriaScores[c])),
        ].filter(v => v !== null) as number[]

        if (cAvgs.length < 2) continue
        const variance = Math.max(...cAvgs) - Math.min(...cAvgs)
        if (variance > maxCritVariance) {
          maxCritVariance = variance
          flagCriterion = c
        }
      }

      flag = `${CRITERION_LABEL[flagCriterion]} scores notably lower in ${weakerStageKey} sessions.`
    }
  }

  // topStrength / topWeakness — null if fewer than 2 snapshots
  let topStrength: string | null = null
  let topWeakness: string | null = null

  if (sorted.length >= 2) {
    const criterionAvgs = CRITERIA.map(c => ({
      name: c,
      avg: avg(sorted.map(s => s.criteriaScores[c])) ?? 0,
    })).sort((a, b) => b.avg - a.avg)

    topStrength = criterionAvgs[0].name
    topWeakness = criterionAvgs[criterionAvgs.length - 1].name
  }

  // Verdict history is derived from snapshots, which is correct for now: snapshots
  // are append-only (appendScoreSnapshot only ever pushes), so the derived history
  // can only grow. Revisit — pass history in and append to it — if snapshots ever
  // become mutable (e.g. session deletion). Append-only guarantee covered by tests.
  const history = [...sorted].reverse().map(s => ({
    verdict: scoreToVerdict(s.overallScore),
    score: s.overallScore,
    date: s.date,
    sessionId: s.sessionId,
  }))

  const current = sorted.length > 0
    ? scoreToVerdict(sorted[sorted.length - 1].overallScore)
    : "No sessions yet"

  const companiesCount = new Set(snapshots.map(s => s.company.toLowerCase().trim())).size

  return {
    trendsByCriterion,
    stageVariance: { recruiterScreen, hiringManager, portfolioReview, flag },
    overallTrend,
    topStrength,
    topWeakness,
    readinessVerdict: { current, history },
    sessionCount: snapshots.length,
    companiesCount,
  }
}

export { CRITERION_LABEL }
export type { Criterion }
