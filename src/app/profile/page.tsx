"use client"

import { useEffect, useState } from "react"
import { getLocalProfile } from "@/lib/local-profile"
import { computeProfileSynthesis, CRITERION_LABEL } from "@/lib/profile-synthesis"
import type {
  LocalProfileData,
  ProfileSynthesis,
  CriterionTrend,
  ScoreSnapshot,
} from "@/lib/session-types"

type Criterion = keyof ProfileSynthesis['trendsByCriterion']

// ─── helpers ─────────────────────────────────────────────────────────────────

const stageOrder = ['recruiter', 'hiring_manager', 'portfolio_review'] as const
type StageKey = typeof stageOrder[number]

const stageLabel: Record<StageKey, string> = {
  recruiter: 'Recruiter',
  hiring_manager: 'Hiring Mgr',
  portfolio_review: 'Portfolio',
}

type StageCell = { score: number; prevScore: number | null; date: string } | null

interface RoleGroup {
  role: string
  lastActive: string
  sessionCount: number
  stages: Record<StageKey, StageCell>
}

interface CompanyGroup {
  company: string
  lastActive: string
  roles: RoleGroup[]
}

const ROLE_FALLBACK = "Role not recorded"

// Group snapshots by company, then by role within each company — so the same
// company appears once with each distinct role they've practised for as an
// expandable track. Delta is computed per company+role+stage.
function groupSnapshotsByCompany(snapshots: ScoreSnapshot[]): CompanyGroup[] {
  const companyMap = new Map<string, { name: string; roles: Map<string, RoleGroup> }>()

  for (const snap of snapshots) {
    const companyKey = snap.company.toLowerCase().trim()
    const roleKey = (snap.role ?? ROLE_FALLBACK).toLowerCase().trim()

    if (!companyMap.has(companyKey)) companyMap.set(companyKey, { name: snap.company, roles: new Map() })
    const roleMap = companyMap.get(companyKey)!.roles

    if (!roleMap.has(roleKey)) {
      roleMap.set(roleKey, {
        role: snap.role ?? ROLE_FALLBACK,
        lastActive: snap.date,
        sessionCount: 0,
        stages: { recruiter: null, hiring_manager: null, portfolio_review: null },
      })
    }
    const group = roleMap.get(roleKey)!
    group.sessionCount++

    const existing = group.stages[snap.stage]
    if (!existing || new Date(snap.date) > new Date(existing.date)) {
      group.stages[snap.stage] = { score: snap.overallScore, prevScore: null, date: snap.date }
    }
    if (new Date(snap.date) > new Date(group.lastActive)) {
      group.lastActive = snap.date
    }
  }

  // Compute prev score (delta) per company+role+stage
  for (const [companyKey, { roles: roleMap }] of companyMap) {
    for (const [roleKey, group] of roleMap) {
      for (const stageKey of stageOrder) {
        const current = group.stages[stageKey]
        if (!current) continue
        const history = snapshots
          .filter(s =>
            s.company.toLowerCase().trim() === companyKey &&
            (s.role ?? ROLE_FALLBACK).toLowerCase().trim() === roleKey &&
            s.stage === stageKey
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        if (history.length >= 2) {
          current.prevScore = history[history.length - 2].overallScore
        }
      }
    }
  }

  const companies: CompanyGroup[] = Array.from(companyMap.values()).map(({ name, roles: roleMap }) => {
    const roles = Array.from(roleMap.values()).sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    )
    return {
      company: name,
      lastActive: roles[0].lastActive,
      roles,
    }
  })

  return companies.sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  )
}

function trendArrow(direction: CriterionTrend['direction']): string {
  return direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'
}

function trendColor(direction: CriterionTrend['direction']): string {
  return direction === 'up'
    ? 'text-[var(--state-positive-foreground)]'
    : direction === 'down'
    ? 'text-[var(--state-negative-foreground)]'
    : 'text-muted-foreground'
}

function getHeadlineTrend(synthesis: ProfileSynthesis): string {
  if (synthesis.sessionCount < 2) return ''

  if (synthesis.stageVariance.flag) {
    return synthesis.stageVariance.flag
  }

  const criterionTrends = synthesis.trendsByCriterion
  const highConfidence = (Object.keys(criterionTrends) as Criterion[]).find(
    c => criterionTrends[c].confidence === 'high'
  )

  if (highConfidence && synthesis.topStrength) {
    const strengthTrend = criterionTrends[synthesis.topStrength as Criterion]
    const weaknessTrend = synthesis.topWeakness
      ? criterionTrends[synthesis.topWeakness as Criterion]
      : null

    if (weaknessTrend && weaknessTrend.direction === 'down') {
      return `${CRITERION_LABEL[synthesis.topWeakness as Criterion]} is your main area to work on across sessions.`
    }
    if (strengthTrend.direction === 'up') {
      return `${CRITERION_LABEL[synthesis.topStrength as Criterion]} is your strongest and trending up.`
    }
    return `${CRITERION_LABEL[synthesis.topStrength as Criterion]} is your most consistent strength.`
  }

  return `${synthesis.sessionCount} session${synthesis.sessionCount !== 1 ? 's' : ''} completed · more data needed for trends.`
}

const verdictBg: Record<string, string> = {
  "Strong performance": "bg-[var(--state-positive)] text-[var(--state-positive-foreground)]",
  "Solid with gaps":    "bg-[var(--state-warning)] text-[var(--state-warning-foreground)]",
  "Needs more prep":    "bg-[var(--state-negative)] text-[var(--state-negative-foreground)]",
}

// ─── component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<LocalProfileData | null>(null)
  const [mounted, setMounted] = useState(false)
  const [tier3Open, setTier3Open] = useState(false)
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({})

  const toggleRole = (key: string) =>
    setExpandedRoles(prev => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    setProfile(getLocalProfile())
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <main className="min-h-screen flex flex-col">
        <div className="w-full h-px bg-foreground/10" />
        <div className="flex items-center justify-between px-8 py-5">
          <a href="/" className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">Rehearse</a>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-sans text-sm text-muted-foreground animate-pulse">Loading…</p>
        </div>
      </main>
    )
  }

  const snapshots = profile?.scoreSnapshots ?? []
  const identity = profile?.inferredIdentity ?? null
  const synthesis = computeProfileSynthesis(snapshots)
  const groups = groupSnapshotsByCompany(snapshots)
  const headline = getHeadlineTrend(synthesis)
  const hasData = synthesis.sessionCount >= 2

  return (
    <main className="min-h-screen flex flex-col">
      <div className="w-full h-px bg-foreground/10" />

      {/* Nav */}
      <div className="flex items-center justify-between px-8 py-5">
        <a href="/" className="text-xs font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">
          Rehearse
        </a>
        <a href="/sessions" className="text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
          All sessions →
        </a>
      </div>

      <div className="flex-1 px-8 max-w-3xl mx-auto w-full py-12">

        {/* ── TIER 1 ── */}
        <div className="mb-12">
          <p className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground mb-4">
            Candidate profile
          </p>

          {identity ? (
            <p className="font-sans text-sm text-foreground mb-4">
              {identity.role} · {identity.seniority} · {identity.targetField}
            </p>
          ) : (
            <p className="font-sans text-sm text-muted-foreground mb-4">
              Complete your first session to build your profile.
            </p>
          )}

          {hasData && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className={`font-sans text-xs font-medium tracking-[0.1em] uppercase px-2.5 py-1 rounded ${verdictBg[synthesis.readinessVerdict.current] ?? "bg-muted text-muted-foreground"}`}>
                  {synthesis.readinessVerdict.current}
                </span>
                {synthesis.overallTrend.latestScore > 0 && (
                  <span className="font-heading text-2xl font-light">
                    {synthesis.overallTrend.latestScore}
                    <span className="font-sans text-sm text-muted-foreground">/10</span>
                  </span>
                )}
              </div>

              {headline && (
                <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-md">
                  {headline}
                </p>
              )}
            </>
          )}

          {synthesis.sessionCount === 1 && (
            <p className="font-sans text-xs text-muted-foreground mt-3">
              Run at least 2 sessions to start seeing trends.
            </p>
          )}

          {synthesis.sessionCount === 0 && (
            <div className="mt-4">
              <a
                href="/setup"
                className="font-sans text-xs tracking-[0.08em] uppercase border border-border rounded px-4 py-2 hover:border-foreground/40 transition-colors inline-block"
              >
                Start a session →
              </a>
            </div>
          )}
        </div>

        {/* ── TIER 2 — company/stage grid ── */}
        {groups.length > 0 && (
          <div className="mb-12">
            <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Company history
            </p>

            <div className="flex flex-col gap-6">
              {groups.map(group => (
                <div key={group.company} className="border border-border rounded overflow-hidden">
                  {/* Company header */}
                  <div className="px-5 py-4 border-b border-border/60 flex items-baseline justify-between">
                    <p className="font-sans text-sm font-medium text-foreground">{group.company}</p>
                    <p className="font-sans text-xs text-muted-foreground/60">
                      {new Date(group.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>

                  {/* Roles — each an expandable track */}
                  {group.roles.map((roleGroup, ri) => {
                    const roleKey = `${group.company}|${roleGroup.role}`
                    const singleRole = group.roles.length === 1
                    const expanded = expandedRoles[roleKey] ?? singleRole
                    const isLastRole = ri === group.roles.length - 1

                    return (
                      <div key={roleKey} className={!isLastRole ? "border-b border-border/60" : ""}>
                        {/* Role row — toggle */}
                        <button
                          onClick={() => toggleRole(roleKey)}
                          className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-muted/10 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-sans text-xs text-muted-foreground/50 w-3 shrink-0">{expanded ? "▾" : "▸"}</span>
                            <span className="font-sans text-sm text-foreground truncate">{roleGroup.role}</span>
                          </div>
                          <span className="font-sans text-xs text-muted-foreground/60 shrink-0 ml-3">
                            {roleGroup.sessionCount} session{roleGroup.sessionCount !== 1 ? "s" : ""}
                          </span>
                        </button>

                        {/* Stage rows — indented under the role */}
                        {expanded && (
                          <div className="pb-1">
                            {stageOrder.map((stage, i) => {
                              const s = roleGroup.stages[stage]
                              const isLast = i === stageOrder.length - 1

                              if (!s) {
                                return (
                                  <div key={stage} className={`pl-10 pr-5 py-2.5 flex items-center justify-between ${!isLast ? "border-b border-border/30" : ""}`}>
                                    <div className="flex items-center gap-3">
                                      <span className="font-sans text-xs text-muted-foreground/40 w-20">{stageLabel[stage]}</span>
                                      <span className="font-sans text-xs text-muted-foreground/30">not started</span>
                                    </div>
                                    <a href="/setup" className="font-sans text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                      Start →
                                    </a>
                                  </div>
                                )
                              }

                              const delta = s.prevScore !== null
                                ? Math.round((s.score - s.prevScore) * 10) / 10
                                : null

                              return (
                                <div key={stage} className={`pl-10 pr-5 py-2.5 flex items-center justify-between ${!isLast ? "border-b border-border/30" : ""}`}>
                                  <div className="flex items-center gap-3">
                                    <span className="font-sans text-xs text-muted-foreground w-20 shrink-0">{stageLabel[stage]}</span>
                                    <span className="font-sans text-sm text-foreground">{s.score}</span>
                                    {delta !== null && (
                                      <span className={`font-sans text-xs ${delta >= 0 ? "text-[var(--state-positive-foreground)]" : "text-[var(--state-negative-foreground)]"}`}>
                                        {delta >= 0 ? `+${delta}` : delta}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TIER 3 — criterion breakdown + verdict history ── */}
        {hasData && (
          <div className="border-t border-border/40 pt-6">
            <button
              onClick={() => setTier3Open(o => !o)}
              className="font-sans text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              {tier3Open ? "Hide analysis ↑" : "Show analysis ↓"}
            </button>

            {tier3Open && (
              <div className="mt-8 flex flex-col gap-10">

                {/* Per-criterion breakdown */}
                <div>
                  <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                    Criterion breakdown
                  </p>
                  <div className="flex flex-col gap-2">
                    {(Object.keys(synthesis.trendsByCriterion) as Criterion[]).map(c => {
                      const trend = synthesis.trendsByCriterion[c]
                      return (
                        <div key={c} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className={`font-sans text-sm ${trendColor(trend.direction)}`}>
                              {trendArrow(trend.direction)}
                            </span>
                            <span className="font-sans text-sm text-foreground">{CRITERION_LABEL[c]}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-sans text-xs text-muted-foreground/60">
                              {trend.confidence} confidence · {trend.sampleSize} session{trend.sampleSize !== 1 ? 's' : ''}
                            </span>
                            <span className="font-sans text-sm text-foreground w-8 text-right">
                              {trend.latestScore.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Verdict history */}
                <div>
                  <p className="font-sans text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                    Readiness over time
                  </p>
                  <div className="flex flex-col gap-3">
                    {synthesis.readinessVerdict.history.map((entry, i) => (
                      <div key={entry.sessionId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {i === 0 && (
                            <span className="font-sans text-[10px] tracking-[0.08em] uppercase text-muted-foreground/60 mr-1">
                              latest
                            </span>
                          )}
                          <span className={`font-sans text-xs font-medium tracking-[0.08em] uppercase px-2 py-0.5 rounded ${verdictBg[entry.verdict] ?? "bg-muted text-muted-foreground"}`}>
                            {entry.verdict}
                          </span>
                          <span className="font-sans text-sm text-foreground">{entry.score}</span>
                        </div>
                        <span className="font-sans text-xs text-muted-foreground/60">
                          {new Date(entry.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-12 pt-6 border-t border-border flex items-center gap-4">
          <a href="/sessions" className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Full session history
          </a>
          <a href="/setup" className="font-sans text-xs tracking-[0.08em] uppercase border border-border rounded px-4 py-2 hover:border-foreground/40 transition-colors">
            New session →
          </a>
        </div>

      </div>

      <div className="w-full h-px bg-foreground/10 mt-auto" />
      <div className="px-8 py-4">
        <p className="text-xs text-muted-foreground font-sans">Rehearse · Candidate profile</p>
      </div>
    </main>
  )
}
