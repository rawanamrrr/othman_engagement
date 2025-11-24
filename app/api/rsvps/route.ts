import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json');

export async function GET() {
  try {
    // Read the existing data
    const fileData = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileData);
    
    // Transform the data to match our RSVP interface
    const rsvps = data.map((item: any, index: number) => ({
      id: `rsvp-${index + 1}`,
      name: item.name || 'Unknown',
      guests: parseInt(item.guests) || 0,
      guestNames: item.guestNames || '',
      favoriteSong: item.favoriteSong || '',
      isAttending: item.isAttending === true || item.isAttending === 'true',
      createdAt: item.timestamp || new Date().toISOString(),
      handwrittenMessageUrl: item.handwrittenMessageUrl || '',
    }));

    return NextResponse.json(rsvps);
  } catch (error) {
    console.error('Error reading RSVPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    );
  }
}
