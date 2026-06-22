export type InterviewStage = 'recruiter' | 'hiring-manager' | 'portfolio-review'
export type CoverageLevel = 'rich' | 'sparse' | 'none'
export type ScoreLevel = 'strong' | 'moderate' | 'weak'

export interface SetupData {
  resumeText: string
  resumeFileName?: string
  portfolioUrl: string
  jobPostingUrl: string
  stage: InterviewStage
}

export interface ResearchSource {
  title: string
  url: string
  snippet: string
  source?: string
  userAdded?: boolean
}

export interface ResearchData {
  companyName: string
  roleTitle: string
  coverageLevel: CoverageLevel
  sourceCount: number
  sources: ResearchSource[]
  insights: string
  synthesizedTakeaways?: string[]
  disclaimer?: string
}

export interface InferredIdentity {
  role: string
  seniority: string
  targetField: string
  experienceSummary: string
  lastUpdated: string
}

export interface CompanyResearchSummary {
  companyName: string
  synthesizedTakeaways: string[]
  sourceCount: number
  researchedAt: string
}

export interface ScoreSnapshot {
  sessionId: string
  company: string
  role?: string
  stage: 'recruiter' | 'hiring_manager' | 'portfolio_review'
  date: string
  overallScore: number
  criteriaScores: {
    structure: number
    specificity: number
    relevance: number
    communication: number
    aiFluency: number
  }
  // Questions asked in this session — persisted so a later session for the same
  // company can avoid repeating topics (cross-session question awareness).
  questions?: string[]
}

// Built client-side from prior ScoreSnapshots for the same company, then passed
// to the stateless generate-questions API so Claude can target weak areas and
// avoid repeating prior topics. Never read from storage server-side.
export interface PriorSessionContext {
  company: string
  sessionCount: number
  weakestCriteria: string[]   // top 2 lowest-avg criterion names
  coveredTopics: string[]     // prior question texts to avoid repeating, max 8
  lastStage: string           // most recent stage completed for this company
}

export interface LocalProfileData {
  profileId: string
  inferredIdentity?: InferredIdentity
  researchSummaries: Record<string, CompanyResearchSummary>
  scoreSnapshots: ScoreSnapshot[]
}

export interface QAPair {
  questionId: string
  questionText: string
  userAnswer: string
  status?: 'answered' | 'skipped'
  skipped?: boolean
  // Populated at report time, not during simulation
  scores?: Array<{
    criterion: string
    level: ScoreLevel
    rationale: string
  }>
  whatWorked?: string
  whatToImprove?: string
  sampleAnswer?: string
}

export interface SimulationData {
  personaName: string
  personaRole: string
  behaviorNote: string
  questions: string[]
  answers: QAPair[]
  skippedQuestions?: Array<{ questionId: string; questionText: string }>
}

export interface ReportData {
  overallImpressionLevel: ScoreLevel
  overallImpressionSummary: string
  generatedAt: string
}

export interface JobInsight {
  category: string
  points: string[]
}

export interface ResumeProfile {
  title: string        // current/most recent role + company
  experience: string   // years of experience + seniority level
  highlight: string    // quantified impact if present, otherwise key skills/domains
}

export interface ContextData {
  companyName: string
  roleTitle: string
  logoUrl?: string
  portfolioOgImage?: string
  jobInsights: JobInsight[]
  resumeProfile: ResumeProfile
  jobDescriptionOverride?: string
}

export interface SessionState {
  setup?: SetupData
  context?: ContextData
  research?: ResearchData
  simulation?: SimulationData
  report?: ReportData
}

export interface CriterionTrend {
  direction: 'up' | 'down' | 'flat'
  confidence: 'low' | 'medium' | 'high'
  sampleSize: number
  latestScore: number
  delta: number | null
}

export interface StageVariance {
  recruiterScreen: number | null
  hiringManager: number | null
  portfolioReview: number | null
  flag: string | null
}

export interface VerdictHistoryEntry {
  verdict: string
  score: number
  date: string
  sessionId: string
}

export interface ProfileSynthesis {
  trendsByCriterion: {
    structure: CriterionTrend
    specificity: CriterionTrend
    relevance: CriterionTrend
    communication: CriterionTrend
    aiFluency: CriterionTrend
  }
  stageVariance: StageVariance
  overallTrend: CriterionTrend
  topStrength: string | null
  topWeakness: string | null
  readinessVerdict: {
    current: string
    history: VerdictHistoryEntry[]
  }
  sessionCount: number
  companiesCount: number
}
