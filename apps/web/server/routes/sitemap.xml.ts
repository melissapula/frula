/**
 * GET /sitemap.xml
 *
 * Generates a dynamic XML sitemap for search engines. Includes:
 *   - Static pages (landing, browse, paperwork, checklists, etc.)
 *   - All active listings (from Supabase)
 *   - All paperwork guide pages (federal + 50 states + concepts)
 *   - Public seller profile pages
 */

import { serverSupabaseServiceRole } from '#supabase/server'

// US state codes for generating paperwork guide slugs.
// Kept inline here to avoid importing from app/ (Nitro can't resolve ~/app paths).
const STATE_CODES = [
    'AL',
    'AK',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'FL',
    'GA',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'OH',
    'OK',
    'OR',
    'PA',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'UT',
    'VT',
    'VA',
    'WA',
    'WV',
    'WI',
    'WY',
    'DC',
]

const CONCEPT_SLUGS = [
    'lead-paint-disclosure',
    'closing-disclosure',
    'form-1099-s',
    'fair-housing-act',
    'sellers-property-disclosure',
    'purchase-agreement',
    'title-insurance',
    'home-inspection',
    'deed-types',
]

const PAPERWORK_SLUGS = [
    ...CONCEPT_SLUGS,
    ...STATE_CODES.map((c) => `${c.toLowerCase()}-real-estate-forms`),
]

const STATIC_PATHS = [
    '/',
    '/browse',
    '/dream-home',
    '/paperwork',
    '/how-we-make-money',
    '/privacy',
    '/terms',
    '/checklist/seller-prep',
    '/checklist/buyer-guide',
]

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const siteUrl = config.public.siteUrl || 'https://frulahomes.com'
    const admin = serverSupabaseServiceRole(event)

    // Fetch active listing IDs + dates
    const { data: listings } = await admin
        .from('listings')
        .select('id, listed_at')
        .eq('status', 'active')
        .order('listed_at', { ascending: false })

    // Fetch unique seller profile IDs
    const { data: sellers } = await admin.from('listings').select('user_id').eq('status', 'active')

    const uniqueSellerIds = [...new Set((sellers ?? []).map((s) => s.user_id))]

    const today = new Date().toISOString().split('T')[0]

    // Build URL entries
    const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = []

    // Static pages
    for (const path of STATIC_PATHS) {
        urls.push({
            loc: `${siteUrl}${path}`,
            lastmod: today,
            changefreq: path === '/' ? 'daily' : 'weekly',
            priority: path === '/' ? '1.0' : '0.7',
        })
    }

    // Paperwork guides
    for (const slug of PAPERWORK_SLUGS) {
        urls.push({
            loc: `${siteUrl}/paperwork/${slug}`,
            lastmod: today,
            changefreq: 'monthly',
            priority: '0.6',
        })
    }

    // Active listings
    for (const listing of listings ?? []) {
        const lastmod = listing.listed_at
            ? new Date(listing.listed_at).toISOString().split('T')[0]
            : today
        urls.push({
            loc: `${siteUrl}/listing/${listing.id}`,
            lastmod,
            changefreq: 'weekly',
            priority: '0.8',
        })
    }

    // Seller profiles
    for (const sellerId of uniqueSellerIds) {
        urls.push({
            loc: `${siteUrl}/seller/${sellerId}`,
            lastmod: today,
            changefreq: 'weekly',
            priority: '0.5',
        })
    }

    // Generate XML
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(
            (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
        ),
        '</urlset>',
    ].join('\n')

    setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
    setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')
    return xml
})

function escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
