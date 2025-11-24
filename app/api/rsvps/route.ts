import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('engagement'); // Replace 'engagement' with your database name if different
    const rsvps = await db.collection('rsvps').find({}).toArray();
    return NextResponse.json(rsvps);
  } catch (e) {
    console.error(e);
    return new NextResponse(JSON.stringify({ message: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
