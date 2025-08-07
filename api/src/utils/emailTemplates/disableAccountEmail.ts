// Disable Account Email Template
export function getDisableAccountEmail({ username }: { username: string }) {
  const text = `Dear ${username},\n\nYou have disabled your account. This action is irreversible and you will not be able to log in until re-enabled by an admin.`;
  const html = `<div style='font-family:sans-serif;color:#222;'><h2>Account Disabled</h2><p>Dear <b>${username}</b>,</p><p>You have disabled your account. This action is <b>irreversible</b> and you will not be able to log in until re-enabled by an admin.</p></div>`;
  return { text, html };
} 