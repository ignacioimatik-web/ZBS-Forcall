import type { DayValidationIssue } from './calendarValidation';

/**
 * Día de la semana (convención ISO):
 * 1 = Lunes, 2 = Martes, ..., 7 = Domingo
 */
export type WeekdayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface CoverageRequirements {
  minMedicine?: number;
  minNursing?: number;
  minOnCall?: number;
  minReinforcement?: number;
}

export interface CoverageRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  appliesTo: {
    weekdays?: WeekdayNumber[];
    weekends?: boolean;
    holidays?: boolean;
  };
  requirements: CoverageRequirements;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Lista de reglas de cobertura configurables.
 *
 * Solo las reglas con `enabled: true` generan alertas.
 * Reglas marcadas enabled: false están disponibles para activar
 * cuando se defina la política de cobertura real del centro.
 */
export const DEFAULT_COVERAGE_RULES: CoverageRule[] = [
  {
    id: 'weekday-medicine',
    label: 'Laborable sin Medicina',
    description: 'Los días laborables deben tener al menos una guardia de Medicina',
    enabled: false,
    appliesTo: {
      weekdays: [1, 2, 3, 4, 5],
    },
    requirements: {
      minMedicine: 1,
    },
    severity: 'warning',
  },
  {
    id: 'weekday-nursing',
    label: 'Laborable sin Enfermería',
    description: 'Los días laborables deben tener al menos una guardia de Enfermería',
    enabled: false,
    appliesTo: {
      weekdays: [1, 2, 3, 4, 5],
    },
    requirements: {
      minNursing: 1,
    },
    severity: 'warning',
  },
  {
    id: 'weekend-continuity',
    label: 'Fin de semana sin guardia',
    description: 'Los fines de semana debe existir al menos una guardia (Medicina o Enfermería)',
    enabled: false,
    appliesTo: {
      weekends: true,
    },
    requirements: {
      minMedicine: 1,
      minNursing: 1,
    },
    severity: 'warning',
  },
  {
    id: 'holiday-coverage',
    label: 'Festivo sin cobertura',
    description: 'Los días festivos debe existir al menos una guardia o refuerzo',
    enabled: false,
    appliesTo: {
      holidays: true,
    },
    requirements: {
      minMedicine: 1,
      minNursing: 1,
      minReinforcement: 1,
    },
    severity: 'warning',
  },
];

/**
 * Helper: verifica si una regla aplica a una fecha dada
 */
export function ruleAppliesToDate(rule: CoverageRule, date: Date, isHoliday: boolean): boolean {
  const dow = date.getDay(); // 0=Dom ... 6=Sáb
  const isoWeekday = dow === 0 ? 7 : dow; // Convertir a ISO: 1=Lun ... 7=Dom
  const isWeekend = dow === 0 || dow === 6;
  const { appliesTo } = rule;

  // Si la regla aplica a festivos y hoy es festivo → aplica
  if (appliesTo.holidays && isHoliday) return true;

  // Si la regla aplica a fines de semana y hoy es fin de semana → aplica
  if (appliesTo.weekends && isWeekend) return true;

  // Si la regla aplica a días específicos de la semana
  if (appliesTo.weekdays && appliesTo.weekdays.includes(isoWeekday as WeekdayNumber)) {
    // Excluir festivos de reglas de días laborables (un festivo no es "laborable")
    if (isHoliday) return false;
    return true;
  }

  return false;
}

/**
  * Evalúa las reglas de cobertura para una fecha dada.
  * Devuelve alertas solo para reglas con enabled: true.
  * Evita duplicados: no genera alerta si ya existe una del mismo tipo
  * para la misma fecha.
  */
export function evaluateCoverageRules(
  date: Date,
  guardias: { type: string; personnelName?: string }[],
  libranzas: { type: string; personnelName?: string }[],
  doblas: { type: string; personnelName?: string }[],
  vacaciones: { type: string; personnelName?: string }[],
  isHoliday: boolean,
  existingIssues: DayValidationIssue[],
  rules: CoverageRule[] = DEFAULT_COVERAGE_RULES,
): DayValidationIssue[] {
  const newIssues: DayValidationIssue[] = [];
  const dateStr = date.toDateString();

  // Combinar todas las asignaciones operativas
  const operational = [
    ...guardias.map(g => ({ type: g.type, name: g.personnelName, kind: 'guardia' as const })),
    ...libranzas.map(l => ({ type: l.type, name: l.personnelName, kind: 'libranza' as const })),
    ...doblas.map(d => ({ type: d.type, name: d.personnelName, kind: 'dobla' as const })),
    ...vacaciones.map(v => ({ type: v.type, name: v.personnelName, kind: 'vacacion' as const })),
  ];

  // Nombres de los días para mensajes
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayLabel = dayNames[date.getDay()];
  const dateFormatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (!ruleAppliesToDate(rule, date, isHoliday)) continue;

    const reqs = rule.requirements;

    for (const [key, min] of Object.entries(reqs)) {
      if (min === undefined || min <= 0) continue;

      let count = 0;
      let personnelFound: string[] = [];

      if (key === 'minMedicine') {
        const matches = operational.filter(
          o => (o.type === 'medica' || o.kind === 'guardia') && o.name && o.kind !== 'vacacion'
        );
        count = matches.length;
        personnelFound = matches.map(m => m.name || '').filter(Boolean);
      } else if (key === 'minNursing') {
        const matches = operational.filter(
          o => (o.type === 'enfermeria' || o.kind === 'guardia') && o.name && o.kind !== 'vacacion'
        );
        count = matches.length;
        personnelFound = matches.map(m => m.name || '').filter(Boolean);
      } else if (key === 'minOnCall') {
        // Guardias en general (cualquier tipo)
        const matches = operational.filter(o => o.kind === 'guardia' && o.name);
        count = matches.length;
        personnelFound = matches.map(m => m.name || '').filter(Boolean);
      } else if (key === 'minReinforcement') {
        const matches = operational.filter(o => o.kind === 'dobla' || o.kind === 'libranza');
        count = matches.length;
        personnelFound = matches.map(m => m.name || '').filter(Boolean);
      }

      if (count < min) {
        const missingCount = min - count;
        // Verificar que no sea duplicado de una alerta existente
        const alreadyReported = existingIssues.some(
          i =>
            i.type === 'missing_coverage' &&
            i.date === dateStr &&
            i.message.includes(rule.label)
        );

        if (!alreadyReported) {
          const hasPersonnel = operational.some(o => o.name);
          const missingType =
            key === 'minMedicine'
              ? 'Medicina'
              : key === 'minNursing'
              ? 'Enfermería'
              : key === 'minOnCall'
              ? 'Guardia'
              : 'Refuerzo';

          let message: string;
          if (hasPersonnel) {
            message = `Falta ${missingType} según regla "${rule.label}"`;
          } else {
            // Si no hay NADIE asignado, ya se reporta como missing_coverage base
            // Solo reportar si hay ALGUIEN pero no del tipo requerido
            continue;
          }

          newIssues.push({
            id: `coverage-${rule.id}-${dateStr}`,
            type: 'missing_coverage',
            severity: rule.severity,
            message,
            professionals: personnelFound.length > 0 ? personnelFound : undefined,
            date: dateStr,
          });
        }
      }
    }
  }

  return newIssues;
}