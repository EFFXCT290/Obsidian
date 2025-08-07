export function getPeerBanEmail({ username, reason, expiresAt }: { username: string, reason: string, expiresAt?: Date }) {
  const text = `Dear ${username},\n\nYou have been banned from the tracker for the following reason:\n${reason}${expiresAt ? `\nThis ban will expire at: ${expiresAt.toLocaleString()}` : ''}\n\nIf you believe this is a mistake, please contact support.`;

  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n    <h2>You've been banned from the tracker</h2>\n    <p>Dear <b>${username}</b>,</p>\n    <p>You have been banned for the following reason:</p>\n    <blockquote style=\"color:#b91c1c;\">${reason}</blockquote>\n    ${expiresAt ? `<p>This ban will expire at: <b>${expiresAt.toLocaleString()}</b></p>` : ''}\n    <p>If you believe this is a mistake, please contact support.</p>\n  </div>`;
 
  return { text, html };
} 