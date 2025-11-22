import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, guests, guestNames, favoriteSong, isAttending } = await req.json();

    // Email configuration - using environment variables with fallback to provided credentials
    const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER || 'digitivaa@gmail.com';
    const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.GOOGLE_APP_PASSWORD || 'aoqa gsal cmgn qcym';
    const recipientEmail = process.env.CONTACT_EMAIL || 'engagementzeyadrawan@gmail.com';

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        { message: 'Email service not configured. Missing SMTP credentials.' },
        { status: 500 }
      );
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
                  ${guests ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Number of Guests:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${guests}</td>
                  </tr>
                  ` : ''}
                  ${guestNames ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Guest Names:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${guestNames}</td>
                  </tr>
                  ` : ''}
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
                <p style="color: #1f2937; margin: 0;">We're sorry you won't be able to join us, but we appreciate you letting us know!</p>
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
    return NextResponse.json({ message: 'RSVP submitted successfully' });
  } catch (error) {
    console.error('RSVP email error:', error);
    return NextResponse.json(
      { message: 'Error submitting RSVP' },
      { status: 500 }
    );
  }
}
