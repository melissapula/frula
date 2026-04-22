// Regenerates the favicon PNG set from the 512x512 source by trimming
// blank whitespace and re-padding with an even margin. Safe to re-run.
//
// Usage: node scripts/regenerate-favicons.mjs

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'apps', 'web', 'public')
const SOURCE = join(PUBLIC_DIR, 'android-chrome-512x512.png')

// Proportional padding around the trimmed mark. 0.08 = 8% on each side.
const PADDING_RATIO = 0.08

const TARGETS = [
    { file: 'favicon-16x16.png', size: 16 },
    { file: 'favicon-32x32.png', size: 32 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'android-chrome-192x192.png', size: 192 },
    { file: 'android-chrome-512x512.png', size: 512 },
]

async function main() {
    const trimmed = await sharp(SOURCE).trim().toBuffer()
    const { width, height } = await sharp(trimmed).metadata()

    const longSide = Math.max(width, height)
    const pad = Math.round(longSide * PADDING_RATIO)
    const canvas = longSide + pad * 2

    // Center the trimmed mark on a transparent square canvas with breathing room.
    const squared = await sharp({
        create: {
            width: canvas,
            height: canvas,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([
            {
                input: trimmed,
                top: Math.round((canvas - height) / 2),
                left: Math.round((canvas - width) / 2),
            },
        ])
        .png()
        .toBuffer()

    for (const { file, size } of TARGETS) {
        const out = join(PUBLIC_DIR, file)
        await sharp(squared).resize(size, size).png().toFile(out)
        console.log(`wrote ${file} (${size}x${size})`)
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
