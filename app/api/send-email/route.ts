// app/api/send-email/route.ts
import nodemailer from 'nodemailer';

// Ensure this route uses the Node.js runtime (not Edge), required for nodemailer
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '';
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GOOGLE_APP_PASSWORD || '';
    const toEmail = process.env.CONTACT_EMAIL || smtpUser || '';
    const imageFile = formData.get('image') as File | null;

    if (!name?.trim()) {
      return Response.json(
        { success: false, message: 'Please enter your name' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!smtpUser || !smtpPass) {
      return Response.json(
        { success: false, message: 'Email service not configured. Missing SMTP credentials.' },
        { status: 500 }
      );
    }
    if (!toEmail) {
      return Response.json(
        { success: false, message: 'Email service not configured. Missing recipient email.' },
        { status: 500 }
      );
    }

    // Create transporter after validating env, so any errors are caught below
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

    // Convert the image file to a buffer
    let attachments = [];
    if (imageFile) {
      const imageBytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(imageBytes);
      
      attachments.push({
        filename: 'handwritten-message.png',
        content: buffer,
        cid: 'handwritten-message',
        encoding: 'base64'
      });
    }

    // Send mail
    let info;
    try {
      info = await transporter.sendMail({
        from: `"Engagement Website" <${smtpUser}>`,
        to: toEmail,
        subject: `New Message from ${name}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">You've received a new message!</h2>
          <p><strong>From:</strong> ${name}</p>
          <p>Here's the handwritten message:</p>
          ${imageFile ? 
            `<div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
              <img src="cid:handwritten-message" alt="Handwritten message" style="max-width: 100%; height: auto;" />
            </div>` : 
            '<p>No image was attached to this message.</p>'
          }
        </div>
      `,
        attachments
      });
    } catch (err: any) {
      console.error('Error sending email:', err);
      const message = (err && (err.message || err.toString())) || 'Unknown email error';
      return Response.json(
        {
          success: false,
          message,
          code: err?.code || null,
          provider: 'gmail',
          envPresent: {
            SMTP_USER: Boolean(process.env.SMTP_USER),
            SMTP_PASS: Boolean(process.env.SMTP_PASS),
            GMAIL_USER: Boolean(process.env.GMAIL_USER),
            GMAIL_APP_PASSWORD: Boolean(process.env.GMAIL_APP_PASSWORD),
            GOOGLE_APP_PASSWORD: Boolean(process.env.GOOGLE_APP_PASSWORD),
            CONTACT_EMAIL: Boolean(process.env.CONTACT_EMAIL),
          },
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
    console.error('Error sending email:', error);
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