export function getRequestFilledEmail({ username, requestTitle, torrentName }: { username: string, requestTitle: string, torrentName: string }) {
  const text = `Dear ${username},\n\nYour request \"${requestTitle}\" has been filled with the torrent: ${torrentName}.\n\nYou can now download it from the tracker.\n\nThank you for using our request system!`;
  const html = `<div style=\"font-family:sans-serif;color:#222;\">\n  <h2>Your request has been filled!</h2>\n  <p>Dear <b>${username}</b>,</p>\n  <p>Your request <b>\"${requestTitle}\"</b> has been filled with the torrent: <b>${torrentName}</b>.</p>\n  <p>You can now download it from the tracker.</p>\n  <p>Thank you for using our request system!</p>\n</div>`;
  return { text, html };
} 