'use client';

import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components/ui';
import { PriceChart, SourcePieChart } from '@/components/charts';
import { mockListings, mockStats, mockNeighborhoods } from '@/lib/mock-data';
import { formatPrice, getCityLabel } from '@/lib/utils';
import { BarChart3, TrendingUp, Building2, MapPin } from 'lucide-react';
import { useMemo } from 'react';

export default function AnalyticsPage() {
  const cityData = useMemo(
    () =>
      Object.entries(mockStats.cities).map(([city, count]) => ({
        name: getCityLabel(city),
        value: count,
      })),
    []
  );

  const priceByCity = useMemo(() => {
    const cities = ['sofia', 'burgas', 'varna', 'plovdiv'];
    return cities.map((city) => {
      const listings = mockListings.filter((l) => l.city === city);
      const avgPrice =
        listings.length > 0
          ? listings.reduce((sum, l) => sum + l.price_eur, 0) / listings.length
          : 0;
      return {
        city: getCityLabel(city),
        avgPrice: Math.round(avgPrice),
        count: listings.length,
      };
    });
  }, []);

  const topNeighborhoods = useMemo(
    () =>
      [...mockNeighborhoods]
        .sort((a, b) => b.avg_price_per_sqm - a.avg_price_per_sqm)
        .slice(0, 10),
    []
  );

  const marketTrendData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        price: mockStats.avg_price * (0.85 + Math.random() * 0.3),
      });
    }
    return data;
  }, []);

  return (
    <AppLayout newListingsToday={mockStats.new_today}>
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500 mt-1">Market insights and trends</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Avg. Price"
            value={formatPrice(mockStats.avg_price)}
            change={-2.3}
            changeLabel="vs last month"
            icon={<Building2 className="w-6 h-6" />}
          />
          <StatCard
            title="Avg. Price/m²"
            value={formatPrice(mockStats.avg_price_per_sqm)}
            change={1.5}
            changeLabel="vs last month"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard
            title="Total Listings"
            value={mockStats.total_listings.toLocaleString()}
            change={12.5}
            changeLabel="vs last week"
            icon={<BarChart3 className="w-6 h-6" />}
          />
          <StatCard
            title="Active Cities"
            value="4"
            icon={<MapPin className="w-6 h-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Trend (12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceChart data={marketTrendData} height={300} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listings by City</CardTitle>
            </CardHeader>
            <CardContent>
              <SourcePieChart data={cityData} height={300} />
            </CardContent>
          </Card>
        </div>

        {/* City Price Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Average Price by City</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceByCity.map((city, i) => (
                <div key={city.city} className="flex items-center gap-4">
                  <div className="w-24 font-medium text-gray-800">{city.city}</div>
                  <div className="flex-1 h-8 bg-indigo-50/30 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-lg transition-all duration-500"
                      style={{
                        width: `${(city.avgPrice / Math.max(...priceByCity.map((c) => c.avgPrice))) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-28 text-right font-semibold text-gray-800">
                    {formatPrice(city.avgPrice)}
                  </div>
                  <div className="w-20 text-right text-sm text-gray-500">{city.count} listings</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Neighborhoods */}
        <Card>
          <CardHeader>
            <CardTitle>Top Neighborhoods by Price/m²</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topNeighborhoods.map((n, i) => (
                <div
                  key={n.name}
                  className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{n.name}</p>
                      <p className="text-sm text-gray-500">{getCityLabel(n.city)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-500">{formatPrice(n.avg_price_per_sqm)}/m²</p>
                    <p className="text-sm text-gray-500">{n.listing_count} listings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
