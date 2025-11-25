import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import clientPromise from '@/lib/mongodb';
import { saveRSVP } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, favoriteSong = '', isAttending } = body;

    // Basic validation
    if (!name || isAttending === undefined) {
      return NextResponse.json(
        { message: 'Name and attendance status are required' },
        { status: 400 }
      );
    }

    // Email configuration - using environment variables (optional)
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const recipientEmail = process.env.CONTACT_EMAIL;

    // Send email if SMTP is configured
    if (smtpUser && smtpPass) {
      try {
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
          to: recipientEmail || smtpUser,
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
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4f46e5;">
                  <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">New RSVP Response</h1>
                </div>
                
                <!-- RSVP Status -->
                <div style="background-color: ${attendingColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                  <h2 style="margin: 0; font-size: 24px;">${attendingStatus}</h2>
                </div>
                
                ${isAttending ? `
                  <!-- Attending Details -->
                  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                    <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">Guest Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 40%;">Name:</td>
                        <td style="padding: 8px 0; color: #1f2937;">${name}</td>
                      </tr>
                      ${favoriteSong ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Favorite Song:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-style: italic;">"${favoriteSong}"</td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>
                ` : `
                  <!-- Not Attending -->
                  <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
                    <h3 style="color: #1f2937; margin-top: 0; font-size: 20px; margin-bottom: 15px;">Guest Information</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 40%;">Name:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: 500;">${name}</td>
                      </tr>
                    </table>
                    <p style="color: #1f2937; margin: 15px 0 0 0; font-style: italic;">We're sorry you won't be able to join us, but we appreciate you letting us know!</p>
                  </div>
                `}
                
                <!-- Footer -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                  <p style="margin: 0;">This is an automated message from the engagement website.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error('Email send error (non-critical):', emailError);
      }
    } else {
      // Log that email is not configured (for development/debugging)
      console.log('Email not sent: SMTP credentials not configured');
    }

    // Try MongoDB first
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db('engagement');
        const rsvpData = {
          name: name.trim(),
          favoriteSong: isAttending ? (favoriteSong || '') : '',
          isAttending,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.collection('rsvps').insertOne(rsvpData);
      } catch (dbError) {
        console.error('MongoDB save error, falling back to file storage:', dbError);
        // Fallback to file storage
        try {
          await saveRSVP({
            name: name.trim(),
            favoriteSong: isAttending ? (favoriteSong || '') : '',
            isAttending
          });
        } catch (fileError) {
          console.error('File storage error:', fileError);
        }
      }
    } else {
      // No MongoDB, use file storage
      try {
        await saveRSVP({
          name: name.trim(),
          favoriteSong: isAttending ? (favoriteSong || '') : '',
          isAttending
        });
      } catch (fileError) {
        console.error('File storage error:', fileError);
      }
    }

    return NextResponse.json({ message: 'RSVP submitted successfully' });
  } catch (error) {
    console.error('RSVP submission error:', error);
    return NextResponse.json(
      { message: 'Error submitting RSVP' },
      { status: 500 }
    );
  }
}
