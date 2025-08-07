export function getTorrentApprovedEmail({ username, torrentName }: { username: string, torrentName: string }) {
  const text = `Dear ${username},\n\nYour torrent \"${torrentName}\" has been approved and is now available on the tracker.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>Your torrent has been approved</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>Your torrent <b>\"${torrentName}\"</b> has been approved and is now available on the tracker.</p>\n</div>`;
  return { text, html };
}
 
export function getTorrentRejectedEmail({ username, torrentName }: { username: string, torrentName: string }) {
  const text = `Dear ${username},\n\nYour torrent \"${torrentName}\" has been rejected by an administrator.`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>Your torrent has been rejected</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>Your torrent <b>\"${torrentName}\"</b> has been rejected by an administrator.</p>\n</div>`;
  return { text, html };
} 