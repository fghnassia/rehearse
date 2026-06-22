"use client"

import { useState, useEffect, useCallback } from "react"
import { themes, DEFAULT_THEME_ID, type Theme } from "@/lib/themes"

const STORAGE_KEY = "rehearse_theme"

function applyTheme(theme: Theme) {
  const root = document.documentElement
  for (const [name, value] of Object.entries(theme.vars)) {
    root.style.setProperty(name, value)
  }
}

// Reads the saved theme on mount, applies its CSS variables to
// document.documentElement, and exposes { theme, setTheme, themes }.
// The default :root already equals Ground, so Ground users see no flash;
// other themes apply once on mount.
export function useTheme() {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID)

  useEffect(() => {
    let stored: string | null = null
    try { stored = localStorage.getItem(STORAGE_KEY) } catch {}
    const initial = themes.find(t => t.id === stored) ?? themes.find(t => t.id === DEFAULT_THEME_ID)!
    setThemeId(initial.id)
    applyTheme(initial)
  }, [])

  const setTheme = useCallback((id: string) => {
    const next = themes.find(t => t.id === id)
    if (!next) return
    applyTheme(next)
    setThemeId(next.id)
    try { localStorage.setItem(STORAGE_KEY, next.id) } catch {}
  }, [])

  const theme = themes.find(t => t.id === themeId) ?? themes[0]
  return { theme, setTheme, themes }
}
