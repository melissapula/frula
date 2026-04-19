/**
 * Inject JSON-LD structured data into the page <head>.
 *
 * Usage:
 *   useJsonLd({ '@type': 'Organization', name: 'Frula Homes', ... })
 */
export function useJsonLd(data: Record<string, unknown>) {
    useHead({
        script: [
            {
                type: 'application/ld+json',
                innerHTML: JSON.stringify({ '@context': 'https://schema.org', ...data }),
            },
        ],
    })
}
