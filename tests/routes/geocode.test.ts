import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import {
    CENSUS_MATCH,
    CENSUS_PATH,
    NOMINATIM_MATCH,
    NOMINATIM_PATH,
    startFakeServices,
    type GeocoderResult,
} from './support/fake-services'

const ROUTE = '/api/geocode'
const STREET_ADDRESS = '13109 Lola Drive, Spring Hill, FL 34609'

let fake: Awaited<ReturnType<typeof startFakeServices>>

const getRoute = (params: Record<string, string>) =>
    fetch(`${ROUTE}?${new URLSearchParams(params).toString()}`)

const useGeocoders = (census: GeocoderResult, nominatim: GeocoderResult) => {
    fake.setCensusResult(census)
    fake.setNominatimResult(nominatim)
}

const callCount = (path: string) => fake.callsTo(path, 'GET').length

// The route allows 10 calls a minute per IP, and every request here comes from 127.0.0.1, so the
// whole file must stay at 9 requests or fewer.
describe('GET /api/geocode', async () => {
    beforeAll(async () => {
        fake = await startFakeServices()
    })

    afterEach(() => {
        useGeocoders('match', 'match')
    })

    afterAll(async () => {
        await fake.stop()
    })

    await setup({ rootDir: fileURLToPath(new URL('../../apps/web', import.meta.url)) })

    it('returns the Census match for kind=address, without calling Nominatim', async () => {
        useGeocoders('match', 'match')
        const nominatimCallsBefore = callCount(NOMINATIM_PATH)

        const response = await getRoute({ q: STREET_ADDRESS, kind: 'address' })

        expect(await response.json()).toEqual({ ...CENSUS_MATCH, source: 'census' })
        expect(callCount(NOMINATIM_PATH)).toBe(nominatimCallsBefore)
    })

    it('falls back to Nominatim for kind=address when Census has no match', async () => {
        useGeocoders('none', 'match')

        const response = await getRoute({ q: STREET_ADDRESS, kind: 'address' })

        expect(await response.json()).toEqual({ ...NOMINATIM_MATCH, source: 'nominatim' })
    })

    it('falls back to Nominatim for kind=address when Census is down', async () => {
        useGeocoders('down', 'match')

        const response = await getRoute({ q: STREET_ADDRESS, kind: 'address' })

        expect(await response.json()).toEqual({ ...NOMINATIM_MATCH, source: 'nominatim' })
    })

    it('returns 404 for kind=address when neither geocoder has a match', async () => {
        useGeocoders('none', 'none')

        const response = await getRoute({ q: STREET_ADDRESS, kind: 'address' })

        expect(response.status).toBe(404)
    })

    it('never calls Census without kind, which the browse near search relies on', async () => {
        useGeocoders('match', 'match')
        const censusCallsBefore = callCount(CENSUS_PATH)

        const response = await getRoute({ q: 'Bemidji, MN' })

        expect(await response.json()).toEqual({ ...NOMINATIM_MATCH, source: 'nominatim' })
        expect(callCount(CENSUS_PATH)).toBe(censusCallsBefore)
    })

    it('returns 400 when q is missing or blank', async () => {
        const missing = await getRoute({})
        const blank = await getRoute({ q: '   ' })

        expect(missing.status).toBe(400)
        expect(blank.status).toBe(400)
    })

    it('returns 400 when q is over 200 characters, without calling a geocoder', async () => {
        const nominatimCallsBefore = callCount(NOMINATIM_PATH)

        const response = await getRoute({ q: 'a'.repeat(201) })

        expect(response.status).toBe(400)
        expect(callCount(NOMINATIM_PATH)).toBe(nominatimCallsBefore)
    })

    it('returns 502 without kind when Nominatim is down', async () => {
        useGeocoders('match', 'down')

        const response = await getRoute({ q: 'Bemidji, MN' })

        expect(response.status).toBe(502)
    })
})
