'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Search,
  Map,
  BarChart3,
  Heart,
  GitCompare,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  newListingsToday?: number;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'search', label: 'Search', icon: Search, href: '/search' },
  { id: 'map', label: 'Map', icon: Map, href: '/map' },
  { id: 'compare', label: 'Compare', icon: GitCompare, href: '/compare' },
  { id: 'saved', label: 'Saved', icon: Heart, href: '/saved' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  { id: 'help', label: 'Help', icon: HelpCircle, href: '/help' },
];

export function Sidebar({ newListingsToday = 0 }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] gradient-sidebar border-r border-indigo-100 flex flex-col sticky top-16">
      {/* New Listings Banner */}
      {newListingsToday > 0 && (
        <div className="mx-4 mt-4 p-3 gradient-header rounded-xl text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">{newListingsToday} New Today</p>
              <p className="text-xs text-white/80">Fresh listings to explore</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  'relative group',
                  active
                    ? 'bg-indigo-500 text-white shadow-btn'
                    : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                )}
              >
                {/* Active Indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}

                <Icon className={cn('w-5 h-5', active ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500')} />
                <span>{item.label}</span>

                {/* Dashboard badge */}
                {item.id === 'dashboard' && newListingsToday > 0 && !active && (
                  <span className="ml-auto px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
                    {newListingsToday}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 pb-4 border-t border-indigo-100 pt-4 mt-auto">
        <div className="space-y-1">
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Version */}
        <div className="mt-4 px-4 text-xs text-gray-400">
          DealScope v1.0.0
        </div>
      </div>
    </aside>
  );
}
