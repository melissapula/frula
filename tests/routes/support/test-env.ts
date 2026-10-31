export const FAKE_SERVICES_PORT = 54398
export const FAKE_SERVICES_URL = `http://127.0.0.1:${FAKE_SERVICES_PORT}`

// Set before Nuxt loads, because dotenv does not replace a variable that already exists. The NUXT_
// names matter as much as the plain ones: they override runtime config in the built server, and the
// repo root .env defines two of them.
const FAKE_ENV = {
    SUPABASE_URL: FAKE_SERVICES_URL,
    SUPABASE_KEY: 'fake-anon-key',
    SUPABASE_SERVICE_KEY: 'fake-service-key',
    NUXT_PUBLIC_SUPABASE_URL: FAKE_SERVICES_URL,
    NUXT_PUBLIC_SUPABASE_KEY: 'fake-anon-key',
    NUXT_SUPABASE_SERVICE_KEY: 'fake-service-key',
    RESEND_API_KEY: 'fake-resend-key',
    RESEND_API_URL: FAKE_SERVICES_URL,
    NUXT_RESEND_API_KEY: 'fake-resend-key',
    NUXT_RESEND_API_URL: FAKE_SERVICES_URL,
}

Object.assign(process.env, FAKE_ENV)

for (const name of [
    'SUPABASE_URL',
    'NUXT_PUBLIC_SUPABASE_URL',
    'RESEND_API_URL',
    'NUXT_RESEND_API_URL',
]) {
    if (!process.env[name]?.startsWith('http://127.0.0.1')) {
        throw new Error(`${name} must point at the local fake`)
    }
}
