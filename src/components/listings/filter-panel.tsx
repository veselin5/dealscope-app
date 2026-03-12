'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FilterState } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const propertyTypes = [
  { value: 'apartment_1', label: '1-Bedroom' },
  { value: 'apartment_2', label: '2-Bedroom' },
  { value: 'apartment_3', label: '3-Bedroom' },
  { value: 'apartment_4', label: '4+ Bedroom' },
  { value: 'studio', label: 'Studio' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
];

const sources = [
  { value: 'imot_bg', label: 'Imot.bg' },
  { value: 'alo_bg', label: 'Alo.bg' },
  { value: 'homes_bg', label: 'Homes.bg' },
  { value: 'address_bg', label: 'Address.bg' },
  { value: 'bazar_bg', label: 'Bazar.bg' },
  { value: 'olx_bg', label: 'OLX.bg' },
  { value: 'buildingbox_bg', label: 'BuildingBox' },
];

const sortOptions = [
  { value: 'score', label: 'Best Score' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'area', label: 'Largest First' },
];

export function FilterPanel({ filters, onFiltersChange, className }: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['price', 'type']);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const togglePropertyType = (type: string) => {
    const current = filters.property_type || [];
    if (current.includes(type)) {
      updateFilter('property_type', current.filter((t) => t !== type));
    } else {
      updateFilter('property_type', [...current, type]);
    }
  };

  const toggleSource = (source: string) => {
    const current = filters.sources || [];
    if (current.includes(source)) {
      updateFilter('sources', current.filter((s) => s !== source));
    } else {
      updateFilter('sources', [...current, source]);
    }
  };

  const resetFilters = () => {
    onFiltersChange({ sort_by: 'score' });
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => key !== 'sort_by' && filters[key as keyof FilterState]
  );

  return (
    <Card className={cn('h-fit', className)} padding="none">
      <CardHeader className="px-5 py-4 border-b border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-500">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Sort */}
        <div className="px-5 py-4 border-b border-gray-100">
          <label className="text-sm font-medium text-gray-800 mb-2 block">Sort by</label>
          <Select
            options={sortOptions}
            value={filters.sort_by || 'score'}
            onChange={(e) => updateFilter('sort_by', e.target.value as FilterState['sort_by'])}
          />
        </div>

        {/* Price Range */}
        <FilterSection
          title="Price Range"
          isExpanded={expandedSections.includes('price')}
          onToggle={() => toggleSection('price')}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min (EUR)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.price_min || ''}
                onChange={(e) => updateFilter('price_min', Number(e.target.value) || undefined)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max (EUR)</label>
              <Input
                type="number"
                placeholder="Any"
                value={filters.price_max || ''}
                onChange={(e) => updateFilter('price_max', Number(e.target.value) || undefined)}
              />
            </div>
          </div>
        </FilterSection>

        {/* Property Type */}
        <FilterSection
          title="Property Type"
          isExpanded={expandedSections.includes('type')}
          onToggle={() => toggleSection('type')}
          count={filters.property_type?.length}
        >
          <div className="flex flex-wrap gap-2">
            {propertyTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => togglePropertyType(type.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg border transition-all',
                  filters.property_type?.includes(type.value)
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white border-indigo-100 text-gray-500 hover:border-indigo-500 hover:text-indigo-500'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Area */}
        <FilterSection
          title="Area (m²)"
          isExpanded={expandedSections.includes('area')}
          onToggle={() => toggleSection('area')}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.area_min || ''}
                onChange={(e) => updateFilter('area_min', Number(e.target.value) || undefined)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max</label>
              <Input
                type="number"
                placeholder="Any"
                value={filters.area_max || ''}
                onChange={(e) => updateFilter('area_max', Number(e.target.value) || undefined)}
              />
            </div>
          </div>
        </FilterSection>

        {/* Floor */}
        <FilterSection
          title="Floor"
          isExpanded={expandedSections.includes('floor')}
          onToggle={() => toggleSection('floor')}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min</label>
              <Input
                type="number"
                placeholder="1"
                value={filters.floor_min || ''}
                onChange={(e) => updateFilter('floor_min', Number(e.target.value) || undefined)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max</label>
              <Input
                type="number"
                placeholder="Any"
                value={filters.floor_max || ''}
                onChange={(e) => updateFilter('floor_max', Number(e.target.value) || undefined)}
              />
            </div>
          </div>
        </FilterSection>

        {/* Deal Score */}
        <FilterSection
          title="Deal Score"
          isExpanded={expandedSections.includes('score')}
          onToggle={() => toggleSection('score')}
        >
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Minimum Score</label>
            <Input
              type="number"
              placeholder="0"
              min={0}
              max={100}
              value={filters.score_min || ''}
              onChange={(e) => updateFilter('score_min', Number(e.target.value) || undefined)}
            />
          </div>
        </FilterSection>

        {/* Sources */}
        <FilterSection
          title="Sources"
          isExpanded={expandedSections.includes('sources')}
          onToggle={() => toggleSection('sources')}
          count={filters.sources?.length}
        >
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <button
                key={source.value}
                onClick={() => toggleSource(source.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg border transition-all',
                  filters.sources?.includes(source.value)
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white border-indigo-100 text-gray-500 hover:border-indigo-500 hover:text-indigo-500'
                )}
              >
                {source.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Seller Type */}
        <FilterSection
          title="Seller Type"
          isExpanded={expandedSections.includes('seller')}
          onToggle={() => toggleSection('seller')}
        >
          <div className="flex gap-2">
            <button
              onClick={() => updateFilter('is_agency', filters.is_agency === false ? null : false)}
              className={cn(
                'flex-1 px-3 py-2 text-sm rounded-lg border transition-all',
                filters.is_agency === false
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white border-indigo-100 text-gray-500 hover:border-indigo-500 hover:text-indigo-500'
              )}
            >
              Owner
            </button>
            <button
              onClick={() => updateFilter('is_agency', filters.is_agency === true ? null : true)}
              className={cn(
                'flex-1 px-3 py-2 text-sm rounded-lg border transition-all',
                filters.is_agency === true
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white border-indigo-100 text-gray-500 hover:border-indigo-500 hover:text-indigo-500'
              )}
            >
              Agency
            </button>
          </div>
        </FilterSection>
      </CardContent>
    </Card>
  );
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  count?: number;
}

function FilterSection({ title, children, isExpanded, onToggle, count }: FilterSectionProps) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-indigo-50/30 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
          {title}
          {count && count > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
              {count}
            </span>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isExpanded && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}
