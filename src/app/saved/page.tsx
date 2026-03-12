'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { ListingCard } from '@/components/listings';
import { mockListings, mockStats } from '@/lib/mock-data';
import { Heart, Bookmark, Bell, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState('listings');

  const savedListings = mockListings.slice(0, 8);

  const savedSearches = [
    {
      id: '1',
      name: 'Sofia 2-bedroom under €100K',
      filters: 'Sofia, 2-bedroom, €50K-€100K',
      matches: 23,
      alerts: true,
    },
    {
      id: '2',
      name: 'Burgas beachfront',
      filters: 'Burgas, Score > 70',
      matches: 12,
      alerts: false,
    },
  ];

  return (
    <AppLayout newListingsToday={mockStats.new_today}>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Saved</h1>
            <p className="text-gray-500 mt-1">Your saved listings and searches</p>
          </div>
        </div>

        <Tabs
          tabs={[
            { id: 'listings', label: 'Saved Listings', count: savedListings.length },
            { id: 'searches', label: 'Saved Searches', count: savedSearches.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'listings' ? (
          savedListings.length > 0 ? (
            <div className="space-y-4">
              {savedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} view="list" isSaved />
              ))}
            </div>
          ) : (
            <Card className="py-16">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-indigo-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">No saved listings</h2>
                <p className="text-gray-500 mb-6">Save listings you like to view them here later.</p>
                <Link href="/search">
                  <Button>Browse Listings</Button>
                </Link>
              </div>
            </Card>
          )
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <Card key={search.id} hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Bookmark className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{search.name}</h3>
                      <p className="text-sm text-gray-500">{search.filters}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{search.matches} matches</p>
                      <p className="text-sm text-gray-500">
                        {search.alerts ? 'Alerts on' : 'No alerts'}
                      </p>
                    </div>
                    <Button variant={search.alerts ? 'primary' : 'secondary'} size="sm">
                      <Bell className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Button variant="secondary" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create New Saved Search
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
