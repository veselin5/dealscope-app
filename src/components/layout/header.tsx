'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Bell, ChevronDown, Settings, LogOut, User, Search, X } from 'lucide-react';

interface HeaderProps {
  city: string;
  onCityChange: (city: string) => void;
  onSearch?: (query: string) => void;
}

const cities = [
  { id: 'sofia', label: 'Sofia' },
  { id: 'burgas', label: 'Burgas' },
  { id: 'varna', label: 'Varna' },
  { id: 'plovdiv', label: 'Plovdiv' },
];

const mockNotifications = [
  { id: 1, title: 'New price drop!', message: 'Apartment in Лозенец dropped 5%', time: '2h ago', unread: true },
  { id: 2, title: 'Hot deal detected', message: 'Score 92 listing in Витоша', time: '4h ago', unread: true },
  { id: 3, title: 'Scraper completed', message: 'Imot.bg: 45 new listings', time: '6h ago', unread: false },
];

export function Header({ city, onCityChange, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="h-16 gradient-header text-white sticky top-0 z-40">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
            DS
          </div>
          <span className="font-bold text-xl hidden sm:block">DealScope</span>
        </div>

        {/* City Selector - Pill Style */}
        <div className="city-pill hidden md:flex">
          {cities.map((c) => (
            <button
              key={c.id}
              onClick={() => onCityChange(c.id)}
              className={cn(city === c.id && 'active')}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Mobile City Dropdown */}
        <div className="md:hidden relative">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => {
              const nextIndex = (cities.findIndex(c => c.id === city) + 1) % cities.length;
              onCityChange(cities[nextIndex].id);
            }}
          >
            {cities.find(c => c.id === city)?.label}
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings, neighborhoods..."
              className="w-full h-10 pl-10 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-white/30 transition-all"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white/80 hover:text-white hover:bg-white/10 w-9 h-9 p-0"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 w-9 h-9 p-0 relative"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-modal border border-indigo-100 overflow-hidden animate-slideUp">
                <div className="px-4 py-3 border-b border-indigo-100">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'px-4 py-3 hover:bg-indigo-50/50 cursor-pointer transition-colors border-b border-gray-100 last:border-0',
                        notification.unread && 'bg-indigo-50/30'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {notification.unread && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        )}
                        <div className={cn(!notification.unread && 'ml-5')}>
                          <p className="font-medium text-gray-800 text-sm">{notification.title}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{notification.message}</p>
                          <p className="text-gray-400 text-xs mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-indigo-100 bg-gray-50/50">
                  <button className="text-indigo-500 text-sm font-medium hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 gap-2 pl-2"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden sm:block">Investor</span>
              <ChevronDown className="w-4 h-4" />
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-modal border border-indigo-100 overflow-hidden animate-slideUp">
                <div className="px-4 py-3 border-b border-indigo-100">
                  <p className="font-semibold text-gray-800">John Investor</p>
                  <p className="text-gray-500 text-sm">john@dealscope.bg</p>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-800 hover:bg-indigo-50/50 transition-colors">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-800 hover:bg-indigo-50/50 transition-colors">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Settings</span>
                  </button>
                </div>
                <div className="py-2 border-t border-indigo-100">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50/50 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="lg:hidden px-4 pb-3 animate-slideUp">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings..."
                className="w-full h-10 pl-10 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:bg-white/15"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
