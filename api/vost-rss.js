const cleanContent = (value = '') =>
  (value || '')
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rssUrl = encodeURIComponent('https://nitter.net/VOSTcvalenciana/rss');
    const response = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`,
      {
        headers: { 'user-agent': 'ZBS-Forcall/1.0' },
      },
    );

    if (!response.ok) {
      throw new Error(`RSS2JSON responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error('RSS2JSON returned error status');
    }

    const posts = (data.items || []).slice(0, 5).map((item) => ({
      content: cleanContent(item.content || item.description || ''),
      pubDate: item.pubDate || '',
      link: item.link || '',
    }));

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron obtener los tweets de VOSTcvalenciana.',
      posts: [],
    });
  }
}
