#!/usr/bin/env node

/**
 * Paperwork Link Health Checker
 *
 * Checks every external URL in the paperwork directory (state commission
 * sites + federal form URLs) to verify they're still reachable. Reports
 * broken links with status codes.
 *
 * Usage:
 *   node scripts/check-paperwork-links.mjs
 *
 * Exit codes:
 *   0 — all links healthy
 *   1 — one or more broken links found
 *
 * Designed to run as a daily GitHub Actions cron job.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Parse state resources to extract URLs
const stateResourcesPath = resolve(
    __dirname,
    '../apps/web/app/data/paperwork/state-resources.ts',
)
const stateContent = readFileSync(stateResourcesPath, 'utf-8')

// Extract all URLs from state-resources.ts
const stateUrls = []
const stateUrlRegex = /url:\s*'([^']+)'/g
let match
while ((match = stateUrlRegex.exec(stateContent)) !== null) {
    stateUrls.push(match[1])
}

// Extract state names for labeling
const stateNameRegex = /name:\s*'([^']+)'/g
const stateNames = []
while ((match = stateNameRegex.exec(stateContent)) !== null) {
    stateNames.push(match[1])
}

// Federal/concept guide URLs
const FEDERAL_URLS = [
    { label: 'EPA Lead Paint Disclosure', url: 'https://www.epa.gov/lead/real-estate-disclosure' },
    { label: 'CFPB Closing Disclosure', url: 'https://www.consumerfinance.gov/owning-a-home/closing-disclosure/' },
    { label: 'IRS Form 1099-S', url: 'https://www.irs.gov/forms-pubs/about-form-1099-s' },
    { label: 'HUD Fair Housing Act', url: 'https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview' },
]

// Build full link list
const links = [
    ...FEDERAL_URLS,
    ...stateUrls.map((url, i) => ({
        label: stateNames[i] || `State ${i + 1}`,
        url,
    })),
]

// Check a single URL with timeout and redirect following
async function checkUrl(url, timeoutMs = 15000) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const res = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'FrulaHomes-LinkChecker/1.0 (https://frulahomes.com)',
            },
        })
        clearTimeout(timer)
        return { ok: res.ok, status: res.status }
    } catch (err) {
        clearTimeout(timer)
        // Some servers reject HEAD requests — retry with GET
        try {
            const controller2 = new AbortController()
            const timer2 = setTimeout(() => controller2.abort(), timeoutMs)
            const res = await fetch(url, {
                method: 'GET',
                signal: controller2.signal,
                redirect: 'follow',
                headers: {
                    'User-Agent': 'FrulaHomes-LinkChecker/1.0 (https://frulahomes.com)',
                },
            })
            clearTimeout(timer2)
            return { ok: res.ok, status: res.status }
        } catch (err2) {
            return { ok: false, status: err2.name === 'AbortError' ? 'TIMEOUT' : 'ERROR' }
        }
    }
}

// Run all checks with concurrency limit
async function main() {
    console.log(`Checking ${links.length} paperwork links...\n`)

    const broken = []
    const warnings = []
    let checked = 0

    // Process in batches of 5 to be polite to servers
    const BATCH_SIZE = 5
    for (let i = 0; i < links.length; i += BATCH_SIZE) {
        const batch = links.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(
            batch.map(async (link) => {
                const result = await checkUrl(link.url)
                checked++
                const icon = result.ok ? '\u2713' : '\u2717'
                const statusStr =
                    typeof result.status === 'number' ? result.status.toString() : result.status
                console.log(`  ${icon} [${statusStr}] ${link.label}: ${link.url}`)
                return { ...link, ...result }
            }),
        )
        for (const r of results) {
            if (!r.ok) {
                if (r.status === 403 || r.status === 405) {
                    // Some government sites block automated requests — flag as warning, not broken
                    warnings.push(r)
                } else {
                    broken.push(r)
                }
            }
        }
    }

    console.log(`\n--- Results ---`)
    console.log(`Checked: ${checked}`)
    console.log(`Healthy: ${checked - broken.length - warnings.length}`)
    console.log(`Warnings (403/405 — may block bots): ${warnings.length}`)
    console.log(`Broken: ${broken.length}`)

    if (warnings.length > 0) {
        console.log(`\nWarnings:`)
        for (const w of warnings) {
            console.log(`  [${w.status}] ${w.label}: ${w.url}`)
        }
    }

    if (broken.length > 0) {
        console.log(`\nBroken links:`)
        for (const b of broken) {
            console.log(`  [${b.status}] ${b.label}: ${b.url}`)
        }
        process.exit(1)
    }

    console.log(`\nAll links healthy!`)
    process.exit(0)
}

main().catch((err) => {
    console.error('Link checker failed:', err)
    process.exit(1)
})
