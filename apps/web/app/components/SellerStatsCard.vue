<template>
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
            <h3 class="font-display text-base font-bold text-slate-900">📊 Your listing stats</h3>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Only you see this
            </span>
        </div>

        <div v-if="loading" class="space-y-2">
            <div class="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div class="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div class="h-12 animate-pulse rounded-lg bg-slate-100" />
        </div>

        <div v-else class="space-y-3">
            <StatRow
                icon="👀"
                label="Views"
                :total="stats.viewsTotal"
                :this-week="stats.viewsWeek"
                :delta="stats.viewsDelta"
            />
            <StatRow
                icon="❤️"
                label="Saves"
                :total="stats.savesTotal"
                :this-week="stats.savesWeek"
                :delta="stats.savesDelta"
            />
            <StatRow
                icon="💬"
                label="Messages"
                :total="stats.messagesTotal"
                :this-week="stats.messagesWeek"
                :delta="stats.messagesDelta"
            />
        </div>

        <p v-if="!loading && !hasAnyActivity" class="mt-4 text-xs text-slate-500">
            No activity yet — share your listing on social media to drive traffic.
        </p>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    listingId: string
}>()

const supabase = useSupabaseClient()

interface Stats {
    viewsTotal: number
    viewsWeek: number
    viewsDelta: number
    savesTotal: number
    savesWeek: number
    savesDelta: number
    messagesTotal: number
    messagesWeek: number
    messagesDelta: number
}

const loading = ref(true)
const stats = reactive<Stats>({
    viewsTotal: 0,
    viewsWeek: 0,
    viewsDelta: 0,
    savesTotal: 0,
    savesWeek: 0,
    savesDelta: 0,
    messagesTotal: 0,
    messagesWeek: 0,
    messagesDelta: 0,
})

const hasAnyActivity = computed(() => stats.viewsTotal + stats.savesTotal + stats.messagesTotal > 0)

const now = new Date()
const oneWeekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString()
const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString()

/** Run a `count: 'exact', head: true` query and return the count or 0. */
async function countWhere(
    table: 'listing_views' | 'saved_listings' | 'messages',
    column: 'viewed_at' | 'created_at',
    sinceISO: string,
    untilISO?: string,
) {
    let q = supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', props.listingId)
        .gte(column, sinceISO)
    if (untilISO) q = q.lt(column, untilISO)
    const { count } = await q
    return count ?? 0
}

async function totalCount(table: 'listing_views' | 'saved_listings' | 'messages') {
    const { count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', props.listingId)
    return count ?? 0
}

async function load() {
    loading.value = true

    const [
        viewsTotal,
        viewsWeek,
        viewsPrev,
        savesTotal,
        savesWeek,
        savesPrev,
        messagesTotal,
        messagesWeek,
        messagesPrev,
    ] = await Promise.all([
        totalCount('listing_views'),
        countWhere('listing_views', 'viewed_at', oneWeekAgo),
        countWhere('listing_views', 'viewed_at', twoWeeksAgo, oneWeekAgo),
        totalCount('saved_listings'),
        countWhere('saved_listings', 'created_at', oneWeekAgo),
        countWhere('saved_listings', 'created_at', twoWeeksAgo, oneWeekAgo),
        totalCount('messages'),
        countWhere('messages', 'created_at', oneWeekAgo),
        countWhere('messages', 'created_at', twoWeeksAgo, oneWeekAgo),
    ])

    stats.viewsTotal = viewsTotal
    stats.viewsWeek = viewsWeek
    stats.viewsDelta = viewsWeek - viewsPrev
    stats.savesTotal = savesTotal
    stats.savesWeek = savesWeek
    stats.savesDelta = savesWeek - savesPrev
    stats.messagesTotal = messagesTotal
    stats.messagesWeek = messagesWeek
    stats.messagesDelta = messagesWeek - messagesPrev

    loading.value = false
}

onMounted(load)
</script>
