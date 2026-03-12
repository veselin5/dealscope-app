export interface Listing {
  id: string;
  source: string;
  source_id: string;
  source_url: string;
  city: 'sofia' | 'burgas' | 'varna' | 'plovdiv';
  property_type: string;
  title: string;
  price_eur: number;
  price_history?: PricePoint[];
  area_sqm?: number;
  floor?: number;
  total_floors?: number;
  neighborhood?: string;
  photos: string[];
  description?: string;
  is_agency?: boolean;
  deal_score?: number;
  price_per_sqm?: number;
  created_at: string;
  updated_at: string;
  is_new?: boolean;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface FilterState {
  city?: string;
  property_type?: string[];
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  floor_min?: number;
  floor_max?: number;
  sources?: string[];
  neighborhoods?: string[];
  score_min?: number;
  is_agency?: boolean | null;
  sort_by?: 'score' | 'price_asc' | 'price_desc' | 'newest' | 'area';
}

export interface MarketStats {
  total_listings: number;
  avg_price: number;
  avg_price_per_sqm: number;
  new_today: number;
  price_drops: number;
  sources: Record<string, number>;
  cities: Record<string, number>;
}

export interface PriceAlert {
  id: string;
  listing_id: string;
  listing: Listing;
  old_price: number;
  new_price: number;
  change_percent: number;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  created_at: string;
  email_alerts: boolean;
}

export interface ScraperRun {
  id: string;
  source: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  listings_found: number;
  new_listings: number;
  updated_listings: number;
  errors?: string[];
}

export interface Neighborhood {
  name: string;
  city: string;
  avg_price: number;
  avg_price_per_sqm: number;
  listing_count: number;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'score' | 'price_asc' | 'price_desc' | 'newest' | 'area';
