"use client"

import { useState, useRef, useEffect } from "react"
import { useTheme } from "@/lib/hooks/use-theme"

// Low-weight floating pill, bottom-right. Shows the current theme name in the
// product's type style; clicking opens a compact popover of the 5 theme names.
// Selecting one applies it immediately and closes; clicking outside also closes.
// Lives only on / and /report — never inside the interview flow.
export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="absolute bottom-full right-0 mb-2 min-w-[8.5rem] rounded-lg border border-border bg-popover py-1 shadow-lg">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false) }}
              className={`block w-full px-3 py-1.5 text-left font-sans text-xs transition-colors hover:bg-muted ${
                t.id === theme.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Change theme"
        className="rounded-full border border-border bg-background/70 px-3.5 py-1.5 font-sans text-xs text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        {theme.name}
      </button>
    </div>
  )
}
