'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  newListingsToday?: number;
}

export function AppLayout({ children, newListingsToday = 0 }: AppLayoutProps) {
  const [city, setCity] = useState('sofia');

  const handleSearch = (query: string) => {
    console.log('Search:', query);
    // TODO: Implement search navigation
  };

  return (
    <div className="min-h-screen bg-background">
      <Header city={city} onCityChange={setCity} onSearch={handleSearch} />
      <div className="flex">
        <Sidebar newListingsToday={newListingsToday} />
        <main className="flex-1 p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
