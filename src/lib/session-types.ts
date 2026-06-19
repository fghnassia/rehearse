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
  disclaimer?: string
}

export interface QAPair {
  questionId: string
  questionText: string
  userAnswer: string
  scores: Array<{
    criterion: string
    level: ScoreLevel
    rationale: string
  }>
  whatWorked: string
  whatToImprove: string
  sampleAnswer: string
}

export interface SimulationData {
  personaName: string
  personaRole: string
  behaviorNote: string
  questions: string[]
  answers: QAPair[]
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
