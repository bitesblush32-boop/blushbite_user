'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Search, X } from 'lucide-react'

declare global {
  interface Window { google: any }
}

interface Prediction {
  place_id: string
  structured_formatting: { main_text: string; secondary_text: string }
  description: string
}

interface Props {
  onSaved:   (city: string) => void
  onCancel:  () => void
  /** Override the default save behaviour. If omitted, PATCHes /api/users/profile. */
  saveCity?: (city: string) => Promise<void>
}

export default function LocationPicker({ onSaved, onCancel, saveCity }: Props) {
  const [query,       setQuery]       = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [mapsLoaded,  setMapsLoaded]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [open,        setOpen]        = useState(false)

  const svcRef      = useRef<any>(null)
  const tokenRef    = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  // track whether the last action was picking from the list (prevents blur-reset)
  const pickingRef  = useRef(false)

  // ── Load Google Maps Places SDK ────────────────────────────────────────────
  useEffect(() => {
    if (window.google?.maps?.places) { setMapsLoaded(true); return }

    const SCRIPT_ID = 'gm-places-sdk'
    if (document.getElementById(SCRIPT_ID)) {
      const id = setInterval(() => {
        if (window.google?.maps?.places) { setMapsLoaded(true); clearInterval(id) }
      }, 100)
      return () => clearInterval(id)
    }

    const script = document.createElement('script')
    script.id  = SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`
    script.async = true
    script.onload = () => setMapsLoaded(true)
    document.head.appendChild(script)
  }, [])

  // ── Init service + session token once maps ready ───────────────────────────
  useEffect(() => {
    if (!mapsLoaded) return
    svcRef.current   = new window.google.maps.places.AutocompleteService()
    tokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [mapsLoaded])

  // ── Fetch predictions ──────────────────────────────────────────────────────
  const fetchPredictions = useCallback((value: string) => {
    if (!svcRef.current || value.length < 2) { setPredictions([]); return }
    svcRef.current.getPlacePredictions(
      { input: value, types: ['(cities)'], sessionToken: tokenRef.current },
      (results: Prediction[] | null, status: string) => {
        setPredictions(status === 'OK' && results ? results.slice(0, 6) : [])
      },
    )
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchPredictions(v), 220)
  }

  function handleBlur() {
    // small delay so onMouseDown on a prediction fires first
    setTimeout(() => {
      if (pickingRef.current) return
      setQuery('')
      setPredictions([])
      setOpen(false)
    }, 160)
  }

  async function handleSelect(p: Prediction) {
    pickingRef.current = true
    const city = p.structured_formatting?.main_text ?? p.description
    setQuery(city)
    setPredictions([])
    setOpen(false)
    setSaving(true)

    // new session token for next search
    if (window.google?.maps?.places) {
      tokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
    }

    try {
      if (saveCity) {
        await saveCity(city)
      } else {
        const res = await fetch('/api/users/profile', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ city }),
        })
        if (!res.ok) throw new Error()
      }
      onSaved(city)
    } catch {
      setSaving(false)
      pickingRef.current = false
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 300 }}>
      {/* Input */}
      <div
        className="flex items-center gap-2 rounded-[10px] px-3 h-[42px] relative"
        style={{ background: '#111620', border: '1px solid #1c2333' }}
      >
        <Search size={13} color="#6b7280" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          onBlur={handleBlur}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={mapsLoaded ? 'Search your city or area…' : 'Loading…'}
          disabled={!mapsLoaded || saving}
          autoComplete="off"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            outline: 'none', fontSize: 13, color: '#eeeef0',
          }}
          className="placeholder-[#4b5563]"
        />
        {saving ? (
          <div style={{
            width: 14, height: 14, flexShrink: 0, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.12)', borderTopColor: '#e8607a',
            animation: 'spin 0.7s linear infinite',
          }} />
        ) : query ? (
          <button
            onMouseDown={e => { e.preventDefault(); setQuery(''); setPredictions([]); setOpen(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
          >
            <X size={13} color="#6b7280" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {open && predictions.length > 0 && (
        <div
          className="mt-1 rounded-[10px] overflow-hidden"
          style={{
            background: '#0d1117',
            border: '1px solid #1c2333',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
          }}
        >
          {predictions.map((p, i) => (
            <button
              key={p.place_id}
              onMouseDown={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-4 py-[10px] text-left cursor-pointer border-none transition-colors duration-100"
              style={{
                background: 'transparent',
                borderBottom: i < predictions.length - 1 ? '1px solid #1c2333' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,96,122,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <MapPin size={12} color="#e8607a" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: '#eeeef0', lineHeight: 1.3 }}>
                  {p.structured_formatting?.main_text ?? p.description}
                </div>
                {p.structured_formatting?.secondary_text && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                    {p.structured_formatting.secondary_text}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Cancel */}
      <button
        onMouseDown={e => { e.preventDefault(); onCancel() }}
        style={{
          marginTop: 8, fontSize: 11, color: '#4b5563',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        cancel
      </button>
    </div>
  )
}
