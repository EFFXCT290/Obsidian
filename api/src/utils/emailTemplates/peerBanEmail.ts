import { sanitizeText, sanitizeHtml, sanitizeHtmlWithLineBreaks, sanitizeDate } from './sanitization.js';

export function getPeerBanEmail({ username, reason, expiresAt }: { username: string, reason: string, expiresAt?: Date }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeReason = sanitizeText(reason);
  const safeExpiresAt = expiresAt ? sanitizeDate(expiresAt) : '';
  
  // For HTML, sanitize and preserve formatting
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlReason = sanitizeHtmlWithLineBreaks(reason);
  const safeHtmlExpiresAt = expiresAt ? sanitizeHtml(sanitizeDate(expiresAt)) : '';

  const text = `Dear ${safeUsername},\n\nYou have been banned from the tracker for the following reason:\n${safeReason}${safeExpiresAt ? `\nThis ban will expire at: ${safeExpiresAt}` : ''}\n\nIf you believe this is a mistake, please contact support.`;

  const html = `<div style="font-family:sans-serif;color:#222;">\n    <h2>You've been banned from the tracker</h2>\n    <p>Dear <b>${safeHtmlUsername}</b>,</p>\n    <p>You have been banned for the following reason:</p>\n    <blockquote style="color:#b91c1c;">${safeHtmlReason}</blockquote>\n    ${safeHtmlExpiresAt ? `<p>This ban will expire at: <b>${safeHtmlExpiresAt}</b></p>` : ''}\n    <p>If you believe this is a mistake, please contact support.</p>\n  </div>`;
 
  return { text, html };
} 