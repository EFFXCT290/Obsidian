export function getWikiCreatedEmail({ username, title }: { username: string, title: string }) {
  const text = `Dear ${username},\n\nA new wiki page has been created: \"${title}\".\n\nVisit the tracker to read it.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>New Wiki Page Created</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>A new wiki page has been created: <b>\"${title}\"</b>.</p>\n  <p>Visit the tracker to read it.</p>\n</div>`;
  return { text, html };
}
 
export function getWikiUpdatedEmail({ username, title }: { username: string, title: string }) {
  const text = `Dear ${username},\n\nA wiki page has been updated: \"${title}\".\n\nVisit the tracker to read the latest version.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>Wiki Page Updated</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>A wiki page has been updated: <b>\"${title}\"</b>.</p>\n  <p>Visit the tracker to read the latest version.</p>\n</div>`;
  return { text, html };
} 