'use client'

import { motion } from 'framer-motion'
import { LayoutDashboard, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCompanionMode } from '@/hooks/useCompanionMode'

export function CompanionModeToggle() {
  const router = useRouter()
  const { isCreator, toggleMode } = useCompanionMode()

  const handleClick = () => {
    toggleMode()
    if (isCreator) {
      router.push('/')
    } else {
      router.push('/companion/dashboard')
    }
  }

  return (
    <motion.button
      data-tour="mode-toggle"
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2 cursor-pointer"
      style={{
        position: 'fixed',
        top: 64,
        right: 16,
        zIndex: 900,
        background: '#111620',
        border: '1px solid #1c2333',
        borderRadius: 999,
        padding: '8px 16px',
        minHeight: 44,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {isCreator ? (
        <>
          <LayoutDashboard size={14} color="#e8607a" />
          <span style={{ fontSize: 12, color: '#e8607a', fontWeight: 500, whiteSpace: 'nowrap' }}>Creator</span>
        </>
      ) : (
        <>
          <Eye size={14} color="#6b7280" />
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>Browsing</span>
        </>
      )}
    </motion.button>
  )
}
