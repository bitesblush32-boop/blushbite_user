'use client'
import { useState, useEffect } from 'react'

type CompanionMode = 'creator' | 'browse'

export function useCompanionMode() {
  const [mode, setMode] = useState<CompanionMode>('creator')

  useEffect(() => {
    const saved = localStorage.getItem('bb_companion_mode') as CompanionMode
    if (saved === 'creator' || saved === 'browse') setMode(saved)
  }, [])

  const toggleMode = () => {
    const next = mode === 'creator' ? 'browse' : 'creator'
    setMode(next)
    localStorage.setItem('bb_companion_mode', next)
  }

  return { mode, toggleMode, isCreator: mode === 'creator', isBrowse: mode === 'browse' }
}
