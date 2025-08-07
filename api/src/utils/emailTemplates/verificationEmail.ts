export function getVerificationEmail({ username, link }: { username: string; link: string }) {
  const text = `Hello ${username},\n\nPlease verify your email address by clicking the link below:\n${link}\n\nIf you did not create an account, you can ignore this email.`;
  const html = `
    <div style="font-family: sans-serif; color: #222;">
      <h2>Hello ${username},</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <p style="margin: 32px 0;">
        <a href="${link}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify Email</a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${link}">${link}</a></p>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888;">If you did not create an account, you can ignore this email.</p>
    </div>
  `;
  return { text, html };
} 