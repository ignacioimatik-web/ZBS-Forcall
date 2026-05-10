import React, { useEffect, useState } from 'react';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  category: string;
  publishedAt: string;
}

export const NoticiasView: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health-news?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setArticles(data.articles || []);
      if (data.notice) setNotice(data.notice);
    } catch {
      setError('No se han podido cargar las noticias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const hero = articles[0];
  const rest = articles.slice(1, 7);
  const sideArticles = articles.slice(7, 11);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      'Atención Primaria': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Vacunación': 'bg-blue-100 text-blue-800 border-blue-200',
      'Emergencias': 'bg-red-100 text-red-800 border-red-200',
      'Innovación': 'bg-purple-100 text-purple-800 border-purple-200',
      'Formación': 'bg-amber-100 text-amber-800 border-amber-200',
      'Prevención': 'bg-teal-100 text-teal-800 border-teal-200',
      'Hospital': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Telemedicina': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return map[cat] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="animate-fade-in pb-16">
      {/* Cabecera de periódico clásico */}
      <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-2">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-none">
          Crónica Sanitaria
        </h1>
        <div className="w-24 h-0.5 bg-gray-900 mx-auto mt-3 mb-2" />
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
          Actualidad sanitaria de la Comunitat Valenciana
        </p>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {error && <span className="text-[10px] text-red-600 font-bold">{error}</span>}
          {notice && <span className="text-[10px] text-amber-600 font-bold">{notice}</span>}
          {!error && !loading && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {articles.length} artículos
            </span>
          )}
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Actualizar
        </button>
      </div>

      {loading && articles.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <span className="material-symbols-outlined animate-spin mr-3">refresh</span>
          <span className="text-xs font-black uppercase tracking-widest">Cargando crónica...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Artículo principal */}
          {hero && (
            <a
              href={hero.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="block bg-white rounded-[2rem] border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getCategoryColor(hero.category)}`}>
                    {hero.category}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {formatDate(hero.publishedAt)}
                  </span>
                </div>
                <h2 className="text-xl md:text-3xl font-black text-gray-900 leading-tight group-hover:text-gray-600 transition-colors">
                  {hero.title}
                </h2>
                <div className="w-16 h-0.5 bg-gray-300 my-4" />
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {hero.summary}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  {hero.sourceName}
                </div>
              </div>
            </a>
          )}

          {/* Parrilla de artículos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {rest.map((article, i) => (
                <a
                  key={article.id}
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`block bg-white border border-gray-200 hover:shadow-md transition-all group ${
                    i === 0 ? 'rounded-t-[2rem]' : ''
                  } ${i === rest.length - 1 ? 'rounded-b-[2rem]' : ''} ${i > 0 && i < rest.length - 1 ? '' : ''}`}
                  style={i > 0 && i < rest.length - 1 ? { borderTop: 'none' } : undefined}
                >
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 leading-snug group-hover:text-gray-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                      {article.summary}
                    </p>
                  </div>
                  {i < rest.length - 1 && <div className="mx-5 border-t border-gray-100" />}
                </a>
              ))}
            </div>

            {/* Columna lateral */}
            <div className="space-y-5">
              <div className="bg-stone-50 rounded-[2rem] border border-stone-200 p-5">
                <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-stone-500 mb-4 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-stone-300 flex items-center justify-center">
                    <span className="text-[8px] text-white">+</span>
                  </span>
                  Más noticias
                </h3>
                <div className="space-y-4">
                  {sideArticles.map((article) => (
                    <a
                      key={article.id}
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-full min-h-[3rem] bg-stone-200 rounded-full mt-1 shrink-0" />
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border mb-1 ${getCategoryColor(article.category)}`}>
                            {article.category}
                          </span>
                          <h4 className="text-xs font-black text-gray-900 leading-snug group-hover:text-gray-600 transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-[9px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                            {article.summary}
                          </p>
                          <span className="text-[8px] font-bold text-stone-400 mt-1 block">
                            {formatDate(article.publishedAt)}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Pie de edición */}
              <div className="bg-gray-900 rounded-[2rem] p-5 text-white text-center">
                <span className="material-symbols-outlined text-2xl mb-2 opacity-60">newspaper</span>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Crónica Sanitaria</p>
                <div className="w-8 h-0.5 bg-white/20 mx-auto my-2" />
                <p className="text-[8px] font-bold opacity-40">
                  © 2026 ZBS Forcall — Gestión Sanitaria V1.4
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
