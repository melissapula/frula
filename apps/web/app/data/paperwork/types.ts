/**
 * Shape of a paperwork directory entry. Each entry describes a single
 * document at an informational level: what it is, who needs it, when
 * it's used, where to get the official version, and commonly reported
 * issues.
 *
 * ⚠️ POSITIONING: Frula Homes is an INFORMATIONAL platform, not a
 * walkthrough service. Entries should describe documents — not teach
 * users how to fill them out field-by-field. Keep content descriptive
 * ("this is a seller disclosure; it covers X, Y, Z") rather than
 * prescriptive ("here's how to answer question 14"). The `fields` array
 * below exists for legacy data shape but is NOT rendered on the public
 * pages — keeping the field data around lets us revisit later without
 * losing work, while the UI stays informational-only.
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
