import Image from 'next/image'
import Link from 'next/link'

export default function GeoPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07090f] text-[#eeeef0]">
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="border-b border-[#1c2333] px-6 h-16 flex items-center justify-between relative z-10">
        <Link href="https://blushbite.co/home">
          <Image src="/bb.png" alt="BlushBite" width={120} height={40} className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="https://blushbite.live"
            className="text-xs text-[#6b7280] hover:text-[#e8607a] transition-colors"
          >
            Become a companion →
          </Link>
          <Link
            href="https://blushbite.co/home"
            className="text-xs bg-[#e8607a] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Enter
          </Link>
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer className="border-t border-[#1c2333] px-6 py-8 mt-16 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-x-8 gap-y-2 items-center justify-between">
          <p className="text-xs text-[#374151]">
            © BlushBite · EU-hosted · GDPR compliant · Netherlands
          </p>
          <div className="flex gap-6">
            {[
              ['Terms', 'https://blushbite.co/terms'],
              ['Privacy', 'https://blushbite.co/privacy'],
              ['For companions', 'https://blushbite.live'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-xs text-[#4b5563] hover:text-[#6b7280] transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        <p className="max-w-5xl mx-auto text-xs text-[#1f2937] mt-4 leading-relaxed">
          This website only allows adult individuals to advertise their time and companionship to
          other adult individuals. BlushBite is an advertising platform only. Users are responsible
          for compliance with all applicable local laws. All users must be 18 years of age or older.
        </p>
      </footer>
    </div>
  )
}
