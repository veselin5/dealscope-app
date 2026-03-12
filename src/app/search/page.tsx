'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { ListingCard, FilterPanel } from '@/components/listings';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { mockListings, mockStats } from '@/lib/mock-data';
import { FilterState, ViewMode, Listing } from '@/types';
import { getPropertyTypeLabel, getSourceLabel } from '@/lib/utils';
import { Grid3X3, List, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 12;

export default function SearchPage() {
  const [filters, setFilters] = useState<FilterState>({ sort_by: 'score' });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [comparingListings, setComparingListings] = useState<Set<string>>(new Set());

  const filteredListings = useMemo(() => {
    let result = [...mockListings];

    // Apply filters
    if (filters.property_type && filters.property_type.length > 0) {
      result = result.filter((l) => filters.property_type!.includes(l.property_type));
    }
    if (filters.price_min) {
      result = result.filter((l) => l.price_eur >= filters.price_min!);
    }
    if (filters.price_max) {
      result = result.filter((l) => l.price_eur <= filters.price_max!);
    }
    if (filters.area_min) {
      result = result.filter((l) => l.area_sqm && l.area_sqm >= filters.area_min!);
    }
    if (filters.area_max) {
      result = result.filter((l) => l.area_sqm && l.area_sqm <= filters.area_max!);
    }
    if (filters.floor_min) {
      result = result.filter((l) => l.floor && l.floor >= filters.floor_min!);
    }
    if (filters.floor_max) {
      result = result.filter((l) => l.floor && l.floor <= filters.floor_max!);
    }
    if (filters.score_min) {
      result = result.filter((l) => l.deal_score && l.deal_score >= filters.score_min!);
    }
    if (filters.sources && filters.sources.length > 0) {
      result = result.filter((l) => filters.sources!.includes(l.source));
    }
    if (filters.is_agency !== null && filters.is_agency !== undefined) {
      result = result.filter((l) => l.is_agency === filters.is_agency);
    }

    // Sort
    switch (filters.sort_by) {
      case 'score':
        result.sort((a, b) => (b.deal_score || 0) - (a.deal_score || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => a.price_eur - b.price_eur);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price_eur - a.price_eur);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'area':
        result.sort((a, b) => (b.area_sqm || 0) - (a.area_sqm || 0));
        break;
    }

    return result;
  }, [filters]);

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string }[] = [];

    if (filters.property_type && filters.property_type.length > 0) {
      filters.property_type.forEach((type) => {
        chips.push({ key: `type-${type}`, label: getPropertyTypeLabel(type) });
      });
    }
    if (filters.price_min || filters.price_max) {
      const label = `€${filters.price_min?.toLocaleString() || 0} - €${
        filters.price_max?.toLocaleString() || 'Any'
      }`;
      chips.push({ key: 'price', label });
    }
    if (filters.area_min || filters.area_max) {
      const label = `${filters.area_min || 0} - ${filters.area_max || 'Any'} m²`;
      chips.push({ key: 'area', label });
    }
    if (filters.score_min) {
      chips.push({ key: 'score', label: `Score ≥ ${filters.score_min}` });
    }
    if (filters.sources && filters.sources.length > 0) {
      filters.sources.forEach((source) => {
        chips.push({ key: `source-${source}`, label: getSourceLabel(source) });
      });
    }
    if (filters.is_agency === true) {
      chips.push({ key: 'agency', label: 'Agency only' });
    } else if (filters.is_agency === false) {
      chips.push({ key: 'owner', label: 'Owner only' });
    }

    return chips;
  }, [filters]);

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };

    if (key.startsWith('type-')) {
      const type = key.replace('type-', '');
      newFilters.property_type = newFilters.property_type?.filter((t) => t !== type);
    } else if (key === 'price') {
      delete newFilters.price_min;
      delete newFilters.price_max;
    } else if (key === 'area') {
      delete newFilters.area_min;
      delete newFilters.area_max;
    } else if (key === 'score') {
      delete newFilters.score_min;
    } else if (key.startsWith('source-')) {
      const source = key.replace('source-', '');
      newFilters.sources = newFilters.sources?.filter((s) => s !== source);
    } else if (key === 'agency' || key === 'owner') {
      newFilters.is_agency = null;
    }

    setFilters(newFilters);
  };

  const toggleSaved = (id: string) => {
    setSavedListings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setComparingListings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AppLayout newListingsToday={mockStats.new_today}>
      <div className="flex gap-6 animate-fadeIn">
        {/* Filter Panel - Desktop */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Search Listings</h1>
              <p className="text-gray-500 mt-1">
                {filteredListings.length.toLocaleString()} properties found
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <Button
                variant="secondary"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>

              {/* View Mode Toggle */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'list'
                      ? 'bg-white text-indigo-500 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'grid'
                      ? 'bg-white text-indigo-500 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((filter) => (
                <FilterChip
                  key={filter.key}
                  label={filter.label}
                  onRemove={() => removeFilter(filter.key)}
                  active
                />
              ))}
              <button
                onClick={() => setFilters({ sort_by: 'score' })}
                className="text-sm text-gray-500 hover:text-indigo-500"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Comparison Bar */}
          {comparingListings.size > 0 && (
            <Card className="mb-4 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">
                    {comparingListings.size} listings selected for comparison
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setComparingListings(new Set())}
                  >
                    Clear
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    const ids = Array.from(comparingListings).join(',');
                    window.location.href = `/compare?ids=${ids}`;
                  }}
                  disabled={comparingListings.size < 2}
                >
                  Compare ({comparingListings.size})
                </Button>
              </div>
            </Card>
          )}

          {/* Results Grid/List */}
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                : 'space-y-4'
            )}
          >
            {paginatedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                view={viewMode}
                isSaved={savedListings.has(listing.id)}
                isComparing={comparingListings.has(listing.id)}
                onSave={toggleSaved}
                onCompare={toggleCompare}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-sm font-medium transition-all',
                      currentPage === page
                        ? 'bg-indigo-500 text-white'
                        : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-500'
                    )}
                  >
                    {page}
                  </button>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Filter Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileFilters(false)}
            />
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#FAFAFE] overflow-y-auto animate-slideIn">
              <div className="flex items-center justify-between p-4 border-b border-indigo-100">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <FilterPanel filters={filters} onFiltersChange={setFilters} />
              <div className="p-4 border-t border-indigo-100">
                <Button
                  className="w-full"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Show {filteredListings.length} results
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
