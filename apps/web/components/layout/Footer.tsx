'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, Sparkles, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 pt-12 pb-24 sm:pb-10 border-t border-[#1c2333] bg-[#07090f]/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Brand & Slogan Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-[#1c2333]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[20px] font-bold text-[#eeeef0] tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Blush<span className="text-[#e8607a]">Bite</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8607a]/10 border border-[#e8607a]/30 text-[#e8607a] font-medium">
                18+ Adult Platform
              </span>
            </div>
            <p className="text-[12px] text-[#9ca3af] max-w-[420px]">
              A private desire engine &amp; erotic narrative platform. EU-hosted, 100% anonymous, strictly private companion discovery.
            </p>
          </div>

          {/* Quick Trust Badges */}
          <div className="flex items-center gap-3 flex-wrap text-[11.5px] text-[#9ca3af]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111620] border border-[#1c2333]">
              <Lock size={13} className="text-[#e8607a]" />
              <span>Anonymous Alias System</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111620] border border-[#1c2333]">
              <ShieldCheck size={13} className="text-[#e8607a]" />
              <span>Verified Identity</span>
            </div>
          </div>
        </div>

        {/* Navigation Grid (2-cols on mobile, 4-cols on sm+) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-10">
          {/* Column 1: Platform */}
          <div>
            <div className="text-[11px] font-semibold text-[#eeeef0] uppercase tracking-wider mb-3">
              Platform
            </div>
            <ul className="space-y-2 text-[12.5px] text-[#9ca3af]">
              <li>
                <Link href="/companions" className="hover:text-[#e8607a] transition-colors">
                  Browse Companions
                </Link>
              </li>
              <li>
                <Link href="/stories" className="hover:text-[#e8607a] transition-colors">
                  Intimate Stories
                </Link>
              </li>
              <li>
                <Link href="/confessions" className="hover:text-[#e8607a] transition-colors">
                  Private Confessions
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-[#e8607a] transition-colors">
                  Share Confession
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Communities */}
          <div>
            <div className="text-[11px] font-semibold text-[#eeeef0] uppercase tracking-wider mb-3">
              Communities
            </div>
            <ul className="space-y-2 text-[12.5px] text-[#9ca3af]">
              <li>
                <Link href="/female" className="hover:text-[#e8607a] transition-colors">
                  Female Companions
                </Link>
              </li>
              <li>
                <Link href="/male" className="hover:text-[#60a5fa] transition-colors">
                  Men Companions
                </Link>
              </li>
              <li>
                <Link href="/shemale" className="hover:text-[#c084fc] transition-colors">
                  Trans &amp; TS Companions
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="hover:text-[#c9a96e] transition-colors flex items-center gap-1">
                  <span>Advertise &amp; Boost</span>
                  <Sparkles size={11} className="text-[#c9a96e]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Safety */}
          <div>
            <div className="text-[11px] font-semibold text-[#eeeef0] uppercase tracking-wider mb-3">
              Legal &amp; Trust
            </div>
            <ul className="space-y-2 text-[12.5px] text-[#9ca3af]">
              <li>
                <Link href="/privacy" className="hover:text-[#eeeef0] transition-colors">
                  Privacy Policy &amp; GDPR
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#eeeef0] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="hover:text-[#eeeef0] cursor-pointer transition-colors">
                  Safety &amp; Consent Standard
                </span>
              </li>
              <li>
                <span className="hover:text-[#eeeef0] cursor-pointer transition-colors">
                  Report Content
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Ethics & Guarantee */}
          <div>
            <div className="text-[11px] font-semibold text-[#eeeef0] uppercase tracking-wider mb-3">
              Our Principles
            </div>
            <p className="text-[12px] text-[#6b7280] leading-relaxed mb-3">
              Strictly 18+ adult environment. Every user is anonymous under an alias tag. All content is consensually submitted.
            </p>
            <div className="text-[11px] text-[#e8607a] flex items-center gap-1 font-medium">
              <Heart size={12} className="fill-[#e8607a]" />
              <span>Sex-positive &amp; shame-free platform</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-6 border-t border-[#1c2333]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px] text-[#6b7280] text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} BlushBite · All companion profiles ID verified · Strictly 18+
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>EU Hosted (Netherlands)</span>
            <span>·</span>
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
