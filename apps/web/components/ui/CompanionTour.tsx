'use client'
import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function CompanionTour() {
  useEffect(() => {
    const done = localStorage.getItem('bb_companion_tour_done')
    if (done) return

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(7,9,15,0.85)',
      stagePadding: 8,
      stageRadius: 12,
      steps: [
        { popover: { title: 'Welcome to BlushBite ✨', description: 'This is your companion dashboard. Let us show you around — takes 30 seconds.', align: 'center' } },
        { element: '#profile-completeness', popover: { title: 'Complete your profile', description: "Fill in your details to unlock your profile for dreamers. They can't see you until it's done.", side: 'bottom' } },
        { element: '#quick-actions', popover: { title: 'Post your first content', description: 'Write a confession or story. This is what dreamers discover before finding you.', side: 'top' } },
        { element: '[data-tour="mode-toggle"]', popover: { title: 'Browse like a dreamer', description: 'Switch to Browse mode to scroll through the dreamer feed and link your profile to stories you relate with.', side: 'bottom' } },
        { element: '#bridge-section', popover: { title: 'The Bridge feature', description: 'When your profile is linked to a story, it appears at the bottom as a gateway. This is how most bookings start.', side: 'top' } },
      ],
      onDestroyStarted: () => {
        localStorage.setItem('bb_companion_tour_done', 'true')
        driverObj.destroy()
      },
    })

    setTimeout(() => driverObj.drive(), 1500)
  }, [])

  return null
}
