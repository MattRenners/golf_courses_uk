import { Marker } from '@/app/types';

interface MarkerTableProps {
  markers: Marker[];
}

export default function MarkerTable({ markers }: MarkerTableProps) {
  if (markers.length === 0) {
    return <p className="text-stone-500 italic">No markers available for this course.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-md border border-stone-200">
      <table className="w-full text-sm text-left text-stone-700 bg-white">
        <thead className="text-xs text-emerald-900 uppercase bg-emerald-50 border-b border-emerald-100">
          <tr>
            <th scope="col" className="px-6 py-4 font-bold">Marker (Tee)</th>
            <th scope="col" className="px-6 py-4 font-bold text-center">Par</th>
            <th scope="col" className="px-6 py-4 font-bold text-center">Yards</th>
            <th scope="col" className="px-6 py-4 font-bold text-center">Rating</th>
            <th scope="col" className="px-6 py-4 font-bold text-center">Slope</th>
          </tr>
        </thead>
        <tbody>
          {markers.map((marker) => {
            // Calculate total distance if needed, though API usually provides it or similar
            // We'll calculate it from holes just in case to be safe, or use what's available.
            // Based on the type, we have Holes.
            const totalDistance = marker.Holes ? marker.Holes.reduce((sum, hole) => sum + (hole.DistanceYards || 0), 0) : 0;
            const totalPar = marker.TotalPar || (marker.Holes ? marker.Holes.reduce((sum, hole) => sum + (hole.Par || 0), 0) : 0);

            return (
              <tr key={marker.MarkerId} className="border-b border-stone-100 hover:bg-stone-50 transition-colors last:border-0">
                <td className="px-6 py-4 font-medium flex items-center text-stone-900">
                  <span
                    className="w-4 h-4 rounded-full mr-3 border border-stone-300 shadow-sm"
                    style={{ backgroundColor: marker.MarkerColor ? `#${marker.MarkerColor}` : '#e5e7eb' }}
                  ></span>
                  {marker.DisplayMarkerName}
                </td>
                <td className="px-6 py-4 text-center">{totalPar}</td>
                <td className="px-6 py-4 text-center font-mono text-stone-600">{totalDistance}</td>
                <td className="px-6 py-4 text-center">{marker.UsgaNzcr}</td>
                <td className="px-6 py-4 text-center">{marker.SlopeRating}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
