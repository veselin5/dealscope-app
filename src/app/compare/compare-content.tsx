'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, ScoreBadge } from '@/components/ui/badge';
import { PriceChart } from '@/components/charts';
import { mockListings, mockStats } from '@/lib/mock-data';
import { formatPrice, formatArea, getPropertyTypeLabel, getCityLabel, getSourceLabel, cn } from '@/lib/utils';
import {
  Plus,
  X,
  Download,
  Share2,
  Building2,
  Layers,
  MapPin,
  Calendar,
  TrendingUp,
  Check,
  Minus,
} from 'lucide-react';
import Link from 'next/link';
import { Listing } from '@/types';

export function ComparePageContent() {
  const searchParams = useSearchParams();
  const initialIds = searchParams.get('ids')?.split(',') || [];

  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialIds.filter((id) => mockListings.some((l) => l.id === id)).slice(0, 4)
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const selectedListings = useMemo(
    () => selectedIds.map((id) => mockListings.find((l) => l.id === id)).filter(Boolean) as Listing[],
    [selectedIds]
  );

  const addListing = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
    setShowAddModal(false);
  };

  const removeListing = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
  };

  const ComparisonValue = ({
    values,
    format,
    higherBetter = true,
  }: {
    values: (number | undefined)[];
    format: (v: number) => string;
    higherBetter?: boolean;
  }) => {
    const validValues = values.filter((v): v is number => v !== undefined);
    if (validValues.length === 0) return null;

    const best = higherBetter ? Math.max(...validValues) : Math.min(...validValues);

    return (
      <>
        {values.map((value, i) => (
          <div key={i} className="p-4 text-center">
            {value !== undefined ? (
              <span className={cn('font-semibold', value === best && 'text-emerald-500')}>
                {format(value)}
                {value === best && values.length > 1 && (
                  <Check className="w-4 h-4 inline ml-1 text-emerald-500" />
                )}
              </span>
            ) : (
              <Minus className="w-4 h-4 text-gray-500 mx-auto" />
            )}
          </div>
        ))}
      </>
    );
  };

  return (
    <AppLayout newListingsToday={mockStats.new_today}>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Compare Listings</h1>
            <p className="text-gray-500 mt-1">
              Compare up to 4 properties side by side
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {selectedListings.length === 0 ? (
          <Card className="py-16">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No listings to compare</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Add listings from the search page by clicking the compare icon, or add listings
                directly here.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/search">
                  <Button variant="secondary">Browse Listings</Button>
                </Link>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Listing
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Listing Cards Row */}
              <div
                className="grid gap-4 mb-6"
                style={{ gridTemplateColumns: `repeat(${Math.min(selectedListings.length + 1, 5)}, 1fr)` }}
              >
                {selectedListings.map((listing) => (
                  <Card key={listing.id} className="relative overflow-hidden">
                    <button
                      onClick={() => removeListing(listing.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500/10 hover:bg-red-500/20 rounded-full flex items-center justify-center text-red-500 z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Link href={`/listing/${listing.id}`}>
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-xl font-bold text-gray-800">
                            {formatPrice(listing.price_eur)}
                          </p>
                          {listing.deal_score && (
                            <ScoreBadge score={listing.deal_score} size="sm" />
                          )}
                        </div>
                        <p className="font-medium text-gray-800 mb-1 line-clamp-1">
                          {listing.title}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {listing.neighborhood}
                        </p>
                      </div>
                    </Link>
                  </Card>
                ))}

                {selectedListings.length < 4 && (
                  <Card
                    className="flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                    onClick={() => setShowAddModal(true)}
                  >
                    <div className="text-center py-16">
                      <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-7 h-7 text-indigo-500" />
                      </div>
                      <p className="font-medium text-gray-800">Add Listing</p>
                      <p className="text-sm text-gray-500">Compare up to 4</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Comparison Details */}
              <Card>
                <CardContent className="p-0">
                  <div className="grid border-b border-indigo-100" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      Price
                    </div>
                    <ComparisonValue
                      values={selectedListings.map((l) => l.price_eur)}
                      format={(v) => formatPrice(v)}
                      higherBetter={false}
                    />
                  </div>

                  <div className="grid border-b border-indigo-100" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      Price per m²
                    </div>
                    <ComparisonValue
                      values={selectedListings.map((l) => l.price_per_sqm)}
                      format={(v) => formatPrice(v)}
                      higherBetter={false}
                    />
                  </div>

                  <div className="grid border-b border-indigo-100" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      Area
                    </div>
                    <ComparisonValue
                      values={selectedListings.map((l) => l.area_sqm)}
                      format={(v) => formatArea(v)}
                      higherBetter={true}
                    />
                  </div>

                  <div className="grid border-b border-indigo-100" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      Deal Score
                    </div>
                    <ComparisonValue
                      values={selectedListings.map((l) => l.deal_score)}
                      format={(v) => `${v}`}
                      higherBetter={true}
                    />
                  </div>

                  <div className="grid border-b border-indigo-100" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      Floor
                    </div>
                    {selectedListings.map((listing) => (
                      <div key={listing.id} className="p-4 text-center font-semibold">
                        {listing.floor ? `${listing.floor}/${listing.total_floors || '?'}` : '-'}
                      </div>
                    ))}
                  </div>

                  <div className="grid border-b border-indigo-100" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      Type
                    </div>
                    {selectedListings.map((listing) => (
                      <div key={listing.id} className="p-4 text-center">
                        <Badge variant="primary">{getPropertyTypeLabel(listing.property_type)}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="grid border-b border-indigo-100" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      Location
                    </div>
                    {selectedListings.map((listing) => (
                      <div key={listing.id} className="p-4 text-center text-sm">
                        <p className="font-semibold text-gray-800">{listing.neighborhood}</p>
                        <p className="text-gray-500">{getCityLabel(listing.city)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid border-b border-indigo-100" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      Source
                    </div>
                    {selectedListings.map((listing) => (
                      <div key={listing.id} className="p-4 text-center">
                        <Badge>{getSourceLabel(listing.source)}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: `200px repeat(${selectedListings.length}, 1fr)` }}>
                    <div className="p-4 bg-gray-100/50 font-medium text-gray-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      Seller
                    </div>
                    {selectedListings.map((listing) => (
                      <div key={listing.id} className="p-4 text-center">
                        <Badge variant={listing.is_agency ? 'default' : 'success'}>
                          {listing.is_agency ? 'Agency' : 'Owner'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedListings.some((l) => l.price_history && l.price_history.length > 1) && (
                <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: `repeat(${selectedListings.length}, 1fr)` }}>
                  {selectedListings.map((listing) => (
                    <Card key={listing.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Price History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {listing.price_history && listing.price_history.length > 1 ? (
                          <PriceChart data={listing.price_history} height={150} showAxis={false} />
                        ) : (
                          <div className="h-[150px] flex items-center justify-center text-gray-500">
                            No price history
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showAddModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowAddModal(false)}
          >
            <Card
              className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="border-b border-indigo-100">
                <CardTitle>Add Listing to Compare</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {mockListings
                    .filter((l) => !selectedIds.includes(l.id))
                    .slice(0, 20)
                    .map((listing) => (
                      <button
                        key={listing.id}
                        onClick={() => addListing(listing.id)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50/50 transition-colors text-left"
                      >
                        <img
                          src={listing.photos[0]}
                          alt=""
                          className="w-20 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{listing.title}</p>
                          <p className="text-sm text-gray-500">
                            {listing.neighborhood}, {listing.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">
                            {formatPrice(listing.price_eur)}
                          </p>
                          {listing.deal_score && (
                            <span
                              className={cn(
                                'text-sm font-medium',
                                listing.deal_score >= 70
                                  ? 'text-emerald-500'
                                  : listing.deal_score >= 40
                                  ? 'text-amber-500'
                                  : 'text-red-500'
                              )}
                            >
                              Score: {listing.deal_score}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
