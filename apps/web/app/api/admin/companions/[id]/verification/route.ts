import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  companions, companionProfiles, companionVerifications, diditExtractedData,
} from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = params

  const [companionRows, profileRows, verificationRows, extractedRows] = await Promise.all([
    db.select({
      full_name:    companions.full_name,
      date_of_birth: companions.date_of_birth,
      country:      companions.country,
    })
    .from(companions)
    .where(eq(companions.id, id))
    .limit(1),

    db.select({
      whatsapp_number: companionProfiles.whatsapp_number,
      is_verified:     companionProfiles.is_verified,
    })
    .from(companionProfiles)
    .where(eq(companionProfiles.companion_id, id))
    .limit(1),

    db.select({
      id:                    companionVerifications.id,
      provider:              companionVerifications.provider,
      provider_status:       companionVerifications.provider_status,
      liveness_check_passed: companionVerifications.liveness_check_passed,
      id_document_front_url: companionVerifications.id_document_front_url,
      id_document_back_url:  companionVerifications.id_document_back_url,
      selfie_url:            companionVerifications.selfie_url,
      verified_at:           companionVerifications.verified_at,
      expires_at:            companionVerifications.expires_at,
    })
    .from(companionVerifications)
    .where(eq(companionVerifications.companion_id, id))
    .limit(1),

    db.select({
      id:                   diditExtractedData.id,
      extracted_first_name: diditExtractedData.extracted_first_name,
      extracted_last_name:  diditExtractedData.extracted_last_name,
      extracted_dob:        diditExtractedData.extracted_dob,
      document_type:        diditExtractedData.document_type,
      document_number:      diditExtractedData.document_number,
      issuing_state:        diditExtractedData.issuing_state,
      liveness_score:       diditExtractedData.liveness_score,
      face_match_score:     diditExtractedData.face_match_score,
      overall_status:       diditExtractedData.overall_status,
    })
    .from(diditExtractedData)
    .where(eq(diditExtractedData.companion_id, id))
    .orderBy(desc(diditExtractedData.created_at))
    .limit(1),
  ])

  if (!companionRows[0]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const c   = companionRows[0]
  const pro = profileRows[0] ?? null

  return NextResponse.json({
    manually_entered: {
      full_name:       c.full_name,
      date_of_birth:   c.date_of_birth,
      country:         c.country,
      whatsapp_number: pro?.whatsapp_number ?? null,
    },
    didit_extracted:    extractedRows[0] ?? null,
    verification_status: verificationRows[0] ?? null,
    is_verified:         pro?.is_verified ?? false,
  })
}
