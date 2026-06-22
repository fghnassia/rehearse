import { test } from "node:test"
import assert from "node:assert/strict"
import { computeProfileSynthesis } from "../profile-synthesis.ts"
import type { ScoreSnapshot } from "../session-types.ts"

// Run with: npm test   (Node's built-in runner, native TS type-stripping)

const mockSnapshots: ScoreSnapshot[] = [
  {
    sessionId: "session-1",
    company: "Stripe",
    stage: "recruiter",
    date: "2026-06-01T10:00:00Z",
    overallScore: 6.2,
    criteriaScores: {
      structure: 2, specificity: 1, relevance: 2,
      communication: 2, aiFluency: 1,
    },
  },
  {
    sessionId: "session-2",
    company: "Stripe",
    stage: "hiring_manager",
    date: "2026-06-10T10:00:00Z",
    overallScore: 7.8,
    criteriaScores: {
      structure: 2, specificity: 2, relevance: 3,
      communication: 3, aiFluency: 2,
    },
  },
  {
    sessionId: "session-3",
    company: "Mercury",
    stage: "hiring_manager",
    date: "2026-06-18T10:00:00Z",
    overallScore: 8.4,
    criteriaScores: {
      structure: 3, specificity: 3, relevance: 3,
      communication: 3, aiFluency: 2,
    },
  },
]

// ── 1. Overall trend direction ───────────────────────────────────────────────
test("1. overallTrend.direction === 'up' (6.2 → 8.4, delta > 0.3)", () => {
  const s = computeProfileSynthesis(mockSnapshots)
  assert.equal(s.overallTrend.direction, "up")
})

// ── 2. Overall trend delta present ───────────────────────────────────────────
test("2. overallTrend.delta is not null with multiple snapshots", () => {
  const s = computeProfileSynthesis(mockSnapshots)
  assert.notEqual(s.overallTrend.delta, null)
  assert.equal(s.overallTrend.delta, 2.2) // round((8.4 - 6.2) * 10) / 10
})

// ── 3. Top strength present with ≥2 sessions ─────────────────────────────────
test("3. topStrength is not null (3 sessions exist)", () => {
  const s = computeProfileSynthesis(mockSnapshots)
  assert.notEqual(s.topStrength, null)
})

// ── 4. Top weakness present with ≥2 sessions ─────────────────────────────────
test("4. topWeakness is not null (3 sessions exist)", () => {
  const s = computeProfileSynthesis(mockSnapshots)
  assert.notEqual(s.topWeakness, null)
})

// ── 5. Recruiter stage average ───────────────────────────────────────────────
test("5. stageVariance.recruiterScreen ≈ 6.2", () => {
  const s = computeProfileSynthesis(mockSnapshots)
  assert.notEqual(s.stageVariance.recruiterScreen, null)
  assert.ok(
    Math.abs((s.stageVariance.recruiterScreen as number) - 6.2) < 0.001,
    `expected ≈ 6.2, got ${s.stageVariance.recruiterScreen}`,
  )
})

// ── 6. Hiring-manager stage average ──────────────────────────────────────────
test("6. stageVariance.hiringManager ≈ 8.1 (avg of 7.8 and 8.4)", () => {
  const s = computeProfileSynthesis(mockSnapshots)
  assert.notEqual(s.stageVariance.hiringManager, null)
  assert.ok(
    Math.abs((s.stageVariance.hiringManager as number) - 8.1) < 0.001,
    `expected ≈ 8.1, got ${s.stageVariance.hiringManager}`,
  )
})

// ── 7. Single-snapshot edge case ─────────────────────────────────────────────
test("7. single snapshot: delta null, topStrength null, topWeakness null", () => {
  const s = computeProfileSynthesis([mockSnapshots[0]])
  assert.equal(s.overallTrend.delta, null)
  assert.equal(s.topStrength, null)
  assert.equal(s.topWeakness, null)
})

// ── 8. Verdict history is append-only / lossless ─────────────────────────────
//
// NOTE ON THE ASSERTION AS WORDED:
// The production signature is computeProfileSynthesis(snapshots) — it does NOT
// take an existing history array as input. The verdict history is a pure,
// deterministic projection of the append-only `snapshots` array (one entry per
// snapshot, most-recent-first). Append-only-ness is therefore guaranteed
// structurally: snapshots only ever grow (appendScoreSnapshot never mutates or
// removes), so the derived history only ever grows too. The tests below prove
// that real property directly: adding a snapshot only appends — prior entries
// are never dropped or rewritten.
test("8a. history has exactly one entry per snapshot — nothing lost", () => {
  const s = computeProfileSynthesis(mockSnapshots)
  assert.equal(s.readinessVerdict.history.length, mockSnapshots.length)
  const ids = new Set(s.readinessVerdict.history.map(h => h.sessionId))
  for (const snap of mockSnapshots) {
    assert.ok(ids.has(snap.sessionId), `missing history entry for ${snap.sessionId}`)
  }
})

test("8b. history is ordered most-recent-first", () => {
  const s = computeProfileSynthesis(mockSnapshots)
  const times = s.readinessVerdict.history.map(h => new Date(h.date).getTime())
  for (let i = 1; i < times.length; i++) {
    assert.ok(times[i - 1] >= times[i], "history not sorted most-recent-first")
  }
})

test("8c. appending a snapshot only appends — prior entries unchanged", () => {
  const before = computeProfileSynthesis(mockSnapshots)
  const newSnap: ScoreSnapshot = {
    ...mockSnapshots[2],
    sessionId: "session-4",
    date: "2026-06-25T10:00:00Z",
  }
  const after = computeProfileSynthesis([...mockSnapshots, newSnap])

  // exactly one new entry, prepended as the most recent
  assert.equal(after.readinessVerdict.history.length, before.readinessVerdict.history.length + 1)
  assert.equal(after.readinessVerdict.history[0].sessionId, "session-4")

  // every prior entry is still present and unmodified — none dropped or rewritten
  const afterById = new Map(after.readinessVerdict.history.map(h => [h.sessionId, h]))
  for (const prior of before.readinessVerdict.history) {
    const stillThere = afterById.get(prior.sessionId)
    assert.ok(stillThere, `prior entry ${prior.sessionId} was dropped`)
    assert.deepEqual(stillThere, prior, `prior entry ${prior.sessionId} was rewritten`)
  }
})
