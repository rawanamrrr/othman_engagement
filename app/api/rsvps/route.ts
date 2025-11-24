import { NextResponse } from 'next/server';

import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'submissions.json');

export async function readSubmissions() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    return [];
  }
}

export async function writeSubmissions(data: any) {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const submissions = await readSubmissions();
    return NextResponse.json(submissions);
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
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const submissions = await readSubmissions();
    const newSubmission = {
      ...data,
      id: Date.now().toString(), // Add a unique ID
      createdAt: new Date().toISOString(),
    };
    
    submissions.push(newSubmission);
    await writeSubmissions(submissions);
    
    return NextResponse.json(
      { success: true, data: newSubmission },
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
