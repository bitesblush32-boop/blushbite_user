'use client'
import { useState, useEffect, useCallback } from 'react'

export type GeoPermission = 'granted' | 'denied' | 'prompt' | 'unknown'

export interface GeoState {
  latitude:    number | null
  longitude:   number | null
  accuracy:    number | null
  loading:     boolean
  error:       GeolocationPositionError | null
  permission:  GeoPermission
  isSupported: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    latitude:    null,
    longitude:   null,
    accuracy:    null,
    loading:     false,
    error:       null,
    permission:  'unknown',
    isSupported: false,
  })

  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) return
    setState(s => ({ ...s, loading: true }))
    navigator.geolocation.getCurrentPosition(
      (pos) => setState(s => ({
        ...s,
        loading:   false,
        error:     null,
        permission: 'granted',
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy:  pos.coords.accuracy,
      })),
      (err) => setState(s => ({
        ...s,
        loading:    false,
        error:      err,
        permission: err.code === 1 ? 'denied' : s.permission,
      })),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    )
  }, [])

  useEffect(() => {
    setState(s => ({ ...s, isSupported: !!navigator?.geolocation }))
    if (!navigator?.permissions) return
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      setState(s => ({ ...s, permission: result.state as GeoPermission }))
      result.onchange = () =>
        setState(s => ({ ...s, permission: result.state as GeoPermission }))
      if (result.state === 'granted') requestLocation()
    }).catch(() => {})
  }, [requestLocation])

  return { ...state, requestLocation }
}
