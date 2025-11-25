import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { getAllSubmissions } from '../../../lib/storage';

export async function GET() {
  try {
    // Try MongoDB first
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db('engagement');
        const rsvps = await db.collection('rsvps').find({}).toArray();
        // Transform MongoDB format to match expected format
        const formattedRsvps = rsvps.map(rsvp => ({
          _id: rsvp._id.toString(),
          name: rsvp.name,
          favoriteSong: rsvp.favoriteSong || '',
          isAttending: rsvp.isAttending,
          createdAt: rsvp.createdAt ? new Date(rsvp.createdAt).toISOString() : new Date().toISOString()
        }));
        return NextResponse.json(formattedRsvps);
      } catch (dbError) {
        console.error('MongoDB read error, falling back to file storage:', dbError);
      }
    }
    
    // Fallback to file storage
    const data = await getAllSubmissions();
    const formattedRsvps = data.rsvps.map((rsvp, index) => ({
      _id: `file-${index}-${rsvp.timestamp}`,
      name: rsvp.name,
      favoriteSong: rsvp.favoriteSong || '',
      isAttending: rsvp.isAttending,
      createdAt: rsvp.timestamp
    }));
    return NextResponse.json(formattedRsvps);
  } catch (e) {
    console.error(e);
    return new NextResponse(JSON.stringify({ message: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
