import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json');

export async function POST(req: NextRequest) {
  try {
    const { name, guests, guestNames, favoriteSong, isAttending, handwrittenMessage } = await req.json();

    // --- Start: New file writing logic ---
    let handwrittenMessageUrl = '';
    if (handwrittenMessage) {
      const base64Data = handwrittenMessage.replace(/^data:image\/png;base64,/, "");
      const filename = `message-${Date.now()}.png`;
      const imagePath = path.join(process.cwd(), 'public', 'uploads', filename);
      await fs.mkdir(path.dirname(imagePath), { recursive: true });
      await fs.writeFile(imagePath, base64Data, 'base64');
      handwrittenMessageUrl = `/uploads/${filename}`;
    }

    const newSubmission = {
      name,
      guests,
      guestNames,
      favoriteSong,
      isAttending,
      handwrittenMessageUrl,
      timestamp: new Date().toISOString(),
    };

    let submissions = [];
    try {
      const fileData = await fs.readFile(DATA_FILE, 'utf-8');
      if (fileData) {
        submissions = JSON.parse(fileData);
      }
    } catch (error) {
      console.log('submissions.json not found or empty, creating a new one.');
    }

    submissions.push(newSubmission);

    const fileWritePromise = fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf-8');

    // --- Email Sending Logic ---
    const sendEmailPromise = (async () => {
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const recipientEmail = process.env.CONTACT_EMAIL;

      if (!smtpUser || !smtpPass) {
        throw new Error('Email service not configured. Missing SMTP credentials.');
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const attendingStatus = isAttending ? 'Yes, attending!' : 'Not attending';
      const attendingColor = isAttending ? '#10b981' : '#ef4444';

      const mailOptions = {
        from: `"Othman & Rita Engagement" <${smtpUser}>`,
        to: recipientEmail,
        subject: `RSVP Response from ${name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
              <!-- ... (email content) ... -->
            </div>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
    })();

    await Promise.all([fileWritePromise, sendEmailPromise]);

    return NextResponse.json({ message: 'RSVP submitted successfully' });
  } catch (error) {
    console.error('RSVP submission error:', error);
    return NextResponse.json(
      { message: 'Error submitting RSVP' },
      { status: 500 }
    );
  }
}
