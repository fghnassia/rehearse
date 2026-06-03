export type InterviewStage = 'recruiter' | 'hiring-manager' | 'portfolio-review'
export type CoverageLevel = 'rich' | 'sparse' | 'none'
export type ScoreLevel = 'strong' | 'moderate' | 'weak'

export interface SetupData {
  resumeText: string
  portfolioUrl: string
  jobPostingUrl: string
  stage: InterviewStage
}

export interface ResearchSource {
  title: string
  url: string
  snippet: string
  source?: string
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

export interface ContextData {
  companyName: string
  roleTitle: string
  logoUrl?: string
  jobInsights: JobInsight[]
  resumeBullets: string[]
}

export interface SessionState {
  setup?: SetupData
  context?: ContextData
  research?: ResearchData
  simulation?: SimulationData
  report?: ReportData
}
