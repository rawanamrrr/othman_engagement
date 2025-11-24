import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Re-export the POST handler from the send-email route
export { POST } from '../send-email/route';

const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json');

// Function to read submissions from the JSON file
export async function readSubmissions() {
  try {
    const fileData = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(fileData);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    // For other errors, re-throw
    throw error;
  }
}

// Function to write submissions to the JSON file
export async function writeSubmissions(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const data = await readSubmissions();
    
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
