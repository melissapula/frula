export interface ChecklistItem {
    id: string
    phase: string
    title: string
    description?: string
    due_offset_days?: number
    required?: boolean
    guide_key?: string
    completed?: boolean
    completed_at?: string | null
    completed_by?: string | null
}

export interface TransactionChecklist {
    id: string
    transaction_id: string
    user_id: string
    role: 'seller' | 'buyer'
    items: ChecklistItem[]
    created_at: string
    updated_at: string
}

export interface Transaction {
    id: string
    listing_id: string
    seller_id: string
    buyer_id: string | null
    offer_accepted_at: string | null
    closing_date: string | null
    offer_price: number | null
    created_at: string
}

export const PHASE_LABELS: Record<string, string> = {
    immediately: 'Immediately after offer',
    disclosure: 'Disclosures',
    inspection: 'Inspection period',
    pre_closing: 'Pre-closing',
    closing: 'Closing day',
}

export const PHASE_ORDER = ['immediately', 'disclosure', 'inspection', 'pre_closing', 'closing']

/**
 * Group items by phase, preserving template order within each phase.
 */
export function groupByPhase(
    items: ChecklistItem[],
): { phase: string; label: string; items: ChecklistItem[] }[] {
    const groups = new Map<string, ChecklistItem[]>()
    for (const item of items) {
        const list = groups.get(item.phase) ?? []
        list.push(item)
        groups.set(item.phase, list)
    }
    return PHASE_ORDER.filter((p) => groups.has(p)).map((p) => ({
        phase: p,
        label: PHASE_LABELS[p] ?? p,
        items: groups.get(p)!,
    }))
}

/**
 * Seed a fresh transaction_checklists.items array from a template's items.
 * Adds the completion-tracking fields.
 */
export function seedItemsFromTemplate(templateItems: ChecklistItem[]): ChecklistItem[] {
    return templateItems.map((it) => ({
        ...it,
        completed: false,
        completed_at: null,
        completed_by: null,
    }))
}

export function progress(items: ChecklistItem[]) {
    const total = items.length
    const done = items.filter((i) => i.completed).length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
}
