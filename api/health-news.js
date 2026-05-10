const SOURCES = [
  { name: 'GVA Sanitat', url: 'https://www.san.gva.es/web/comunicacion/noticias' },
  { name: 'GVA Sanitat RSS', url: 'https://www.san.gva.es/noticias.rss' },
];

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

function parseRSS(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const item = match[1];
    const title = cleanText(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
    const link = cleanText(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
    const description = cleanText(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
    const pubDate = cleanText(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '');
    const category = cleanText(item.match(/<category>([\s\S]*?)<\/category>/)?.[1] || 'Sanidad');
    if (title) {
      items.push({ title, link, description, pubDate, category });
    }
  }
  return items;
}

function parseHTMLNews(html) {
  const items = [];
  const articleRegex = /<article[\s\S]*?>(.+?)<\/article>/g;
  let match;
  while ((match = articleRegex.exec(html)) !== null) {
    const article = match[1];
    const titleMatch = article.match(/<h[2-3][^>]*>(.+?)<\/h[2-3]>/);
    const linkMatch = article.match(/<a[^>]*href="([^"]+)"[^>]*>/);
    const summaryMatch = article.match(/<p[^>]*>(.+?)<\/p>/);
    const title = titleMatch ? cleanText(titleMatch[1]) : '';
    const link = linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.san.gva.es${linkMatch[1]}`) : '';
    const summary = summaryMatch ? cleanText(summaryMatch[1]) : '';
    if (title) {
      items.push({ title, link, description: summary, pubDate: '', category: 'Sanidad' });
    }
  }
  return items;
}

function categorizeArticle(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  if (text.includes('vacun') || text.includes('gripe') || text.includes('campaña')) return 'Vacunación';
  if (text.includes('emergencia') || text.includes('urgencia') || text.includes('samu') || text.includes('112')) return 'Emergencias';
  if (text.includes('telemedicina') || text.includes('digital') || text.includes('tecnología')) return 'Innovación';
  if (text.includes('formación') || text.includes('curso') || text.includes('jornada')) return 'Formación';
  if (text.includes('atención primaria') || text.includes('consultorio') || text.includes('centro de salud')) return 'Atención Primaria';
  if (text.includes('prevención') || text.includes('salud pública') || text.includes('recomendacion')) return 'Prevención';
  if (text.includes('hospital') || text.includes('quirófano') || text.includes('lista de espera')) return 'Hospital';
  return 'Sanidad';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    let articles = [];

    for (const source of SOURCES) {
      try {
        const response = await fetch(source.url, {
          headers: {
            'user-agent': 'ZBS-Forcall/1.0',
            accept: 'text/html,application/xhtml+xml,application/xml',
          },
          cache: 'no-store',
        });

        if (!response.ok) continue;

        const text = await response.text();

        if (source.url.endsWith('.rss')) {
          articles = parseRSS(text);
        } else {
          articles = parseHTMLNews(text);
        }

        if (articles.length > 0) break;
      } catch {
        continue;
      }
    }

    if (articles.length > 0) {
      const mapped = articles.slice(0, 12).map((a, i) => ({
        id: String(i + 1),
        title: a.title,
        summary: a.description || a.title,
        sourceUrl: a.link || 'https://www.san.gva.es',
        sourceName: 'GVA Sanitat',
        category: categorizeArticle(a.title, a.description),
        publishedAt: a.pubDate || new Date(Date.now() - i * 86400000).toISOString(),
      }));
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
      res.status(200).json({ articles: mapped });
    } else {
      res.status(503).json({ articles: [], error: 'No se pudieron obtener noticias de las fuentes oficiales.' });
    }
  } catch (error) {
    res.status(503).json({ articles: [], error: 'Error al conectar con las fuentes de noticias.' });
  }
}
