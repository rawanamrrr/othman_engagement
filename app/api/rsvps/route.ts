import { NextResponse } from 'next/server';

// In-memory storage (temporary solution)
let rsvps: any[] = [];

export async function GET() {
  try {
    // Return the in-memory RSVPs array
    return NextResponse.json(rsvps);
  } catch (error) {
    console.error('Error reading RSVPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    );
  }
}

// Export the rsvps array so it can be used in other API routes
export { rsvps };
