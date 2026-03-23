export default function CompanionDocumentsPage() {
  return (
    <div className="min-h-screen bg-[#07090f] flex items-center justify-center relative overflow-hidden">

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

      <div className="text-center relative z-10 px-5 max-w-[480px]">

        {/* Gold chip */}
        <span
          className="inline-flex items-center gap-[6px] text-[11px] font-medium text-[#c9a96e] px-[10px] py-1 rounded-full mb-6 tracking-[0.06em] uppercase"
          style={{
            background: 'rgba(201,169,110,0.1)',
            border: '1px solid rgba(201,169,110,0.3)',
          }}
        >
          <span className="w-[5px] h-[5px] rounded-full bg-current inline-block" />
          Stage 3 · Identity Verification
        </span>

        <h1
          className="text-[28px] text-[#eeeef0] leading-tight mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          One more step.
        </h1>
        <p
          className="text-[22px] text-[#e8607a] mb-6"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
        >
          before your world goes live.
        </p>

        <p className="text-[13px] text-[#6b7280] leading-[1.7] max-w-[360px] mx-auto mb-10">
          Identity verification is coming soon. You'll be among the first companions when it launches.
        </p>

        {/* Status steps */}
        <div
          className="rounded-[16px] border border-[#1c2333] p-6 text-left mb-8"
          style={{ background: '#0d1117' }}
        >
          <div className="flex flex-col gap-4">

            {/* Step 1 — complete */}
            <div className="flex items-start gap-4">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] flex-shrink-0 mt-[1px]"
                style={{ background: '#e8607a' }}
              >
                ✓
              </div>
              <div>
                <p className="text-[13px] text-[#eeeef0] font-medium">Profile created</p>
                <p className="text-[11.5px] text-[#6b7280] mt-[2px]">Your preferences and role are saved.</p>
              </div>
            </div>

            {/* Connector */}
            <div className="ml-[13px] w-[1px] h-4 bg-[#1c2333]" />

            {/* Step 2 — complete */}
            <div className="flex items-start gap-4">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] flex-shrink-0 mt-[1px]"
                style={{ background: '#e8607a' }}
              >
                ✓
              </div>
              <div>
                <p className="text-[13px] text-[#eeeef0] font-medium">Basic profile</p>
                <p className="text-[11.5px] text-[#6b7280] mt-[2px]">Name, date of birth and country saved.</p>
              </div>
            </div>

            {/* Connector */}
            <div className="ml-[13px] w-[1px] h-4 bg-[#1c2333]" />

            {/* Step 3 — current (gold) */}
            <div className="flex items-start gap-4">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-[1px] text-[11px] text-[#c9a96e]"
                style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.35)' }}
              >
                ✦
              </div>
              <div>
                <p
                  className="text-[13px] font-medium"
                  style={{ color: '#c9a96e' }}
                >
                  Identity verification
                </p>
                <p className="text-[11.5px] text-[#6b7280] mt-[2px]">
                  Companion verification is being built — you'll be among the first.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Contact line */}
        <p className="text-[12px] text-[#6b7280] leading-[1.7]">
          Questions?{' '}
          <span className="text-[#e8607a] cursor-pointer hover:underline transition-all">
            companions@blushbite.com
          </span>
        </p>

      </div>
    </div>
  )
}
