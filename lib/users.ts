import type { UserRole } from '../types';

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  category: 'Medicina' | 'Enfermería' | 'Administrativos';
  pin: string;
}

export const USERS: LocalUser[] = [
  // Medicina
  { id: 'elena', name: 'Elena Benages', email: 'elena.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '0000' },
  { id: 'fernando', name: 'Fernando Sierra', email: 'fernando.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '1111' },
  { id: 'frank', name: 'Frank Castillo', email: 'frank.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '1111' },
  { id: 'jorge', name: 'Jorge', email: 'jorge.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '1111' },
  { id: 'ilie', name: 'Ilie Popov', email: 'ilie.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '1111' },
  // Enfermería
  { id: 'chelo', name: 'Xelo Carbó', email: 'chelo.zbsforcall@gmail.com', role: 'Enfermera', category: 'Enfermería', pin: '0000' },
  { id: 'rosa', name: 'Rosa Carbó', email: 'rosa.zbsforcall@gmail.com', role: 'Enfermera', category: 'Enfermería', pin: '1111' },
  { id: 'delia', name: 'Delia', email: 'delia.zbsforcall@gmail.com', role: 'Enfermera', category: 'Enfermería', pin: '1111' },
  // Administrativos
  { id: 'joan', name: 'Joan', email: 'joan.zbsforcall@gmail.com', role: 'Administrador', category: 'Administrativos', pin: '1111' },
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
