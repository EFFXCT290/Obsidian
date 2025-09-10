import { sanitizeText, sanitizeHtml } from './sanitization.js';

export function getTorrentApprovedEmail({ username, torrentName }: { username: string, torrentName: string }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeTorrentName = sanitizeText(torrentName);
  
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlTorrentName = sanitizeHtml(torrentName);
  
  const text = `Dear ${safeUsername},\n\nYour torrent "${safeTorrentName}" has been approved and is now available on the tracker.`;
  const html = `<div style="font-family:sans-serif;color:#222;">\n  <h2>Your torrent has been approved</h2>\n  <p>Dear <b>${safeHtmlUsername}</b>,</p>\n  <p>Your torrent <b>"${safeHtmlTorrentName}"</b> has been approved and is now available on the tracker.</p>\n</div>`;
  return { text, html };
}
 
export function getTorrentRejectedEmail({ username, torrentName }: { username: string, torrentName: string }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeTorrentName = sanitizeText(torrentName);
  
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlTorrentName = sanitizeHtml(torrentName);
  
  const text = `Dear ${safeUsername},\n\nYour torrent "${safeTorrentName}" has been rejected by an administrator.`;
  const html = `<div style="font-family:sans-serif;color:#222;">\n  <h2>Your torrent has been rejected</h2>\n  <p>Dear <b>${safeHtmlUsername}</b>,</p>\n  <p>Your torrent <b>"${safeHtmlTorrentName}"</b> has been rejected by an administrator.</p>\n</div>`;
  return { text, html };
} 