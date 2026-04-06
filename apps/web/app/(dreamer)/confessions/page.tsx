'use client'

import { motion } from 'framer-motion'
import { ConfessionsFeed } from '@/components/ui/ConfessionsFeed'

export default function ConfessionsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ConfessionsFeed />
    </motion.div>
  )
}
