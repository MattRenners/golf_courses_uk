'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import ClubCard from '@/components/ClubCard';
import { Club } from '@/app/types';

export default function Home() {
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchAllClubs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clubs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLatitude: null,
          userLongitude: null,
          amenityIds: [],
          programmeIds: [],
          pageNumber: 1,
          pageSize: 3000 // Fetch all
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch clubs');
      }

      const data = await res.json();
      setAllClubs(data);
      setFilteredClubs(data);
      setHasFetched(true);
    } catch (err) {
      console.error(err);
      setError('An error occurred while loading clubs. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllClubs();
  }, []);

  const handleSearch = (term: string) => {
    if (!term.trim()) {
      setFilteredClubs(allClubs);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = allClubs.filter(club =>
      club.ClubName.toLowerCase().includes(lowerTerm) ||
      (club.LocAddress4 && club.LocAddress4.toLowerCase().includes(lowerTerm)) || // Town/City?
      (club.LocAddress2 && club.LocAddress2.toLowerCase().includes(lowerTerm)) ||
      (club.PostalCode && club.PostalCode.toLowerCase().includes(lowerTerm))
    );
    setFilteredClubs(filtered);
  };

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch('/api/clubs/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userLatitude: latitude,
              userLongitude: longitude,
              amenityIds: [],
              programmeIds: [],
              pageNumber: 1,
              pageSize: 3000
            }),
          });

           if (!res.ok) {
            throw new Error('Failed to fetch clubs nearby');
          }

          const data = await res.json();
          // API should return sorted by distance if lat/long provided.
          setAllClubs(data);
          setFilteredClubs(data);
        } catch (err) {
           console.error(err);
           setError('Failed to find clubs near you.');
        } finally {
           setIsLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setIsLoading(false);
        alert('Unable to retrieve your location');
      }
    );
  };

  return (
    <main className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-emerald-900 mb-4 font-serif">England Golf Discovery</h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Discover the finest golf clubs across England. Search by name, location, or find courses near you.
          </p>
        </div>

        <div className="mb-12">
          <SearchBar
            onSearch={handleSearch}
            onLocationSearch={handleLocationSearch}
            isLoading={isLoading}
          />
        </div>

        {error && (
          <div className="text-center text-red-600 mb-8 p-4 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {isLoading && !hasFetched ? (
             <div className="flex justify-center items-center h-64">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-700"></div>
             </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClubs.slice(0, 100).map((club) => (
              <ClubCard key={club.ClubId} club={club} />
            ))}
          </div>
        )}

        {!isLoading && filteredClubs.length === 0 && hasFetched && (
             <div className="text-center text-stone-500 mt-12">
               <p className="text-xl">No clubs found matching your search.</p>
             </div>
        )}

        {!isLoading && filteredClubs.length > 100 && (
             <div className="text-center mt-8 text-stone-500 text-sm">
                Showing top 100 results of {filteredClubs.length}
             </div>
        )}
      </div>
    </main>
  );
}
