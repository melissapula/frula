<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <AuthNav />
            </div>
        </header>

        <div class="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
            <h1 class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                {{ editingId ? 'Edit your listing' : 'List your home' }}
            </h1>
            <p class="mt-2 text-slate-600">
                {{
                    editingId
                        ? 'Update any details below and save your changes.'
                        : 'Tell buyers about your property. You can edit any of this later.'
                }}
            </p>

            <form class="mt-8 space-y-8" @submit.prevent="submit">
                <!-- Address -->
                <Section title="Address">
                    <Field label="Street address" required>
                        <input
                            v-model="form.address"
                            type="text"
                            required
                            placeholder="123 Main St"
                            class="input"
                        />
                    </Field>
                    <div class="grid gap-4 sm:grid-cols-3">
                        <Field label="City" required>
                            <input
                                v-model="form.city"
                                type="text"
                                required
                                placeholder="City"
                                class="input"
                            />
                        </Field>
                        <Field label="State" required>
                            <select v-model="form.state" required class="input">
                                <option value="">Select…</option>
                                <option v-for="s in US_STATES" :key="s.code" :value="s.code">
                                    {{ s.name }}
                                </option>
                            </select>
                        </Field>
                        <Field label="ZIP" required>
                            <input
                                v-model="form.zip"
                                type="text"
                                required
                                placeholder="12345"
                                class="input"
                            />
                        </Field>
                    </div>
                    <Field label="County">
                        <input
                            v-model="form.county"
                            type="text"
                            placeholder="County (optional)"
                            class="input"
                        />
                    </Field>
                </Section>

                <!-- Property -->
                <Section title="Property details">
                    <div class="grid gap-4 sm:grid-cols-2">
                        <Field label="Property type" required>
                            <select v-model="form.property_type" required class="input">
                                <option value="residential">Residential</option>
                                <option value="condo">Condo</option>
                                <option value="multi-family">Multi-family</option>
                                <option value="land">Land</option>
                                <option value="commercial">Commercial</option>
                            </select>
                        </Field>
                        <Field label="Year built">
                            <input
                                v-model.number="form.year_built"
                                type="number"
                                placeholder="1998"
                                class="input"
                            />
                        </Field>
                    </div>
                    <div class="grid gap-4 sm:grid-cols-3">
                        <Field label="Bedrooms">
                            <input v-model.number="form.beds" type="number" min="0" class="input" />
                        </Field>
                        <Field label="Full baths">
                            <input
                                v-model.number="form.full_baths"
                                type="number"
                                min="0"
                                class="input"
                            />
                        </Field>
                        <Field label="Half baths">
                            <input
                                v-model.number="form.half_baths"
                                type="number"
                                min="0"
                                class="input"
                            />
                        </Field>
                    </div>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <Field label="Square feet">
                            <input
                                v-model.number="form.sqft"
                                type="number"
                                min="0"
                                placeholder="2400"
                                class="input"
                            />
                        </Field>
                        <Field label="Lot size (acres)">
                            <input
                                v-model.number="form.lot_size"
                                type="number"
                                step="0.01"
                                min="0"
                                class="input"
                            />
                        </Field>
                    </div>
                    <div class="grid gap-4 sm:grid-cols-3">
                        <Field label="Garage stalls">
                            <input
                                v-model.number="form.garage_stalls"
                                type="number"
                                min="0"
                                class="input"
                            />
                        </Field>
                        <Field label="Other parking spaces">
                            <input
                                v-model.number="form.parking_spaces"
                                type="number"
                                min="0"
                                class="input"
                            />
                        </Field>
                        <Field label="Basement">
                            <select v-model="form.basement_type" class="input">
                                <option value="none">None</option>
                                <option value="unfinished">Unfinished</option>
                                <option value="finished">Finished</option>
                            </select>
                        </Field>
                    </div>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <Field label="Stories">
                            <input
                                v-model.number="form.stories"
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="2"
                                class="input"
                            />
                        </Field>
                        <Field label="HOA fee (USD)">
                            <input
                                v-model.number="form.hoa_fee"
                                type="number"
                                min="0"
                                placeholder="(leave blank if no HOA)"
                                class="input"
                            />
                        </Field>
                    </div>
                    <label class="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            v-model="form.single_story"
                            type="checkbox"
                            class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                        />
                        Single story / no stairs
                    </label>
                </Section>

                <!-- Lifestyle & features -->
                <Section title="Features & lifestyle">
                    <label class="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            v-model="form.waterfront"
                            type="checkbox"
                            class="text-brand focus:ring-brand h-4 w-4 rounded border-slate-300"
                        />
                        Waterfront
                    </label>
                    <Field v-if="form.waterfront" label="Body of water">
                        <input
                            v-model="form.water_body_name"
                            type="text"
                            placeholder="e.g. Lake Bemidji"
                            class="input"
                        />
                    </Field>

                    <Field label="Views (select all that apply)">
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="v in VIEW_OPTIONS"
                                :key="v.value"
                                type="button"
                                :class="chipClass(form.view_types.includes(v.value))"
                                @click="toggleArray('view_types', v.value)"
                            >
                                {{ v.label }}
                            </button>
                        </div>
                    </Field>

                    <div>
                        <p
                            class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                            Features (select all that apply)
                        </p>
                        <div class="space-y-4">
                            <div v-for="group in FEATURE_GROUPS" :key="group.label">
                                <p class="mb-2 text-xs font-medium text-slate-600">
                                    {{ group.label }}
                                </p>
                                <div class="flex flex-wrap gap-2">
                                    <button
                                        v-for="f in group.options"
                                        :key="f.value"
                                        type="button"
                                        :class="chipClass(form.features.includes(f.value))"
                                        @click="toggleArray('features', f.value)"
                                    >
                                        {{ f.label }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                <!-- Land-specific -->
                <Section v-if="form.property_type === 'land'" title="Land details">
                    <Field label="Terrain (select all that apply)">
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="t in TERRAIN_OPTIONS"
                                :key="t.value"
                                type="button"
                                :class="chipClass(form.terrain.includes(t.value))"
                                @click="toggleArray('terrain', t.value)"
                            >
                                {{ t.label }}
                            </button>
                        </div>
                    </Field>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <Field label="Road access">
                            <select v-model="form.road_access" class="input">
                                <option :value="undefined">Select…</option>
                                <option
                                    v-for="r in ROAD_ACCESS_OPTIONS"
                                    :key="r.value"
                                    :value="r.value"
                                >
                                    {{ r.label }}
                                </option>
                            </select>
                        </Field>
                    </div>

                    <Field label="Utilities at lot (select all that apply)">
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="u in UTILITY_OPTIONS"
                                :key="u.value"
                                type="button"
                                :class="chipClass(form.utilities.includes(u.value))"
                                @click="toggleArray('utilities', u.value)"
                            >
                                {{ u.label }}
                            </button>
                        </div>
                    </Field>
                </Section>

                <!-- Utilities (homes) -->
                <Section v-else title="Utilities">
                    <div class="grid gap-4 sm:grid-cols-2">
                        <Field label="Water source">
                            <select v-model="form.water_source" class="input">
                                <option :value="undefined">Select…</option>
                                <option value="city">City</option>
                                <option value="well">Well</option>
                                <option value="other">Other</option>
                            </select>
                        </Field>
                        <Field label="Sewer">
                            <select v-model="form.sewer_type" class="input">
                                <option :value="undefined">Select…</option>
                                <option value="city">City</option>
                                <option value="septic">Septic</option>
                                <option value="other">Other</option>
                            </select>
                        </Field>
                    </div>
                </Section>

                <!-- Price -->
                <Section title="Price">
                    <Field label="Asking price (USD)" required>
                        <input
                            v-model.number="form.price"
                            type="number"
                            required
                            min="0"
                            placeholder="425000"
                            class="input"
                        />
                    </Field>
                </Section>

                <!-- Listing copy -->
                <Section title="Listing description">
                    <Field label="Headline">
                        <input
                            v-model="form.title"
                            type="text"
                            placeholder="Lakefront 4BR with Walkout Basement"
                            class="input"
                        />
                    </Field>
                    <Field label="Description">
                        <textarea
                            v-model="form.description"
                            rows="6"
                            placeholder="Tell buyers what makes your home special…"
                            class="input"
                        />
                    </Field>
                    <Field label="Highlights (one per line)">
                        <textarea
                            v-model="highlightsText"
                            rows="4"
                            placeholder="New roof 2022&#10;Walkout basement&#10;100ft lake frontage"
                            class="input"
                        />
                    </Field>
                </Section>

                <!-- Photos -->
                <Section title="Photos">
                    <p class="mb-3 text-sm text-slate-500">
                        Drag and drop your listing photos, or click to browse. The first photo
                        becomes the primary thumbnail buyers see.
                    </p>
                    <PhotoUploader v-model="photos" />
                </Section>

                <!-- Errors / submit -->
                <div
                    v-if="error"
                    class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                    {{ error }}
                </div>

                <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <NuxtLink
                        to="/account"
                        class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700"
                    >
                        Cancel
                    </NuxtLink>
                    <button
                        type="submit"
                        :disabled="submitting || !canSubmit"
                        :title="canSubmit ? '' : 'Fill in all required fields first'"
                        class="bg-brand hover:bg-brand-600 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {{
                            submitting
                                ? editingId
                                    ? 'Saving…'
                                    : 'Publishing…'
                                : editingId
                                  ? 'Save changes'
                                  : 'Publish listing'
                        }}
                    </button>
                </div>
            </form>
        </div>
    </main>
</template>

<script setup lang="ts">
import { US_STATES } from '~/composables/useStates'
import {
    VIEW_OPTIONS,
    FEATURE_GROUPS,
    TERRAIN_OPTIONS,
    ROAD_ACCESS_OPTIONS,
    UTILITY_OPTIONS,
} from '~/types/listing'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()

// `?edit=<id>` flips this page into edit mode: load the existing listing,
// pre-populate the form, and update on submit instead of insert.
const editingId = computed(() => (route.query.edit as string | undefined) ?? null)

watchEffect(() => {
    if (!user.value && import.meta.client) router.replace('/login')
})

const form = reactive({
    address: '',
    city: '',
    state: '',
    zip: '',
    county: '',
    property_type: 'residential',
    year_built: undefined as number | undefined,
    beds: undefined as number | undefined,
    full_baths: undefined as number | undefined,
    half_baths: undefined as number | undefined,
    sqft: undefined as number | undefined,
    lot_size: undefined as number | undefined,
    garage_stalls: undefined as number | undefined,
    parking_spaces: undefined as number | undefined,
    single_story: false,
    stories: undefined as number | undefined,
    basement_type: 'none' as 'none' | 'unfinished' | 'finished',
    price: undefined as number | undefined,
    title: '',
    description: '',
    // Lifestyle / features
    waterfront: false,
    water_body_name: '',
    view_types: [] as string[],
    features: [] as string[],
    // Land
    terrain: [] as string[],
    road_access: undefined as string | undefined,
    utilities: [] as string[],
    // Utilities (homes)
    water_source: undefined as string | undefined,
    sewer_type: undefined as string | undefined,
    // HOA
    hoa_fee: undefined as number | undefined,
})

type ArrayFormKey = 'view_types' | 'features' | 'terrain' | 'utilities'
function toggleArray(key: ArrayFormKey, value: string) {
    const current = form[key]
    if (current.includes(value)) {
        form[key] = current.filter((x) => x !== value)
    } else {
        form[key] = [...current, value]
    }
}

function chipClass(active: boolean): string {
    return [
        'rounded-full border px-3 py-1.5 text-sm font-medium transition',
        active
            ? 'border-brand bg-brand text-white'
            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
    ].join(' ')
}

const highlightsText = ref('')
const photos = ref<{ url: string; publicId?: string }[]>([])
const submitting = ref(false)
const error = ref<string | null>(null)

// Load existing listing on mount if editing.
onMounted(async () => {
    if (!editingId.value || !user.value) return
    const { data, error: loadErr } = await supabase
        .from('listings')
        .select(
            `id, user_id, address, city, state, zip, county, property_type,
             year_built, beds, full_baths, half_baths, sqft, lot_size,
             garage_stalls, parking_spaces, single_story, stories,
             basement, basement_finished, price, title, description, highlights,
             waterfront, water_body_name, view_types, features,
             terrain, road_access, utilities,
             water_source, sewer_type, hoa, hoa_fee,
             listing_photos ( url, sort_order, is_primary )`,
        )
        .eq('id', editingId.value)
        .maybeSingle()

    if (loadErr || !data) {
        error.value = loadErr?.message || 'Could not load this listing for editing.'
        return
    }
    if (data.user_id !== user.value.id) {
        error.value = 'You can only edit listings you own.'
        return
    }

    Object.assign(form, {
        address: data.address ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        zip: data.zip ?? '',
        county: data.county ?? '',
        property_type: data.property_type ?? 'residential',
        year_built: data.year_built ?? undefined,
        beds: data.beds ?? undefined,
        full_baths: data.full_baths ?? undefined,
        half_baths: data.half_baths ?? undefined,
        sqft: data.sqft ?? undefined,
        lot_size: data.lot_size ?? undefined,
        garage_stalls: data.garage_stalls ?? undefined,
        parking_spaces: data.parking_spaces ?? undefined,
        single_story: data.single_story ?? false,
        stories: data.stories ?? undefined,
        basement_type: data.basement_finished ? 'finished' : data.basement ? 'unfinished' : 'none',
        price: data.price ?? undefined,
        title: data.title ?? '',
        description: data.description ?? '',
        waterfront: data.waterfront ?? false,
        water_body_name: data.water_body_name ?? '',
        view_types: data.view_types ?? [],
        features: data.features ?? [],
        terrain: data.terrain ?? [],
        road_access: data.road_access ?? undefined,
        utilities: data.utilities ?? [],
        water_source: data.water_source ?? undefined,
        sewer_type: data.sewer_type ?? undefined,
        hoa_fee: data.hoa_fee ?? undefined,
    })
    highlightsText.value = (data.highlights ?? []).join('\n')
    photos.value = (
        (data.listing_photos ?? []) as { url: string; sort_order: number; is_primary: boolean }[]
    )
        .sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1
            if (!a.is_primary && b.is_primary) return 1
            return a.sort_order - b.sort_order
        })
        .map((p) => ({ url: p.url }))
})

// Required-field gate for the submit button. Mirrors the `required` attribute
// on the inputs but disables the button up front so users can't even click
// it (and double-click their way into duplicate listings).
const canSubmit = computed(() => {
    return (
        form.address.trim().length > 0 &&
        form.city.trim().length > 0 &&
        form.state.trim().length > 0 &&
        form.zip.trim().length > 0 &&
        !!form.property_type &&
        typeof form.price === 'number' &&
        form.price > 0
    )
})

async function submit() {
    if (!user.value) return
    // Re-entrancy guard. Even if the button is somehow clicked twice (slow
    // network, double-click, Enter key + click), only the first call proceeds.
    if (submitting.value) return
    if (!canSubmit.value) return
    error.value = null
    submitting.value = true

    const highlights = highlightsText.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

    const photoUrls = photos.value.map((p) => p.url)

    // Geocode the address so the new listing shows up on the browse map.
    // Failure is non-fatal — the listing will still publish, just without
    // a pin until the user (or an admin) corrects it.
    let lat: number | null = null
    let lng: number | null = null
    try {
        const q = `${form.address}, ${form.city}, ${form.state} ${form.zip}`
        const geo = await $fetch<{ lat: number; lng: number }>('/api/geocode', {
            params: { q },
        })
        lat = geo.lat
        lng = geo.lng
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Geocoding failed for new listing:', e)
    }

    const payload = {
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        county: form.county || null,
        lat,
        lng,
        property_type: form.property_type,
        price: form.price,
        sqft: form.sqft ?? null,
        lot_size: form.lot_size ?? null,
        beds: form.beds ?? null,
        full_baths: form.full_baths ?? null,
        half_baths: form.half_baths ?? null,
        year_built: form.year_built ?? null,
        garage: (form.garage_stalls ?? 0) > 0,
        garage_stalls: form.garage_stalls ?? null,
        parking_spaces: form.parking_spaces ?? null,
        single_story: form.single_story,
        stories: form.stories ?? null,
        basement: form.basement_type !== 'none',
        basement_finished: form.basement_type === 'finished',
        title: form.title || null,
        description: form.description || null,
        highlights,
        // Lifestyle / features
        waterfront: form.waterfront,
        water_body_name: form.waterfront && form.water_body_name ? form.water_body_name : null,
        view_types: form.view_types,
        features: form.features,
        // Land
        terrain: form.property_type === 'land' ? form.terrain : [],
        road_access: form.property_type === 'land' ? (form.road_access ?? null) : null,
        utilities: form.property_type === 'land' ? form.utilities : [],
        // Utilities (homes)
        water_source: form.property_type !== 'land' ? (form.water_source ?? null) : null,
        sewer_type: form.property_type !== 'land' ? (form.sewer_type ?? null) : null,
        // HOA — derive boolean from fee presence
        hoa: !!form.hoa_fee,
        hoa_fee: form.hoa_fee ?? null,
    }

    let listingId: string
    if (editingId.value) {
        // ----- UPDATE existing listing -----
        const { data: updated, error: updErr } = await supabase
            .from('listings')
            .update(payload)
            .eq('id', editingId.value)
            .eq('user_id', user.value.id) // RLS belt-and-suspenders
            .select('id')
            .single()
        if (updErr || !updated) {
            submitting.value = false
            if (updErr?.code === '23505') {
                error.value =
                    'Another active listing already exists at this address. Edit that one instead of duplicating it.'
            } else {
                error.value = updErr?.message || 'Could not save your changes.'
            }
            return
        }
        listingId = updated.id

        // Replace photos: delete existing rows then re-insert in current order.
        // Cloudinary assets aren't deleted (they're cheap and the user might
        // re-add them); we only manage the DB pointers.
        await supabase.from('listing_photos').delete().eq('listing_id', listingId)
    } else {
        // ----- INSERT new listing -----
        const { data: listing, error: insertError } = await supabase
            .from('listings')
            .insert({
                user_id: user.value.id,
                status: 'active',
                ...payload,
                listed_at: new Date().toISOString(),
            })
            .select('id')
            .single()

        if (insertError || !listing) {
            submitting.value = false
            if (insertError?.code === '23505') {
                error.value =
                    'This address is already listed as active. If you need to update the existing listing, edit it from your account page instead of creating a new one.'
            } else {
                error.value = insertError?.message || 'Something went wrong creating your listing.'
            }
            return
        }
        listingId = listing.id
    }

    if (photoUrls.length) {
        const { error: photoError } = await supabase.from('listing_photos').insert(
            photoUrls.map((url, i) => ({
                listing_id: listingId,
                url,
                sort_order: i,
                is_primary: i === 0,
            })),
        )
        if (photoError) {
            // eslint-disable-next-line no-console
            console.error('Photo insert failed:', photoError)
        }
    }

    await router.push(`/listing/${listingId}`)
}

useSeoMeta({ title: 'List your home — Frula Homes' })
</script>

<style scoped>
.input {
    @apply focus:border-brand focus:ring-brand w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1;
}
</style>
