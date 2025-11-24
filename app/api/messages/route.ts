import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('engagement'); // Replace 'engagement' with your database name if different
    const messages = await db.collection('messages').find({}).toArray();
    return NextResponse.json(messages);
  } catch (e) {
    console.error(e);
    return new NextResponse(JSON.stringify({ message: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, message } = await req.json();

    if (!name || !message) {
      return new NextResponse(JSON.stringify({ message: 'Name and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await clientPromise;
    const db = client.db('engagement');
    await db.collection('messages').insertOne({
      name,
      message,
      createdAt: new Date(),
    });

    return new NextResponse(JSON.stringify({ success: true, message: 'Message saved' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse(JSON.stringify({ message: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
