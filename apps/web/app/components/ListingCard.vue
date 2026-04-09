<template>
    <NuxtLink
        :to="`/listing/${listing.id}`"
        :class="[
            'group block overflow-hidden rounded-2xl border bg-white transition',
            highlighted
                ? 'border-brand ring-brand/40 shadow-lg ring-2'
                : 'hover:border-brand border-slate-200 hover:shadow-lg',
            expanded ? 'sm:col-span-2' : '',
        ]"
        @mouseenter="$emit('hover', listing.id)"
        @mouseleave="$emit('hover', null)"
    >
        <div
            :class="[
                'relative overflow-hidden bg-slate-100',
                expanded ? 'aspect-[16/9]' : 'aspect-[4/3]',
            ]"
        >
            <img
                v-if="primaryPhoto"
                :src="primaryPhoto"
                :alt="listing.title || listing.address"
                loading="lazy"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div v-else class="flex h-full items-center justify-center text-slate-300">
                No photo
            </div>
            <div
                class="text-brand absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm"
            >
                FSBO
            </div>
            <div
                v-if="matchPercent != null"
                :class="[
                    'absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-md',
                    matchPercent >= 80
                        ? 'bg-brand text-white'
                        : matchPercent >= 50
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-white',
                ]"
            >
                {{ matchPercent }}% match
            </div>
            <div
                v-if="distanceLabel"
                class="absolute right-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white shadow-sm"
            >
                {{ distanceLabel }}
            </div>
        </div>

        <div :class="['p-4', expanded ? 'sm:p-6' : '']">
            <div class="flex items-baseline justify-between gap-2">
                <div class="font-display text-2xl font-bold text-slate-900">
                    {{ formatPrice(listing.price) }}
                </div>
                <div v-if="listing.sqft" class="text-xs text-slate-500">
                    {{ pricePerSqft }}/sqft
                </div>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700">
                <span v-if="listing.beds"
                    ><strong>{{ listing.beds }}</strong> bd</span
                >
                <span v-if="totalBaths"
                    ><strong>{{ totalBaths }}</strong> ba</span
                >
                <span v-if="listing.sqft">{{ formatSqft(listing.sqft) }}</span>
                <span v-if="lotLabel">{{ lotLabel }}</span>
            </div>

            <p class="mt-2 truncate text-sm text-slate-600">
                {{ listing.address }}
            </p>
            <p class="text-xs text-slate-500">
                {{ listing.city }}, {{ listing.state }} {{ listing.zip }}
            </p>

            <!-- ============ EXPANDED EXTRAS ============ -->
            <div v-if="expanded" class="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <p v-if="listing.title" class="font-display text-base font-semibold text-slate-800">
                    {{ listing.title }}
                </p>

                <p
                    v-if="listing.description"
                    class="line-clamp-3 text-sm leading-relaxed text-slate-600"
                >
                    {{ listing.description }}
                </p>

                <!-- Quick fact grid -->
                <dl v-if="quickFacts.length" class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div v-for="f in quickFacts" :key="f.label" class="flex flex-col">
                        <dt class="font-semibold uppercase tracking-wide text-slate-400">
                            {{ f.label }}
                        </dt>
                        <dd class="text-slate-700">{{ f.value }}</dd>
                    </div>
                </dl>

                <!-- Tag pills (terrain, view, features, highlights) -->
                <div v-if="tagPills.length" class="flex flex-wrap gap-1.5">
                    <span
                        v-for="tag in tagPills"
                        :key="tag"
                        class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                        {{ tag }}
                    </span>
                </div>

                <div class="pt-1">
                    <span class="text-brand inline-flex items-center text-sm font-semibold">
                        View full listing →
                    </span>
                </div>
            </div>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import type { Listing } from '~/types/listing'
import { formatPrice, formatSqft, formatDistance } from '~/composables/useListings'

const props = defineProps<{
    listing: Listing
    highlighted?: boolean
    expanded?: boolean
    matchPercent?: number
}>()
defineEmits<{ (e: 'hover', id: string | null): void }>()

const primaryPhoto = computed(() => {
    const photos = props.listing.listing_photos ?? []
    const primary = photos.find((p) => p.is_primary)
    return (primary ?? photos[0])?.url
})

const totalBaths = computed(() => {
    const f = props.listing.full_baths ?? 0
    const h = props.listing.half_baths ?? 0
    if (!f && !h) return null
    return h ? `${f}.${h >= 1 ? 5 : 0}` : `${f}`
})

const distanceLabel = computed(() => formatDistance(props.listing.distance_meters))

const pricePerSqft = computed(() => {
    if (!props.listing.sqft) return ''
    return formatPrice(Math.round(props.listing.price / props.listing.sqft))
})

const lotLabel = computed(() => {
    const l = props.listing
    if (l.lot_size == null) return null
    if (l.lot_unit === 'sqft') {
        return `${Math.round(l.lot_size).toLocaleString()} sqft lot`
    }
    return `${l.lot_size} ac`
})

const TYPE_LABELS: Record<string, string> = {
    residential: 'Residential',
    condo: 'Condo',
    'multi-family': 'Multi-family',
    land: 'Land',
    commercial: 'Commercial',
}

const FEATURE_LABELS: Record<string, string> = {
    pool: 'Pool',
    fireplace: 'Fireplace',
    central_ac: 'Central A/C',
    deck: 'Deck',
    fenced_yard: 'Fenced yard',
    updated_kitchen: 'Updated kitchen',
    new_roof: 'New roof',
    solar: 'Solar',
    ev_charger: 'EV charger',
    dock: 'Dock',
}

const VIEW_LABELS: Record<string, string> = {
    water: 'Water view',
    lake: 'Lake view',
    river: 'River view',
    mountain: 'Mountain view',
    city: 'City view',
    woods: 'Woods view',
    golf: 'Golf view',
}

function daysAgo(iso: string | null): string | null {
    if (!iso) return null
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
    if (days <= 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
}

const quickFacts = computed(() => {
    const l = props.listing
    const facts: { label: string; value: string }[] = []
    facts.push({ label: 'Type', value: TYPE_LABELS[l.property_type] ?? l.property_type })

    if (l.property_type === 'land') {
        if (lotLabel.value) facts.push({ label: 'Lot', value: lotLabel.value })
        if (l.road_access)
            facts.push({
                label: 'Road',
                value: l.road_access.charAt(0).toUpperCase() + l.road_access.slice(1),
            })
        if (l.waterfront) facts.push({ label: 'Waterfront', value: l.water_body_name || 'Yes' })
    } else {
        if (l.year_built) facts.push({ label: 'Year built', value: String(l.year_built) })
        if (l.garage_stalls)
            facts.push({
                label: 'Garage',
                value: `${l.garage_stalls} stall${l.garage_stalls > 1 ? 's' : ''}`,
            })
        if (l.basement)
            facts.push({
                label: 'Basement',
                value: l.basement_finished ? 'Finished' : 'Unfinished',
            })
        if (lotLabel.value) facts.push({ label: 'Lot', value: lotLabel.value })
    }

    const listed = daysAgo(l.listed_at)
    if (listed) facts.push({ label: 'Listed', value: listed })

    return facts
})

const tagPills = computed(() => {
    const l = props.listing
    const tags: string[] = []

    // Land terrain
    for (const t of l.terrain ?? []) {
        tags.push(t.charAt(0).toUpperCase() + t.slice(1))
    }
    // Views
    for (const v of l.view_types ?? []) {
        tags.push(VIEW_LABELS[v] ?? v)
    }
    // Features
    for (const f of l.features ?? []) {
        tags.push(FEATURE_LABELS[f] ?? f)
    }
    // Seller-entered highlights
    for (const h of l.highlights ?? []) {
        tags.push(h)
    }

    return tags.slice(0, 8)
})
</script>
