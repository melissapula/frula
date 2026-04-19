<template>
    <div
        class="relative h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 md:h-[560px]"
    >
        <div ref="mapEl" class="h-full w-full" />
        <div
            v-if="token"
            class="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1 rounded-lg bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200"
        >
            <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: COLORS.homes }" />
                <span class="text-slate-700">Homes</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: COLORS.land }" />
                <span class="text-slate-700">Land</span>
            </div>
            <div class="flex items-center gap-2">
                <span
                    class="h-2.5 w-2.5 rounded-full"
                    :style="{ backgroundColor: COLORS.commercial }"
                />
                <span class="text-slate-700">Commercial</span>
            </div>
        </div>
        <div
            v-if="!token"
            class="absolute inset-0 flex items-center justify-center bg-slate-100 text-sm text-slate-500"
        >
            Map unavailable (no Mapbox token configured)
        </div>
    </div>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Listing, GeoCenter } from '~/types/listing'
import { colorForType, CATEGORY_COLORS } from '~/composables/useMapColors'

const props = defineProps<{
    listings: Listing[]
    center?: GeoCenter
    radiusMiles?: number
    hoveredId?: string | null
    pinnedId?: string | null
}>()

const emit = defineEmits<{
    (e: 'select', id: string): void
    (e: 'hover', id: string | null): void
    (e: 'pin', id: string | null): void
}>()

const config = useRuntimeConfig()
const token = config.public.mapboxToken as string | undefined
const COLORS = CATEGORY_COLORS

const mapEl = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map | null = null
const markers: mapboxgl.Marker[] = []
// Per-listing references so hover-sync can update them
const markerById = new Map<string, mapboxgl.Marker>()
const listingById = new Map<string, Listing>()
let activePopup: mapboxgl.Popup | null = null
// Mapbox's map.on('click') still fires when you click an HTML marker (HTML
// stopPropagation doesn't reach the canvas event), so we use a short-lived
// timestamp guard: any map click within 300ms of a marker/popup click is
// treated as part of that interaction and ignored by the unpin handler.
let lastMarkerInteractionAt = 0

function clearMarkers() {
    for (const m of markers) m.remove()
    markers.length = 0
    markerById.clear()
    listingById.clear()
    if (activePopup) {
        activePopup.remove()
        activePopup = null
    }
}

function escapeHtml(s: string | null | undefined): string {
    if (!s) return ''
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function formatAcres(l: Listing): string | null {
    if (l.lot_size == null) return null
    if (l.lot_unit === 'sqft') return `${Math.round(l.lot_size).toLocaleString()} sqft lot`
    return `${l.lot_size} ac`
}

function buildPopupHTML(l: Listing): string {
    const photo =
        l.listing_photos?.find((p) => p.is_primary)?.url ?? l.listing_photos?.[0]?.url ?? null
    const price = formatPriceShort(l.price)
    const acres = formatAcres(l)

    let summary = ''
    if (l.property_type === 'land') {
        const terrainTags = (l.terrain ?? [])
            .slice(0, 3)
            .map((t) => escapeHtml(t))
            .join(', ')
        const parts = [acres, terrainTags || null].filter(Boolean)
        summary = parts.join(' · ')
    } else {
        const beds = l.beds ? `${l.beds} bd` : null
        const baths = l.full_baths ? `${l.full_baths} ba` : null
        const sqft = l.sqft ? `${l.sqft.toLocaleString()} sqft` : null
        const parts = [beds, baths, sqft, acres].filter(Boolean)
        summary = parts.join(' · ')
    }

    const typeLabel =
        l.property_type === 'land'
            ? 'Land'
            : l.property_type === 'commercial'
              ? 'Commercial'
              : l.property_type.charAt(0).toUpperCase() + l.property_type.slice(1)

    return `
        <div style="width:220px;font-family:inherit">
            ${
                photo
                    ? `<img src="${escapeHtml(photo)}" alt="" style="width:100%;height:130px;object-fit:cover;border-radius:8px;display:block" />`
                    : `<div style="width:100%;height:130px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12px">No photo</div>`
            }
            <div style="margin-top:8px;font-weight:700;font-size:16px;color:#0f172a">${price}</div>
            <div style="margin-top:2px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#1D9E75;font-weight:600">${typeLabel}</div>
            ${summary ? `<div style="margin-top:4px;font-size:12px;color:#475569">${summary}</div>` : ''}
            <div style="margin-top:4px;font-size:12px;color:#64748b">${escapeHtml(l.address)}</div>
            <div style="font-size:12px;color:#94a3b8">${escapeHtml(l.city)}, ${escapeHtml(l.state)}</div>
        </div>
    `
}

function showPopupFor(id: string | null | undefined) {
    if (activePopup) {
        activePopup.remove()
        activePopup = null
    }
    if (!id || !map) return
    const marker = markerById.get(id)
    const listing = listingById.get(id)
    if (!marker || !listing) return

    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
        className: 'frula-marker-popup',
    })
        .setLngLat(marker.getLngLat())
        .setHTML(buildPopupHTML(listing))
        .addTo(map)

    // Make the popup body clickable → opens the full listing.
    // Also stop click propagation so it doesn't unpin via the map background handler.
    const popupEl = popup.getElement()
    if (popupEl) {
        popupEl.style.cursor = 'pointer'
        popupEl.addEventListener('click', (e) => {
            e.stopPropagation()
            lastMarkerInteractionAt = Date.now()
            emit('select', id)
        })
    }

    activePopup = popup
}

function buildCircleGeoJSON(
    center: [number, number],
    radiusMiles: number,
    points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
    const km = radiusMiles * 1.609344
    const coords: [number, number][] = []
    const distanceX = km / (111.32 * Math.cos((center[1] * Math.PI) / 180))
    const distanceY = km / 110.574
    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI)
        coords.push([
            center[0] + distanceX * Math.cos(theta),
            center[1] + distanceY * Math.sin(theta),
        ])
    }
    coords.push(coords[0]!)
    return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
    }
}

function syncCircle() {
    if (!map) return
    const src = map.getSource('search-radius') as mapboxgl.GeoJSONSource | undefined
    if (props.center && props.radiusMiles) {
        const data = buildCircleGeoJSON([props.center.lng, props.center.lat], props.radiusMiles)
        if (src) {
            src.setData(data)
        } else {
            map.addSource('search-radius', { type: 'geojson', data })
            map.addLayer({
                id: 'search-radius-fill',
                type: 'fill',
                source: 'search-radius',
                paint: { 'fill-color': '#1D9E75', 'fill-opacity': 0.1 },
            })
            map.addLayer({
                id: 'search-radius-line',
                type: 'line',
                source: 'search-radius',
                paint: { 'line-color': '#1D9E75', 'line-width': 2 },
            })
        }
    } else if (src) {
        if (map.getLayer('search-radius-fill')) map.removeLayer('search-radius-fill')
        if (map.getLayer('search-radius-line')) map.removeLayer('search-radius-line')
        map.removeSource('search-radius')
    }
}

function syncMarkers() {
    if (!map) return
    clearMarkers()
    const bounds = new mapboxgl.LngLatBounds()
    let any = false

    for (const l of props.listings) {
        if (l.lat == null || l.lng == null) continue
        const el = document.createElement('button')
        el.type = 'button'
        el.className =
            'rounded-full px-2 py-1 text-xs font-semibold text-white shadow-md ring-2 ring-white'
        el.style.backgroundColor = colorForType(l.property_type)
        el.textContent = formatPriceShort(l.price)
        el.addEventListener('click', (e) => {
            e.stopPropagation()
            lastMarkerInteractionAt = Date.now()
            // Toggle pin: clicking the same pinned marker again unpins it.
            emit('pin', props.pinnedId === l.id ? null : l.id)
        })
        el.addEventListener('mouseenter', () => emit('hover', l.id))
        el.addEventListener('mouseleave', () => emit('hover', null))
        const marker = new mapboxgl.Marker({ element: el }).setLngLat([l.lng, l.lat]).addTo(map)
        markers.push(marker)
        markerById.set(l.id, marker)
        listingById.set(l.id, l)
        bounds.extend([l.lng, l.lat])
        any = true
    }

    if (props.center) {
        bounds.extend([props.center.lng, props.center.lat])
        any = true
    }

    if (any && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 400 })
    }

    // Re-open popup for whichever listing is currently active (pinned wins)
    showPopupFor(props.pinnedId ?? props.hoveredId)
}

// Open/close popup when either hovered or pinned id changes.
// Pinned takes priority — hover doesn't override a pin.
watch(
    () => [props.pinnedId, props.hoveredId] as const,
    ([pinned, hovered]) => showPopupFor(pinned ?? hovered),
)

function formatPriceShort(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
    return `$${n}`
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
    // Wait for the DOM to fully settle — on the initial page load the
    // container may not have dimensions yet when onMounted fires because
    // the parent's v-else just appeared.
    await nextTick()
    if (!token || !mapEl.value) return
    mapboxgl.accessToken = token
    map = new mapboxgl.Map({
        container: mapEl.value,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: props.center ? [props.center.lng, props.center.lat] : [-98.5, 39.5],
        zoom: props.center ? 10 : 3.5,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    // Mapbox initializes against the container's current pixel size. If the
    // container starts at 0×0 (very common when the parent is still rendering
    // — e.g., we're inside a v-else that just appeared), the map looks blank
    // until something forces a resize. A ResizeObserver covers every case:
    // first paint, parent layout settling, sticky reflow, mobile rotation.
    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
            map?.resize()
        })
        resizeObserver.observe(mapEl.value)
    }

    map.on('load', () => {
        syncCircle()
        syncMarkers()
        // Belt-and-suspenders: explicitly resize once the style is ready in
        // case the observer hasn't fired yet on first paint.
        map?.resize()
    })
    // Click anywhere on the map background (not a marker, not the popup) → unpin.
    // Markers/popups bump `lastMarkerInteractionAt` so we ignore the synthetic
    // map click that fires from the same gesture.
    map.on('click', () => {
        if (Date.now() - lastMarkerInteractionAt < 300) return
        if (props.pinnedId) emit('pin', null)
    })
})

watch(
    () => [props.listings, props.center, props.radiusMiles] as const,
    () => {
        if (!map) return
        if (!map.isStyleLoaded()) {
            map.once('load', () => {
                syncCircle()
                syncMarkers()
            })
            return
        }
        syncCircle()
        syncMarkers()
    },
    { deep: true },
)

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    clearMarkers()
    map?.remove()
    map = null
})
</script>
