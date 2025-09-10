import { sanitizeText, sanitizeHtml } from './sanitization.js';

export function getWikiCreatedEmail({ username, title }: { username: string, title: string }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeTitle = sanitizeText(title);
  
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlTitle = sanitizeHtml(title);
  
  const text = `Dear ${safeUsername},\n\nA new wiki page has been created: "${safeTitle}".\n\nVisit the tracker to read it.`;
  const html = `<div style="font-family:sans-serif;color:#222;">\n  <h2>New Wiki Page Created</h2>\n  <p>Dear <b>${safeHtmlUsername}</b>,</p>\n  <p>A new wiki page has been created: <b>"${safeHtmlTitle}"</b>.</p>\n  <p>Visit the tracker to read it.</p>\n</div>`;
  return { text, html };
}
 
export function getWikiUpdatedEmail({ username, title }: { username: string, title: string }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeTitle = sanitizeText(title);
  
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlTitle = sanitizeHtml(title);
  
  const text = `Dear ${safeUsername},\n\nA wiki page has been updated: "${safeTitle}".\n\nVisit the tracker to read the latest version.`;
  const html = `<div style="font-family:sans-serif;color:#222;">\n  <h2>Wiki Page Updated</h2>\n  <p>Dear <b>${safeHtmlUsername}</b>,</p>\n  <p>A wiki page has been updated: <b>"${safeHtmlTitle}"</b>.</p>\n  <p>Visit the tracker to read the latest version.</p>\n</div>`;
  return { text, html };
} 