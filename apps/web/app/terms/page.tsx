// Server Component — no 'use client'. Statically generated (ISR 24h).
// No framer-motion needed: entrance animation uses existing @keyframes fadeUp from globals.css.
export const revalidate = 86400

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
  return <p className="text-[14px] text-[#6b7280] leading-relaxed mb-4">{children}</p>
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="text-[14px] text-[#6b7280] leading-relaxed mb-4 flex flex-col gap-[6px] pl-5">
      {items.map((item, i) => (
        <li key={i} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
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
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── Fixed header ──────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-[900] flex items-center justify-between px-5 md:px-10 h-[75px] border-b border-[#1c2333]"
        style={{
          background: 'rgba(7,9,15,0.82)',
          backdropFilter: 'blur(20px)',
          willChange: 'transform',
        }}
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
      <main
        className="relative z-10 max-w-[860px] mx-auto px-5 md:px-10 pt-[95px] pb-20"
        style={{ animation: 'fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both' }}
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
            Terms of <em style={{ fontStyle: 'italic', color: '#e8607a' }}>Service.</em>
          </h1>
          <p className="text-[14px] text-[#6b7280] leading-relaxed max-w-[640px]">
            Please read these Terms carefully before using BlushBite. By creating an account you
            agree to be bound by them.
          </p>
        </div>

        {/* 1. Acceptance */}
        <Section title="1. Acceptance">
          <P>
            By creating an account on BlushBite you confirm that you are 18 years of age or older
            and that you agree to these Terms of Service in full. If you do not agree, do not create
            an account and do not use the platform.
          </P>
        </Section>

        {/* 2. The Platform */}
        <Section title="2. The Platform">
          <P>
            BlushBite is operated by BlushBite (operated as a sole trader, incorporation pending),
            registered in the Netherlands. BlushBite is a curated companion discovery and erotic
            fantasy content platform. It facilitates connections between consenting adults.
            BlushBite does not provide escort services and is not a party to any arrangements made
            between users and companions. All interactions facilitated through the platform are
            between adult users acting of their own free will.
          </P>
          <P>
            The platform also hosts user-generated stories and confessions submitted by both
            companions and registered users (Dreamers). This content constitutes literary erotica —
            emotionally rich adult fiction — and is moderated before publication.
          </P>
        </Section>

        {/* 3. Age Requirement */}
        <Section title="3. Age Requirement">
          <P>
            You must be 18 years of age or older to use BlushBite in any capacity — including
            browsing content, creating an account, or engaging with companions. We use third-party
            identity verification (Didit) to confirm the age of companions before their profiles are
            made live.
          </P>
          <P>
            Users who misrepresent their age will be permanently banned from the platform and
            reported to relevant law enforcement authorities.
          </P>
        </Section>

        {/* 4. Companion Verification */}
        <Section title="4. Companion Verification Requirement">
          <P>
            All companions (&ldquo;The Dream&rdquo;) must complete identity verification via our third-party
            provider, Didit (didit.me), before their profile is made live on the platform.
            Verification includes submission of a government-issued photo ID and a liveness selfie
            check.
          </P>
          <P>
            Unverified profiles are not visible to any users on the platform under any
            circumstances. Verification data is handled in accordance with our{' '}
            <Link href="/privacy" className="text-[#e8607a] hover:underline">
              Privacy Policy
            </Link>
            .
          </P>
        </Section>

        {/* 5. Prohibited Conduct */}
        <Section title="5. Prohibited Conduct">
          <P>Users must not, at any time:</P>
          <UL
            items={[
              <>Impersonate another person or entity.</>,
              <>Share another person&apos;s personal information without their explicit consent.</>,
              <>Solicit or post illegal content of any kind.</>,
              <>
                Use the platform in jurisdictions where such platforms are prohibited (see Section
                13).
              </>,
              <>Attempt to circumvent or undermine the age verification system.</>,
              <>Harass, threaten, or intimidate other users or companions.</>,
              <>
                Use automated tools, bots, or scrapers to extract content or data from the platform.
              </>,
            ]}
          />
        </Section>

        {/* 6. Content Standards */}
        <Section title="6. Content Standards">
          <P>
            All content on BlushBite must involve consenting adults. Child sexual abuse material
            (CSAM) is strictly prohibited and will be reported to law enforcement immediately upon
            discovery.
          </P>
          <P>
            Stories and audio content on BlushBite are classified as literary erotica — emotionally
            rich adult fiction — and are not pornographic material in the legal sense. Companions
            are individually responsible for ensuring that all content they post complies with
            applicable law in both their jurisdiction and the Netherlands.
          </P>
        </Section>

        {/* 7. User-Generated Content (UGC) */}
        <Section title="7. User-Generated Content (UGC)">
          <P>
            Both companions (&ldquo;The Dream&rdquo;) and users (&ldquo;The Dreamer&rdquo;) may submit stories and
            confessions to the platform. The following rules apply to all UGC:
          </P>
          <UL
            items={[
              <>
                All UGC must involve consenting adults only. No content depicting or implying minors
                under any circumstances.
              </>,
              <>
                Submitters confirm they hold all rights to the content they submit and that no real
                individuals are identifiable without their explicit consent.
              </>,
              <>
                By submitting UGC, you grant BlushBite a non-exclusive, royalty-free, worldwide
                licence to display and distribute the content on the platform.
              </>,
              <>
                BlushBite may remove any UGC at any time without notice if it violates these Terms
                or applicable law.
              </>,
              <>Repeat violators will be permanently banned from the platform.</>,
            ]}
          />
        </Section>

        {/* 8. AI-Generated and Platform-Enhanced Content */}
        <Section title="8. AI-Generated and Platform-Enhanced Content">
          <P>
            The platform may use AI tools to enhance content discovery and personalisation,
            including the generation of vector embeddings from content and user preference data.
            This processing is described in detail in our{' '}
            <Link href="/privacy" className="text-[#e8607a] hover:underline">
              Privacy Policy
            </Link>{' '}
            (see Sub-Processors & Third Parties).
          </P>
          <P>
            Users may opt out of personalisation-based AI processing at any time by contacting{' '}
            <span className="text-[#e8607a]">privacy@blushbite.co</span>. Opting out will not affect
            your access to the platform but may reduce the relevance of content recommendations.
          </P>
        </Section>

        {/* 9. Content Moderation & Reporting */}
        <Section title="9. Content Moderation & Reporting">
          <P>
            All companion profiles, stories, audio recordings, and confessions are reviewed by the
            BlushBite moderation team before publication. Content that violates these Terms or
            applicable law will be rejected or removed.
          </P>
          <UL
            items={[
              <>
                Users may report content that violates these Terms via{' '}
                <span className="text-[#e8607a]">support@blushbite.co</span> or the in-platform
                report function.
              </>,
              <>BlushBite will review and act on valid reports within 72 hours of receipt.</>,
              <>
                For illegal content, including CSAM, we will report to relevant law enforcement
                authorities and the National Center for Missing & Exploited Children (NCMEC)
                immediately upon discovery.
              </>,
              <>
                DSA notice-and-action requests should be submitted to:{' '}
                <span className="text-[#e8607a]">support@blushbite.co</span>.
              </>,
            ]}
          />
        </Section>

        {/* 10. 2257 Compliance */}
        <Section title="10. 2257 Compliance">
          <P>
            BlushBite maintains records pursuant to 18 USC 2257 (US federal record-keeping
            requirements for depictions of actual sexually explicit conduct) where applicable to
            content hosted on the platform.
          </P>
          <P>
            The Custodian of Records is: BlushBite, c/o{' '}
            <span className="text-[#e8607a]">privacy@blushbite.co</span>. Records are available for
            inspection as required by law.
          </P>
          <P>
            All performers depicted in content on this platform have confirmed they are 18 years of
            age or older at the time of production. Companions are required to provide valid proof
            of age as part of the identity verification process described in Section 4.
          </P>
        </Section>

        {/* 11. User Responsibilities */}
        <Section title="11. User Responsibilities">
          <P>
            You are solely responsible for maintaining the confidentiality of your account
            credentials. You agree to notify us immediately at{' '}
            <span className="text-[#e8607a]">support@blushbite.co</span> upon becoming aware of any
            unauthorised access to or use of your account.
          </P>
          <P>
            BlushBite is not liable for any loss or damage arising from unauthorised use of your
            account where such use resulted from your failure to maintain adequate credential
            security.
          </P>
        </Section>

        {/* 12. Limitation of Liability */}
        <Section title="12. Limitation of Liability">
          <P>
            BlushBite operates as a platform intermediary. We do not independently verify the
            accuracy of profile information beyond identity verification as described in Section 4.
            We are not liable for the conduct, statements, or actions of any user or companion on
            the platform.
          </P>
          <P>
            To the maximum extent permitted by applicable law, our total aggregate liability to any
            user shall not exceed the total amount paid by that user to BlushBite in the 12 calendar
            months immediately preceding the event giving rise to the claim.
          </P>
        </Section>

        {/* 13. Jurisdictional Restrictions */}
        <Section title="13. Jurisdictional Restrictions">
          <P>
            BlushBite is not available to residents of the following jurisdictions: Sweden, Norway,
            Iceland, Singapore, or Canada. Users located in the United States may only access the
            platform if they are in a state or jurisdiction where such platforms are lawful.
          </P>
          <P>
            It is your sole responsibility to determine whether your use of BlushBite is lawful in
            your jurisdiction. BlushBite accepts no liability for unlawful use of the platform.
          </P>
          <P>
            Users in the United States are solely responsible for determining the legality of this
            platform in their state or jurisdiction. BlushBite does not knowingly facilitate
            arrangements that violate US federal law, including 18 USC 2257 or FOSTA-SESTA.
          </P>
        </Section>

        {/* 14. Termination */}
        <Section title="14. Termination">
          <P>
            We reserve the right to suspend or permanently terminate any account that violates these
            Terms, without prior notice and at our sole discretion. Accounts may also be terminated
            upon receipt of a valid legal order. You may delete your account at any time via your
            account settings. Upon deletion, your data will be handled per our Privacy Policy.
          </P>
        </Section>

        {/* 15. Governing Law */}
        <Section title="15. Governing Law">
          <P>
            These Terms are governed by and construed in accordance with the laws of the
            Netherlands. Any disputes arising from these Terms or your use of the platform shall be
            subject to the exclusive jurisdiction of the courts of Amsterdam, the Netherlands.
          </P>
          <P>
            For UK users, these Terms are also subject to applicable UK consumer protection
            legislation where it provides greater protection than Dutch law.
          </P>
        </Section>

        {/* 16. Contact */}
        <Section title="16. Contact">
          <P>
            For questions about these Terms, contact us at{' '}
            <span className="text-[#e8607a]">support@blushbite.co</span>.
          </P>
        </Section>

        {/* Footer */}
        <div className="h-[1px] bg-[#1c2333] mb-8" />
        <p className="text-[12px] text-[#6b7280]" style={{ opacity: 0.5 }}>
          © 2025 BlushBite · EU-hosted · 18+ only ·{' '}
          <Link href="/privacy" className="hover:text-[#e8607a] transition-colors">
            Privacy Policy
          </Link>
        </p>
      </main>
    </div>
  )
}
