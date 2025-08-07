export function getUserBanEmail({ username }: { username: string }) {
  const text = `Dear ${username},\n\nYour account has been banned by an administrator. You will not be able to use the tracker until your account is unbanned.\n\nIf you believe this is a mistake, please contact support.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n    <h2>Your account has been banned</h2>\n    <p>Dear <b>${username}</b>,</p>\n    <p>Your account has been banned by an administrator. You will not be able to use the tracker until your account is unbanned.</p>\n    <p>If you believe this is a mistake, please contact support.</p>\n  </div>`;
  return { text, html };
}
 
export function getUserUnbanEmail({ username }: { username: string }) {
  const text = `Dear ${username},\n\nYour account has been unbanned by an administrator. You may now use the tracker again.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n    <h2>Your account has been unbanned</h2>\n    <p>Dear <b>${username}</b>,</p>\n    <p>Your account has been unbanned by an administrator. You may now use the tracker again.</p>\n  </div>`;
  return { text, html };
} 