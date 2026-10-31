import { randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { FAKE_SERVICES_PORT } from './test-env'

// supabase-js names the cookie after the first part of the host: 127 for 127.0.0.1.
const SESSION_COOKIE = 'sb-127-auth-token'
const ONE_HOUR_IN_SECONDS = 3600

type Row = Record<string, unknown>
type Table = 'messages' | 'profiles' | 'listings'

export interface RecordedCall {
    method: string
    path: string
    authorization: string | undefined
    body: unknown
}

const fakeUser = (id: string) => ({
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: `${id}@example.test`,
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
})

const readJson = async (request: IncomingMessage): Promise<unknown> => {
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(chunk as Buffer)
    const text = Buffer.concat(chunks).toString()
    return text ? JSON.parse(text) : undefined
}

const reply = (response: ServerResponse, status: number, body: unknown) => {
    response.writeHead(status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(body))
}

export const sessionCookieFor = (userId: string): string => {
    const session = {
        access_token: `token-${userId}`,
        refresh_token: `refresh-${userId}`,
        token_type: 'bearer',
        expires_in: ONE_HOUR_IN_SECONDS,
        expires_at: Math.floor(Date.now() / 1000) + ONE_HOUR_IN_SECONDS,
        user: fakeUser(userId),
    }
    const encoded = Buffer.from(JSON.stringify(session)).toString('base64url')
    return `${SESSION_COOKIE}=base64-${encoded}`
}

export const startFakeServices = async () => {
    const calls: RecordedCall[] = []
    const users = new Set<string>()
    const tables: Record<Table, Row[]> = { messages: [], profiles: [], listings: [] }
    let isResendFailing = false

    const handle = async (request: IncomingMessage, response: ServerResponse) => {
        const url = new URL(request.url ?? '/', 'http://fake')
        const body = await readJson(request)
        calls.push({
            method: request.method ?? '',
            path: url.pathname,
            authorization: request.headers.authorization,
            body,
        })

        if (request.method === 'GET' && url.pathname === '/auth/v1/user') {
            const userId = request.headers.authorization?.replace('Bearer token-', '') ?? ''
            return users.has(userId)
                ? reply(response, 200, fakeUser(userId))
                : reply(response, 401, { message: 'invalid token' })
        }

        const table = url.pathname.match(/^\/rest\/v1\/(messages|profiles|listings)$/)?.[1]
        if (request.method === 'GET' && table) {
            const id = url.searchParams.get('id')?.replace('eq.', '')
            return reply(
                response,
                200,
                tables[table as Table].filter((row) => row.id === id),
            )
        }

        if (request.method === 'POST' && url.pathname === '/rest/v1/notifications') {
            return reply(response, 201, null)
        }

        if (request.method === 'POST' && url.pathname === '/emails') {
            return isResendFailing
                ? reply(response, 500, { message: 'resend is down' })
                : reply(response, 200, { id: randomUUID() })
        }

        return reply(response, 404, { message: 'no fake for this call' })
    }

    const server = createServer((request, response) => {
        handle(request, response).catch(() => reply(response, 500, { message: 'fake failed' }))
    })
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(FAKE_SERVICES_PORT, '127.0.0.1', resolve)
    })

    return {
        addUser: (): string => {
            const id = randomUUID()
            users.add(id)
            return id
        },
        seed: (table: Table, row: Row) => tables[table].push(row),
        failResend: (isFailing: boolean) => {
            isResendFailing = isFailing
        },
        callsTo: (path: string, method = 'POST') =>
            calls.filter((call) => call.path === path && call.method === method),
        stop: () => new Promise((resolve) => server.close(resolve)),
    }
}
