'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, ScoreBadge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { ListingCard } from '@/components/listings';
import { mockListings, mockNeighborhoods, mockStats } from '@/lib/mock-data';
import { formatPrice, formatPriceCompact, getCityLabel } from '@/lib/utils';
import {
  Maximize2,
  Minimize2,
  Layers,
  MapPin,
  Building2,
  X,
  ChevronRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Listing } from '@/types';

export default function MapPage() {
  const [selectedCity, setSelectedCity] = useState('sofia');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [compareNeighborhoods, setCompareNeighborhoods] = useState<string[]>([]);

  const cityListings = useMemo(
    () => mockListings.filter((l) => l.city === selectedCity),
    [selectedCity]
  );

  const cityNeighborhoods = useMemo(
    () => mockNeighborhoods.filter((n) => n.city === selectedCity),
    [selectedCity]
  );

  const toggleCompareNeighborhood = (name: string) => {
    setCompareNeighborhoods((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < 2 ? [...prev, name] : prev
    );
  };

  const selectedNeighborhoodsData = useMemo(
    () => cityNeighborhoods.filter((n) => compareNeighborhoods.includes(n.name)),
    [cityNeighborhoods, compareNeighborhoods]
  );

  return (
    <AppLayout newListingsToday={mockStats.new_today}>
      <div className={cn('animate-fadeIn', isFullscreen && 'fixed inset-0 z-50 bg-background p-4')}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Map View</h1>
            <p className="text-gray-500 mt-1">
              {cityListings.length} listings in {getCityLabel(selectedCity)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: 'sofia', label: 'Sofia' },
                { value: 'burgas', label: 'Burgas' },
              ]}
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-36"
            />
            <Button
              variant={showHeatmap ? 'primary' : 'secondary'}
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Heatmap
            </Button>
            <Button variant="secondary" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '70vh' }}>
          {/* Map Container */}
          <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-indigo-100 bg-white">
            {/* Placeholder Map */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Map</h3>
                <p className="text-gray-500 max-w-sm">
                  Map integration with Mapbox or Google Maps would display property clusters and
                  markers here. Click on markers to view listing details.
                </p>
              </div>
            </div>

            {/* Mock Markers */}
            <div className="absolute inset-0 pointer-events-none">
              {cityListings.slice(0, 20).map((listing, i) => (
                <div
                  key={listing.id}
                  className="absolute marker-cluster w-10 h-10 pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: `${15 + (i % 5) * 18}%`,
                    top: `${15 + Math.floor(i / 5) * 20}%`,
                  }}
                  onClick={() => setSelectedListing(listing)}
                >
                  {formatPriceCompact(listing.price_eur).replace('€', '')}
                </div>
              ))}
            </div>

            {/* Heatmap Overlay */}
            {showHeatmap && (
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute w-48 h-48 rounded-full opacity-30"
                  style={{
                    background: 'radial-gradient(circle, var(--error) 0%, transparent 70%)',
                    left: '30%',
                    top: '20%',
                  }}
                />
                <div
                  className="absolute w-36 h-36 rounded-full opacity-30"
                  style={{
                    background: 'radial-gradient(circle, var(--warning) 0%, transparent 70%)',
                    left: '50%',
                    top: '40%',
                  }}
                />
                <div
                  className="absolute w-40 h-40 rounded-full opacity-30"
                  style={{
                    background: 'radial-gradient(circle, var(--success) 0%, transparent 70%)',
                    left: '20%',
                    top: '55%',
                  }}
                />
              </div>
            )}

            {/* Map Legend */}
            {showHeatmap && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-indigo-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Price Density</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500">Low</span>
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-gray-500">Medium</span>
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-500">High</span>
                </div>
              </div>
            )}

            {/* Selected Listing Popup */}
            {selectedListing && (
              <div className="absolute bottom-4 right-4 w-80 animate-slideUp">
                <Card>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedListing(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Link href={`/listing/${selectedListing.id}`}>
                      <div className="aspect-[16/9] rounded-t-2xl overflow-hidden">
                        <img
                          src={selectedListing.photos[0]}
                          alt={selectedListing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-bold text-lg text-gray-800">
                            {formatPrice(selectedListing.price_eur)}
                          </p>
                          {selectedListing.deal_score && (
                            <ScoreBadge score={selectedListing.deal_score} size="sm" />
                          )}
                        </div>
                        <p className="font-medium text-gray-800 mb-1 line-clamp-1">
                          {selectedListing.title}
                        </p>
                        <p className="text-sm text-gray-500 mb-3">
                          {selectedListing.neighborhood}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {selectedListing.area_sqm && (
                              <Badge variant="default">{selectedListing.area_sqm} m²</Badge>
                            )}
                            {selectedListing.floor && (
                              <Badge variant="default">Floor {selectedListing.floor}</Badge>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-indigo-500" />
                        </div>
                      </div>
                    </Link>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar - Neighborhoods */}
          <div className="space-y-4 overflow-y-auto">
            {/* Neighborhood Compare */}
            {compareNeighborhoods.length === 2 && (
              <Card className="bg-indigo-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Compare Neighborhoods</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompareNeighborhoods([])}
                  >
                    Clear
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedNeighborhoodsData.map((n) => (
                      <div key={n.name} className="text-center">
                        <p className="font-medium text-gray-800 mb-2">{n.name}</p>
                        <p className="text-xl font-bold text-indigo-500">
                          {formatPrice(n.avg_price_per_sqm)}/m²
                        </p>
                        <p className="text-sm text-gray-500">{n.listing_count} listings</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Neighborhood List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Neighborhoods</CardTitle>
                <span className="text-xs text-gray-500">Click to compare (max 2)</span>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {cityNeighborhoods.map((neighborhood) => (
                  <button
                    key={neighborhood.name}
                    onClick={() => toggleCompareNeighborhood(neighborhood.name)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl transition-all text-left',
                      compareNeighborhoods.includes(neighborhood.name)
                        ? 'bg-indigo-500 text-white'
                        : 'hover:bg-indigo-50/50'
                    )}
                  >
                    <div>
                      <p
                        className={cn(
                          'font-medium',
                          compareNeighborhoods.includes(neighborhood.name)
                            ? 'text-white'
                            : 'text-gray-800'
                        )}
                      >
                        {neighborhood.name}
                      </p>
                      <p
                        className={cn(
                          'text-sm',
                          compareNeighborhoods.includes(neighborhood.name)
                            ? 'text-white/70'
                            : 'text-gray-500'
                        )}
                      >
                        {neighborhood.listing_count} listings
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'font-semibold',
                          compareNeighborhoods.includes(neighborhood.name)
                            ? 'text-white'
                            : 'text-gray-800'
                        )}
                      >
                        {formatPrice(neighborhood.avg_price_per_sqm)}/m²
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          compareNeighborhoods.includes(neighborhood.name)
                            ? 'text-white/70'
                            : 'text-gray-500'
                        )}
                      >
                        avg. {formatPriceCompact(neighborhood.avg_price)}
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Recent in Area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent in Area</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cityListings.slice(0, 5).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50/50 transition-colors"
                    onMouseEnter={() => setSelectedListing(listing)}
                  >
                    <img
                      src={listing.photos[0]}
                      alt=""
                      className="w-12 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {listing.neighborhood}
                      </p>
                      <p className="text-xs text-gray-500">{listing.area_sqm} m²</p>
                    </div>
                    <p className="text-sm font-bold text-indigo-500">
                      {formatPriceCompact(listing.price_eur)}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
