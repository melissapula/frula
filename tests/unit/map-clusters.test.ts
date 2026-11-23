import { describe, expect, it } from 'vitest'
import { createListingClusters, type MapItem } from '../../apps/web/app/utils/mapClusters'

const WHOLE_WORLD: [number, number, number, number] = [-180, -85, 180, 85]
const US_OVERVIEW_ZOOM = 3.5
const STREET_ZOOM = 17

// Two real Bemidji listings about 200 m apart, which drew on top of each other.
const LAKE_AVE = { id: 'lake-ave', lat: 47.4838858, lng: -94.8351943 }
const POWER_DAM = { id: 'power-dam', lat: 47.4825641, lng: -94.832884 }
const BLACKDUCK = { id: 'blackduck', lat: 47.7333, lng: -94.5486 }
const TECOPA = { id: 'tecopa', lat: 35.8483, lng: -116.2264 }

const clustersOf = (items: MapItem[]) => items.filter((item) => item.kind === 'cluster')
const listingIdsOf = (items: MapItem[]) =>
    items.flatMap((item) => (item.kind === 'listing' ? [item.id] : [])).sort()

describe('createListingClusters', () => {
    it('groups listings that would overlap into one cluster with their count', () => {
        const items = createListingClusters([LAKE_AVE, POWER_DAM]).itemsInView(
            WHOLE_WORLD,
            US_OVERVIEW_ZOOM,
        )

        expect(items).toHaveLength(1)
        expect(items[0]).toMatchObject({ kind: 'cluster', count: 2 })
    })

    it('groups listings in nearby towns whose pins would overlap at the national view', () => {
        // About 40 km apart: a few pixels at this zoom, less than one price pin's width.
        const items = createListingClusters([LAKE_AVE, BLACKDUCK]).itemsInView(
            WHOLE_WORLD,
            US_OVERVIEW_ZOOM,
        )

        expect(items).toHaveLength(1)
        expect(items[0]).toMatchObject({ kind: 'cluster', count: 2 })
    })

    it('shows nearby listings separately once zoomed in to street level', () => {
        const items = createListingClusters([LAKE_AVE, POWER_DAM]).itemsInView(
            WHOLE_WORLD,
            STREET_ZOOM,
        )

        expect(clustersOf(items)).toHaveLength(0)
        expect(listingIdsOf(items)).toEqual(['lake-ave', 'power-dam'])
    })

    it('splits a cluster when zoomed to its expansion zoom', () => {
        const clusters = createListingClusters([LAKE_AVE, POWER_DAM])
        const [cluster] = clusters.itemsInView(WHOLE_WORLD, US_OVERVIEW_ZOOM)
        if (cluster?.kind !== 'cluster') throw new Error('expected a cluster')

        const items = clusters.itemsInView(WHOLE_WORLD, cluster.expansionZoom)

        expect(listingIdsOf(items)).toEqual(['lake-ave', 'power-dam'])
    })

    it('keeps listings that are far apart as separate pins', () => {
        const items = createListingClusters([LAKE_AVE, TECOPA]).itemsInView(
            WHOLE_WORLD,
            US_OVERVIEW_ZOOM,
        )

        expect(clustersOf(items)).toHaveLength(0)
        expect(listingIdsOf(items)).toEqual(['lake-ave', 'tecopa'])
    })

    it('returns only what is inside the visible area', () => {
        const aroundBemidji: [number, number, number, number] = [-95.5, 47, -94, 48]

        const items = createListingClusters([LAKE_AVE, TECOPA]).itemsInView(
            aroundBemidji,
            STREET_ZOOM,
        )

        expect(listingIdsOf(items)).toEqual(['lake-ave'])
    })

    it('returns nothing when there are no listings', () => {
        expect(createListingClusters([]).itemsInView(WHOLE_WORLD, US_OVERVIEW_ZOOM)).toEqual([])
    })
})
