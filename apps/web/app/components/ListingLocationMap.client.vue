<template>
    <div
        class="relative h-[300px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 md:h-[360px]"
    >
        <div ref="mapEl" class="h-full w-full" />
        <div
            v-if="!token || lat == null || lng == null"
            class="absolute inset-0 flex items-center justify-center text-sm text-slate-500"
        >
            {{
                !token
                    ? 'Map unavailable (no Mapbox token)'
                    : 'Location not available for this listing'
            }}
        </div>
    </div>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = defineProps<{
    lat: number | null
    lng: number | null
    /** Property type drives the marker color (matches BrowseMap legend). */
    propertyType?: string
    /** Optional address shown in the marker tooltip / accessible label */
    address?: string
}>()

const config = useRuntimeConfig()
const token = config.public.mapboxToken as string | undefined

const mapEl = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map | null = null
let marker: mapboxgl.Marker | null = null
let resizeObserver: ResizeObserver | null = null

const COLORS: Record<string, string> = {
    homes: '#1D9E75',
    land: '#C97A1A',
    commercial: '#3B5BDB',
}
function colorFor(type: string | undefined): string {
    if (type === 'land') return COLORS.land
    if (type === 'commercial') return COLORS.commercial
    return COLORS.homes
}

onMounted(() => {
    if (!token || !mapEl.value || props.lat == null || props.lng == null) return
    mapboxgl.accessToken = token

    map = new mapboxgl.Map({
        container: mapEl.value,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [props.lng, props.lat],
        zoom: 14,
        // Disable interactions on the small map — it's a "where is this" widget,
        // not a navigation map. Buyers who want to explore go to /browse.
        interactive: false,
        attributionControl: true,
    })

    map.on('load', () => {
        if (!map) return
        const el = document.createElement('div')
        el.style.width = '28px'
        el.style.height = '28px'
        el.style.borderRadius = '50%'
        el.style.background = colorFor(props.propertyType)
        el.style.border = '4px solid #ffffff'
        el.style.boxShadow = '0 4px 10px rgba(15, 23, 42, 0.25)'
        if (props.address) el.title = props.address

        marker = new mapboxgl.Marker({ element: el }).setLngLat([props.lng!, props.lat!]).addTo(map)

        // Belt-and-suspenders resize call after style settles
        map.resize()
    })

    // Same defense as BrowseMap — if the container starts at 0×0 because the
    // parent is still painting, the map renders blank until something forces
    // a resize. ResizeObserver covers it.
    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
            map?.resize()
        })
        resizeObserver.observe(mapEl.value)
    }
})

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    marker?.remove()
    marker = null
    map?.remove()
    map = null
})
</script>
