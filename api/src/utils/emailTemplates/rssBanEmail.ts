export function getRssBannedEmail({ username }: { username: string }) {
  const text = `Dear ${username},\n\nYour RSS access has been disabled by an administrator. You will not be able to use RSS until it is re-enabled.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>RSS Access Disabled</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>Your RSS access has been disabled by an administrator. You will not be able to use RSS until it is re-enabled.</p>\n</div>`;
  return { text, html };
}
 
export function getRssUnbannedEmail({ username }: { username: string }) {
  const text = `Dear ${username},\n\nYour RSS access has been re-enabled by an administrator. You may now use RSS again.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>RSS Access Enabled</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>Your RSS access has been re-enabled by an administrator. You may now use RSS again.</p>\n</div>`;
  return { text, html };
} 