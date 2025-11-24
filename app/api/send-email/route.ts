// app/api/send-email/route.ts
import nodemailer from 'nodemailer';

// Ensure this route uses the Node.js runtime (not Edge), required for nodemailer
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const name = formData.get('name') as string;
    const toEmail = (formData.get('to_email') as string) || 'engagementzeyadrawan@gmail.com';
    const message = formData.get('message') as string;
    const messageType = (formData.get('message_type') as string) || 'normal';
    const imageFile = formData.get('image') as File | null;
    
    // RSVP specific fields
    const rsvpAttending = formData.get('rsvp_attending') as string;
    const rsvpName = formData.get('rsvp_name') as string;
    const rsvpPlusOne = formData.get('rsvp_plus_one') as string;
    const rsvpGuestCount = formData.get('rsvp_guest_count') as string;
    const favoriteSong = formData.get('favorite_song') as string;

    // Validate required fields
    if (!name?.trim()) {
      return Response.json(
        { success: false, message: 'Please enter your name' },
        { status: 400 }
      );
    }

    // Email configuration - using environment variables
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const recipientEmail = process.env.CONTACT_EMAIL || toEmail;

    // Validate environment variables
    if (!smtpUser || !smtpPass) {
      return Response.json(
        { success: false, message: 'Email service not configured. Missing SMTP credentials.' },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify SMTP connection/auth before attempting to send
    try {
      await transporter.verify();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SMTP verification failed';
      console.error('SMTP verify error:', err);
      return Response.json(
        { success: false, message: `Email service error: ${msg}` },
        { status: 500 }
      );
    }

    // Process image attachment if provided
    let attachments: any[] = [];
    let imageCid = '';
    if (imageFile) {
      const imageBytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(imageBytes);
      imageCid = 'handwritten-message-' + Date.now();
      
      attachments.push({
        filename: imageFile.name || 'handwritten-message.png',
        content: buffer,
        cid: imageCid,
      });
    }

    // Build HTML email content based on message type
    let htmlContent = '';
    let subject = '';

    if (messageType === 'rsvp' || rsvpAttending) {
      // RSVP Email Template
      subject = `RSVP Response from ${rsvpName || name}`;
      const attendingStatus = rsvpAttending === 'yes' ? 'Yes, attending!' : 'Not attending';
      const attendingColor = rsvpAttending === 'yes' ? '#10b981' : '#ef4444';
      
      htmlContent = `
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
            
            ${rsvpAttending === 'yes' ? `
              <!-- Attending Details -->
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">Guest Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 40%;">Name:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${rsvpName || name}</td>
                  </tr>
                  ${rsvpGuestCount ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Number of Guests:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${rsvpGuestCount}</td>
                  </tr>
                  ` : ''}
                  ${rsvpPlusOne ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Plus One:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${rsvpPlusOne}</td>
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
      `;
    } else if (messageType === 'handwritten' || imageFile) {
      // Handwritten Message Email Template
      subject = `Handwritten Message from ${name}`;
      htmlContent = `
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
              <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">You've Received a Handwritten Message!</h1>
            </div>
            
            <!-- Sender Info -->
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 0; color: #1f2937;">
                <strong style="color: #4f46e5;">From:</strong> ${name}
              </p>
            </div>
            
            <!-- Message Image -->
            <div style="margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center;">
              ${imageFile ? 
                `<img src="cid:${imageCid}" alt="Handwritten message from ${name}" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />` : 
                '<p style="color: #6b7280;">No image was attached to this message.</p>'
              }
            </div>
            
            ${message ? `
            <!-- Additional Message -->
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1f2937;">${message}</p>
            </div>
            ` : ''}
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">This is an automated message from the engagement website.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Normal Text Message Email Template
      subject = `Message from ${name}`;
      htmlContent = `
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
              <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">You've Received a New Message!</h1>
            </div>
            
            <!-- Sender Info -->
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 0; color: #1f2937;">
                <strong style="color: #4f46e5;">From:</strong> ${name}
              </p>
            </div>
            
            <!-- Message Content -->
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
              <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 16px; white-space: pre-wrap;">${message || 'No message content provided.'}</p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">This is an automated message from the engagement website.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email
    let info;
    try {
      info = await transporter.sendMail({
        from: `"Othman & Rita Engagement" <${smtpUser}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    } catch (err: any) {
      console.error('Error sending email:', err);
      const message = (err && (err.message || err.toString())) || 'Unknown email error';
      return Response.json(
        {
          success: false,
          message: 'Failed to send email',
          error: message,
        },
        { status: 500 }
      );
    }

    return Response.json({ 
      success: true, 
      message: 'Message sent successfully!',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return Response.json(
      { 
        success: false, 
        message: 'Failed to send message. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
