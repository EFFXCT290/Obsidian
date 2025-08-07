export function getPromotionEmail({ username, newRole }: { username: string, newRole: string }) {
  const text = `Dear ${username},\n\nCongratulations! You have been promoted to the role of ${newRole} on the tracker.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>Promotion Notice</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>Congratulations! You have been promoted to the role of <b>${newRole}</b> on the tracker.</p>\n</div>`;
  return { text, html };
}
 
export function getDemotionEmail({ username, oldRole }: { username: string, oldRole: string }) {
  const text = `Dear ${username},\n\nYou have been demoted from the role of ${oldRole} on the tracker.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>Demotion Notice</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>You have been demoted from the role of <b>${oldRole}</b> on the tracker.</p>\n</div>`;
  return { text, html };
} 