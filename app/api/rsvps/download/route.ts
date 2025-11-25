import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';

function convertToCSV(data: any[]) {
  if (data.length === 0) {
    return '';
  }
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export async function GET() {
  try {
    if (!clientPromise) {
      return new NextResponse('', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="rsvps.csv"',
        },
      });
    }
    const client = await clientPromise;
    const db = client.db('engagement'); // Replace 'engagement' with your database name if different
    const rsvps = await db.collection('rsvps').find({}).toArray();

    const csv = convertToCSV(rsvps);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="rsvps.csv"',
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse(JSON.stringify({ message: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
