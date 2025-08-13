/**
 * Lightweight tag suggestions based on filename and optional context
 */

export function generateTagSuggestions(filename: string, opts?: { sourceName?: string; categoryLabel?: string }): string[] {
  const suggestions = new Set<string>();
  const name = filename || '';

  // Resolution
  if (/(4k|2160p)/i.test(name)) suggestions.add('4K');
  if (/4320p/i.test(name)) suggestions.add('8K');
  if (/1080p/i.test(name)) suggestions.add('1080p');
  if (/720p/i.test(name)) suggestions.add('720p');
  if (/480p/i.test(name)) suggestions.add('480p');

  // Codecs / containers
  if (/(x265|h265|hevc)/i.test(name)) suggestions.add('x265');
  if (/(x264|h264)/i.test(name)) suggestions.add('x264');
  const container = name.match(/\.(mkv|mp4|avi)\b/i)?.[1]?.toUpperCase();
  if (container) suggestions.add(container);

  // Sources
  if (/(bluray|bdrip)/i.test(name)) suggestions.add('BluRay');
  if (/(web-?dl|webrip)/i.test(name)) suggestions.add('WebDL');
  if (/(dvdrip)/i.test(name)) suggestions.add('DVDRip');
  if (/(hdtv)/i.test(name)) suggestions.add('HDTV');

  // Audio
  if (/(dts|dts-hd)/i.test(name)) suggestions.add('DTS');
  if (/(aac)/i.test(name)) suggestions.add('AAC');
  if (/(flac)/i.test(name)) suggestions.add('FLAC');
  if (/(ac3)/i.test(name)) suggestions.add('AC3');

  // TV season/episode
  const season = name.match(/s(\d{1,2})/i)?.[1];
  if (season) suggestions.add(`Season ${season}`);
  if (/\b(complete|completa)\b/i.test(name)) suggestions.add('Complete');

  // Music quality
  if (/(320kbps|320)/i.test(name)) suggestions.add('320kbps');
  if (/(lossless)/i.test(name)) suggestions.add('Lossless');

  // Books format
  const book = name.match(/\.(pdf|epub|mobi|azw3|txt)\b/i)?.[1]?.toUpperCase();
  if (book) suggestions.add(book);

  // Optional context
  if (opts?.sourceName) suggestions.add(opts.sourceName);
  if (opts?.categoryLabel?.toLowerCase().includes('documentary')) suggestions.add('Documentary');

  // Default helpers (cap to 10)
  const defaults = ['HD', 'HDR', 'Subbed', 'Dubbed'];
  for (const d of defaults) {
    if (suggestions.size >= 10) break;
    suggestions.add(d);
  }

  return Array.from(suggestions).slice(0, 10);
}

