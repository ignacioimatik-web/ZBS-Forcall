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
  { id: 'elena', name: 'Elena Benages', role: 'Médico', category: 'Medicina', pin: '1019' },
  { id: 'fernando', name: 'Fernando Sierra', role: 'Médico', category: 'Medicina', pin: '2222' },
  { id: 'frank', name: 'Frank Castillo', role: 'Médico', category: 'Medicina', pin: '1111' },
  // Enfermería
  { id: 'chelo', name: 'Xelo Carbó', role: 'Enfermera', category: 'Enfermería', pin: '0000' },
  // Administrativos (vacío por ahora)
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
