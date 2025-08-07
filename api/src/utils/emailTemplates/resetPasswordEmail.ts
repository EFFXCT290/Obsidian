export function getResetPasswordEmail({ username, link }: { username: string; link: string }) {
  const text = `Hello ${username},\n\nYou requested a password reset. Click the link below to reset your password:\n${link}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family: sans-serif; color: #222;">
      <h2>Hello ${username},</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <p style="margin: 32px 0;">
        <a href="${link}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${link}">${link}</a></p>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">If you did not request this, you can ignore this email.</p>
    </div>
  `;
  return { text, html };
} 