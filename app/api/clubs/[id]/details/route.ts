import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
  }

  try {
    const [clubRes, coursesRes] = await Promise.all([
      fetch(`https://www.englandgolf.org/api/clubs/GetClubFacilityTypes?clubId=${id}`),
      fetch(`https://www.englandgolf.org/api/clubs/getCourses?clubId=${id}`)
    ]);

    if (!clubRes.ok) {
        throw new Error(`Failed to fetch club details: ${clubRes.status} ${clubRes.statusText}`);
    }
    if (!coursesRes.ok) {
        throw new Error(`Failed to fetch courses: ${coursesRes.status} ${coursesRes.statusText}`);
    }

    const clubData = await clubRes.json();
    const coursesData = await coursesRes.json();

    return NextResponse.json({
      club: clubData,
      courses: coursesData
    });
  } catch (error) {
    console.error('Error fetching club details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
