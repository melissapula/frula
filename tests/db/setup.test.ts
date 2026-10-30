import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { as, createTestDatabase } from './support/database'
import { APPLIED_FILES, SKIPPED_FILES, SUPABASE_DIR } from './support/schema-files'

const sqlFilesIn = (subdirectory: string) =>
    readdirSync(join(SUPABASE_DIR, subdirectory))
        .filter((name) => name.endsWith('.sql'))
        .map((name) => join(subdirectory, name).replaceAll('\\', '/'))

describe('schema file list', () => {
    it('accounts for every .sql file under supabase/', () => {
        const listed = [...APPLIED_FILES, ...SKIPPED_FILES.map(({ file }) => file)]
        const onDisk = [...sqlFilesIn(''), ...sqlFilesIn('migrations')]

        expect(onDisk.filter((file) => !listed.includes(file))).toEqual([])
    })
})

describe('as', () => {
    let db: PGlite

    beforeAll(async () => {
        db = await createTestDatabase()
    })

    afterAll(async () => {
        await db.close()
    })

    // PGlite connects as a superuser, which ignores row rules, so every RLS test
    // depends on this one.
    it('really drops privileges to the requested role', async () => {
        const result = await as(db, 'anon', null, 'SELECT current_user')

        expect(result.rows).toEqual([{ current_user: 'anon' }])
    })
})
