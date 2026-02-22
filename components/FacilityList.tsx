import { Facility } from '@/app/types';

interface FacilityListProps {
  facilities: Facility[];
}

export default function FacilityList({ facilities }: FacilityListProps) {
  const availableFacilities = facilities.filter(f => f.IsAvailable);

  if (availableFacilities.length === 0) {
    return <p className="text-stone-500 italic">No facilities listed.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {availableFacilities.map((facility) => (
        <div key={facility.FacilityTypeId} className="flex items-center p-3 bg-white rounded-lg border border-stone-200 shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 shrink-0"></span>
          <span className="text-stone-700 font-medium text-sm">{facility.TypeName}</span>
        </div>
      ))}
    </div>
  );
}
