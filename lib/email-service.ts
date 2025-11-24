import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
  from = `"Engagement Site" <${process.env.SMTP_USER}>`,
}: SendEmailOptions) {
  // Validate environment variables
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured');
  }

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Required for Netlify
    },
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    debug: process.env.NODE_ENV === 'development',
  });

  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    attachments,
  });

  console.log('Message sent: %s', info.messageId);
  return info;
}
