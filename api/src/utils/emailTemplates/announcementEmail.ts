import { sanitizeText, sanitizeHtml, sanitizeHtmlWithLineBreaks } from './sanitization.js';

export function getAnnouncementEmail({ username, title, body }: { username: string, title: string, body: string }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeTitle = sanitizeText(title);
  const safeBody = sanitizeText(body);
  
  // For HTML, we need to sanitize and also convert line breaks to <br> tags
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlTitle = sanitizeHtml(title);
  const safeHtmlBody = sanitizeHtmlWithLineBreaks(body);
  
  const text = `Dear ${safeUsername},\n\nA new announcement has been posted: "${safeTitle}"\n\n${safeBody}\n\nVisit the tracker for more details.`;
  const html = `<div style="font-family:sans-serif;color:#222;">\n  <h2>New Announcement: ${safeHtmlTitle}</h2>\n  <p>Dear <b>${safeHtmlUsername}</b>,</p>\n  <p>${safeHtmlBody}</p>\n  <p>Visit the tracker for more details.</p>\n</div>`;
  return { text, html };
} 