import type { Guardia, User } from '../types';

export type GuardiaCategory = 'Medicina' | 'Enfermería';

const normalize = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const matchesAny = (user: User | null, values: string[]) => {
  if (!user) return false;

  const candidates = [normalize(user.id), normalize(user.name), normalize(user.email)];
  return values.some((value) => candidates.includes(normalize(value)));
};

export function isMedicineCoordinator(user: User | null) {
  return matchesAny(user, ['elena', 'elena benages']);
}

export function isNursingCoordinator(user: User | null) {
  return matchesAny(user, ['chelo', 'xelo', 'xelo carbo', 'xelo carbó']);
}

export function isNursingPlanner(user: User | null) {
  return matchesAny(user, ['chelo', 'xelo', 'xelo carbo', 'xelo carbó']);
}

export function canManageGuardiaCategory(user: User | null, category: GuardiaCategory) {
  if (category === 'Medicina') return isMedicineCoordinator(user);
  return isNursingCoordinator(user);
}

export function canManageGuardiaType(user: User | null, type: Guardia['type']) {
  if (type === 'Médica') return isMedicineCoordinator(user);
  return isNursingCoordinator(user);
}

export function canManagePlanningType(user: User | null, type: Guardia['type']) {
  if (type === 'Médica') return isMedicineCoordinator(user);
  return isNursingPlanner(user);
}

export function getGuardiaPermissionMessage(type: Guardia['type']) {
  return type === 'Médica'
    ? 'Solo Elena Benages puede añadir o quitar guardias de Medicina.'
    : 'Solo Xelo Carbó puede añadir o quitar guardias de Enfermería.';
}

export function getPlanningPermissionMessage(type: Guardia['type']) {
  return type === 'Médica'
    ? 'Solo Elena Benages puede gestionar libranzas y refuerzo de Medicina.'
    : 'Solo Xelo Carbó puede gestionar libranzas y refuerzo de Enfermería.';
}