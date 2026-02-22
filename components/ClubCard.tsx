import Link from 'next/link';
import { Club } from '@/app/types';

interface ClubCardProps {
  club: Club;
}

export default function ClubCard({ club }: ClubCardProps) {
  const address = [
    club.LocAddress1,
    club.LocAddress2,
    club.LocAddress3,
    club.LocAddress4,
    club.PostalCode
  ].filter(Boolean).join(', ');

  return (
    <Link href={`/club/${club.ClubId}`} className="block h-full">
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-emerald-100 hover:border-emerald-300 h-full flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-emerald-900 mb-2 font-serif">{club.ClubName}</h3>
          <p className="text-stone-600 text-sm mb-4 line-clamp-2">{address}</p>
        </div>
        <div className="flex items-center text-emerald-700 text-sm font-medium mt-4 group">
          <span className="group-hover:underline">View Details</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
