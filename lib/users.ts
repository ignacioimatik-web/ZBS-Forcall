import type { UserRole } from '../types';

export interface LocalUser {
  id: string;
  name: string;
  role: UserRole;
  category: 'Medicina' | 'Enfermería' | 'Administrativos';
  pin: string;
}

export const USERS: LocalUser[] = [
  // Medicina
  { id: 'elena', name: 'Elena Benages', role: 'Médico', category: 'Medicina', pin: '663880' },
  { id: 'fernando', name: 'Fernando Sierra', role: 'Médico', category: 'Medicina', pin: '111111' },
  { id: 'frank', name: 'Frank Castillo', role: 'Médico', category: 'Medicina', pin: '222222' },
  { id: 'jorge', name: 'Jorge', role: 'Médico', category: 'Medicina', pin: '333333' },
  { id: 'ilie', name: 'Ilie Popov', role: 'Médico', category: 'Medicina', pin: '555555' },
  // Enfermería
  { id: 'chelo', name: 'Xelo Carbó', role: 'Enfermera', category: 'Enfermería', pin: '666666' },
  { id: 'rosa', name: 'Rosa Carbó', role: 'Enfermera', category: 'Enfermería', pin: '777777' },
  { id: 'delia', name: 'Delia', role: 'Enfermera', category: 'Enfermería', pin: '444444' },
  // Administrativos
  { id: 'joan', name: 'Joan', role: 'Administrador', category: 'Administrativos', pin: '5555' },
];

export const CATEGORIES: Array<{ id: string; label: string; icon: string }> = [
  { id: 'Medicina', label: 'Medicina', icon: 'stethoscope' },
  { id: 'Enfermería', label: 'Enfermería', icon: 'medical_services' },
  { id: 'Administrativos', label: 'Administrativos', icon: 'admin_panel_settings' },
];

export function getUsersByCategory(category: string): LocalUser[] {
  return USERS.filter(u => u.category === category);
}

export function validateUser(userId: string, pin: string): LocalUser | null {
  const user = USERS.find(u => u.id === userId);
  if (!user) return null;
  if (user.pin !== pin) return null;
  return user;
}
