const decodeBasicEntities = (text: string): string =>
  text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16))
    );

/** Comic Vine volume descriptions are HTML; normalize to plain text for the UI. */
export const formatComicVineDescription = (html: string): string => {
  const input = html.trim();

  if (!input || !input.includes('<')) {
    return decodeBasicEntities(input);
  }

  let text = input
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<\/(?:p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(
      /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      (_match, url: string, label: string) => {
        const cleanLabel = decodeBasicEntities(
          label.replace(/<[^>]+>/g, '').trim()
        );

        if (!cleanLabel || cleanLabel === url) {
          return url;
        }

        return `${cleanLabel} (${url})`;
      }
    )
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  return decodeBasicEntities(text).trim();
};
