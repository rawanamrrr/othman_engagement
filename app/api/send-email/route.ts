import { NextRequest } from 'next/server';
import { sendEmail } from '@/lib/email-service';
import path from 'path';
import fs from 'fs/promises';

const UPLOADS_DIR = path.join('/tmp', 'uploads');
const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json');

export const runtime = 'nodejs';

interface FormDataEntry {
  [key: string]: string | File | null;
}

interface Submission {
  name: string;
  handwrittenMessageUrl?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const formEntries: FormDataEntry = {};
    
    // Convert FormData to a plain object
    for (const [key, value] of formData.entries()) {
      formEntries[key] = value as string | File;
    }
    
    const {
      name = '',
      to_email = 'engagementzeyadrawan@gmail.com',
      message = '',
      message_type = 'normal',
      image = null,
      rsvp_attending = '',
      rsvp_name = '',
      rsvp_plus_one = '',
      rsvp_guest_count = '',
      favorite_song = ''
    } = formEntries;

    // Log incoming request for debugging
    console.log('Received form data:', {
      name: name?.toString().substring(0, 10) + '...',
      message_type,
      hasImage: Boolean(image),
      imageSize: image instanceof File ? `${(image.size / 1024).toFixed(2)}KB` : 'N/A'
    });

    // Validate required fields
    if (typeof name !== 'string' || !name.trim()) {
      return Response.json(
        { success: false, message: 'Please enter your name' },
        { status: 400 }
      );
    }

    const recipientEmail = process.env.CONTACT_EMAIL || (to_email as string);
    let htmlContent = '';
    let subject = '';
    let attachments: Array<{
      filename: string;
      content: Buffer;
      cid: string;
    }> = [];
    let imageUrl = '';
    let imageCid = '';

    // Process image if provided
    if (image instanceof File) {
      try {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(image.type)) {
          throw new Error(`Invalid file type: ${image.type}. Only JPEG and PNG are supported.`);
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (image.size > maxSize) {
          throw new Error(`File is too large. Maximum size is 5MB.`);
        }

        const imageBytes = await image.arrayBuffer();
        const buffer = Buffer.from(imageBytes);
        const filename = `message-${Date.now()}.${image.type.split('/')[1] || 'png'}`;
        const imagePath = path.join(UPLOADS_DIR, filename);

        console.log(`Attempting to save image to: ${imagePath}`);
        
        try {
          // Ensure uploads directory exists
          await fs.mkdir(UPLOADS_DIR, { recursive: true });
          console.log(`Upload directory verified/created at: ${UPLOADS_DIR}`);
          
          // Write the file
          await fs.writeFile(imagePath, buffer);
          console.log(`Image successfully saved to: ${imagePath}`);
        } catch (fsError) {
          console.error('Filesystem error during image save:', fsError);
          throw new Error(`Failed to save image: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`);
        }

        imageUrl = `/uploads/${filename}`;
        imageCid = `handwritten-message-${Date.now()}`;
        
        attachments.push({
          filename: image.name || `handwritten-message-${Date.now()}.${image.type.split('/')[1] || 'png'}`,
          content: buffer,
          cid: imageCid,
        });

      } catch (error) {
        console.error('Error processing image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
        return Response.json(
          { 
            success: false, 
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error : undefined
          },
          { status: 400 }
        );
      }
    }

    // Build email content based on message type
    try {
      if (message_type === 'rsvp' || rsvp_attending) {
        subject = `RSVP Response from ${rsvp_name || name}`;
        const attendingStatus = rsvp_attending === 'yes' ? 'Yes, attending!' : 'Not attending';
        const attendingColor = rsvp_attending === 'yes' ? '#10b981' : '#ef4444';
        
        htmlContent = buildRsvpTemplate({
          name: typeof rsvp_name === 'string' ? rsvp_name : name.toString(),
          attendingStatus,
          attendingColor,
          guestCount: typeof rsvp_guest_count === 'string' ? rsvp_guest_count : undefined,
          plusOne: typeof rsvp_plus_one === 'string' ? rsvp_plus_one : undefined,
          favoriteSong: typeof favorite_song === 'string' ? favorite_song : undefined,
        });
      } else if (message_type === 'handwritten' || image) {
        subject = `Handwritten Message from ${name}`;
        htmlContent = buildHandwrittenTemplate({
          name: name.toString(),
          message: message ? message.toString() : undefined,
          hasImage: !!image,
          imageCid
        });
      } else {
        subject = `Message from ${name}`;
        htmlContent = buildMessageTemplate({
          name: name.toString(),
          message: message ? message.toString() : undefined
        });
      }
    } catch (error) {
      console.error('Error building email content:', error);
      return Response.json(
        { success: false, message: 'Error creating email content' },
        { status: 500 }
      );
    }

    // Send email
    try {
      await sendEmail({
        to: recipientEmail,
        subject,
        html: htmlContent,
        from: `"${name}" <${process.env.SMTP_USER}>`,
        attachments
      });

      // After sending email, save the submission
      const submissionData = {
        name: name.toString(),
        handwrittenMessageUrl: imageUrl,
        timestamp: new Date().toISOString(),
      };

      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/rsvps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      return Response.json({ 
        success: true, 
        message: 'Message sent successfully!'
      });
    } catch (error) {
      const err = error as Error & { code?: string; responseCode?: number };
      console.error('Error sending email:', {
        message: err.message,
        code: err.code,
        responseCode: err.responseCode,
        stack: err.stack
      });

      let errorMessage = 'Failed to send message. Please try again later.';
      if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
        errorMessage = 'Could not connect to email server. Please try again later.';
      } else if (err.code === 'EAUTH') {
        errorMessage = 'Authentication failed. Please check your email settings.';
      } else if (err.responseCode === 550) {
        errorMessage = 'Email address not found or rejected by server.';
      }

      return Response.json(
        { 
          success: false, 
          message: errorMessage,
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return Response.json(
      { 
        success: false, 
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}


function buildRsvpTemplate({
  name,
  attendingStatus,
  attendingColor,
  guestCount,
  plusOne,
  favoriteSong
}: {
  name: string;
  attendingStatus: string;
  attendingColor: string;
  guestCount?: string;
  plusOne?: string;
  favoriteSong?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4f46e5;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">New RSVP Response</h1>
        </div>
        
        <div style="background-color: ${attendingColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">${attendingStatus}</h2>
        </div>
        
        ${attendingStatus === 'Yes, attending!' ? `
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">Guest Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 40%;">Name:</td>
                <td style="padding: 8px 0; color: #1f2937;">${name}</td>
              </tr>
              ${guestCount ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Number of Guests:</td>
                <td style="padding: 8px 0; color: #1f2937;">${guestCount}</td>
              </tr>
              ` : ''}
              ${plusOne ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Plus One:</td>
                <td style="padding: 8px 0; color: #1f2937;">${plusOne}</td>
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
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
            <p style="color: #1f2937; margin: 0;">We're sorry you won't be able to join us, but we appreciate you letting us know!</p>
          </div>
        `}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">This is an automated message from the engagement website.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildHandwrittenTemplate({
  name,
  message,
  hasImage,
  imageCid
}: {
  name: string;
  message?: string;
  hasImage: boolean;
  imageCid?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4f46e5;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">You've Received a Handwritten Message!</h1>
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0; color: #1f2937;">
            <strong style="color: #4f46e5;">From:</strong> ${name}
          </p>
        </div>
        
        ${hasImage ? `
          <div style="margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <img src="cid:${imageCid}" alt="Handwritten message from ${name}" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          </div>
        ` : ''}
        
        ${message ? `
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1f2937;">${message}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">This is an automated message from the engagement website.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildMessageTemplate({
  name,
  message = 'No message content provided.'
}: {
  name: string;
  message?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4f46e5;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">You've Received a New Message!</h1>
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0; color: #1f2937;">
            <strong style="color: #4f46e5;">From:</strong> ${name}
          </p>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
          <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 16px; white-space: pre-wrap;">${message}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">This is an automated message from the engagement website.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ... (rest of the code remains the same)
