import {
  pgTable,
  serial,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  numeric,
  timestamp,
  date,
  time,
  jsonb,
  primaryKey,
  unique,
  check,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

// ─── SHARED LOOKUP TABLES ─────────────────────────────────────────────────────

export const languages = pgTable('languages', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
})

export const fantasyCategories = pgTable('fantasy_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  sort_order: integer('sort_order').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
})

export const fantasyTags = pgTable('fantasy_tags', {
  id: serial('id').primaryKey(),
  category_id: integer('category_id')
    .notNull()
    .references(() => fantasyCategories.id),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
})

export const vibeTags = pgTable('vibe_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  emoji: varchar('emoji', { length: 10 }),
  is_active: boolean('is_active').notNull().default(true),
})

export const moodTags = pgTable('mood_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  emoji: varchar('emoji', { length: 10 }),
  is_active: boolean('is_active').notNull().default(true),
})

export const orientationTags = pgTable('orientation_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  is_active: boolean('is_active').notNull().default(true),
})

export const storyCategories = pgTable('story_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  sort_order: integer('sort_order').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
})

// ─── DREAMER SIDE ─────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  email_verified: timestamp('email_verified', { withTimezone: true }),
  hashed_password: text('hashed_password'),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  alias: varchar('alias', { length: 100 }).unique(),
  phone: varchar('phone', { length: 30 }),
  onboarding_complete: boolean('onboarding_complete').notNull().default(false),
  is_flagged: boolean('is_flagged').notNull().default(false),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
  // Location (Haversine-compatible)
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  location_enabled: boolean('location_enabled').notNull().default(false),
  location_updated_at: timestamp('location_updated_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userAccounts = pgTable(
  'user_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 255 }).notNull(),
    provider_account_id: varchar('provider_account_id', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => ({
    providerUnique: unique('idx_user_accounts_provider').on(
      table.provider,
      table.provider_account_id
    ),
  })
)

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  gender: varchar('gender', { length: 50 }),
  desired_genders: jsonb('desired_genders'),
  vibes: jsonb('vibes'),
  // TODO Phase 2: index this column for user segmentation queries
  platform_role: varchar('platform_role', { length: 20 }),
  mood_intensity: integer('mood_intensity').notNull().default(50),
  display_name: varchar('display_name', { length: 100 }),
  avatar_url: text('avatar_url'),
  bio: text('bio'),
  date_of_birth: date('date_of_birth'),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userFantasyTags = pgTable(
  'user_fantasy_tags',
  {
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fantasy_tag_id: integer('fantasy_tag_id')
      .notNull()
      .references(() => fantasyTags.id),
    intensity: varchar('intensity', { length: 20 }).notNull().default('curious'),
    source: varchar('source', { length: 30 }).notNull().default('explicit'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.user_id, table.fantasy_tag_id] }),
    intensityCheck: check(
      'uft_intensity_check',
      sql`${table.intensity} IN ('curious', 'into_it', 'love_it')`
    ),
    sourceCheck: check(
      'uft_source_check',
      sql`${table.source} IN ('explicit', 'story_like', 'story_save', 'companion_save', 'vibe_map')`
    ),
  })
)

// ─── COMPANION SIDE ───────────────────────────────────────────────────────────

export const companions = pgTable('companions', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  email_verified: timestamp('email_verified', { withTimezone: true }),
  hashed_password: text('hashed_password'),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  alias: varchar('alias', { length: 100 }).unique(),
  onboarding_complete: boolean('onboarding_complete').notNull().default(false),
  full_name: varchar('full_name', { length: 255 }),
  date_of_birth: date('date_of_birth'),
  country: varchar('country', { length: 100 }),
  companion_stage: integer('companion_stage').notNull().default(1),
  gender_community: varchar('gender_community', { length: 20 }),
  tour_completed_at: timestamp('tour_completed_at', { withTimezone: true }),
  whatsapp_number: varchar('whatsapp_number', { length: 20 }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const companionAccounts = pgTable(
  'companion_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companion_id: uuid('companion_id')
      .notNull()
      .references(() => companions.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 255 }).notNull(),
    provider_account_id: varchar('provider_account_id', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => ({
    providerUnique: unique('idx_companion_accounts_provider').on(
      table.provider,
      table.provider_account_id
    ),
  })
)

export const companionProfiles = pgTable(
  'companion_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companion_id: uuid('companion_id')
      .notNull()
      .unique()
      .references(() => companions.id, { onDelete: 'cascade' }),
    bio: text('bio'),
    tagline: varchar('tagline', { length: 300 }),
    city: varchar('city', { length: 100 }),
    hourly_rate: numeric('hourly_rate', { precision: 10, scale: 2 }),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    availability_status: varchar('availability_status', { length: 20 })
      .notNull()
      .default('offline'),
    is_verified: boolean('is_verified').notNull().default(false),
    verified_at: timestamp('verified_at', { withTimezone: true }),
    is_live: boolean('is_live').notNull().default(false),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    // Location (Haversine-compatible)
    latitude: numeric('latitude', { precision: 10, scale: 8 }),
    longitude: numeric('longitude', { precision: 11, scale: 8 }),
    location_enabled: boolean('location_enabled').notNull().default(false),
    location_updated_at: timestamp('location_updated_at', { withTimezone: true }),
    // Physical attributes
    height_cm: integer('height_cm'),
    body_type: varchar('body_type', { length: 30 }),
    ethnicity: varchar('ethnicity', { length: 50 }),
    eye_color: varchar('eye_color', { length: 30 }),
    hair_color: varchar('hair_color', { length: 30 }),
    gender: varchar('gender', { length: 30 }),
    skin_color: varchar('skin_color', { length: 30 }),
    // Profile completeness gate
    profile_completeness: integer('profile_completeness').notNull().default(0),
    is_visible_to_users: boolean('is_visible_to_users').notNull().default(false),
    // WhatsApp (E.164 format e.g. "+31612345678")
    whatsapp_number: varchar('whatsapp_number', { length: 20 }),
    // Telegram handle or phone (e.g. "@username" or "+31612345678")
    telegram_handle: varchar('telegram_handle', { length: 100 }),
    // Social / modality (added v2)
    session_modality: varchar('session_modality', { length: 20 }).notNull().default('in_person'),
    city_slug: varchar('city_slug', { length: 100 }),
    country_slug: varchar('country_slug', { length: 100 }),
    instagram_handle: varchar('instagram_handle', { length: 100 }),
    website_url: text('website_url'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    availabilityCheck: check(
      'cp_availability_check',
      sql`${table.availability_status} IN ('available', 'busy', 'offline')`
    ),
    bodyTypeCheck: check(
      'cp_body_type_check',
      sql`${table.body_type} IS NULL OR ${table.body_type} IN ('slim','athletic','average','curvy','plus_size','prefer_not_to_say')`
    ),
    genderCheck: check(
      'cp_gender_check',
      sql`${table.gender} IN ('woman','man','non_binary','trans_woman','trans_man','other','prefer_not_to_say') OR ${table.gender} IS NULL`
    ),
    skinColorCheck: check(
      'cp_skin_color_check',
      sql`${table.skin_color} IN ('fair','light','medium','olive','brown','dark','ebony','prefer_not_to_say') OR ${table.skin_color} IS NULL`
    ),
    sessionModalityCheck: check(
      'cp_session_modality_check',
      sql`${table.session_modality} IN ('in_person', 'online', 'both')`
    ),
  })
)

export const companionPhotos = pgTable('companion_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  companion_profile_id: uuid('companion_profile_id')
    .notNull()
    .references(() => companionProfiles.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  storage_key: text('storage_key').notNull(),
  alt_text: varchar('alt_text', { length: 255 }),
  sort_order: integer('sort_order').notNull().default(0),
  is_primary: boolean('is_primary').notNull().default(false),
  is_approved: boolean('is_approved').notNull().default(false),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const companionVideos = pgTable(
  'companion_videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    storage_key: text('storage_key').notNull(),
    duration_seconds: integer('duration_seconds'),
    thumbnail_url: text('thumbnail_url'),
    is_approved: boolean('is_approved').notNull().default(false),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    durationCheck: check('cv_duration_check', sql`${table.duration_seconds} <= 15`),
  })
)

export const companionLanguages = pgTable(
  'companion_languages',
  {
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id, { onDelete: 'cascade' }),
    language_id: integer('language_id')
      .notNull()
      .references(() => languages.id),
    fluency: varchar('fluency', { length: 20 }).notNull().default('fluent'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.companion_profile_id, table.language_id] }),
    fluencyCheck: check(
      'cl_fluency_check',
      sql`${table.fluency} IN ('native', 'fluent', 'conversational')`
    ),
  })
)

export const companionVibeTags = pgTable(
  'companion_vibe_tags',
  {
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id, { onDelete: 'cascade' }),
    vibe_tag_id: integer('vibe_tag_id')
      .notNull()
      .references(() => vibeTags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.companion_profile_id, table.vibe_tag_id] }),
  })
)

export const companionFantasyTags = pgTable(
  'companion_fantasy_tags',
  {
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id, { onDelete: 'cascade' }),
    fantasy_tag_id: integer('fantasy_tag_id')
      .notNull()
      .references(() => fantasyTags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.companion_profile_id, table.fantasy_tag_id] }),
  })
)

export const sessionCards = pgTable(
  'session_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    duration_minutes: integer('duration_minutes'),
    price: numeric('price', { precision: 10, scale: 2 }),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    session_type: varchar('session_type', { length: 20 }),
    is_active: boolean('is_active').notNull().default(true),
    sort_order: integer('sort_order').notNull().default(0),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionTypeCheck: check(
      'sc_session_type_check',
      sql`${table.session_type} IN ('in_person', 'audio_call', 'video_call', 'chat', 'custom')`
    ),
  })
)

export const companionOnboardingProgress = pgTable(
  'companion_onboarding_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companion_id: uuid('companion_id')
      .notNull()
      .references(() => companions.id, { onDelete: 'cascade' }),
    stage: integer('stage').notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    completed_at: timestamp('completed_at', { withTimezone: true }).notNull(),
    notes: text('notes'),
  },
  (table) => ({
    uniqueCompanionStage: unique('uq_companion_stage').on(table.companion_id, table.stage),
    stageCheck: check('cop_stage_check', sql`${table.stage} BETWEEN 1 AND 7`),
    statusCheck: check(
      'cop_status_check',
      sql`${table.status} IN ('completed', 'rejected', 'skipped')`
    ),
  })
)

export const companionVerifications = pgTable('companion_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  companion_id: uuid('companion_id')
    .notNull()
    .unique()
    .references(() => companions.id),
  id_document_front_url: text('id_document_front_url'),
  id_document_back_url: text('id_document_back_url'),
  selfie_url: text('selfie_url'),
  liveness_check_passed: boolean('liveness_check_passed'),
  provider: varchar('provider', { length: 50 }),
  provider_reference_id: varchar('provider_reference_id', { length: 255 }),
  provider_status: varchar('provider_status', { length: 50 }),
  provider_response: jsonb('provider_response'),
  verified_at: timestamp('verified_at', { withTimezone: true }),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const companionLegalDocs = pgTable(
  'companion_legal_docs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companion_id: uuid('companion_id')
      .notNull()
      .references(() => companions.id),
    document_type: varchar('document_type', { length: 20 }).notNull(),
    signed_at: timestamp('signed_at', { withTimezone: true }).notNull(),
    ip_address: varchar('ip_address', { length: 45 }),
    document_version: varchar('document_version', { length: 20 }),
    signature_data: text('signature_data'),
    pdf_url: text('pdf_url'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueCompanionDoc: unique('uq_companion_legal_doc').on(
      table.companion_id,
      table.document_type
    ),
    docTypeCheck: check(
      'cld_doc_type_check',
      sql`${table.document_type} IN ('tos', 'model_release', 'form_2257')`
    ),
  })
)

export const companionPaymentSetup = pgTable('companion_payment_setup', {
  id: uuid('id').primaryKey().defaultRandom(),
  companion_id: uuid('companion_id')
    .notNull()
    .unique()
    .references(() => companions.id),
  bank_country: varchar('bank_country', { length: 2 }),
  bank_account_last4: varchar('bank_account_last4', { length: 4 }),
  bank_account_verified: boolean('bank_account_verified').notNull().default(false),
  tax_form_type: varchar('tax_form_type', { length: 50 }),
  tax_form_url: text('tax_form_url'),
  tax_form_submitted: boolean('tax_form_submitted').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── CONTENT TABLES ───────────────────────────────────────────────────────────

export const stories = pgTable(
  'stories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    author_type: varchar('author_type', { length: 20 }).notNull(),
    author_user_id: uuid('author_user_id').references(() => users.id),
    author_companion_id: uuid('author_companion_id').references(() => companions.id),
    category_id: integer('category_id').references(() => storyCategories.id),
    title: varchar('title', { length: 300 }).notNull(),
    body: text('body').notNull(),
    excerpt: varchar('excerpt', { length: 500 }),
    is_anonymous: boolean('is_anonymous').notNull().default(false),
    is_published: boolean('is_published').notNull().default(false),
    is_featured: boolean('is_featured').notNull().default(false),
    moderation_status: varchar('moderation_status', { length: 20 }).notNull().default('pending'),
    moderated_at: timestamp('moderated_at', { withTimezone: true }),
    view_count: integer('view_count').notNull().default(0),
    like_count: integer('like_count').notNull().default(0),
    save_count: integer('save_count').notNull().default(0),
    comment_count: integer('comment_count').notNull().default(0),
    published_at: timestamp('published_at', { withTimezone: true }),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    authorTypeCheck: check(
      'st_author_type_check',
      sql`${table.author_type} IN ('admin', 'companion', 'user')`
    ),
    moderationCheck: check(
      'st_moderation_check',
      sql`${table.moderation_status} IN ('pending', 'approved', 'rejected')`
    ),
  })
)

export const storyMoodTags = pgTable(
  'story_mood_tags',
  {
    story_id: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    mood_tag_id: integer('mood_tag_id')
      .notNull()
      .references(() => moodTags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.story_id, table.mood_tag_id] }),
  })
)

export const storyOrientationTags = pgTable(
  'story_orientation_tags',
  {
    story_id: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    orientation_tag_id: integer('orientation_tag_id')
      .notNull()
      .references(() => orientationTags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.story_id, table.orientation_tag_id] }),
  })
)

export const storyFantasyTags = pgTable(
  'story_fantasy_tags',
  {
    story_id: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    fantasy_tag_id: integer('fantasy_tag_id')
      .notNull()
      .references(() => fantasyTags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.story_id, table.fantasy_tag_id] }),
  })
)

export const storyStoryCategories = pgTable(
  'story_story_categories',
  {
    story_id: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    category_id: integer('category_id')
      .notNull()
      .references(() => storyCategories.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.story_id, table.category_id] }),
  })
)

export const audioRecordings = pgTable(
  'audio_recordings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    author_type: varchar('author_type', { length: 20 }).notNull(),
    author_user_id: uuid('author_user_id').references(() => users.id),
    author_companion_id: uuid('author_companion_id').references(() => companions.id),
    companion_profile_id: uuid('companion_profile_id').references(() => companionProfiles.id),
    story_id: uuid('story_id').references(() => stories.id),
    title: varchar('title', { length: 300 }),
    description: text('description'),
    url: text('url').notNull(),
    storage_key: text('storage_key').notNull(),
    duration_seconds: integer('duration_seconds'),
    file_size_bytes: bigint('file_size_bytes', { mode: 'number' }),
    mime_type: varchar('mime_type', { length: 50 }),
    is_original_voice: boolean('is_original_voice').notNull().default(true),
    is_anonymous: boolean('is_anonymous').notNull().default(false),
    moderation_status: varchar('moderation_status', { length: 20 }).notNull().default('pending'),
    listen_count: integer('listen_count').notNull().default(0),
    like_count: integer('like_count').notNull().default(0),
    save_count: integer('save_count').notNull().default(0),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    authorTypeCheck: check(
      'ar_author_type_check',
      sql`${table.author_type} IN ('companion', 'user')`
    ),
    moderationCheck: check(
      'ar_moderation_check',
      sql`${table.moderation_status} IN ('pending', 'approved', 'rejected')`
    ),
  })
)

// ─── ENGAGEMENT TABLES ────────────────────────────────────────────────────────

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content_type: varchar('content_type', { length: 30 }).notNull(),
    content_id: uuid('content_id').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueLike: unique('uq_like').on(table.user_id, table.content_type, table.content_id),
    contentTypeCheck: check(
      'lk_content_type_check',
      sql`${table.content_type} IN ('story', 'audio_recording', 'comment', 'companion_profile')`
    ),
  })
)

export const saves = pgTable(
  'saves',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content_type: varchar('content_type', { length: 30 }).notNull(),
    content_id: uuid('content_id').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueSave: unique('uq_save').on(table.user_id, table.content_type, table.content_id),
    contentTypeCheck: check(
      'sv_content_type_check',
      sql`${table.content_type} IN ('story', 'audio_recording', 'companion_profile', 'session_card')`
    ),
  })
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // For companions: recipient_type='companion', recipient_id = companion.id
    // For dreamers:   recipient_type='user',      recipient_id = user.id
    recipient_type: varchar('recipient_type', { length: 20 }).notNull(),
    recipient_id: uuid('recipient_id').notNull(),
    notification_type: varchar('notification_type', { length: 40 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body').notNull(),
    action_url: varchar('action_url', { length: 500 }),
    metadata: jsonb('metadata'),
    is_read: boolean('is_read').notNull().default(false),
    read_at: timestamp('read_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    recipientTypeCheck: check(
      'notif_recipient_check',
      sql`${table.recipient_type} IN ('user','companion')`
    ),
    notifTypeCheck: check(
      'notif_type_check',
      sql`${table.notification_type} IN ('profile_viewed','story_linked','booking_request','admin_approved','verification_complete','bridge_approved')`
    ),
    recipientIdx: index('notif_recipient_idx').on(table.recipient_id),
  })
)

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content_type: varchar('content_type', { length: 30 }).notNull(),
    content_id: uuid('content_id').notNull(),
    parent_id: uuid('parent_id').references((): AnyPgColumn => comments.id),
    body: text('body').notNull(),
    is_anonymous: boolean('is_anonymous').notNull().default(false),
    moderation_status: varchar('moderation_status', { length: 20 }).notNull().default('approved'),
    like_count: integer('like_count').notNull().default(0),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contentTypeCheck: check(
      'cm_content_type_check',
      sql`${table.content_type} IN ('story', 'audio_recording')`
    ),
    moderationCheck: check(
      'cm_moderation_check',
      sql`${table.moderation_status} IN ('pending', 'approved', 'rejected')`
    ),
  })
)

// ─── BOOKING + BRIDGE ─────────────────────────────────────────────────────────

export const bookingRequests = pgTable(
  'booking_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // nullable — anonymous dreamers (not signed in) can still send contact requests
    user_id: uuid('user_id').references(() => users.id),
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id),
    session_card_id: uuid('session_card_id').references(() => sessionCards.id),
    channel: varchar('channel', { length: 20 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    requested_date: date('requested_date'),
    requested_time: time('requested_time'),
    requested_duration_minutes: integer('requested_duration_minutes'),
    message: text('message'),
    companion_notes: text('companion_notes'),
    price_quoted: numeric('price_quoted', { precision: 10, scale: 2 }),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusCheck: check(
      'br_status_check',
      sql`${table.status} IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')`
    ),
  })
)

// ─── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────────

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueEndpoint: unique('uq_push_endpoint').on(table.user_id, table.endpoint),
  })
)

export const fantasyTagOverlapScores = pgTable(
  'fantasy_tag_overlap_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id),
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id),
    overlap_score: numeric('overlap_score', { precision: 5, scale: 4 }).notNull(),
    matching_tag_count: integer('matching_tag_count').notNull(),
    total_user_tags: integer('total_user_tags').notNull(),
    total_companion_tags: integer('total_companion_tags').notNull(),
    computed_at: timestamp('computed_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    uniqueScore: unique('uq_overlap_score').on(table.user_id, table.companion_profile_id),
  })
)

// ─── COMPANION STORY BRIDGES ──────────────────────────────────────────────────

export const companionStoryBridges = pgTable(
  'companion_story_bridges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id, { onDelete: 'cascade' }),
    story_id: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    admin_note: text('admin_note'),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueBridge: unique('uq_companion_story_bridge').on(
      table.companion_profile_id,
      table.story_id
    ),
    statusCheck: check(
      'csb_status_check',
      sql`${table.status} IN ('pending','approved','rejected')`
    ),
  })
)

// ─── ANALYTICS EVENTS ─────────────────────────────────────────────────────────

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    event_type: varchar('event_type', { length: 40 }).notNull(),
    companion_profile_id: uuid('companion_profile_id')
      .notNull()
      .references(() => companionProfiles.id, { onDelete: 'cascade' }),
    viewer_user_id: uuid('viewer_user_id').references(() => users.id, { onDelete: 'set null' }),
    story_id: uuid('story_id').references(() => stories.id, { onDelete: 'set null' }),
    // SHA256 of IP+SALT, first 32 chars only
    viewer_ip_hash: varchar('viewer_ip_hash', { length: 32 }),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventTypeCheck: check(
      'ae_event_type_check',
      sql`${table.event_type} IN ('profile_view','story_view','whatsapp_click','bridge_click','search_impression')`
    ),
  })
)

// ─── DEVICE COMMUNITY BINDINGS ────────────────────────────────────────────────

export const deviceCommunityBindings = pgTable('device_community_bindings', {
  fingerprint_hash: varchar('fingerprint_hash', { length: 64 }).primaryKey().notNull(),
  community: varchar('community', { length: 20 }).notNull(),
  companion_id: uuid('companion_id').references(() => companions.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_seen: timestamp('last_seen', { withTimezone: true }).defaultNow().notNull(),
})

// ─── DIDIT EXTRACTED DATA ─────────────────────────────────────────────────────

export const diditExtractedData = pgTable('didit_extracted_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  companion_id: uuid('companion_id')
    .notNull()
    .references(() => companions.id, { onDelete: 'cascade' }),
  session_id: varchar('session_id', { length: 255 }).notNull().unique(),
  // Extracted from ID document via OCR
  extracted_first_name: varchar('extracted_first_name', { length: 100 }),
  extracted_last_name: varchar('extracted_last_name', { length: 100 }),
  extracted_dob: varchar('extracted_dob', { length: 10 }), // YYYY-MM-DD
  document_type: varchar('document_type', { length: 50 }),
  document_number: varchar('document_number', { length: 100 }),
  issuing_state: varchar('issuing_state', { length: 10 }), // ISO 3166-1 alpha-3
  liveness_score: numeric('liveness_score', { precision: 5, scale: 2 }),
  face_match_score: numeric('face_match_score', { precision: 5, scale: 2 }),
  overall_status: varchar('overall_status', { length: 30 }),
  raw_payload: jsonb('raw_payload').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── BOOST / AD SYSTEM ────────────────────────────────────────────────────────
// Tables created by blushbite.live; declared here for Drizzle type safety

export const companionBoosts = pgTable('companion_boosts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companion_id: uuid('companion_id')
    .notNull()
    .references(() => companions.id, { onDelete: 'cascade' }),
  boost_type: varchar('boost_type', { length: 30 }).notNull(),
  // 'featured_1' | 'featured_2' | 'featured_3' | 'header_banner' | 'right_rail' | 'mid_grid'
  community: varchar('community', { length: 20 }).notNull(),
  week_start: date('week_start').notNull(),
  week_end: date('week_end').notNull(),
  price_eur: numeric('price_eur', { precision: 8, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  is_enabled: boolean('is_enabled').default(true),
  banner_image_url: text('banner_image_url'),
  banner_headline: text('banner_headline'),
  banner_tagline: text('banner_tagline'),
  payment_ref: varchar('payment_ref', { length: 100 }),
  payment_status: varchar('payment_status', { length: 20 }).default('manual'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const boostSettings = pgTable('boost_settings', {
  id: integer('id').primaryKey(),
  header_banner_enabled: boolean('header_banner_enabled').notNull().default(true),
  right_rail_enabled: boolean('right_rail_enabled').notNull().default(true),
  mid_grid_enabled: boolean('mid_grid_enabled').notNull().default(true),
  featured_enabled: boolean('featured_enabled').notNull().default(true),
  price_featured_eur: numeric('price_featured_eur', { precision: 8, scale: 2 }).default('15.00'),
  price_header_banner_eur: numeric('price_header_banner_eur', { precision: 8, scale: 2 }).default(
    '25.00'
  ),
  price_right_rail_eur: numeric('price_right_rail_eur', { precision: 8, scale: 2 }).default(
    '15.00'
  ),
  price_mid_grid_eur: numeric('price_mid_grid_eur', { precision: 8, scale: 2 }).default('10.00'),
  max_weeks_advance: integer('max_weeks_advance').default(4),
})
