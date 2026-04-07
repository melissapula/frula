import { Injectable, Logger } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CmaRequestDto } from './dto/cma-request.dto'

export interface Comp {
  parcel_id: string
  address: string
  city: string
  sqft: number
  beds: number
  baths: number
  year_built: number
  last_sale_price: number
  last_sale_date: string
  distance_miles: number
  similarity_score: number
  price_per_sqft: number
  days_since_sale: number
}

export interface CmaResult {
  low_estimate: number
  mid_estimate: number
  high_estimate: number
  confidence_score: number
  comps: Comp[]
  comps_avg_age_days: number
  methodology: string
  data_freshness: 'high' | 'medium' | 'low'
}

@Injectable()
export class CmaService {
  private readonly logger = new Logger(CmaService.name)

  constructor(private readonly supabase: SupabaseService) {}

  async generateEstimate(request: CmaRequestDto): Promise<CmaResult> {
    this.logger.log(`Generating CMA for: ${request.address}`)

    // Step 1: Find comparable sales
    const comps = await this.findComps(request)

    if (comps.length === 0) {
      throw new Error(
        'Insufficient comparable sales data for this area. Try expanding your search radius.',
      )
    }

    // Step 2: Calculate weighted value estimate
    const estimate = this.calculateEstimate(request, comps)

    // Step 3: Determine data freshness
    const avgAge = comps.reduce((sum, c) => sum + c.days_since_sale, 0) / comps.length
    const freshness = avgAge < 90 ? 'high' : avgAge < 270 ? 'medium' : 'low'

    return {
      ...estimate,
      comps,
      comps_avg_age_days: Math.round(avgAge),
      data_freshness: freshness,
      methodology: this.buildMethodologyText(comps, request),
    }
  }

  private async findComps(request: CmaRequestDto): Promise<Comp[]> {
    const { lat, lng, sqft, beds, property_type } = request

    // Search radius: start at 2 miles, expand if not enough comps
    const radii = [2, 5, 10, 25]

    for (const radiusMiles of radii) {
      const radiusMeters = radiusMiles * 1609.34

      const { data, error } = await this.supabase.client.rpc('find_comps', {
        p_lat: lat,
        p_lng: lng,
        p_radius_meters: radiusMeters,
        p_sqft: sqft,
        p_beds: beds,
        p_property_type: property_type,
        p_months_back: 18,
      })

      if (error) {
        this.logger.error('Comp query error:', error)
        continue
      }

      if (data && data.length >= 3) {
        // Score and rank comps
        const scored = data
          .map((comp: any) => this.scoreComp(comp, request))
          .sort((a: Comp, b: Comp) => b.similarity_score - a.similarity_score)
          .slice(0, 6) // top 6 comps

        return scored
      }
    }

    return []
  }

  private scoreComp(comp: any, request: CmaRequestDto): Comp {
    const daysSinceSale = Math.floor(
      (Date.now() - new Date(comp.last_sale_date).getTime()) / (1000 * 60 * 60 * 24),
    )

    let score = 100

    // Penalize for age
    if (daysSinceSale > 90) score -= 10
    if (daysSinceSale > 180) score -= 15
    if (daysSinceSale > 365) score -= 20

    // Penalize for sq footage difference
    if (request.sqft) {
      const sqftDiff = Math.abs(comp.sqft - request.sqft) / request.sqft
      score -= sqftDiff * 30
    }

    // Penalize for bed difference
    if (request.beds && comp.beds !== request.beds) {
      score -= Math.abs(comp.beds - request.beds) * 10
    }

    // Penalize for distance
    score -= comp.distance_miles * 3

    return {
      ...comp,
      similarity_score: Math.max(0, Math.round(score)),
      price_per_sqft: comp.sqft ? Math.round(comp.last_sale_price / comp.sqft) : 0,
      days_since_sale: daysSinceSale,
    }
  }

  private calculateEstimate(
    request: CmaRequestDto,
    comps: Comp[],
  ): {
    low_estimate: number
    mid_estimate: number
    high_estimate: number
    confidence_score: number
  } {
    // Weight comps by similarity score and recency
    const totalWeight = comps.reduce((sum, c) => sum + c.similarity_score, 0)

    let weightedPricePerSqft = 0

    if (request.sqft) {
      weightedPricePerSqft = comps.reduce((sum, comp) => {
        const weight = comp.similarity_score / totalWeight
        return sum + comp.price_per_sqft * weight
      }, 0)
    }

    // Base estimate
    let baseEstimate: number

    if (request.sqft && weightedPricePerSqft > 0) {
      baseEstimate = weightedPricePerSqft * request.sqft
    } else {
      // Fallback: weighted average of sale prices
      baseEstimate = comps.reduce((sum, comp) => {
        const weight = comp.similarity_score / totalWeight
        return sum + comp.last_sale_price * weight
      }, 0)
    }

    // Apply adjustment factors
    let adjustedEstimate = baseEstimate

    // Condition adjustment
    const conditionMultiplier = {
      excellent: 1.08,
      good: 1.03,
      fair: 0.97,
      poor: 0.9,
    }
    if (request.condition) {
      adjustedEstimate *= conditionMultiplier[request.condition] ?? 1
    }

    // Garage adjustment (~$15k value in MN market)
    if (request.has_garage && !this.compsAvgHasGarage(comps)) {
      adjustedEstimate += 15000
    }

    // Finished basement adjustment (~$25/sqft in MN)
    if (request.basement_sqft) {
      adjustedEstimate += request.basement_sqft * 25
    }

    // Round to nearest $500
    adjustedEstimate = Math.round(adjustedEstimate / 500) * 500

    // Confidence score
    const avgSimilarity = totalWeight / comps.length
    const recencyBonus = comps.filter((c) => c.days_since_sale < 90).length * 5
    const confidence = Math.min(
      95,
      Math.round(avgSimilarity * 0.7 + recencyBonus + comps.length * 3),
    )

    // Range: ±8% for high confidence, ±12% for low
    const rangePercent = confidence > 70 ? 0.08 : 0.12

    return {
      low_estimate: Math.round((adjustedEstimate * (1 - rangePercent)) / 500) * 500,
      mid_estimate: adjustedEstimate,
      high_estimate: Math.round((adjustedEstimate * (1 + rangePercent)) / 500) * 500,
      confidence_score: confidence,
    }
  }

  private compsAvgHasGarage(comps: Comp[]): boolean {
    const withGarage = comps.filter((c: any) => c.garage).length
    return withGarage > comps.length / 2
  }

  private buildMethodologyText(comps: Comp[], request: CmaRequestDto): string {
    const avgAge = Math.round(comps.reduce((sum, c) => sum + c.days_since_sale, 0) / comps.length)
    return (
      `Estimate based on ${comps.length} comparable sales within the area, ` +
      `with an average sale age of ${avgAge} days. ` +
      `Comparables were weighted by similarity score (sq footage, beds/baths, proximity) and recency. ` +
      `Adjustment factors applied for condition, garage, and basement. ` +
      `Data sourced from Minnesota public parcel records. ` +
      `This is a Seller Market Estimate, not a licensed appraisal.`
    )
  }
}
