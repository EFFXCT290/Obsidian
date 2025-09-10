import nodemailer from 'nodemailer';
import { getConfig } from '../services/configService.js';
import { sanitizeHtml } from './emailTemplates/sanitization.js';

/**
 * Sanitizes email content to prevent XSS attacks
 * This function ensures that any HTML content passed to sendEmail is safe
 */
function sanitizeEmailContent(content: string | undefined): string | undefined {
  if (!content) return content;
  return sanitizeHtml(content);
}

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) {
  const config = await getConfig();
  const host = config.smtpHost || process.env.SMTP_HOST || 'localhost';
  const port = config.smtpPort || Number(process.env.SMTP_PORT) || 1025;
  const user = config.smtpUser || process.env.SMTP_USER;
  const pass = config.smtpPass || process.env.SMTP_PASS;
  const from = config.smtpFrom || process.env.SMTP_FROM || 'noreply@tracker.local';
  
  // Sanitize HTML content to prevent XSS attacks
  const safeHtml = sanitizeEmailContent(html);
  
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: user ? { user, pass } : undefined
  });
  
  await transporter.sendMail({ 
    from, 
    to, 
    subject, 
    text, 
    html: safeHtml 
  });
}

export function getFrontendBaseUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
} 