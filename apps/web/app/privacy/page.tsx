'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// ─── Section component ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2
        className="text-[22px] text-[#eeeef0] mb-4"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
      <div className="h-[1px] bg-[#1c2333] mb-6" />
      {children}
    </div>
  )
}

// ─── Body text helpers ────────────────────────────────────────────────────────

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] text-[#6b7280] leading-relaxed mb-4">
      {children}
    </p>
  )
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="text-[14px] text-[#6b7280] leading-relaxed mb-4 flex flex-col gap-[6px] pl-5">
      {items.map((item, i) => (
        <li key={i} className="list-disc">{item}</li>
      ))}
    </ul>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07090f] relative overflow-x-hidden">

      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient rose glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── Fixed header ──────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-[900] flex items-center justify-between px-5 md:px-10 h-[75px] border-b border-[#1c2333]"
        style={{ background: 'rgba(7,9,15,0.82)', backdropFilter: 'blur(20px)', willChange: 'transform' }}
      >
        <Link href="/auth/signin">
          <Image
            src="/logo_light.png"
            alt="BlushBite"
            width={110}
            height={44}
            style={{ objectFit: 'contain', objectPosition: 'left center' }}
            priority
          />
        </Link>

        <Link
          href="/auth/signin"
          className="flex items-center gap-2 text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-200"
        >
          <ArrowLeft size={15} />
          Back
        </Link>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-[860px] mx-auto px-5 md:px-10 pt-[95px] pb-20"
      >
        {/* Page headline */}
        <div className="mb-12">
          <p className="text-[11px] text-[#e8607a] uppercase tracking-[0.1em] mb-4 font-medium">
            Legal · Last updated March 2025
          </p>
          <h1
            className="text-[34px] text-[#eeeef0] leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Privacy Policy —{' '}
            <em style={{ fontStyle: 'italic', color: '#e8607a' }}>your privacy</em>{' '}
            matters.
          </h1>
          <p className="text-[14px] text-[#6b7280] leading-relaxed max-w-[640px]">
            BlushBite is built on the principle that desire is private. This policy explains what data we collect, why, and how it is protected.
          </p>
        </div>

        {/* 1. Who We Are */}
        <Section title="1. Who We Are">
          <P>
            BlushBite is operated by [Company Name], a company registered in the Netherlands. Our platform is EU-hosted and serves a global adult audience (18+). We are the data controller for personal data processed through this platform.
          </P>
          <P>
            For privacy enquiries, please contact us at:{' '}
            <span className="text-[#e8607a]">privacy@blushbite.co</span>
          </P>
        </Section>

        {/* 2. What Data We Collect */}
        <Section title="2. What Data We Collect">
          <UL items={[
            <><strong className="text-[#eeeef0] font-medium">Account data:</strong> Your email address and alias (an anonymised username automatically generated at signup — your real name is never used on the platform).</>,
            <><strong className="text-[#eeeef0] font-medium">Profile preferences:</strong> Gender, desired genders, and vibe preferences collected during onboarding. These are stored anonymously and used only for content personalisation.</>,
            <><strong className="text-[#eeeef0] font-medium">Identity verification data:</strong> Government-issued ID, selfie photograph, and liveness check data — collected and processed exclusively by our third-party verification provider, Persona (withpersona.com). BlushBite does not store raw identity documents on our servers.</>,
            <><strong className="text-[#eeeef0] font-medium">Usage data:</strong> Pages visited, feature interactions, and session length. Used for platform improvement only. Not sold or shared with advertisers.</>,
            <><strong className="text-[#eeeef0] font-medium">Communications:</strong> Any messages or support requests you send through the platform.</>,
          ]} />
        </Section>

        {/* 3. Why We Collect It */}
        <Section title="3. Why We Collect It">
          <UL items={[
            <>To verify companion identity and prevent fraud — legal basis: legitimate interest and legal obligation.</>,
            <>To provide personalised content discovery — legal basis: consent given via onboarding preferences.</>,
            <>To maintain platform safety and comply with applicable laws, including EU GDPR and Dutch law.</>,
            <>To process bookings and facilitate transactions between users and companions.</>,
          ]} />
        </Section>

        {/* 4. Third-Party Identity Verification */}
        <Section title="4. Third-Party Identity Verification (Persona)">
          <P>
            We use Persona Technologies Inc. (withpersona.com) to verify the identity of companions on our platform. When you submit identity verification, your government-issued ID and biometric data (selfie and liveness check) are transmitted directly to and processed by Persona under their own Privacy Policy, available at{' '}
            <span className="text-[#e8607a]">withpersona.com/legal/privacy-policy</span>.
          </P>
          <P>
            Persona acts as a data processor on our behalf under a Data Processing Agreement compliant with GDPR Article 28. Verification results (pass/fail status only) are returned to BlushBite. Raw documents are not stored by BlushBite.
          </P>
        </Section>

        {/* 5. Data Storage & Security */}
        <Section title="5. Data Storage & Security">
          <UL items={[
            <>All data stored on EU-based servers (Railway, Frankfurt region).</>,
            <>Passwords hashed with bcrypt at cost factor 12 — never stored in plain text.</>,
            <>All data in transit encrypted via TLS 1.2 or higher.</>,
            <>We do not sell personal data to third parties under any circumstances.</>,
          ]} />
        </Section>

        {/* 6. Your Rights (GDPR) */}
        <Section title="6. Your Rights (GDPR)">
          <P>
            As an EU data subject, you have the following rights under the General Data Protection Regulation:
          </P>
          <UL items={[
            <>Right of <strong className="text-[#eeeef0] font-medium">access</strong> — you may request a copy of the personal data we hold about you.</>,
            <>Right of <strong className="text-[#eeeef0] font-medium">rectification</strong> — you may ask us to correct inaccurate data.</>,
            <>Right of <strong className="text-[#eeeef0] font-medium">erasure</strong> ("right to be forgotten") — you may request deletion of your data.</>,
            <>Right to <strong className="text-[#eeeef0] font-medium">restriction of processing</strong> — you may ask us to limit how we use your data.</>,
            <>Right to <strong className="text-[#eeeef0] font-medium">data portability</strong> — you may request your data in a machine-readable format.</>,
            <>Right to <strong className="text-[#eeeef0] font-medium">object</strong> — you may object to processing based on legitimate interest.</>,
          ]} />
          <P>
            To exercise any of these rights, contact us at{' '}
            <span className="text-[#e8607a]">privacy@blushbite.co</span>.
            You may also lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens) at autoriteitpersoonsgegevens.nl.
          </P>
        </Section>

        {/* 7. Data Retention */}
        <Section title="7. Data Retention">
          <UL items={[
            <><strong className="text-[#eeeef0] font-medium">Active accounts:</strong> Data retained while your account is active.</>,
            <><strong className="text-[#eeeef0] font-medium">Verification records:</strong> Retained for legal compliance for 3 years post-verification.</>,
            <><strong className="text-[#eeeef0] font-medium">Deleted accounts:</strong> Anonymised within 30 days of a valid deletion request.</>,
          ]} />
        </Section>

        {/* 8. Cookies */}
        <Section title="8. Cookies">
          <P>
            We use strictly necessary session cookies only, required for authentication and maintaining your signed-in state. We do not use advertising cookies, third-party tracking cookies, or analytics cookies that identify you personally. No cookie consent banner is shown because we only set cookies that are technically essential.
          </P>
        </Section>

        {/* 9. Changes to This Policy */}
        <Section title="9. Changes to This Policy">
          <P>
            We will notify users of any material changes to this Privacy Policy via email or an in-platform notice. Continued use of BlushBite after 30 days of notification constitutes acceptance of the updated policy.
          </P>
        </Section>

        {/* Footer */}
        <div className="h-[1px] bg-[#1c2333] mb-8" />
        <p className="text-[12px] text-[#6b7280]" style={{ opacity: 0.5 }}>
          © 2025 BlushBite · EU-hosted · GDPR compliant ·{' '}
          <Link href="/terms" className="hover:text-[#e8607a] transition-colors">Terms of Service</Link>
        </p>
      </motion.main>
    </div>
  )
}
