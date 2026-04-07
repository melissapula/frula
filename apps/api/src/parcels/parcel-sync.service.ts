import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * ParcelSyncService
 *
 * Keeps our parcel/comp data fresh from MN public sources.
 *
 * Data sources:
 * - MN Geospatial Commons: https://gisdata.mn.gov
 *   → Statewide parcel dataset (annual bulk, free)
 *   → County-level updates (varies by county)
 *
 * - MN Dept of Revenue property records (public)
 *
 * Strategy:
 * - Weekly: check for county deed recording updates
 * - Monthly: re-pull full county snapshots that have updated
 * - Annual: full re-seed from MN statewide dataset
 */
@Injectable()
export class ParcelSyncService {
  private readonly logger = new Logger(ParcelSyncService.name);

  // Counties we support (expanding over time)
  // Start with Beltrami + neighboring counties
  private readonly SUPPORTED_COUNTIES = [
    { name: 'Beltrami', fips: '27007' },
    { name: 'Hubbard', fips: '27057' },
    { name: 'Clearwater', fips: '27029' },
    { name: 'Cass', fips: '27021' },
    { name: 'Koochiching', fips: '27071' },
  ];

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Weekly sync — check for new deed recordings
   * Runs every Sunday at 2am
   */
  @Cron('0 2 * * 0')
  async weeklyDeedSync() {
    this.logger.log('Starting weekly deed recording sync...');

    for (const county of this.SUPPORTED_COUNTIES) {
      try {
        await this.syncCountyDeeds(county.name, county.fips);
      } catch (err) {
        this.logger.error(`Failed to sync ${county.name} county: ${err.message}`);
      }
    }

    this.logger.log('Weekly deed sync complete.');
  }

  /**
   * Monthly parcel refresh
   * Runs 1st of each month at 3am
   */
  @Cron('0 3 1 * *')
  async monthlyParcelRefresh() {
    this.logger.log('Starting monthly parcel refresh...');
    await this.refreshStaleRecords();
    this.logger.log('Monthly parcel refresh complete.');
  }

  private async syncCountyDeeds(countyName: string, fips: string) {
    this.logger.log(`Syncing deed recordings for ${countyName} County (FIPS: ${fips})`);

    /**
     * MN county deed data sources vary by county:
     *
     * Beltrami: https://www.co.beltrami.mn.us/departments/recorder
     * Many MN counties use GovTech/Fidlar for online deed search
     * Some expose CSV/GeoJSON via their GIS portals
     *
     * TODO: Implement per-county scraper/API integration
     * For MVP: manual CSV import via admin endpoint
     *
     * When a county GIS portal is available:
     * 1. Fetch updated parcel GeoJSON/CSV
     * 2. Parse address, sale price, sale date, parcel characteristics
     * 3. Upsert into parcels table (ON CONFLICT DO UPDATE)
     * 4. Flag old records that weren't in the update
     */

    this.logger.debug(`[${countyName}] Deed sync placeholder — implement county-specific connector`);
  }

  private async refreshStaleRecords() {
    // Flag records older than 12 months as low confidence
    const { error } = await this.supabase.client
      .from('parcels')
      .update({ data_source: 'mn_parcel_stale' })
      .lt('last_sale_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (error) {
      this.logger.error('Failed to flag stale records:', error);
    }
  }

  /**
   * Manual import endpoint — called by admin when new CSV is available
   * Accepts MN parcel CSV format
   */
  async importParcelCsv(records: any[]): Promise<{ imported: number; errors: number }> {
    let imported = 0;
    let errors = 0;

    // Process in batches of 500
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const normalized = batch.map(r => ({
        parcel_id: r.PIN || r.parcel_id || r.APN,
        address: r.SITEADDR || r.address,
        city: r.SITECITY || r.city,
        state: 'MN',
        zip: r.SITEZIP || r.zip,
        county: r.COUNTYNAME || r.county,
        lat: parseFloat(r.LAT || r.lat) || null,
        lng: parseFloat(r.LON || r.lng) || null,
        sqft: parseInt(r.FINISHEDAREA || r.sqft) || null,
        lot_size: parseFloat(r.ACREAGE || r.lot_size) || null,
        beds: parseInt(r.BEDROOMS || r.beds) || null,
        baths: parseFloat(r.BATHROOMS || r.baths) || null,
        year_built: parseInt(r.YEARBUILT || r.year_built) || null,
        assessed_value: parseFloat(r.EMV || r.assessed_value) || null,
        estimated_market_value: parseFloat(r.EMV || r.estimated_market_value) || null,
        last_sale_price: parseFloat(r.SALEPRICE || r.last_sale_price) || null,
        last_sale_date: r.SALEDATE || r.last_sale_date || null,
        source_updated_at: new Date().toISOString().split('T')[0],
      })).filter(r => r.parcel_id && r.address);

      const { error } = await this.supabase.client
        .from('parcels')
        .upsert(normalized, { onConflict: 'parcel_id', ignoreDuplicates: false });

      if (error) {
        this.logger.error(`Batch import error: ${error.message}`);
        errors += batch.length;
      } else {
        imported += normalized.length;
      }
    }

    this.logger.log(`Import complete: ${imported} records imported, ${errors} errors`);
    return { imported, errors };
  }
}
