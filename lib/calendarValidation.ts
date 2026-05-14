import type { Guardia, Libranza, Dobla, Vacacion, Meeting } from '../types';
import {
  evaluateCoverageRules,
  type CoverageRule,
  DEFAULT_COVERAGE_RULES,
} from './calendarCoverageRules';

export type ValidationSeverity = 'ok' | 'info' | 'warning' | 'error';

export interface DayValidationIssue {
  id: string;
  type: 'missing_coverage' | 'duplicate_assignment' | 'unavailable_professional' | 'incomplete_coverage' | 'other';
  severity: ValidationSeverity;
  message: string;
  professionals?: string[];
  date: string;
}

export interface DayValidationStatus {
  date: string;
  severity: ValidationSeverity;
  issues: DayValidationIssue[];
  hasOverlap: boolean;
  hasWarning: boolean;
  isComplete: boolean;
}

export interface ValidationOptions {
  requireMedicine?: boolean;
  requireNursing?: boolean;
  coverageRules?: CoverageRule[];
  isHoliday?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────

export function normalizeProfessionalKey(value?: string | null): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isWeekday(date: Date): boolean {
  const dow = date.getDay();
  return dow >= 1 && dow <= 5;
}

function toDateStr(date: Date): string {
  return date.toDateString();
}

// ─── Day-level validation ───────────────────────────────────────

interface RawAssignment {
  kind: string;
  type?: string;
  personnelName?: string;
}

function collectDayAssignments(
  dateStr: string,
  guardias: Guardia[] = [],
  libranzas: Libranza[] = [],
  doblas: Dobla[] = [],
  vacaciones: Vacacion[] = []
): { operational: RawAssignment[]; absences: RawAssignment[] } {
  const operational: RawAssignment[] = [];
  const absences: RawAssignment[] = [];

  for (const g of guardias) {
    if (g.date.toDateString() !== dateStr) continue;
    operational.push({ kind: 'guardia', type: g.type, personnelName: g.personnelName });
  }
  for (const l of libranzas) {
    if (l.date.toDateString() !== dateStr) continue;
    operational.push({ kind: 'libranza', type: l.type, personnelName: l.personnelName });
  }
  for (const d of doblas) {
    if (d.date.toDateString() !== dateStr) continue;
    operational.push({ kind: 'dobla', type: d.type, personnelName: d.personnelName });
  }
  for (const v of vacaciones) {
    if (v.date.toDateString() !== dateStr) continue;
    absences.push({ kind: 'vacacion', type: v.type, personnelName: v.personnelName });
  }

  return { operational, absences };
}

// Public: validate a single day
export function validateDay(
  date: Date,
  guardias: Guardia[] = [],
  libranzas: Libranza[] = [],
  doblas: Dobla[] = [],
  vacaciones: Vacacion[] = [],
  meetings: Meeting[] = [],
  options: ValidationOptions = {}
): DayValidationStatus {
  const dateStr = toDateStr(date);
  const issues: DayValidationIssue[] = [];

  const { operational, absences } = collectDayAssignments(dateStr, guardias, libranzas, doblas, vacaciones);
  const hasOps = operational.length > 0;
  const hasAbsence = absences.length > 0;
  const weekday = isWeekday(date);
  const hasMeeting = meetings.some(m => toDateStr(m.date) === dateStr);
  const isHoliday = options.isHoliday ?? false;

  // A) Missing coverage — weekday with zero operational assignments
  if (weekday && !hasOps) {
    issues.push({
      id: `missing-${dateStr}`,
      type: 'missing_coverage',
      severity: 'warning',
      message: 'Día sin asignaciones registradas',
      date: dateStr,
    });
  }

  // B) Duplicate professional — same person in different operational kinds
  const byPerson: Record<string, RawAssignment[]> = {};
  for (const a of operational) {
    if (!a.personnelName) continue;
    const key = normalizeProfessionalKey(a.personnelName);
    if (!key) continue;
    if (!byPerson[key]) byPerson[key] = [];
    byPerson[key].push(a);
  }

  for (const [_key, assigns] of Object.entries(byPerson)) {
    const uniqueKinds = new Set(assigns.map(a => a.kind));
    if (uniqueKinds.size > 1) {
      const name = assigns[0]?.personnelName || _key;
      const kindList = Array.from(uniqueKinds).join(', ');
      issues.push({
        id: `dup-${_key}-${dateStr}`,
        type: 'duplicate_assignment',
        severity: 'error',
        message: `${name} asignado en roles incompatibles (${kindList})`,
        professionals: [name],
        date: dateStr,
      });
    }
  }

  // C) Professional assigned while on vacation / absence
  for (const vac of absences) {
    if (!vac.personnelName) continue;
    const vacKey = normalizeProfessionalKey(vac.personnelName);
    if (!vacKey) continue;

    const hasOverlap = operational.some(
      op => op.personnelName && normalizeProfessionalKey(op.personnelName) === vacKey
    );

    if (hasOverlap) {
      issues.push({
        id: `unavail-${vacKey}-${dateStr}`,
        type: 'unavailable_professional',
        severity: 'error',
        message: `${vac.personnelName} asignado figurando como ausente`,
        professionals: [vac.personnelName],
        date: dateStr,
      });
    }
  }

  // D) Incomplete coverage (legacy option, kept for backward compatibility)
  if (options.requireMedicine || options.requireNursing) {
    const hasMedicine = operational.some(
      a => a.type === 'medica' && a.personnelName && normalizeProfessionalKey(a.personnelName)
    );
    const hasNursing = operational.some(
      a => a.type === 'enfermeria' && a.personnelName && normalizeProfessionalKey(a.personnelName)
    );

    if (weekday && hasOps) {
      if (options.requireMedicine && !hasMedicine) {
        issues.push({
          id: `incomplete-med-${dateStr}`,
          type: 'incomplete_coverage',
          severity: 'warning',
          message: 'Sin cobertura de Medicina',
          date: dateStr,
        });
      }
      if (options.requireNursing && !hasNursing) {
        issues.push({
          id: `incomplete-nur-${dateStr}`,
          type: 'incomplete_coverage',
          severity: 'warning',
          message: 'Sin cobertura de Enfermería',
          date: dateStr,
        });
      }
    }
  }

  // E) Configurable coverage rules
  const rules = options.coverageRules || DEFAULT_COVERAGE_RULES;
  const coverageIssues = evaluateCoverageRules(
    date,
    guardias,
    libranzas,
    doblas,
    vacaciones,
    isHoliday,
    issues,
    rules
  );
  issues.push(...coverageIssues);

  // Determine overall severity
  const hasError = issues.some(i => i.severity === 'error');
  const hasWarning = issues.some(i => i.severity === 'warning');
  // eslint-disable-next-line no-nested-ternary
  const severity: ValidationSeverity = hasError
    ? 'error'
    : hasWarning
    ? 'warning'
    : 'ok';

  return {
    date: dateStr,
    severity,
    issues,
    hasOverlap: hasError,
    hasWarning,
    isComplete: severity === 'ok',
  };
}

// Public: validate every day of a month
export function validateMonth(
  month: Date,
  guardias: Guardia[] = [],
  libranzas: Libranza[] = [],
  doblas: Dobla[] = [],
  vacaciones: Vacacion[] = [],
  meetings: Meeting[] = [],
  options: ValidationOptions = {}
): DayValidationStatus[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const totalDays = new Date(year, m + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(year, m, i + 1);
    return validateDay(date, guardias, libranzas, doblas, vacaciones, meetings, options);
  });
}

// Public: aggregate summary for StatusSummary
export function getMonthValidationSummary(validations: DayValidationStatus[]) {
  const ok = validations.filter(v => v.severity === 'ok').length;
  const warnings = validations.filter(v => v.severity === 'warning').length;
  const errors = validations.filter(v => v.severity === 'error').length;
  const missingCoverage = validations.filter(v =>
    v.issues.some(i => i.type === 'missing_coverage')
  ).length;
  const duplicates = validations.filter(v =>
    v.issues.some(i => i.type === 'duplicate_assignment')
  ).length;
  const unavailable = validations.filter(v =>
    v.issues.some(i => i.type === 'unavailable_professional')
  ).length;

  return { total: validations.length, ok, warnings, errors, missingCoverage, duplicates, unavailable };
}