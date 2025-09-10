import { sanitizeText, sanitizeHtml } from './sanitization.js';

export function getRequestFilledEmail({ username, requestTitle, torrentName }: { username: string, requestTitle: string, torrentName: string }) {
  // Sanitize all user inputs to prevent XSS attacks
  const safeUsername = sanitizeText(username);
  const safeRequestTitle = sanitizeText(requestTitle);
  const safeTorrentName = sanitizeText(torrentName);
  
  const safeHtmlUsername = sanitizeHtml(username);
  const safeHtmlRequestTitle = sanitizeHtml(requestTitle);
  const safeHtmlTorrentName = sanitizeHtml(torrentName);
  
  const text = `Dear ${safeUsername},\n\nYour request "${safeRequestTitle}" has been filled with the torrent: ${safeTorrentName}.\n\nYou can now download it from the tracker.\n\nThank you for using our request system!`;
  const html = `<div style="font-family:sans-serif;color:#222;">\n  <h2>Your request has been filled!</h2>\n  <p>Dear <b>${safeHtmlUsername}</b>,</p>\n  <p>Your request <b>"${safeHtmlRequestTitle}"</b> has been filled with the torrent: <b>${safeHtmlTorrentName}</b>.</p>\n  <p>You can now download it from the tracker.</p>\n  <p>Thank you for using our request system!</p>\n</div>`;
  return { text, html };
} 