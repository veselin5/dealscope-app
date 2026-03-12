'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, ScoreBadge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PriceChart } from '@/components/charts';
import { ListingCard } from '@/components/listings';
import { Modal } from '@/components/ui/modal';
import { mockListings } from '@/lib/mock-data';
import {
  formatPrice,
  formatArea,
  formatDate,
  getPropertyTypeLabel,
  getSourceLabel,
  getCityLabel,
} from '@/lib/utils';
import {
  ArrowLeft,
  Heart,
  Share2,
  GitCompare,
  ExternalLink,
  Building2,
  Layers,
  MapPin,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Calculator,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const listing = useMemo(() => mockListings.find((l) => l.id === id), [id]);
  const similarListings = useMemo(
    () =>
      mockListings
        .filter(
          (l) =>
            l.id !== id &&
            l.city === listing?.city &&
            Math.abs(l.price_eur - (listing?.price_eur || 0)) < 50000
        )
        .slice(0, 4),
    [id, listing]
  );

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Investment calculator state
  const [downPayment, setDownPayment] = useState(20);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTerm, setLoanTerm] = useState(25);
  const [monthlyRent, setMonthlyRent] = useState(800);

  if (!listing) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Listing Not Found</h1>
            <p className="text-gray-500 mb-4">The listing you're looking for doesn't exist.</p>
            <Link href="/search">
              <Button>Browse Listings</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const priceHistory = listing.price_history || [];
  const hasPriceHistory = priceHistory.length > 1;
  const priceChange = hasPriceHistory
    ? ((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) /
        priceHistory[0].price) *
      100
    : 0;

  // Investment calculations
  const loanAmount = listing.price_eur * (1 - downPayment / 100);
  const monthlyInterest = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;
  const monthlyMortgage =
    (loanAmount * (monthlyInterest * Math.pow(1 + monthlyInterest, numPayments))) /
    (Math.pow(1 + monthlyInterest, numPayments) - 1);
  const annualRent = monthlyRent * 12;
  const grossYield = (annualRent / listing.price_eur) * 100;
  const monthlyCashFlow = monthlyRent - monthlyMortgage;

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % listing.photos.length);
  const prevImage = () =>
    setCurrentImageIndex((i) => (i - 1 + listing.photos.length) % listing.photos.length);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Back Button */}
        <Link href="/search" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-500">
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card padding="none" className="overflow-hidden">
              {/* Main Image */}
              <div
                className="relative aspect-[16/10] cursor-pointer"
                onClick={() => setShowLightbox(true)}
              >
                <img
                  src={listing.photos[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />

                {/* Navigation */}
                {listing.photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {listing.is_new && <Badge variant="new">New</Badge>}
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {listing.photos.length}
                </div>
              </div>

              {/* Thumbnails */}
              {listing.photos.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {listing.photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={cn(
                        'flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all',
                        currentImageIndex === i ? 'border-indigo-500' : 'border-transparent opacity-70'
                      )}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-indigo-50/30 rounded-xl">
                    <Building2 className="w-5 h-5 text-indigo-500 mb-2" />
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-semibold text-gray-800">
                      {getPropertyTypeLabel(listing.property_type)}
                    </p>
                  </div>
                  {listing.area_sqm && (
                    <div className="p-4 bg-indigo-50/30 rounded-xl">
                      <Building2 className="w-5 h-5 text-indigo-500 mb-2" />
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-semibold text-gray-800">{formatArea(listing.area_sqm)}</p>
                    </div>
                  )}
                  {listing.floor && (
                    <div className="p-4 bg-indigo-50/30 rounded-xl">
                      <Layers className="w-5 h-5 text-indigo-500 mb-2" />
                      <p className="text-sm text-gray-500">Floor</p>
                      <p className="font-semibold text-gray-800">
                        {listing.floor} / {listing.total_floors || '?'}
                      </p>
                    </div>
                  )}
                  <div className="p-4 bg-indigo-50/30 rounded-xl">
                    <Calendar className="w-5 h-5 text-indigo-500 mb-2" />
                    <p className="text-sm text-gray-500">Listed</p>
                    <p className="font-semibold text-gray-800">{formatDate(listing.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {listing.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 leading-relaxed">{listing.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Price History */}
            {hasPriceHistory && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Price History</CardTitle>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        priceChange < 0 ? 'text-emerald-500' : 'text-red-500'
                      )}
                    >
                      {priceChange < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                      {Math.abs(priceChange).toFixed(1)}%
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Last 6 months</span>
                </CardHeader>
                <CardContent>
                  <PriceChart data={priceHistory} height={200} />
                </CardContent>
              </Card>
            )}

            {/* Similar Listings */}
            {similarListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Similar Listings</CardTitle>
                  <Link href="/search" className="text-sm text-indigo-500 hover:underline">
                    View more
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {similarListings.map((l) => (
                      <ListingCard key={l.id} listing={l} view="grid" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Price & Actions */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Price Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-3xl font-bold text-gray-800">
                        {formatPrice(listing.price_eur)}
                      </p>
                      {listing.price_per_sqm && (
                        <p className="text-gray-500 mt-1">
                          {formatPrice(listing.price_per_sqm)}/m²
                        </p>
                      )}
                    </div>
                    {listing.deal_score && <ScoreBadge score={listing.deal_score} size="lg" />}
                  </div>

                  <h1 className="text-xl font-semibold text-gray-800 mb-2">{listing.title}</h1>

                  <div className="flex items-center gap-2 text-gray-500 mb-6">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {listing.neighborhood}, {getCityLabel(listing.city)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button className="w-full" onClick={() => window.open(listing.source_url, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on {getSourceLabel(listing.source)}
                    </Button>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={isSaved ? 'primary' : 'secondary'}
                        onClick={() => setIsSaved(!isSaved)}
                      >
                        <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
                      </Button>
                      <Button variant="secondary">
                        <GitCompare className="w-4 h-4" />
                      </Button>
                      <Button variant="secondary">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seller Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Seller</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {listing.is_agency ? 'Real Estate Agency' : 'Private Owner'}
                      </p>
                      <p className="text-sm text-gray-500">{getSourceLabel(listing.source)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Investment Calculator */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-500" />
                    <CardTitle>Investment Calculator</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Down Payment (%)</label>
                      <Input
                        type="number"
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Interest Rate (%)</label>
                      <Input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Expected Monthly Rent (EUR)</label>
                      <Input
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      />
                    </div>

                    <div className="pt-4 border-t border-indigo-100 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Monthly Mortgage</span>
                        <span className="font-semibold">
                          {formatPrice(Math.round(monthlyMortgage))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Monthly Cash Flow</span>
                        <span
                          className={cn(
                            'font-semibold',
                            monthlyCashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'
                          )}
                        >
                          {monthlyCashFlow >= 0 ? '+' : ''}
                          {formatPrice(Math.round(monthlyCashFlow))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gross Yield</span>
                        <span className="font-semibold text-indigo-500">{grossYield.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {showLightbox && (
          <div
            className="lightbox-overlay"
            onClick={() => setShowLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-10"
              onClick={() => setShowLightbox(false)}
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={listing.photos[currentImageIndex]}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {listing.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(i);
                  }}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    i === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
