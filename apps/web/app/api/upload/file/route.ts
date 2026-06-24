import { NextResponse } from 'next/server'

const UNAUTH = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export const GET     = async () => UNAUTH
export const POST    = async () => UNAUTH
export const PATCH   = async () => UNAUTH
export const PUT     = async () => UNAUTH
export const DELETE  = async () => UNAUTH
