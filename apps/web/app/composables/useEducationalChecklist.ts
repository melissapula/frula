export interface ChecklistItem {
    id: string
    title: string
    detail: string
}

export interface ChecklistPhase {
    label: string
    items: ChecklistItem[]
}

export interface ChecklistDef {
    title: string
    subtitle: string
    phases: ChecklistPhase[]
}

// =============================================
// SELLER PREP CHECKLIST
// =============================================
const SELLER_PREP: ChecklistDef = {
    title: 'Prepare your home for sale',
    subtitle:
        'A step-by-step guide to getting your home ready to list. Work through each phase at your own pace — check items off as you go.',
    phases: [
        {
            label: 'Assess and plan',
            items: [
                {
                    id: 'sp-1',
                    title: 'Research your local market',
                    detail: "Look at recent sales in your area to understand pricing. Frula's Market Snapshot can help.",
                },
                {
                    id: 'sp-2',
                    title: 'Decide on your timeline',
                    detail: 'Determine when you want to list and your target closing date.',
                },
                {
                    id: 'sp-3',
                    title: 'Get a pre-listing home inspection',
                    detail: 'Find issues before buyers do. Gives you time to fix or disclose.',
                },
                {
                    id: 'sp-4',
                    title: "Research your state's disclosure requirements",
                    detail: "Every state has different seller disclosure rules. Check Frula's paperwork directory.",
                },
                {
                    id: 'sp-5',
                    title: 'Set a realistic asking price',
                    detail: 'Use comparable sales data, not emotion. Consider getting a professional appraisal.',
                },
            ],
        },
        {
            label: 'Repairs and improvements',
            items: [
                {
                    id: 'sp-6',
                    title: 'Fix obvious maintenance issues',
                    detail: 'Leaky faucets, broken outlets, cracked tiles. Buyers notice everything.',
                },
                {
                    id: 'sp-7',
                    title: 'Deep clean the entire home',
                    detail: 'Carpets, windows, grout, appliances. Consider hiring a professional cleaning service.',
                },
                {
                    id: 'sp-8',
                    title: 'Touch up paint and patch holes',
                    detail: 'Fresh neutral paint is the highest-ROI improvement you can make.',
                },
                {
                    id: 'sp-9',
                    title: 'Improve curb appeal',
                    detail: 'Mow, edge, mulch, power-wash the driveway, clean the front door.',
                },
                {
                    id: 'sp-10',
                    title: 'Address any safety concerns',
                    detail: 'Smoke detectors, carbon monoxide detectors, handrails, GFCIs near water.',
                },
            ],
        },
        {
            label: 'Prepare your listing',
            items: [
                {
                    id: 'sp-11',
                    title: 'Declutter and depersonalize',
                    detail: 'Remove personal photos, excess furniture, and clutter. Buyers need to imagine themselves living there.',
                },
                {
                    id: 'sp-12',
                    title: 'Stage key rooms',
                    detail: 'Focus on the living room, kitchen, and primary bedroom. Clean sight lines and good lighting.',
                },
                {
                    id: 'sp-13',
                    title: 'Take high-quality photos',
                    detail: 'Use natural light, shoot from corners, and capture every room. Consider hiring a photographer.',
                },
                {
                    id: 'sp-14',
                    title: 'Write a compelling property description',
                    detail: 'Highlight key features, recent upgrades, and neighborhood amenities.',
                },
                {
                    id: 'sp-15',
                    title: 'Gather key documents',
                    detail: 'Property survey, HOA docs, utility costs, tax records, warranty info.',
                },
            ],
        },
        {
            label: 'Get ready to show',
            items: [
                {
                    id: 'sp-16',
                    title: 'Create a showing routine',
                    detail: "Plan how you'll handle viewing requests. Keep the home show-ready.",
                },
                {
                    id: 'sp-17',
                    title: 'Secure valuables and medications',
                    detail: 'Lock away anything valuable or sensitive before showings.',
                },
                {
                    id: 'sp-18',
                    title: 'Prepare a property fact sheet',
                    detail: 'One-page handout for buyers with key specs, upgrades, and neighborhood info.',
                },
                {
                    id: 'sp-19',
                    title: 'Know your bottom line',
                    detail: "Decide the lowest price you'll accept before negotiations start.",
                },
                {
                    id: 'sp-20',
                    title: 'Line up your closing team',
                    detail: 'Research title companies and real estate attorneys in your area.',
                },
            ],
        },
    ],
}

// =============================================
// BUYER GUIDE CHECKLIST
// =============================================
const BUYER_GUIDE: ChecklistDef = {
    title: 'What to look for when buying a home',
    subtitle:
        'A practical guide for homebuyers — from getting your finances ready to closing day. Check items off as you work through them.',
    phases: [
        {
            label: 'Financial preparation',
            items: [
                {
                    id: 'bg-1',
                    title: 'Check your credit report',
                    detail: 'Review all three bureaus for errors. Dispute anything inaccurate.',
                },
                {
                    id: 'bg-2',
                    title: 'Get pre-approved for a mortgage',
                    detail: 'Know your budget before you start looking. Sellers take pre-approved buyers more seriously.',
                },
                {
                    id: 'bg-3',
                    title: 'Calculate your total monthly cost',
                    detail: 'Mortgage + property tax + insurance + HOA + maintenance. Not just the purchase price.',
                },
                {
                    id: 'bg-4',
                    title: 'Save for closing costs',
                    detail: 'Budget 2-5% of purchase price for closing costs on top of your down payment.',
                },
                {
                    id: 'bg-5',
                    title: 'Understand your loan options',
                    detail: 'Conventional, FHA, VA, USDA. Each has different down payment and eligibility requirements.',
                },
            ],
        },
        {
            label: 'Finding the right home',
            items: [
                {
                    id: 'bg-6',
                    title: 'Define your must-haves vs. nice-to-haves',
                    detail: 'Bedrooms, location, yard, garage. Know what you will not compromise on.',
                },
                {
                    id: 'bg-7',
                    title: 'Research neighborhoods',
                    detail: 'Schools, commute times, crime stats, future development plans, flood zones.',
                },
                {
                    id: 'bg-8',
                    title: 'Visit homes at different times of day',
                    detail: 'A quiet street at 10am might be a highway at 5pm. Check noise, traffic, light.',
                },
                {
                    id: 'bg-9',
                    title: 'Look beyond cosmetics',
                    detail: 'Fresh paint and staging hide a lot. Focus on bones: roof, foundation, HVAC, plumbing, electrical.',
                },
                {
                    id: 'bg-10',
                    title: 'Check the lot and exterior',
                    detail: 'Drainage, grading, retaining walls, trees near foundation, fence condition.',
                },
            ],
        },
        {
            label: 'Evaluating a specific property',
            items: [
                {
                    id: 'bg-11',
                    title: "Review the seller's disclosures carefully",
                    detail: 'Look for past water damage, foundation issues, insurance claims, and unpermitted work.',
                },
                {
                    id: 'bg-12',
                    title: 'Get a professional home inspection',
                    detail: 'Non-negotiable. Attend the inspection and ask questions.',
                },
                {
                    id: 'bg-13',
                    title: 'Check for environmental concerns',
                    detail: 'Radon, lead paint (pre-1978), asbestos, mold, underground storage tanks.',
                },
                {
                    id: 'bg-14',
                    title: "Research the property's history",
                    detail: 'Previous sale prices, time on market, any liens, easements, or encroachments.',
                },
                {
                    id: 'bg-15',
                    title: 'Verify property boundaries and survey',
                    detail: 'Know exactly what you are buying. Get a current survey if one is not available.',
                },
            ],
        },
        {
            label: 'Making an offer and closing',
            items: [
                {
                    id: 'bg-16',
                    title: 'Research comparable sales before offering',
                    detail: 'Do not rely on list price alone. What have similar homes actually sold for?',
                },
                {
                    id: 'bg-17',
                    title: 'Understand contingencies',
                    detail: 'Inspection, financing, appraisal, sale of current home. Know which ones protect you.',
                },
                {
                    id: 'bg-18',
                    title: 'Get title insurance',
                    detail: 'Protects you from undiscovered liens, claims, and ownership disputes.',
                },
                {
                    id: 'bg-19',
                    title: 'Do a final walkthrough',
                    detail: 'Verify repairs were made, nothing was removed, and the home is in agreed-upon condition.',
                },
                {
                    id: 'bg-20',
                    title: 'Review all closing documents carefully',
                    detail: 'Closing Disclosure, deed, title commitment. Ask questions about anything unclear.',
                },
            ],
        },
    ],
}

const CHECKLISTS: Record<string, ChecklistDef> = {
    'seller-prep': SELLER_PREP,
    'buyer-guide': BUYER_GUIDE,
}

export function useEducationalChecklist(key: string) {
    const def = CHECKLISTS[key]
    if (!def) throw new Error(`Unknown checklist: ${key}`)

    const user = useSupabaseUser()
    const supabase = useSupabaseClient()

    const checkedIds = ref<string[]>([])
    const loaded = ref(false)

    const totalItems = def.phases.reduce((n, p) => n + p.items.length, 0)

    const progress = computed(() => {
        const done = checkedIds.value.length
        return {
            done,
            total: totalItems,
            pct: totalItems > 0 ? Math.round((done / totalItems) * 100) : 0,
        }
    })

    // Load saved progress
    async function load() {
        if (!user.value) {
            checkedIds.value = []
            loaded.value = true
            return
        }
        const { data } = await supabase
            .from('checklist_progress')
            .select('checked')
            .eq('user_id', user.value.id)
            .eq('checklist', key)
            .maybeSingle()
        checkedIds.value = (data?.checked as string[]) ?? []
        loaded.value = true
    }

    // Debounced save to avoid rapid-fire writes
    let saveTimer: ReturnType<typeof setTimeout> | null = null
    function debouncedSave() {
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => save(), 400)
    }

    async function save() {
        if (!user.value) return
        await supabase.from('checklist_progress').upsert(
            {
                user_id: user.value.id,
                checklist: key,
                checked: checkedIds.value,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,checklist' },
        )
    }

    function toggle(itemId: string) {
        if (!user.value) return
        const idx = checkedIds.value.indexOf(itemId)
        if (idx >= 0) {
            checkedIds.value = checkedIds.value.filter((id) => id !== itemId)
        } else {
            checkedIds.value = [...checkedIds.value, itemId]
        }
        debouncedSave()
    }

    function isChecked(itemId: string) {
        return checkedIds.value.includes(itemId)
    }

    // Reload when user changes (login/logout)
    watch(user, () => load(), { immediate: true })

    return {
        def,
        checkedIds,
        loaded,
        progress,
        toggle,
        isChecked,
    }
}
