import React, { useState, useMemo } from 'react';
import { useT } from '../lib/i18n';
import { User, Guardia, Libranza, Dobla, Vacacion } from '../types';
import { NotificationToast } from './NotificationToast';
import { USERS } from '../lib/users';

interface IAEntry {
  id: string;
  date: string;
  category: 'guardia' | 'libranza' | 'refuerzo' | 'vacacion';
  type: 'medica' | 'enfermeria';
  personnelName: string;
}

interface IAassistViewProps {
  onAddGuardia: (guardia: Guardia) => Promise<boolean | void>;
  onAddLibranza: (libranza: Libranza) => Promise<void>;
  onAddDobla: (dobla: Dobla) => Promise<void>;
  onAddVacacion: (vacacion: Vacacion) => Promise<void>;
  currentUser: User | null;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  guardias: Guardia[];
  libranzas: Libranza[];
  doblas: Dobla[];
  vacaciones: Vacacion[];
}

const CATEGORY_LABELS: Record<string, string> = {
  guardia: 'Guardia',
  libranza: 'Libranza',
  refuerzo: 'Refuerzo',
  vacacion: 'Vacación',
};

const TYPE_LABELS: Record<string, string> = {
  medica: 'Medicina',
  enfermeria: 'Enfermeria',
};

const ALL_PERSONNEL = USERS.map(u => u.name);

function generateId(): string {
  return 'ia-' + (crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11));
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8');
  const content = decoder.decode(buffer);

  const texts: string[] = [];
  const tjRegex = /\(([^)]*)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(content)) !== null) {
    const t = match[1];
    if (t.length > 1 || /^[\d]$/.test(t)) {
      texts.push(t);
    }
  }

  const tjArrRegex = /\[([^\]]*)\]\s*TJ/g;
  while ((match = tjArrRegex.exec(content)) !== null) {
    const parts = match[1].match(/\(([^)]*)\)/g);
    if (parts) {
      for (const p of parts) {
        const t = p.slice(1, -1);
        if (t.length > 1 || /^[\d]$/.test(t)) {
          texts.push(t);
        }
      }
    }
  }

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const combined = texts
    .filter(t => !dayNames.includes(t))
    .join('\n');

  return combined;
}

function findPersonnelInText(text: string): string[] {
  const found: string[] = [];
  for (const name of ALL_PERSONNEL) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(escaped, 'i').test(text)) {
      found.push(name);
    }
  }
  return found;
}

interface DayGroup {
  day: number;
  names: string[];
  labels: string[];
}

function groupByDay(fragments: string[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let current: DayGroup | null = null;

  for (const f of fragments) {
    const trimmed = f.trim();
    const dayNum = parseInt(trimmed, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      current = { day: dayNum, names: [], labels: [] };
      groups.push(current);
    } else if (current) {
      const known = ['M', 'E', 'L', 'R', 'MT', 'V'];
      if (known.includes(trimmed)) {
        current.labels.push(trimmed);
      } else {
        const matched = ALL_PERSONNEL.filter(n => n.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(n.toLowerCase()));
        if (matched.length > 0) {
          current.names.push(matched[0]);
        } else if (trimmed.length > 2) {
          current.names.push(trimmed);
        }
      }
    }
  }

  return groups;
}

const TYPE_MAP: Record<string, 'medica' | 'enfermeria'> = {
  M: 'medica',
  E: 'enfermeria',
  L: 'medica',
  R: 'medica',
  V: 'medica',
};

const CAT_MAP: Record<string, 'guardia' | 'libranza' | 'refuerzo' | 'vacacion'> = {
  M: 'guardia',
  E: 'guardia',
  L: 'libranza',
  R: 'refuerzo',
  V: 'vacacion',
};

const TXT_MAP: Record<string, string> = {
  M: 'M medic',
  E: 'E enfermer',
  L: 'L libranza',
  R: 'R refuerzo',
  V: 'V vacacion',
};

function parseFragmentsIntoEntries(fragments: string[]): IAEntry[] {
  const groups = groupByDay(fragments);
  const entries: IAEntry[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  for (const g of groups) {
    const date = new Date(year, month, g.day);
    const dateStr = formatDate(date);

    if (g.labels.length === 0 && g.names.length > 0) {
      for (const name of g.names) {
        const user = USERS.find(u => u.name === name);
        entries.push({
          id: generateId(),
          date: dateStr,
          category: 'guardia',
          type: user?.category === 'enfermeria' ? 'enfermeria' : 'medica',
          personnelName: name,
        });
      }
    } else {
      for (let i = 0; i < Math.max(g.labels.length, g.names.length); i++) {
        const label = g.labels[i] || '';
        const name = g.names[i] || g.names[0] || label;
        const type = TYPE_MAP[label] || 'medica';
        const cat = CAT_MAP[label] || 'guardia';
        if (name !== label) {
          entries.push({
            id: generateId(),
            date: dateStr,
            category: cat,
            type,
            personnelName: name,
          });
        }
      }
    }
  }

  return entries;
}

export const IAassistView: React.FC<IAassistViewProps> = ({
  onAddGuardia, onAddLibranza, onAddDobla, onAddVacacion,
  currentUser, notify, guardias, libranzas, doblas, vacaciones,
}) => {
  const { t } = useT();
  const [activeMethod, setActiveMethod] = useState<'pdf' | 'image'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [entries, setEntries] = useState<IAEntry[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);
  const [rawText, setRawText] = useState('');
  const [formDate, setFormDate] = useState(formatDate(new Date()));
  const [formPersonnel, setFormPersonnel] = useState('');
  const [formCategory, setFormCategory] = useState<'guardia' | 'libranza' | 'refuerzo' | 'vacacion'>('guardia');
  const [formType, setFormType] = useState<'medica' | 'enfermeria'>('medica');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [filterPersonnel, setFilterPersonnel] = useState('');

  const localNotify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setEntries([]);
    setRawText('');

    if (activeMethod === 'image') {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleProcessPdf = async () => {
    if (!file || activeMethod !== 'pdf') return;
    setIsProcessing(true);
    try {
      const text = await extractPdfText(file);
      setRawText(text);
      const fragments = text.split('\n').filter(s => s.trim());
      const parsed = parseFragmentsIntoEntries(fragments);
      if (parsed.length > 0) {
        setEntries(parsed);
        localNotify(`Se encontraron ${parsed.length} entradas. Revísalas antes de asignar.`, 'info');
      } else {
        localNotify('No se pudieron identificar entradas automáticamente. Puedes añadirlas manualmente.', 'info');
      }
    } catch (err) {
      localNotify('Error al procesar el PDF. Añade las entradas manualmente.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddManualEntry = () => {
    if (!formPersonnel.trim()) {
      localNotify('Selecciona un profesional.', 'error');
      return;
    }
    const entry: IAEntry = {
      id: generateId(),
      date: formDate,
      category: formCategory,
      type: formType,
      personnelName: formPersonnel,
    };
    setEntries(prev => [...prev, entry]);
    setFormPersonnel('');
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateEntry = (id: string, field: keyof IAEntry, value: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value as any } : e));
  };

  const handleAssignAll = async () => {
    if (entries.length === 0) {
      localNotify('No hay entradas para asignar.', 'error');
      return;
    }
    setIsAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    for (const entry of entries) {
      try {
        const date = new Date(entry.date + 'T12:00:00');
        const base = {
          id: generateId(),
          date,
          type: entry.type,
          personnelName: entry.personnelName,
          isChange: false,
          modifiedBy: currentUser?.id || null,
          modifiedAt: new Date(),
        };

        switch (entry.category) {
          case 'guardia': {
            const r = await onAddGuardia({ ...base });
            if (r !== false) successCount++;
            else errorCount++;
            break;
          }
          case 'libranza': {
            try {
              await onAddLibranza({ ...base, id: 'lib-' + base.id });
              successCount++;
            } catch { errorCount++; }
            break;
          }
          case 'refuerzo': {
            try {
              await onAddDobla({ ...base, id: 'dob-' + base.id });
              successCount++;
            } catch { errorCount++; }
            break;
          }
          case 'vacacion': {
            try {
              await onAddVacacion({ ...base });
              successCount++;
            } catch { errorCount++; }
            break;
          }
        }
      } catch {
        errorCount++;
      }
    }

    setIsAssigning(false);
    notify(`Asignación completada: ${successCount} correctas${errorCount > 0 ? `, ${errorCount} errores` : ''}.`, errorCount > 0 ? 'error' : 'success');
    if (successCount > 0) setEntries([]);
  };

  const handleClearAll = () => {
    setEntries([]);
    setRawText('');
    setFile(null);
    setImagePreview('');
  };

  const filteredEntries = useMemo(() => {
    if (!filterPersonnel) return entries;
    return entries.filter(e => e.personnelName.toLowerCase().includes(filterPersonnel.toLowerCase()));
  }, [entries, filterPersonnel]);

  const isAdmin = currentUser?.staffGroup == null;
  const canAssign = currentUser?.role === 'Administrador' || currentUser?.role === 'Coordinador';

  if (!canAssign) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 max-w-md">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">smart_ai</span>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Solo la coordinación puede importar datos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="material-symbols-outlined text-2xl text-forcall-600">smart_ai</span>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex-1">IAassist — Importación de Cuadrante</h2>
        </div>
        <p className="text-[10px] text-gray-400 font-medium mt-1 ml-1">
          Importa un PDF o imagen del cuadrante para asignar guardias, libranzas, refuerzos y vacaciones.
        </p>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200 max-w-xs">
        {(['pdf', 'image'] as const).map(method => (
          <button
            key={method}
            onClick={() => { setActiveMethod(method); setFile(null); setEntries([]); setRawText(''); setImagePreview(''); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeMethod === method
                ? 'bg-white text-gray-800 shadow-sm border'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {method === 'pdf' ? 'description' : 'image'}
            </span>
            {method === 'pdf' ? 'PDF' : 'Imagen'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        {activeMethod === 'pdf' ? (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-forcall-400 transition-colors bg-gray-50/50">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">description</span>
              <span className="text-sm font-bold text-gray-600">{file ? file.name : 'Selecciona un archivo PDF'}</span>
              <span className="text-[10px] text-gray-400 mt-1">El PDF debe contener el cuadrante con las asignaciones</span>
              <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {file && (
              <div className="flex gap-2">
                <button
                  onClick={handleProcessPdf}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-forcall-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Analizando...
                    </span>
                  ) : 'Analizar PDF'}
                </button>
              </div>
            )}

            {rawText && (
              <div>
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-[10px] font-bold text-gray-500 hover:text-gray-700 uppercase tracking-widest flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">{showRawText ? 'visibility_off' : 'visibility'}</span>
                  Texto extraído
                </button>
                {showRawText && (
                  <pre className="mt-2 p-3 bg-gray-50 rounded-xl text-[10px] text-gray-600 max-h-40 overflow-y-auto border border-gray-100 whitespace-pre-wrap break-all">
                    {rawText}
                  </pre>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-forcall-400 transition-colors bg-gray-50/50">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">image</span>
              <span className="text-sm font-bold text-gray-600">{file ? file.name : 'Selecciona una imagen'}</span>
              <span className="text-[10px] text-gray-400 mt-1">La imagen debe mostrar el cuadrante con las asignaciones</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {imagePreview && (
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <img src={imagePreview} alt="Cuadrante" className="w-full object-contain max-h-[400px]" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
            <span className="material-symbols-outlined text-base align-text-bottom mr-1">table</span>
            Entradas ({entries.length})
          </h3>
          <div className="flex gap-2">
            {filterPersonnel && (
              <span className="text-[9px] text-gray-400 self-center font-medium">Filtro: {filterPersonnel}</span>
            )}
            <button
              onClick={handleClearAll}
              disabled={entries.length === 0}
              className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span>
            Añadir entrada manual
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
            />
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select
              value={formType}
              onChange={e => setFormType(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
            >
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select
              value={formPersonnel}
              onChange={e => setFormPersonnel(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
            >
              <option value="">-- Seleccionar --</option>
              {ALL_PERSONNEL.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              onClick={handleAddManualEntry}
              className="py-2 bg-forcall-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow hover:bg-black transition-all active:scale-95"
            >
              Añadir
            </button>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="mb-3">
            <input
              type="text"
              value={filterPersonnel}
              onChange={e => setFilterPersonnel(e.target.value)}
              placeholder="Filtrar por profesional..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
            />
          </div>
        )}

        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">Fecha</th>
                  <th className="text-left py-2 px-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">Categoría</th>
                  <th className="text-left py-2 px-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">Tipo</th>
                  <th className="text-left py-2 px-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">Profesional</th>
                  <th className="text-right py-2 px-2 text-[9px] font-black text-gray-500 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-1.5 px-2">
                      <input
                        type="date"
                        value={entry.date}
                        onChange={e => handleUpdateEntry(entry.id, 'date', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={entry.category}
                        onChange={e => handleUpdateEntry(entry.id, 'category', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={entry.type}
                        onChange={e => handleUpdateEntry(entry.id, 'type', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
                      >
                        {Object.entries(TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={entry.personnelName}
                        onChange={e => handleUpdateEntry(entry.id, 'personnelName', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-forcall-500 transition-all"
                      >
                        {ALL_PERSONNEL.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <button
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">remove_circle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-3xl text-gray-200">table_rows</span>
            <p className="text-xs font-bold text-gray-400 mt-2">
              {activeMethod === 'pdf'
                ? 'Sube un PDF y pulsa "Analizar" para extraer las entradas, o añádelas manualmente.'
                : 'Añade entradas manualmente con el formulario superior.'}
            </p>
          </div>
        )}

        {entries.length > 0 && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleAssignAll}
              disabled={isAssigning}
              className="flex-1 py-4 bg-forcall-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isAssigning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Asignando...
                </span>
              ) : `Asignar todo (${entries.length})`}
            </button>
          </div>
        )}
      </div>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};
