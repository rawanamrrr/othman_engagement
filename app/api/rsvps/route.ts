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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Add timestamp
    const newRsvp = {
      ...data,
      submittedAt: new Date().toISOString()
    };
    
    // Add to our in-memory array
    rsvps.push(newRsvp);
    
    return NextResponse.json(
      { success: true, data: newRsvp },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving RSVP:', error);
    return NextResponse.json(
      { error: 'Failed to save RSVP' },
      { status: 500 }
    );
  }
}

// Export the rsvps array so it can be used in other API routes
export { rsvps };
