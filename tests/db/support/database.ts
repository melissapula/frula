import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { APPLIED_FILES, SUPABASE_DIR } from './schema-files'

export type Role = 'anon' | 'authenticated' | 'service_role'

export interface QueryResult {
    rows?: Record<string, unknown>[]
    error?: string
}

// Stands in for what Supabase provides. A pass proves what the repo's SQL does under these
// fakes, and says nothing about what production has.
const SUPABASE_STAND_IN = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT NULLIF(current_setting('request.jwt.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
  -- Mimics Supabase's default grants on new public tables.
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated, service_role;
`

const withoutPostgis = (sql: string): string =>
    sql
        .replace(/CREATE EXTENSION IF NOT EXISTS postgis;/g, '')
        .replace(/GEOGRAPHY\(POINT, 4326\)/g, 'TEXT')
        .replace(/CREATE INDEX \w+ ON public\.\w+ USING GIST \(location\);/g, '')

function readSchemaFile(file: string): string {
    const sql = readFileSync(join(SUPABASE_DIR, file), 'utf8')
    return file === 'schema.sql' ? withoutPostgis(sql) : sql
}

export async function createTestDatabase(): Promise<PGlite> {
    const db = new PGlite()
    await db.exec(SUPABASE_STAND_IN)

    for (const file of APPLIED_FILES) {
        try {
            await db.exec(readSchemaFile(file))
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to apply ${file}: ${message}`, { cause: error })
        }
    }

    return db
}

export async function as(
    db: PGlite,
    role: Role,
    userId: string | null,
    sql: string,
): Promise<QueryResult> {
    await db.exec('BEGIN')
    try {
        await db.query(`SELECT set_config('request.jwt.sub', $1, true)`, [userId ?? ''])
        await db.exec(`SET LOCAL ROLE ${role}`)
        const { rows } = await db.query<Record<string, unknown>>(sql)
        return { rows }
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) }
    } finally {
        await db.exec('ROLLBACK')
    }
}

export const isDenied = (result: QueryResult): boolean =>
    /permission denied/.test(result.error ?? '')
