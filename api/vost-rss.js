const RSS_URL = 'https://nitter.net/VOSTcvalenciana/rss';

const decodeHtml = (value = '') =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const cleanText = (value = '') =>
  decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cleanContent = (value = '') =>
  decodeHtml(value)
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const response = await fetch(RSS_URL, {
      headers: {
        'user-agent': 'ZBS-Forcall/1.0',
        accept: 'application/rss+xml, application/xml, text/xml',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`RSS respondió ${response.status}`);
    }

    const xml = await response.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];
      const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      const descMatch = content.match(/<description[^>]*>([\s\S]*?)<\/description>/);
      const pubDateMatch = content.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);
      const linkMatch = content.match(/<link[^>]*>([\s\S]*?)<\/link>/);
      const guidMatch = content.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);

      const title = titleMatch ? cleanText(titleMatch[1]) : '';
      const description = descMatch ? cleanContent(descMatch[1]) : '';
      const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : '';
      const link = linkMatch ? cleanText(linkMatch[1]) : '';
      const guid = guidMatch ? cleanText(guidMatch[1]) : '';

      if (title || description) {
        items.push({
          title: title || description.slice(0, 100),
          content: description,
          pubDate,
          link: link || guid || '',
        });
      }
    }

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json({ posts: items.slice(0, 5) });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron obtener los tweets de VOSTcvalenciana.',
      details: error instanceof Error ? error.message : 'Error desconocido',
      posts: [],
    });
  }
}
