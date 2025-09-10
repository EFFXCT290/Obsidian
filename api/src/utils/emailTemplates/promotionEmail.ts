import { sanitizeText, sanitizeHtml } from './sanitization.js';

export function getPromotionEmail({ username, newRole }: { username: string, newRole: string }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeNewRole = sanitizeText(newRole);
  
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlNewRole = sanitizeHtml(newRole);
  
  const text = `Dear ${safeUsername},\n\nCongratulations! You have been promoted to the role of ${safeNewRole} on the tracker.`;
  const html = `<div style="font-family:sans-serif;color:#222;">\n  <h2>Promotion Notice</h2>\n  <p>Dear <b>${safeHtmlUsername}</b>,</p>\n  <p>Congratulations! You have been promoted to the role of <b>${safeHtmlNewRole}</b> on the tracker.</p>\n</div>`;
  return { text, html };
}
 
export function getDemotionEmail({ username, oldRole }: { username: string, oldRole: string }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeOldRole = sanitizeText(oldRole);
  
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlOldRole = sanitizeHtml(oldRole);
  
  const text = `Dear ${safeUsername},\n\nYou have been demoted from the role of ${safeOldRole} on the tracker.`;
  const html = `<div style="font-family:sans-serif;color:#222;">\n  <h2>Demotion Notice</h2>\n  <p>Dear <b>${safeHtmlUsername}</b>,</p>\n  <p>You have been demoted from the role of <b>${safeHtmlOldRole}</b> on the tracker.</p>\n</div>`;
  return { text, html };
} 