'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClubDetails, Course, Marker } from '@/app/types';
import FacilityList from '@/components/FacilityList';
import CourseList from '@/components/CourseList';
import MarkerTable from '@/components/MarkerTable';

export const runtime = 'edge';

export default function ClubDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [club, setClub] = useState<ClubDetails | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMarkers, setLoadingMarkers] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchClubDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/clubs/${id}/details`);
        if (!res.ok) {
          throw new Error('Failed to fetch club details');
        }
        const data = await res.json();
        setClub(data.club);
        setCourses(data.courses);

        if (data.courses && data.courses.length > 0) {
           setSelectedCourseId(data.courses[0].CourseId);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load club details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubDetails();
  }, [id]);

  useEffect(() => {
    if (!selectedCourseId) {
      setMarkers([]);
      return;
    }

    const fetchMarkers = async () => {
      setLoadingMarkers(true);
      try {
        const res = await fetch(`/api/courses/${selectedCourseId}/markers`);
        if (!res.ok) {
            throw new Error('Failed to fetch markers');
        }
        const data = await res.json();
        setMarkers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setMarkers([]);
      } finally {
        setLoadingMarkers(false);
      }
    };

    fetchMarkers();
  }, [selectedCourseId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4">
        <div className="text-red-600 mb-4">{error || 'Club not found'}</div>
        <Link href="/" className="text-emerald-700 underline hover:text-emerald-900 font-medium">
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-emerald-700 hover:text-emerald-900 font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Search
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-100 mb-8">
          <div className="p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-4 font-serif">{club.ClubName}</h1>
            {club.FacilityDescription && (
              <p className="text-stone-600 leading-relaxed mb-8 max-w-4xl">{club.FacilityDescription.replace(/<[^>]*>?/gm, '')}</p>
            )}

            <div className="border-t border-stone-100 pt-6">
              <h2 className="text-xl font-bold text-emerald-800 mb-4 font-serif flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Facilities
              </h2>
              {club.FacilityTypes ? (
                <FacilityList facilities={club.FacilityTypes} />
              ) : (
                <p className="text-stone-500 italic">No facility information available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-100">
           <div className="p-8">
             <h2 className="text-2xl font-bold text-emerald-900 mb-6 font-serif flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M10 9H7v5a2 2 0 01-2 2h2m6-7h3m-3 0v5a2 2 0 002 2h-2" />
               </svg>
               Courses & Scorecards
             </h2>

             <div className="mb-8">
               <CourseList
                 courses={courses}
                 selectedCourseId={selectedCourseId}
                 onSelectCourse={setSelectedCourseId}
               />
             </div>

             {loadingMarkers ? (
               <div className="flex justify-center p-8">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-700"></div>
               </div>
             ) : (
                <>
                  {selectedCourseId && (
                     <MarkerTable markers={markers} />
                  )}
                  {!selectedCourseId && courses.length > 0 && (
                     <p className="text-stone-500 italic text-center p-8 bg-stone-50 rounded-lg">Select a course to view marker details.</p>
                  )}
                  {courses.length === 0 && (
                     <p className="text-stone-500 italic">No course information available.</p>
                  )}
                </>
             )}
           </div>
        </div>
      </div>
    </main>
  );
}
