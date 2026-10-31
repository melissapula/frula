import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'db',
                    environment: 'node',
                    include: ['tests/db/**/*.test.ts'],
                    // Starting PGlite and applying the schema takes far longer than Vitest's default.
                    hookTimeout: 30_000,
                },
            },
            {
                test: {
                    name: 'routes',
                    environment: 'node',
                    include: ['tests/routes/**/*.test.ts'],
                    // Runs first so no real credentials are in place when Nuxt loads.
                    setupFiles: ['tests/routes/support/test-env.ts'],
                },
            },
        ],
    },
})
