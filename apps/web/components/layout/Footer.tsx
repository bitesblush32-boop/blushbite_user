'use client'

import React from 'react'

export default function Footer() {
  return (
    <footer className="mt-16 pt-8 pb-24 sm:pb-8 border-t border-[#1c2333]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Original links */}
          <div className="flex gap-4 sm:gap-6 flex-wrap justify-center sm:justify-start">
            {[
              'Safety & Consent',
              'Privacy & Anonymity',
              'Legal information',
              'Report an issue',
            ].map((label) => (
              <span
                key={label}
                className="text-[12px] text-[#6b7280] cursor-pointer transition-colors duration-150 hover:text-[#eeeef0]"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Original feature badges */}
          <div className="flex gap-3 sm:gap-4 flex-wrap justify-center text-[12px] text-[#6b7280]">
            <span>🔒 Anonymous IDs</span>
            <span>✦ Clear consent &amp; boundaries</span>
            <span>💳 Transparent pricing</span>
          </div>
        </div>

        {/* Original copyright notice */}
        <p className="text-[11px] text-[#6b7280] mt-5 text-center sm:text-left" style={{ opacity: 0.5 }}>
          © {new Date().getFullYear()} BlushBite · All companions verified · 18+
        </p>
      </div>
    </footer>
  )
}
