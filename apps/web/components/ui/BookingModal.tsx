'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

export default function BookingModal() {
  const { bookingModalOpen, closeBookingModal } = useUIStore()

  const [form, setForm] = useState({ dates: '', notes: '' })
  const [datesFocused, setDatesFocused] = useState(false)
  const [notesFocused, setNotesFocused] = useState(false)

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: '#161d2a',
    border: '1px solid #1c2333',
    borderRadius: '10px',
    fontSize: '13.5px',
    color: '#eeeef0',
    padding: '12px 16px',
    marginBottom: '16px',
    outline: 'none',
    display: 'block',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  return (
    <AnimatePresence>
      {bookingModalOpen && (
        <motion.div
          key="booking-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={closeBookingModal}
          className="fixed inset-0 flex items-center justify-center px-5"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 900,
          }}
        >
          <motion.div
            key="booking-modal"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full overflow-hidden"
            style={{
              maxWidth: '520px',
              background: '#0d1117',
              border: '1px solid #1c2333',
              borderRadius: '20px',
            }}
          >
            {/* Header */}
            <div className="p-7 pb-5 flex items-center justify-between border-b border-[#1c2333]">
              <div>
                <p className="text-[10px] text-[#e8607a] uppercase tracking-[0.1em] mb-1 font-medium">
                  Booking request
                </p>
                <h2
                  className="text-[22px] text-[#eeeef0]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Reserve your evening
                </h2>
              </div>

              {/* Close */}
              <button
                onClick={closeBookingModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6b7280] text-[18px] cursor-pointer transition-all duration-150 leading-none flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid #1c2333',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.color = '#eeeef0'
                  el.style.background = 'rgba(255,255,255,0.12)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.color = '#6b7280'
                  el.style.background = 'rgba(255,255,255,0.06)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-7">
              {/* Phase 1 info box */}
              <div
                style={{
                  background: 'rgba(201,169,110,0.08)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                }}
              >
                <p style={{ fontSize: '12px', color: '#c9a96e', lineHeight: '1.7' }}>
                  Booking is coming in Phase 2 with full payment integration. For now, leave your
                  preferred dates and we&apos;ll reach out via your anonymous alias.
                </p>
              </div>

              {/* Dates field */}
              <label
                className="text-[11.5px] text-[#6b7280] mb-2 block"
                htmlFor="booking-dates"
              >
                Preferred dates or window
              </label>
              <input
                id="booking-dates"
                type="text"
                placeholder="e.g. Next Friday evening, or 14–16 March"
                value={form.dates}
                onChange={(e) => setForm((f) => ({ ...f, dates: e.target.value }))}
                onFocus={() => setDatesFocused(true)}
                onBlur={() => setDatesFocused(false)}
                style={{
                  ...inputBase,
                  borderColor: datesFocused ? 'rgba(232,96,122,0.4)' : '#1c2333',
                  // placeholder color via CSS below
                } as React.CSSProperties}
                className="placeholder-[#6b7280]"
              />

              {/* Notes field */}
              <label
                className="text-[11.5px] text-[#6b7280] mb-2 block"
                htmlFor="booking-notes"
              >
                Anything you&apos;d like her to know
              </label>
              <textarea
                id="booking-notes"
                placeholder="Optional — shared only with the companion..."
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                style={{
                  ...inputBase,
                  borderColor: notesFocused ? 'rgba(232,96,122,0.4)' : '#1c2333',
                  resize: 'none',
                } as React.CSSProperties}
                className="placeholder-[#6b7280]"
              />

              {/* CTA */}
              <button className="btn-primary w-full" onClick={closeBookingModal}>
                Send request — we&apos;ll be in touch
              </button>

              <p
                className="text-center text-[11px] text-[#6b7280] mt-3"
                style={{ opacity: 0.7 }}
              >
                No payment taken now · Full Stripe integration in Phase 2
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
