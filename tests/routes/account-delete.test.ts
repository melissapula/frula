import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import {
    CLOSE_ACCOUNT_PATH,
    authUserPath,
    sessionCookieFor,
    startFakeServices,
} from './support/fake-services'

const ROUTE = '/api/account/delete'
const CLOSE_FAILED = 'Failed to delete account data. Please try again.'
const SIGN_IN_NOT_CLOSED =
    "Your data was deleted, but we couldn't close your sign-in. Please try again."

let fake: Awaited<ReturnType<typeof startFakeServices>>

const postRoute = (cookie?: string) =>
    fetch(ROUTE, { method: 'POST', headers: cookie ? { Cookie: cookie } : {} })

const closeCallsFor = (userId: string) =>
    fake
        .callsTo(CLOSE_ACCOUNT_PATH)
        .filter((call) => (call.body as { p_user: string }).p_user === userId)

const authDeletesFor = (userId: string) => fake.callsTo(authUserPath(userId), 'DELETE')

describe('POST /api/account/delete', async () => {
    beforeAll(async () => {
        fake = await startFakeServices()
    })

    afterAll(async () => {
        await fake.stop()
    })

    afterEach(() => {
        fake.setCloseAccountResult('deleted')
        fake.failAuthDelete(false)
    })

    await setup({ rootDir: fileURLToPath(new URL('../../apps/web', import.meta.url)) })

    // serverSupabaseUser throws when there is no session, so the route's own 401 is never reached
    // (audit item 19).
    it('returns 500 with no session, and closes nothing', async () => {
        const closeCallsBefore = fake.callsTo(CLOSE_ACCOUNT_PATH).length

        const response = await postRoute()

        expect(response.status).toBe(500)
        expect(fake.callsTo(CLOSE_ACCOUNT_PATH)).toHaveLength(closeCallsBefore)
    })

    // A fresh user per test, because the route allows 3 calls an hour per user.
    it('closes the Frula account and deletes the sign-in for a Frula-only user', async () => {
        const userId = fake.addUser()

        const response = await postRoute(sessionCookieFor(userId))

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ deleted: true, signInKept: false })
        expect(closeCallsFor(userId)).toHaveLength(1)
        expect(authDeletesFor(userId)).toHaveLength(1)
        const order = fake.callOrder()
        expect(order.lastIndexOf(`POST ${CLOSE_ACCOUNT_PATH}`)).toBeLessThan(
            order.lastIndexOf(`DELETE ${authUserPath(userId)}`),
        )
    })

    it('keeps the sign-in when ChoreQuest uses it', async () => {
        const userId = fake.addUser()
        fake.setCloseAccountResult('kept')

        const response = await postRoute(sessionCookieFor(userId))

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ deleted: true, signInKept: true })
        expect(closeCallsFor(userId)).toHaveLength(1)
        expect(authDeletesFor(userId)).toHaveLength(0)
    })

    it('returns 500 and skips the auth delete when closing the account fails', async () => {
        const userId = fake.addUser()
        fake.setCloseAccountResult('error')

        const response = await postRoute(sessionCookieFor(userId))

        expect(response.status).toBe(500)
        expect((await response.json()).message).toBe(CLOSE_FAILED)
        expect(authDeletesFor(userId)).toHaveLength(0)
    })

    it('returns an error, not success, when the auth delete fails', async () => {
        const userId = fake.addUser()
        fake.failAuthDelete(true)

        const response = await postRoute(sessionCookieFor(userId))

        expect(response.status).toBe(500)
        // account.vue shows the body's message to the person.
        expect((await response.json()).message).toBe(SIGN_IN_NOT_CLOSED)
    })

    it('a retry after a failed auth delete succeeds', async () => {
        const userId = fake.addUser()
        const cookie = sessionCookieFor(userId)
        fake.failAuthDelete(true)
        await postRoute(cookie)
        fake.failAuthDelete(false)

        const response = await postRoute(cookie)

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ deleted: true, signInKept: false })
        expect(closeCallsFor(userId)).toHaveLength(2)
        expect(authDeletesFor(userId)).toHaveLength(2)
    })
})
