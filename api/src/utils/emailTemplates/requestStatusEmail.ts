export function getRequestClosedEmail({ username, requestTitle }: { username: string, requestTitle: string }) {
  const text = `Dear ${username},\n\nYour request \"${requestTitle}\" has been closed by an administrator.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>Your request has been closed</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>Your request <b>\"${requestTitle}\"</b> has been closed by an administrator.</p>\n</div>`;
  return { text, html };
}
 
export function getRequestRejectedEmail({ username, requestTitle }: { username: string, requestTitle: string }) {
  const text = `Dear ${username},\n\nYour request \"${requestTitle}\" has been rejected by an administrator.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>Your request has been rejected</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>Your request <b>\"${requestTitle}\"</b> has been rejected by an administrator.</p>\n</div>`;
  return { text, html };
} 