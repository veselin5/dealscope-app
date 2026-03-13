import { Listing, PriceAlert, MarketStats, ScraperRun, Neighborhood } from '@/types';
import demoData from './demo_data.json';

export type MockListing = Listing;

// Load listings from generated demo data
export const mockListings: Listing[] = demoData.listings.map(listing => ({
  ...listing,
  price_history: listing.price_history || undefined,
})) as Listing[];

// Calculate stats from listings
export const mockStats: MarketStats = {
  total_listings: demoData.stats.total_listings,
  avg_price: demoData.stats.avg_price,
  avg_price_per_sqm: demoData.stats.avg_price_per_sqm,
  new_today: demoData.stats.new_today,
  price_drops: demoData.stats.price_drops,
  sources: demoData.stats.sources,
  cities: demoData.stats.cities,
};

// Generate price alerts from listings with price drops
export const mockPriceAlerts: PriceAlert[] = mockListings
  .filter(l => l.price_history && l.price_history.length > 1)
  .slice(0, 10)
  .map((listing, i) => {
    const history = listing.price_history!;
    const oldPrice = history[0].price;
    const newPrice = history[history.length - 1].price;
    return {
      id: `alert-${i + 1}`,
      listing_id: listing.id,
      listing,
      old_price: oldPrice,
      new_price: newPrice,
      change_percent: ((newPrice - oldPrice) / oldPrice) * 100,
      created_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
    };
  });

// Scraper run status
const sources = ['imot_bg', 'homes_bg', 'olx_bg', 'alo_bg', 'address_bg', 'bazar_bg', 'buildingbox_bg'] as const;
type SourceType = typeof sources[number];

const sourceCounts = demoData.stats.sources as Record<SourceType, number>;

export const mockScraperRuns: ScraperRun[] = sources.map((source, i) => ({
  id: `run-${i + 1}`,
  source,
  started_at: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
  completed_at: new Date(Date.now() - i * 1800000).toISOString(),
  status: 'completed' as const,
  listings_found: sourceCounts[source] || 0,
  new_listings: Math.floor((sourceCounts[source] || 0) * 0.1),
  updated_listings: Math.floor((sourceCounts[source] || 0) * 0.3),
}));

// Generate neighborhood statistics
export const mockNeighborhoods: Neighborhood[] = (() => {
  const neighborhoodMap: Record<string, { prices: number[]; pricesPerSqm: number[]; city: string }> = {};

  mockListings.forEach(l => {
    const key = `${l.city}-${l.neighborhood}`;
    if (!neighborhoodMap[key]) {
      neighborhoodMap[key] = { prices: [], pricesPerSqm: [], city: l.city };
    }
    neighborhoodMap[key].prices.push(l.price_eur);
    if (l.price_per_sqm) {
      neighborhoodMap[key].pricesPerSqm.push(l.price_per_sqm);
    }
  });

  return Object.entries(neighborhoodMap)
    .map(([key, data]) => {
      const name = key.split('-').slice(1).join('-');
      return {
        name,
        city: data.city,
        avg_price: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length),
        avg_price_per_sqm: Math.round(data.pricesPerSqm.reduce((a, b) => a + b, 0) / data.pricesPerSqm.length),
        listing_count: data.prices.length,
      };
    })
    .sort((a, b) => b.avg_price_per_sqm - a.avg_price_per_sqm);
})();
