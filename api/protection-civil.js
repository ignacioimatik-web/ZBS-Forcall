const OFFICIAL_HOME_URL = 'https://www.112cv.gva.es/es/';
const MAP_BASE_URL = 'https://www.112cv.gva.es/WebPublica-MapasOnLineV2/send/getMapaGeoserver';

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
    .replace(/&ograve;/g, 'ò')
    .replace(/&egrave;/g, 'è')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const cleanText = (value = '') =>
  decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalize = (value = '') =>
  cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const buildMapUrl = (mapa) => `${MAP_BASE_URL}?mapa=${mapa}`;

const getLevelFromText = (text) => {
  const normalized = normalize(text);

  if (normalized.includes('alerta roja') || normalized.includes('nivel rojo')) return 'Rojo';
  if (normalized.includes('alerta naranja') || normalized.includes('nivel naranja')) return 'Naranja';
  if (normalized.includes('alerta amarilla') || normalized.includes('nivel amarillo')) return 'Amarillo';
  return 'Verde';
};

const getTerritoryLabel = (text) => {
  const normalized = normalize(text);

  if (normalized.includes('els ports')) return 'Els Ports';
  if (
    normalized.includes('interior norte') ||
    normalized.includes('castellon interior norte') ||
    normalized.includes('interior de castellon')
  ) {
    return 'Els Ports / interior norte de Castellón';
  }
  if (normalized.includes('castellon')) return 'Provincia de Castellón';
  return 'Comunitat Valenciana';
};

const getArticles = (html) => {
  const regex =
    /<h3 class="asset-title">\s*<a href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<div class="asset-summary">[\s\S]*?<p>([\s\S]*?)<\/p>/g;

  const items = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [, href, rawTitle, rawSummary] = match;
    const title = cleanText(rawTitle);
    const summary = cleanText(rawSummary);

    if (!title) continue;

    items.push({
      title,
      summary,
      url: href.startsWith('http') ? href : `https://www.112cv.gva.es${href}`,
    });
  }

  return items;
};

const getRelevantArticles = (articles) => {
  const relevantKeywords = [
    'els ports',
    'castellon',
    'castellón',
    'interior norte',
    'preemergencia',
    'emergencia',
    'viento',
    'lluvia',
    'incendio',
    'proteccion civil',
    'protección civil',
    'temporal',
  ];

  const relevant = articles.filter((article) => {
    const haystack = normalize(`${article.title} ${article.summary}`);
    return relevantKeywords.some((keyword) => haystack.includes(normalize(keyword)));
  });

  return relevant.length > 0 ? relevant : articles.slice(0, 3);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const response = await fetch(OFFICIAL_HOME_URL, {
      headers: {
        'user-agent': 'ZBS-Forcall/1.0',
        accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`112CV respondió ${response.status}`);
    }

    const html = await response.text();
    const articles = getArticles(html);
    const relevantArticles = getRelevantArticles(articles);
    const lead = relevantArticles[0];
    const leadText = `${lead?.title || ''} ${lead?.summary || ''}`;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({
      headline: lead?.title || 'Protección Civil en Els Ports',
      summary:
        lead?.summary ||
        'Consulta el mapa oficial de 112 Comunitat Valenciana para revisar las alertas activas aplicables a Els Ports y al interior norte de Castellón.',
      level: getLevelFromText(leadText),
      territory: getTerritoryLabel(leadText),
      sourceUrl: lead?.url || `${OFFICIAL_HOME_URL}preemergencias-meteorologicas`,
      fetchedAt: new Date().toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Europe/Madrid',
      }),
      briefs: relevantArticles.slice(0, 4),
      maps: [
        {
          id: 'alertas',
          label: 'Alertas población',
          imageUrl: buildMapUrl('alertas'),
          sourceUrl: 'https://www.112cv.gva.es/es/alertas-poblacion',
        },
        {
          id: 'preemergencias',
          label: 'Preemergencias',
          imageUrl: buildMapUrl('preemergencias'),
          sourceUrl: 'https://www.112cv.gva.es/es/preemergencias-meteorologicas',
        },
        {
          id: 'emergencias',
          label: 'Emergencias',
          imageUrl: buildMapUrl('emergencias'),
          sourceUrl: 'https://www.112cv.gva.es/es/emergencias-meteorologicas',
        },
      ],
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener la información oficial de 112CV.',
      details: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}