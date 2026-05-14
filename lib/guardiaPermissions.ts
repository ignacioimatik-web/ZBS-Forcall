import type { Guardia, User } from '../types';

export type GuardiaCategory = 'Medicina' | 'enfermeria';

const normalize = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const matchesAny = (user: User | null, values: string[]) => {
  if (!user) return false;

  const candidates = [
    normalize(user.id || ''),
    normalize(user.name || ''),
    normalize(user.email || '')
  ];
  return values.some((value) => candidates.includes(normalize(value)));
};

export function isMedicineCoordinator(user: User | null) {
  if (!user) return false;
  if (matchesAny(user, ['elena', 'elena benages'])) return true;
  if (user.role === 'Coordinador' && (!user.staffGroup || user.staffGroup === 'medico')) return true;
  return false;
}

export function isNursingCoordinator(user: User | null) {
  if (!user) return false;
  if (matchesAny(user, ['xelo', 'xelo garcia', 'xelo garcía'])) return true;
  if (user.role === 'Coordinador' && (!user.staffGroup || user.staffGroup === 'enfermeria')) return true;
  return false;
}

export function isNursingPlanner(user: User | null) {
  if (!user) return false;
  if (matchesAny(user, ['xelo', 'xelo garcia', 'xelo garcía'])) return true;
  if (user.role === 'Coordinador' && (!user.staffGroup || user.staffGroup === 'enfermeria')) return true;
  return false;
}

export function canManageGuardiaCategory(user: User | null, category: GuardiaCategory) {
  if (category === 'Medicina') return isMedicineCoordinator(user);
  return isNursingCoordinator(user);
}

export function canManageGuardiaType(user: User | null, type: Guardia['type']) {
  if (type === 'medica') return isMedicineCoordinator(user);
  return isNursingCoordinator(user);
}

export function canManagePlanningType(user: User | null, type: Guardia['type']) {
  if (type === 'medica') return isMedicineCoordinator(user);
  return isNursingPlanner(user);
}

export function getGuardiaPermissionMessage(type: Guardia['type'], t?: (path: string, fallback?: string) => string) {
  return type === 'medica'
    ? t ? t('permissions.onlyElenaMedicina', 'Solo Elena Benages puede añadir o quitar guardias de Medicina.') : 'Solo Elena Benages puede añadir o quitar guardias de Medicina.'
    : t ? t('permissions.onlyXeloEnfermeria', 'Solo Xelo García puede añadir o quitar guardias de Enfermeria.') : 'Solo Xelo García puede añadir o quitar guardias de Enfermeria.';
}

export function canManageVacaciones(user: User | null, type: 'medica' | 'enfermeria') {
  if (type === 'medica') return isMedicineCoordinator(user);
  return isNursingCoordinator(user);
}

export function getPlanningPermissionMessage(type: Guardia['type'], t?: (path: string, fallback?: string) => string) {
  return type === 'medica'
    ? t ? t('permissions.elenaPlanningMedicina', 'Solo Elena Benages puede gestionar libranzas y refuerzo de Medicina.') : 'Solo Elena Benages puede gestionar libranzas y refuerzo de Medicina.'
    : t ? t('permissions.xeloPlanningEnfermeria', 'Solo Xelo García puede gestionar libranzas y refuerzo de Enfermeria.') : 'Solo Xelo García puede gestionar libranzas y refuerzo de Enfermeria.';
}