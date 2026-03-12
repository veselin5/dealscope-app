import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPriceCompact(price: number): string {
  if (price >= 1000000) {
    return `€${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `€${(price / 1000).toFixed(0)}K`;
  }
  return `€${price}`;
}

export function formatArea(sqm: number): string {
  return `${sqm.toFixed(0)} m²`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function calculatePriceChange(oldPrice: number, newPrice: number): number {
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

export function getScoreColor(score: number): 'high' | 'mid' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

export function getScoreGradient(score: number): string {
  if (score >= 70) return 'gradient-score-high';
  if (score >= 40) return 'gradient-score-mid';
  return 'gradient-score-low';
}

export function isNewListing(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment_1: '1-bedroom',
    apartment_2: '2-bedroom',
    apartment_3: '3-bedroom',
    apartment_4: '4+ bedroom',
    studio: 'Studio',
    house: 'House',
    villa: 'Villa',
    land: 'Land',
    commercial: 'Commercial',
    garage: 'Garage',
    office: 'Office',
  };
  return labels[type] || type;
}

export function getCityLabel(city: string): string {
  const labels: Record<string, string> = {
    sofia: 'Sofia',
    burgas: 'Burgas',
    varna: 'Varna',
    plovdiv: 'Plovdiv',
  };
  return labels[city] || city;
}

export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    imot_bg: 'Imot.bg',
    alo_bg: 'Alo.bg',
    homes_bg: 'Homes.bg',
    address_bg: 'Address.bg',
    bazar_bg: 'Bazar.bg',
    olx_bg: 'OLX.bg',
    buildingbox_bg: 'BuildingBox',
  };
  return labels[source] || source;
}

export function generateMockListings(count: number): import('./mock-data').MockListing[] {
  // This is imported from mock-data for actual generation
  return [];
}
