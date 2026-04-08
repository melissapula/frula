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
                List your home
            </h1>
            <p class="mt-2 text-slate-600">
                Tell buyers about your property. You can edit any of this later.
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
                    <div class="grid gap-4 sm:grid-cols-2">
                        <Field label="Garage stalls">
                            <input
                                v-model.number="form.garage_stalls"
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
                        Paste one photo URL per line. We'll wire up real photo uploads in a
                        follow-up.
                    </p>
                    <Field label="Photo URLs">
                        <textarea
                            v-model="photosText"
                            rows="4"
                            placeholder="https://images.unsplash.com/…"
                            class="input"
                        />
                    </Field>
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
                        :disabled="submitting"
                        class="bg-brand hover:bg-brand-600 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
                    >
                        {{ submitting ? 'Publishing…' : 'Publish listing' }}
                    </button>
                </div>
            </form>
        </div>
    </main>
</template>

<script setup lang="ts">
import { US_STATES } from '~/composables/useStates'

definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

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
    basement_type: 'none' as 'none' | 'unfinished' | 'finished',
    price: undefined as number | undefined,
    title: '',
    description: '',
})

const highlightsText = ref('')
const photosText = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

async function submit() {
    if (!user.value) return
    error.value = null
    submitting.value = true

    const highlights = highlightsText.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

    const photoUrls = photosText.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

    const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert({
            user_id: user.value.id,
            status: 'active',
            address: form.address,
            city: form.city,
            state: form.state,
            zip: form.zip,
            county: form.county || null,
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
            basement: form.basement_type !== 'none',
            basement_finished: form.basement_type === 'finished',
            title: form.title || null,
            description: form.description || null,
            highlights,
            listed_at: new Date().toISOString(),
        })
        .select('id')
        .single()

    if (insertError || !listing) {
        submitting.value = false
        error.value = insertError?.message || 'Something went wrong creating your listing.'
        return
    }

    if (photoUrls.length) {
        const { error: photoError } = await supabase.from('listing_photos').insert(
            photoUrls.map((url, i) => ({
                listing_id: listing.id,
                url,
                sort_order: i,
                is_primary: i === 0,
            })),
        )
        if (photoError) {
            // listing was created — let user see it even if photos failed
            // eslint-disable-next-line no-console
            console.error('Photo insert failed:', photoError)
        }
    }

    await router.push(`/listing/${listing.id}`)
}

useSeoMeta({ title: 'List your home — Frula Homes' })
</script>

<style scoped>
.input {
    @apply focus:border-brand focus:ring-brand w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1;
}
</style>
