// Companion layout — ONLY used for /companion/legal (bare, no chrome)
// All other companion routes (/, /profile, /confessions, /stories, etc.)
// use the dreamer layout naturally since companions access those routes.

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07090f] relative overflow-x-hidden">
      {children}
    </div>
  )
}
