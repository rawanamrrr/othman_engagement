import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { getAllSubmissions, saveMessage } from '../../../lib/storage';

export async function GET() {
  try {
    // Try MongoDB first
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db('engagement');
        const messages = await db.collection('messages').find({}).toArray();
        // Transform MongoDB format to match expected format
        const formattedMessages = messages.map(msg => ({
          _id: msg._id.toString(),
          name: msg.name,
          message: msg.message,
          createdAt: msg.createdAt ? new Date(msg.createdAt).toISOString() : new Date().toISOString()
        }));
        return NextResponse.json(formattedMessages);
      } catch (dbError) {
        console.error('MongoDB read error, falling back to file storage:', dbError);
      }
    }
    
    // Fallback to file storage
    const data = await getAllSubmissions();
    const formattedMessages = data.messages.map((msg, index) => ({
      _id: `file-${index}-${msg.timestamp}`,
      name: msg.name,
      message: msg.message,
      createdAt: msg.timestamp
    }));
    return NextResponse.json(formattedMessages);
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

    // Try MongoDB first
    if (clientPromise) {
      try {
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
      } catch (dbError) {
        console.error('MongoDB save error, falling back to file storage:', dbError);
      }
    }

    // Fallback to file storage
    try {
      await saveMessage({ name, message });
      return new NextResponse(JSON.stringify({ success: true, message: 'Message saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (fileError) {
      console.error('File storage error:', fileError);
      return new NextResponse(JSON.stringify({ message: 'Failed to save message' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error(e);
    return new NextResponse(JSON.stringify({ message: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
