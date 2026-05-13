const RSS_URL = 'https://www.aemet.es/es/rss_info/avisos/val';

const decodeHtml = (value = '') =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const cleanText = (value = '') =>
  decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
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
      throw new Error(`AEMET respondió ${response.status}`);
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

      const title = titleMatch ? cleanText(titleMatch[1]) : '';
      const description = descMatch ? cleanText(descMatch[1]) : '';
      const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : '';
      const link = linkMatch ? cleanText(linkMatch[1]) : '';

      if (title && description) {
        items.push({ title, description, pubDate, link });
      }
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ warnings: items.slice(0, 20) });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener los avisos de AEMET.',
      details: error instanceof Error ? error.message : 'Error desconocido',
      warnings: [],
    });
  }
}
