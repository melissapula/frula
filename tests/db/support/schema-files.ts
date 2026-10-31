import { fileURLToPath } from 'node:url'

export const SUPABASE_DIR = fileURLToPath(new URL('../../../supabase/', import.meta.url))

// MIGRATION_CHECKLIST.md order. The April migrations aren't in the checklist, so they sit
// after the files they alter and before the 2026-10-30 migrations, which must run last.
export const APPLIED_FILES: readonly string[] = [
    'schema.sql',
    'listings_features.sql',
    'listings_terrain.sql',
    'listings_more_fields.sql',
    'listings_dedupe.sql',
    'messages_kinds.sql',
    'messages_flagged.sql',
    'notifications.sql',
    'listing_views.sql',
    'profiles_welcomed_at.sql',
    'zip_market_data.sql',
    'checklist_progress.sql',
    'listings_rls.sql',
    'messages_rls.sql',
    'transactions_rls.sql',
    'migrations/20260421_cascade_fixes.sql',
    'migrations/20260421_message_indexes.sql',
    'migrations/20260421_three_quarter_baths.sql',
    'migrations/20261030_profiles_names_and_rows.sql',
    'migrations/20261030_profiles_column_privileges.sql',
    'migrations/20261030_messages_respond_function.sql',
    'migrations/20261030_messages_lock_writes.sql',
    'migrations/20261030_messages_recipient_rule.sql',
]

export const SKIPPED_FILES: readonly { file: string; reason: string }[] = [
    { file: 'functions.sql', reason: 'Triggers call PostGIS on listing inserts' },
    { file: 'listings_radius.sql', reason: 'Body needs PostGIS at creation' },
    {
        file: 'migrations/20260419_security_rls.sql',
        reason: 'Duplicates policies already in schema.sql (audit item 14)',
    },
    { file: 'seed.sql', reason: 'Seed data' },
    { file: 'seed_listings.sql', reason: 'Seed data' },
    { file: 'seed_mock_listings.sql', reason: 'Seed data, needs PostGIS' },
    { file: 'seed_test_listings.sql', reason: 'Seed data, needs PostGIS' },
]
