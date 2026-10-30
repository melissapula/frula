import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        // Starting PGlite and applying the schema takes far longer than Vitest's default.
        hookTimeout: 30_000,
    },
})
