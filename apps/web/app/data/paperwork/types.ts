/**
 * Shape of a paperwork guide. Each guide is a structured walkthrough
 * of a single document: what it is, who fills it out, when, where to
 * get the official blank PDF, field-by-field guidance, and common
 * mistakes drawn from real-world experience.
 *
 * IMPORTANT: We never prepare or fill out the actual document for the
 * user. We guide them through filling it themselves. That's the legal
 * line between "educational platform" (TurboTax) and "practicing law"
 * (regulated profession). Every guide should respect that line.
 */

export type PaperworkRole = 'seller' | 'buyer' | 'both'

/** Where in the transaction this document lives. */
export type PaperworkPhase =
    | 'before_listing'
    | 'on_offer'
    | 'disclosure'
    | 'inspection'
    | 'pre_closing'
    | 'closing'
    | 'post_closing'

export interface PaperworkField {
    /** Plain-English label for the line/box on the form */
    label: string
    /** What goes here, in everyday language */
    explanation: string
    /** Optional warning / pitfall */
    warning?: string
}

export interface PaperworkSection {
    /** Section heading inside the guide */
    title: string
    /** Optional intro paragraph for the section */
    intro?: string
    /** Optional list of form fields walked through one by one */
    fields?: PaperworkField[]
    /** Optional free-form body paragraphs (markdown-flavored plain text) */
    body?: string[]
}

export interface PaperworkGuide {
    /** URL slug, e.g. "lead-paint-disclosure" */
    slug: string
    /** Two-letter state code, or "US" for federal */
    state: string
    /** Display name */
    title: string
    /** One-line summary used in cards and search */
    summary: string
    /** Who needs to deal with this document */
    role: PaperworkRole
    /** Where in the transaction this happens */
    phase: PaperworkPhase
    /** Estimated time to complete, in human terms */
    estimatedTime?: string
    /** Where to download the OFFICIAL blank PDF — never our own copy */
    officialPdfUrl?: string
    officialPdfSource?: string
    /** Property types this applies to. Empty array = all types. */
    propertyTypes?: ('residential' | 'condo' | 'multi-family' | 'land' | 'commercial')[]
    /** Quick "what is this" intro paragraph */
    intro: string
    /** Detailed walkthrough sections */
    sections: PaperworkSection[]
    /** Common mistakes / pitfalls */
    commonMistakes?: string[]
    /** Last reviewed by a human with state-specific expertise */
    lastReviewed?: string
    /** Reviewer's name + credential — builds trust and CYA */
    reviewedBy?: string
}

/** Display labels for phases, in chronological order */
export const PHASE_LABELS: Record<PaperworkPhase, string> = {
    before_listing: 'Before listing',
    on_offer: 'When an offer comes in',
    disclosure: 'Disclosure period',
    inspection: 'Inspection period',
    pre_closing: 'Before closing',
    closing: 'Closing day',
    post_closing: 'After closing',
}

export const PHASE_ORDER: PaperworkPhase[] = [
    'before_listing',
    'on_offer',
    'disclosure',
    'inspection',
    'pre_closing',
    'closing',
    'post_closing',
]

export const ROLE_LABELS: Record<PaperworkRole, string> = {
    seller: 'Seller',
    buyer: 'Buyer',
    both: 'Both',
}
