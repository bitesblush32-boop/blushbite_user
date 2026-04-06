'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera } from 'lucide-react'

// ─── Location data (EU-focused) ───────────────────────────────────────────────

const LOCATIONS: Record<string, string[]> = {
  'Netherlands':      ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Leiden', 'Haarlem', 'Maastricht', 'Delft', 'Arnhem'],
  'Germany':          ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dresden', 'Dortmund', 'Essen', 'Bremen', 'Hannover', 'Nuremberg'],
  'France':           ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Lille', 'Rennes', 'Cannes'],
  'Belgium':          ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège', 'Leuven', 'Namur'],
  'United Kingdom':   ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Brighton', 'Oxford', 'Cambridge'],
  'Spain':            ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Granada', 'Ibiza', 'Palma', 'San Sebastián'],
  'Italy':            ['Rome', 'Milan', 'Florence', 'Venice', 'Turin', 'Naples', 'Bologna', 'Verona', 'Genoa'],
  'Portugal':         ['Lisbon', 'Porto', 'Faro', 'Braga', 'Cascais', 'Funchal'],
  'Switzerland':      ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Lucerne'],
  'Austria':          ['Vienna', 'Salzburg', 'Graz', 'Innsbruck', 'Linz'],
  'Sweden':           ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala'],
  'Denmark':          ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg'],
  'Norway':           ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'],
  'Finland':          ['Helsinki', 'Tampere', 'Turku', 'Espoo'],
  'Poland':           ['Warsaw', 'Krakow', 'Gdańsk', 'Wrocław', 'Poznań'],
  'Czech Republic':   ['Prague', 'Brno', 'Ostrava'],
  'Hungary':          ['Budapest', 'Debrecen'],
  'Greece':           ['Athens', 'Thessaloniki', 'Mykonos', 'Santorini'],
  'Ireland':          ['Dublin', 'Cork', 'Galway', 'Limerick'],
  'Luxembourg':       ['Luxembourg City'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi'],
  'Australia':        ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  'New Zealand':      ['Auckland', 'Wellington', 'Christchurch'],
  'Japan':            ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'],
  'Canada':           ['Toronto', 'Montreal', 'Vancouver', 'Calgary'],
  'United States':    ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Seattle', 'Austin', 'Boston'],
  'Other':            [],
}

const COUNTRY_LIST = Object.keys(LOCATIONS)

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  alias:       z.string().max(100).optional(),
  bio:         z.string().max(300).optional(),
  dateOfBirth: z.string().optional(),
  country:     z.string().max(100).optional(),
  city:        z.string().max(100).optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditProfileDrawerProps {
  open:           boolean
  onClose:        () => void
  onSaved:        (data: Partial<FormValues> & { avatar_url?: string }) => void
  defaults?:      Partial<FormValues>
  currentAvatar?: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProfileDrawer({
  open,
  onClose,
  onSaved,
  defaults,
  currentAvatar,
}: EditProfileDrawerProps) {
  const [submitting, setSubmitting]             = useState(false)
  const [submitError, setSubmitError]           = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview]       = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading]   = useState(false)
  const [avatarError, setAvatarError]           = useState<string | null>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)
  const [isMobile, setIsMobile]                 = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults ?? {},
  })

  const bioLength      = watch('bio')?.length ?? 0
  const selectedCountry = watch('country') ?? ''
  const cityOptions    = LOCATIONS[selectedCountry] ?? []

  // Re-populate form fields every time the drawer opens
  useEffect(() => {
    if (open) {
      reset(defaults ?? {})
      setAvatarPreview(null)
      setUploadedAvatarUrl(null)
      setAvatarError(null)
      setSubmitError(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Detect mobile for animation direction
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // When country changes, reset city if it's not in the new list
  useEffect(() => {
    const current = watch('city')
    if (current && cityOptions.length && !cityOptions.includes(current)) {
      setValue('city', '')
    }
  }, [selectedCountry]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Avatar upload ───────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('JPG, PNG or WebP only.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5 MB.')
      return
    }

    setAvatarPreview(URL.createObjectURL(file))
    setAvatarUploading(true)
    setAvatarError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res  = await fetch('/api/users/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setUploadedAvatarUrl(json.data.avatarUrl)
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed.')
      setAvatarPreview(null)
    } finally {
      setAvatarUploading(false)
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/users/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(values),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        setSubmitError(error ?? 'Something went wrong. Try again.')
        return
      }
      const { data } = await res.json()
      onSaved({ ...data, ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}) })
      onClose()
    } catch {
      setSubmitError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayedAvatar = avatarPreview ?? currentAvatar

  // Animation: slide up on mobile, slide in from right on desktop
  const motionProps = isMobile
    ? {
        initial:    { y: '100%' },
        animate:    { y: 0 },
        exit:       { y: '100%' },
        transition: { type: 'spring' as const, stiffness: 380, damping: 38 },
      }
    : {
        initial:    { x: '100%' },
        animate:    { x: 0 },
        exit:       { x: '100%' },
        transition: { type: 'spring' as const, stiffness: 380, damping: 38 },
      }

  const inputClass =
    'bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[850]"
            style={{ background: 'rgba(0,0,0,0.60)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel — bottom sheet on mobile, right panel on desktop */}
          <motion.div
            {...motionProps}
            className={[
              'fixed z-[860] overflow-y-auto',
              // Mobile: bottom sheet
              'bottom-0 left-0 right-0',
              // Desktop: right-side panel, fixed width
              'md:bottom-0 md:top-0 md:left-auto md:right-0 md:w-[480px]',
            ].join(' ')}
            style={{
              background:   '#0d1117',
              borderTop:    isMobile ? '1px solid #1c2333' : 'none',
              borderLeft:   isMobile ? 'none' : '1px solid #1c2333',
              borderRadius: isMobile ? '20px 20px 0 0' : 0,
              maxHeight:    isMobile ? '92vh' : '100vh',
              willChange:   'transform',
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#1c2333]"
              style={{ background: '#0d1117' }}
            >
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0' }}>
                Edit profile
              </span>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid #1c2333',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', fontSize: 16,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,96,122,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-6 flex flex-col gap-5">

              {/* ── Avatar ────────────────────────────────────────── */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                  Profile photo
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="relative group cursor-pointer flex-shrink-0"
                    style={{ width: 64, height: 64 }}
                    onClick={() => !avatarUploading && fileInputRef.current?.click()}
                  >
                    {displayedAvatar ? (
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        backgroundImage: `url(${displayedAvatar})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        border: '1px solid #1c2333',
                      }} />
                    ) : (
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid #1c2333',
                      }}>
                        <Camera size={20} color="rgba(255,255,255,0.8)" />
                      </div>
                    )}
                    {avatarUploading ? (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.55)' }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.2)',
                          borderTopColor: '#fff',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                      </div>
                    ) : (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: 'rgba(7,9,15,0.65)' }}>
                        <Camera size={16} color="#eeeef0" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      style={{ fontSize: 12, color: '#e8607a', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, textAlign: 'left', opacity: avatarUploading ? 0.5 : 1 }}
                    >
                      {avatarUploading ? 'Processing…' : uploadedAvatarUrl ? 'Change photo' : 'Upload photo'}
                    </button>
                    <span style={{ fontSize: 11, color: '#4b5563' }}>JPG, PNG or WebP · max 5 MB</span>
                    {avatarError && <span style={{ fontSize: 11, color: '#e87070' }}>{avatarError}</span>}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>

              {/* ── Alias ───────────────────────────────────── */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Alias Name</label>
                <input
                  {...register('alias')}
                  placeholder="Your anonymous name (e.g., @midnight-wanderer)"
                  className={inputClass}
                />
                {errors.alias && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.alias.message}</span>}
              </div>

              {/* ── Bio ────────────────────────────────────────────── */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Bio</label>
                <div className="relative">
                  <textarea
                    {...register('bio')}
                    rows={3}
                    placeholder="A little about your desires…"
                    className={`${inputClass} resize-none`}
                  />
                  <span className="absolute bottom-2 right-3" style={{ fontSize: 10, color: '#4b5563', pointerEvents: 'none' }}>
                    {bioLength}/300
                  </span>
                </div>
                {errors.bio && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.bio.message}</span>}
              </div>

              {/* ── Date of birth ──────────────────────────────────── */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Date of birth</label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className={inputClass}
                  style={{ colorScheme: 'dark' }}
                />
                {errors.dateOfBirth && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.dateOfBirth.message}</span>}
              </div>

              {/* ── Country dropdown ───────────────────────────────── */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Country</label>
                <div className="relative">
                  <select
                    {...register('country')}
                    className={inputClass}
                    style={{ colorScheme: 'dark', appearance: 'none', paddingRight: 36 }}
                  >
                    <option value="">Select your country</option>
                    {COUNTRY_LIST.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-[11px]">▾</div>
                </div>
                {errors.country && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.country.message}</span>}
              </div>

              {/* ── City dropdown (dependent on country) ──────────── */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">City</label>
                {cityOptions.length > 0 ? (
                  <div className="relative">
                    <select
                      {...register('city')}
                      className={inputClass}
                      style={{ colorScheme: 'dark', appearance: 'none', paddingRight: 36 }}
                      disabled={!selectedCountry}
                    >
                      <option value="">Select your city</option>
                      {cityOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-[11px]">▾</div>
                  </div>
                ) : (
                  <input
                    {...register('city')}
                    type="text"
                    placeholder={selectedCountry ? 'Enter your city' : 'Select a country first'}
                    disabled={!selectedCountry}
                    className={inputClass}
                    style={{ opacity: selectedCountry ? 1 : 0.5 }}
                  />
                )}
                {errors.city && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.city.message}</span>}
              </div>

              {/* ── Submit error ───────────────────────────────────── */}
              {submitError && (
                <p style={{ fontSize: 12, color: '#e87070', textAlign: 'center' }}>{submitError}</p>
              )}

              {/* ── Save button ────────────────────────────────────── */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 mt-2 rounded-[10px] py-[12px] text-[13.5px] font-medium text-white transition-all duration-200"
                style={{
                  background:    submitting ? '#c4485e' : '#e8607a',
                  border:        'none',
                  opacity:       submitting ? 0.8 : 1,
                  pointerEvents: submitting ? 'none' : 'auto',
                  cursor:        submitting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#c4485e' }}
                onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#e8607a' }}
              >
                {submitting ? (
                  <>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block', flexShrink: 0,
                    }} />
                    Saving…
                  </>
                ) : 'Save changes'}
              </button>

            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
