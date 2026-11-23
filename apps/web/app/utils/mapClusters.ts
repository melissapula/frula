import Supercluster from 'supercluster'

/** Pins closer than this many screen pixels are grouped. A price pin is about 50px wide. */
const CLUSTER_RADIUS_PX = 60
/** Above this zoom every listing gets its own pin. */
const CLUSTER_MAX_ZOOM = 16

export interface MapPoint {
    id: string
    lat: number
    lng: number
}

/** [west, south, east, north] in degrees. */
export type BBox = [number, number, number, number]

export interface ListingItem {
    kind: 'listing'
    id: string
    lat: number
    lng: number
}

export interface ClusterItem {
    kind: 'cluster'
    clusterId: number
    count: number
    lat: number
    lng: number
    /** The zoom at which this cluster breaks apart. */
    expansionZoom: number
}

export type MapItem = ListingItem | ClusterItem

export interface ListingClusters {
    itemsInView(bbox: BBox, zoom: number): MapItem[]
}

/** Indexes listings once so each map move only asks which pins and clusters are in view. */
export function createListingClusters(points: readonly MapPoint[]): ListingClusters {
    const index = new Supercluster<{ id: string }>({
        radius: CLUSTER_RADIUS_PX,
        maxZoom: CLUSTER_MAX_ZOOM,
    })
    index.load(
        points.map((p) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
            properties: { id: p.id },
        })),
    )

    return {
        itemsInView(bbox, zoom) {
            return index.getClusters(bbox, Math.floor(zoom)).map((feature): MapItem => {
                const [lng, lat] = feature.geometry.coordinates as [number, number]
                const props = feature.properties
                if ('cluster' in props && props.cluster) {
                    return {
                        kind: 'cluster',
                        clusterId: props.cluster_id,
                        count: props.point_count,
                        lat,
                        lng,
                        expansionZoom: index.getClusterExpansionZoom(props.cluster_id),
                    }
                }
                return { kind: 'listing', id: (props as { id: string }).id, lat, lng }
            })
        },
    }
}
