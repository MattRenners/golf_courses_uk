'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  onLocationSearch: () => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, onLocationSearch, isLoading }: SearchBarProps) {
  const [term, setTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-4 rounded-xl shadow-lg border border-stone-100">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name, town, or city..."
          className="flex-1 px-4 py-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-700 placeholder-stone-400"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        <button
          type="button"
          onClick={onLocationSearch}
          disabled={isLoading}
          className="px-6 py-3 bg-stone-100 text-emerald-800 font-semibold rounded-lg hover:bg-stone-200 transition-colors border border-stone-200 disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Near Me
        </button>
      </form>
    </div>
  );
}
