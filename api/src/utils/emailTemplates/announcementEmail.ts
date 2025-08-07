export function getAnnouncementEmail({ username, title, body }: { username: string, title: string, body: string }) {
  const text = `Dear ${username},\n\nA new announcement has been posted: \"${title}\"\n\n${body}\n\nVisit the tracker for more details.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>New Announcement: ${title}</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>${body}</p>\n  <p>Visit the tracker for more details.</p>\n</div>`;
  return { text, html };
} 