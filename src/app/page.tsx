'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui';
import { ListingCard } from '@/components/listings';
import { PriceChart, SourcePieChart } from '@/components/charts';
import { mockListings, mockStats, mockPriceAlerts, mockScraperRuns } from '@/lib/mock-data';
import { formatPrice, formatRelativeTime, getSourceLabel } from '@/lib/utils';
import {
  Building2,
  TrendingDown,
  Sparkles,
  Activity,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'activity'>('alerts');

  const topDeals = useMemo(() => mockListings.slice(0, 5), []);

  const priceAlerts = useMemo(() => mockPriceAlerts.slice(0, 5), []);

  const marketTrendData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        price: mockStats.avg_price * (0.9 + Math.random() * 0.2),
      });
    }
    return data;
  }, []);

  const sourceData = useMemo(
    () =>
      Object.entries(mockStats.sources).map(([name, value]) => ({
        name,
        value,
      })),
    []
  );

  return (
    <AppLayout newListingsToday={mockStats.new_today}>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of the Bulgarian real estate market</p>
          </div>
          <Link href="/search">
            <Button>
              Browse Listings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Listings"
            value={mockStats.total_listings.toLocaleString()}
            change={12.5}
            changeLabel="vs last week"
            icon={<Building2 className="w-6 h-6" />}
          />
          <StatCard
            title="Avg. Price"
            value={formatPrice(mockStats.avg_price)}
            change={-2.3}
            changeLabel="vs last month"
            icon={<TrendingDown className="w-6 h-6" />}
          />
          <StatCard
            title="New Today"
            value={mockStats.new_today}
            change={8.1}
            changeLabel="vs yesterday"
            icon={<Sparkles className="w-6 h-6" />}
          />
          <StatCard
            title="Price Drops"
            value={mockStats.price_drops}
            change={25.0}
            changeLabel="this week"
            icon={<Activity className="w-6 h-6" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
              <span className="text-sm text-gray-500">Average price over time</span>
            </CardHeader>
            <CardContent>
              <PriceChart data={marketTrendData} height={250} />
            </CardContent>
          </Card>

          {/* Source Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Source Distribution</CardTitle>
              <span className="text-sm text-gray-500">Listings by source</span>
            </CardHeader>
            <CardContent>
              <SourcePieChart data={sourceData} height={250} />
            </CardContent>
          </Card>
        </div>

        {/* Hot Deals & Alerts/Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hot Deals */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <CardTitle>Hot Deals</CardTitle>
              </div>
              <Link href="/search?sort=score" className="text-sm text-indigo-500 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {topDeals.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50/50 transition-colors group"
                >
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="w-16 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate group-hover:text-indigo-500 transition-colors">
                      {listing.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {listing.neighborhood}, {listing.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatPrice(listing.price_eur)}</p>
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                        listing.deal_score && listing.deal_score >= 70
                          ? 'bg-emerald-500'
                          : listing.deal_score && listing.deal_score >= 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {listing.deal_score}
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Price Alerts & Activity Feed */}
          <Card>
            <CardHeader>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'alerts'
                      ? 'bg-white text-indigo-500 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Price Alerts
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'activity'
                      ? 'bg-white text-indigo-500 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Activity
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'alerts' ? (
                <div className="space-y-3">
                  {priceAlerts.map((alert) => (
                    <Link
                      key={alert.id}
                      href={`/listing/${alert.listing_id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {alert.listing.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(alert.old_price)} → {formatPrice(alert.new_price)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-emerald-500 font-bold">
                          {alert.change_percent.toFixed(1)}%
                        </span>
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(alert.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {mockScraperRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-100/50"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          run.status === 'completed'
                            ? 'bg-emerald-50'
                            : run.status === 'running'
                            ? 'bg-amber-50'
                            : 'bg-red-50'
                        }`}
                      >
                        {run.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : run.status === 'running' ? (
                          <Clock className="w-5 h-5 text-amber-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">
                          {getSourceLabel(run.source)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {run.listings_found} found • {run.new_listings} new
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            run.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-500'
                              : run.status === 'running'
                              ? 'bg-amber-50 text-amber-500'
                              : 'bg-red-50 text-red-500'
                          }`}
                        >
                          {run.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(run.started_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Listings</CardTitle>
            <Link href="/search?sort=newest" className="text-sm text-indigo-500 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockListings.slice(0, 3).map((listing) => (
              <ListingCard key={listing.id} listing={listing} view="list" />
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
