#!/usr/bin/env node
/**
 * Ingest Zillow Research ZHVI (Zillow Home Value Index) data into the
 * `zip_market_data` Supabase table.
 *
 * Run manually (or wire to a monthly cron later):
 *   node scripts/ingest-zillow-zhvi.mjs
 *
 * Required env vars (load from apps/web/.env or pass inline):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (NOT the anon key — needs upsert permission)
 *
 * What it does:
 *   1. Downloads the latest ZHVI ZIP-level CSV from Zillow Research
 *   2. Parses each row to extract the latest two months of values
 *   3. Computes year-over-year change
 *   4. Bulk-upserts into zip_market_data
 *
 * Data source: https://www.zillow.com/research/data/
 * License: free for non-commercial use with attribution. We always
 * render "Data: Zillow Research" wherever ZHVI values appear.
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { createClient } from '@supabase/supabase-js'

// Zillow's ZHVI public CSV URL — ZIP level, all homes, smoothed seasonally adjusted
// (the file Zillow updates monthly; URL is stable)
const ZHVI_URL =
    'https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
        '❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.\n' +
            '   Get the service role key from Supabase dashboard → Settings → API.',
    )
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

console.log('📥 Downloading Zillow ZHVI CSV...')
const response = await fetch(ZHVI_URL)
if (!response.ok) {
    console.error(`❌ Failed to download: ${response.status} ${response.statusText}`)
    process.exit(1)
}

const tmpDir = path.join(process.cwd(), '.tmp')
fs.mkdirSync(tmpDir, { recursive: true })
const tmpFile = path.join(tmpDir, 'zhvi.csv')
fs.writeFileSync(tmpFile, Buffer.from(await response.arrayBuffer()))
console.log(`✓ Downloaded to ${tmpFile}`)

// Parse the CSV. Header columns include metadata + a long tail of YYYY-MM-DD month columns.
const fileStream = fs.createReadStream(tmpFile)
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

let header = null
const rows = []
for await (const line of rl) {
    if (!header) {
        header = parseCsvLine(line)
        continue
    }
    if (!line.trim()) continue
    rows.push(parseCsvLine(line))
}

console.log(`✓ Parsed ${rows.length} ZIP rows`)

// Identify metadata vs date columns
const metaCols = {}
const dateCols = []
header.forEach((col, i) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(col)) {
        dateCols.push({ index: i, date: col })
    } else {
        metaCols[col] = i
    }
})
dateCols.sort((a, b) => a.date.localeCompare(b.date))
const latestCol = dateCols[dateCols.length - 1]
const yearAgoCol =
    dateCols.find((d) => {
        const latestDate = new Date(latestCol.date)
        const target = new Date(latestDate)
        target.setFullYear(target.getFullYear() - 1)
        return d.date === target.toISOString().slice(0, 10)
    }) ?? dateCols[Math.max(0, dateCols.length - 13)]

console.log(`✓ Latest data month: ${latestCol.date}`)
console.log(`✓ Year-ago column:   ${yearAgoCol.date}`)

const records = []
for (const row of rows) {
    const zip = row[metaCols['RegionName']]
    const city = row[metaCols['City']]
    const state = row[metaCols['State']]
    const metro = row[metaCols['Metro']]
    const county = row[metaCols['CountyName']]

    const latestRaw = row[latestCol.index]
    const yearAgoRaw = row[yearAgoCol.index]
    if (!zip || !latestRaw) continue

    const latest = parseFloat(latestRaw)
    const yearAgo = parseFloat(yearAgoRaw)
    if (Number.isNaN(latest)) continue

    const yoyPct =
        !Number.isNaN(yearAgo) && yearAgo > 0
            ? Number((((latest - yearAgo) / yearAgo) * 100).toFixed(2))
            : null

    records.push({
        zip: String(zip).padStart(5, '0'),
        median_home_value: Number(latest.toFixed(2)),
        yoy_change_pct: yoyPct,
        data_month: latestCol.date,
        city: city || null,
        state: state || null,
        metro: metro || null,
        county: county || null,
        data_source: 'zillow_zhvi',
        updated_at: new Date().toISOString(),
    })
}

console.log(`✓ Built ${records.length} records to upsert`)

// Bulk upsert in batches of 1000
const BATCH = 1000
let written = 0
for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH)
    const { error } = await supabase.from('zip_market_data').upsert(chunk, { onConflict: 'zip' })
    if (error) {
        console.error(`❌ Upsert failed at batch ${i}:`, error.message)
        process.exit(1)
    }
    written += chunk.length
    process.stdout.write(`\r  → upserted ${written} / ${records.length}`)
}
console.log('\n✅ Done!')

// Cleanup tmp file
fs.unlinkSync(tmpFile)

// Tiny CSV parser that handles quoted fields with commas
function parseCsvLine(line) {
    const out = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                cur += '"'
                i++
            } else if (ch === '"') {
                inQuotes = false
            } else {
                cur += ch
            }
        } else {
            if (ch === ',') {
                out.push(cur)
                cur = ''
            } else if (ch === '"') {
                inQuotes = true
            } else {
                cur += ch
            }
        }
    }
    out.push(cur)
    return out
}
