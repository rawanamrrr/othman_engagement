import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { rsvps } from '../rsvps/route';

export async function POST(req: NextRequest) {
  try {
    const { name, guests, guestNames, favoriteSong, isAttending, handwrittenMessage } = await req.json();

    // Create a new RSVP entry
    const newSubmission = {
      id: `rsvp-${Date.now()}`,
      name,
      guests: parseInt(guests) || 0,
      guestNames: guestNames || '',
      favoriteSong: favoriteSong || '',
      isAttending: isAttending === true || isAttending === 'true',
      timestamp: new Date().toISOString(),
      // For now, we'll just store a placeholder for the handwritten message
      // In a real app, you'd upload this to a file storage service
      handwrittenMessageUrl: handwrittenMessage ? 'stored-in-memory' : ''
    };

    // Add to in-memory array
    rsvps.push(newSubmission);

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

    try {
      await sendEmailPromise;
      return NextResponse.json({ 
        success: true,
        message: 'RSVP submitted successfully',
        data: newSubmission 
      });
    } catch (emailError) {
      console.error('Email sending failed, but RSVP was saved:', emailError);
      // Still return success since the RSVP was saved
      return NextResponse.json({ 
        success: true,
        message: 'RSVP submitted, but there was an issue sending the confirmation email',
        data: newSubmission
      });
    }
  } catch (error) {
    console.error('RSVP submission error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error submitting RSVP',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
