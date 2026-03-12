'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockStats } from '@/lib/mock-data';
import { User, Bell, Shield, Database, Mail, Save } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    priceDrops: true,
    newListings: true,
    weeklyDigest: false,
    scraperAlerts: true,
  });

  return (
    <AppLayout newListingsToday={mockStats.new_today}>
      <div className="space-y-6 animate-fadeIn max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              <CardTitle>Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-800 mb-1 block">First Name</label>
                <Input defaultValue="John" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-800 mb-1 block">Last Name</label>
                <Input defaultValue="Investor" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800 mb-1 block">Email</label>
              <Input type="email" defaultValue="john@dealscope.bg" />
            </div>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: 'priceDrops',
                label: 'Price Drop Alerts',
                description: 'Get notified when saved listings drop in price',
              },
              {
                key: 'newListings',
                label: 'New Listing Alerts',
                description: 'Notifications for new listings matching your saved searches',
              },
              {
                key: 'weeklyDigest',
                label: 'Weekly Digest',
                description: 'Weekly summary of market trends and hot deals',
              },
              {
                key: 'scraperAlerts',
                label: 'Scraper Status',
                description: 'Alerts when scrapers fail or complete',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof typeof notifications],
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications]
                      ? 'bg-indigo-500'
                      : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              <CardTitle>Email Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Configure how and when you receive email notifications.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="radio" name="frequency" id="instant" defaultChecked />
                <label htmlFor="instant" className="text-gray-800">
                  Instant notifications
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input type="radio" name="frequency" id="daily" />
                <label htmlFor="daily" className="text-gray-800">
                  Daily digest
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input type="radio" name="frequency" id="weekly" />
                <label htmlFor="weekly" className="text-gray-800">
                  Weekly digest only
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <CardTitle>Data & Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-800">Export Data</p>
                <p className="text-sm text-gray-500">Download all your saved listings and searches</p>
              </div>
              <Button variant="secondary">
                <Database className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-indigo-100 pt-4">
              <div>
                <p className="font-medium text-red-500">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
              </div>
              <Button variant="danger">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
