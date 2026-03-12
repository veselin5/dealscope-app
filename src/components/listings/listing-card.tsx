'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice, formatArea, formatRelativeTime, getPropertyTypeLabel, getSourceLabel } from '@/lib/utils';
import { Listing } from '@/types';
import { Badge, ScoreBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, GitCompare, ChevronLeft, ChevronRight, ExternalLink, Building2, Layers, MapPin } from 'lucide-react';
import { Sparkline } from '@/components/charts/sparkline';
import Link from 'next/link';

interface ListingCardProps {
  listing: Listing;
  view?: 'grid' | 'list';
  onSave?: (id: string) => void;
  onCompare?: (id: string) => void;
  onShare?: (id: string) => void;
  isSaved?: boolean;
  isComparing?: boolean;
}

export function ListingCard({
  listing,
  view = 'list',
  onSave,
  onCompare,
  onShare,
  isSaved = false,
  isComparing = false,
}: ListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const hasMultipleImages = listing.photos.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((i) => (i + 1) % listing.photos.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((i) => (i - 1 + listing.photos.length) % listing.photos.length);
  };

  const priceHistory = listing.price_history || [];
  const hasPriceHistory = priceHistory.length > 1;
  const lastPriceChange = hasPriceHistory
    ? ((priceHistory[priceHistory.length - 1].price - priceHistory[priceHistory.length - 2].price) / priceHistory[priceHistory.length - 2].price) * 100
    : 0;

  if (view === 'grid') {
    return (
      <Link href={`/listing/${listing.id}`}>
        <div
          className={cn(
            'bg-white rounded-2xl border border-indigo-100 shadow-card card-hover overflow-hidden group',
            isComparing && 'ring-2 ring-indigo-500'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={listing.photos[currentImageIndex] || '/placeholder.jpg'}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Image Navigation */}
            {hasMultipleImages && isHovered && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Image Dots */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {listing.photos.slice(0, 5).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all',
                      i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                    )}
                  />
                ))}
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-2">
              {listing.is_new && <Badge variant="new">New</Badge>}
              {listing.is_agency && <Badge variant="default">Agency</Badge>}
            </div>

            {/* Score */}
            {listing.deal_score && (
              <div className="absolute top-2 right-2">
                <ScoreBadge score={listing.deal_score} size="sm" />
              </div>
            )}

            {/* Quick Actions */}
            {isHovered && (
              <div className="absolute bottom-2 right-2 flex gap-1 animate-fadeIn">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-8 h-8 p-0 bg-white/90 hover:bg-white',
                    isSaved && 'text-red-500'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onSave?.(listing.id);
                  }}
                >
                  <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-8 h-8 p-0 bg-white/90 hover:bg-white',
                    isComparing && 'text-indigo-500'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onCompare?.(listing.id);
                  }}
                >
                  <GitCompare className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-lg font-bold text-gray-800">{formatPrice(listing.price_eur)}</p>
                {listing.price_per_sqm && (
                  <p className="text-sm text-gray-500">{formatPrice(listing.price_per_sqm)}/m²</p>
                )}
              </div>
              {hasPriceHistory && (
                <div className="sparkline">
                  <Sparkline data={priceHistory.map(p => p.price)} />
                </div>
              )}
            </div>

            <h3 className="font-medium text-gray-800 mb-2 line-clamp-1">{listing.title}</h3>

            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              {listing.area_sqm && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {formatArea(listing.area_sqm)}
                </span>
              )}
              {listing.floor && (
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Floor {listing.floor}/{listing.total_floors || '?'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">{getSourceLabel(listing.source)}</span>
              <span className="text-xs text-gray-400">{formatRelativeTime(listing.created_at)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // List View
  return (
    <Link href={`/listing/${listing.id}`}>
      <div
        className={cn(
          'flex gap-4 p-4 bg-white rounded-2xl border border-indigo-100 shadow-card card-hover group',
          isComparing && 'ring-2 ring-indigo-500'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative w-40 h-32 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={listing.photos[currentImageIndex] || '/placeholder.jpg'}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Image Navigation */}
          {hasMultipleImages && isHovered && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Image Dots */}
          {hasMultipleImages && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
              {listing.photos.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1 h-1 rounded-full',
                    i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          )}

          {/* New Badge */}
          {listing.is_new && (
            <div className="absolute top-2 left-2">
              <Badge variant="new" size="sm">New</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{listing.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{listing.neighborhood}, {listing.city}</span>
              </div>
            </div>

            {/* Score Badge */}
            {listing.deal_score && (
              <ScoreBadge score={listing.deal_score} size="md" />
            )}
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-3 mb-3">
            <Badge variant="primary">{getPropertyTypeLabel(listing.property_type)}</Badge>
            {listing.area_sqm && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="w-3.5 h-3.5" />
                {formatArea(listing.area_sqm)}
              </span>
            )}
            {listing.floor && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Layers className="w-3.5 h-3.5" />
                Floor {listing.floor}/{listing.total_floors || '?'}
              </span>
            )}
            {listing.is_agency && (
              <Badge variant="default" size="sm">Agency</Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{getSourceLabel(listing.source)}</span>
              <span>•</span>
              <span>{formatRelativeTime(listing.created_at)}</span>
            </div>

            {/* Quick Actions */}
            <div className={cn(
              'flex gap-1 transition-opacity',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}>
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-8 px-2', isSaved && 'text-red-500')}
                onClick={(e) => {
                  e.preventDefault();
                  onSave?.(listing.id);
                }}
              >
                <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-8 px-2', isComparing && 'text-indigo-500')}
                onClick={(e) => {
                  e.preventDefault();
                  onCompare?.(listing.id);
                }}
              >
                <GitCompare className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  onShare?.(listing.id);
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(listing.source_url, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Price Column */}
        <div className="text-right flex-shrink-0 min-w-[140px]">
          <p className="text-xl font-bold text-gray-800">{formatPrice(listing.price_eur)}</p>
          {listing.price_per_sqm && (
            <p className="text-sm text-gray-500">{formatPrice(listing.price_per_sqm)}/m²</p>
          )}
          {hasPriceHistory && (
            <div className="mt-2 flex items-center justify-end gap-2">
              <div className="sparkline">
                <Sparkline data={priceHistory.map(p => p.price)} />
              </div>
              {lastPriceChange !== 0 && (
                <span className={cn(
                  'text-xs font-medium',
                  lastPriceChange < 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {lastPriceChange > 0 ? '+' : ''}{lastPriceChange.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
