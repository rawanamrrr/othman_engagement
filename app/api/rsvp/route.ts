import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { name, guests, guestNames, isAttending } = await req.json();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL,
    subject: 'New RSVP Submission',
    html: `
      <h2>New RSVP Submission</h2>
      <p><strong>Attending:</strong> ${isAttending ? 'Yes' : 'No'}</p>
      ${isAttending ? `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Number of Guests:</strong> ${guests}</p>
        <p><strong>Guest Names:</strong> ${guestNames}</p>
      ` : ''}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'RSVP submitted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error submitting RSVP' }, { status: 500 });
  }
}
