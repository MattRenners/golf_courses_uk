import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.englandgolf.org/api/clubs/getMarkers?courseId=${id}&gender=M&isNineHoles=false&memberUid=`);

    if (!res.ok) {
      throw new Error(`Failed to fetch markers: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching markers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
