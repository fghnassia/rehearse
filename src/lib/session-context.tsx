"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { SessionState, SetupData, ContextData, ResearchData, SimulationData, ReportData } from "./session-types"

const SESSION_KEY = "rehearse-session"

interface SessionContextValue {
  session: SessionState
  updateSetup: (data: SetupData) => void
  updateContext: (data: ContextData) => void
  updateResearch: (data: ResearchData) => void
  updateSimulation: (data: SimulationData) => void
  updateReport: (data: ReportData) => void
  clearSession: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({})

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) setSession(JSON.parse(stored))
    } catch {
      // sessionStorage unavailable or corrupt — start fresh
    }
  }, [])

  const persist = useCallback((next: SessionState) => {
    setSession(next)
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      // sessionStorage full or unavailable — session lives in memory only
    }
  }, [])

  const updateSetup = useCallback((data: SetupData) => {
    setSession(prev => {
      const next = { ...prev, setup: data }
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const updateContext = useCallback((data: ContextData) => {
    setSession(prev => {
      const next = { ...prev, context: data }
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const updateResearch = useCallback((data: ResearchData) => {
    setSession(prev => {
      const next = { ...prev, research: data }
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const updateSimulation = useCallback((data: SimulationData) => {
    setSession(prev => {
      const next = { ...prev, simulation: data }
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const updateReport = useCallback((data: ReportData) => {
    setSession(prev => {
      const next = { ...prev, report: data }
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const clearSession = useCallback(() => {
    persist({})
  }, [persist])

  return (
    <SessionContext.Provider value={{ session, updateSetup, updateContext, updateResearch, updateSimulation, updateReport, clearSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used inside SessionProvider")
  return ctx
}
