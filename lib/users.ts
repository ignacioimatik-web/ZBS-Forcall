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
  { id: 'elena', name: 'Elena Benages', email: 'elena.zbsforcall@gmail.com', role: 'Coordinador', category: 'Medicina', pin: '663880' },
  { id: 'delia', name: 'Delia Mestre', email: 'delia.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '777777' },
  { id: 'fran', name: 'Fran Castillo', email: 'fran.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '888888' },
  { id: 'fernando', name: 'Fernando Sierra', email: 'fernando.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '147852' },
  { id: 'jorge', name: 'Jorge Ramón', email: 'jorge.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '258963' },
  { id: 'ilie', name: 'Ilie Popov', email: 'ilie.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '258525' },
  { id: 'externo_med', name: 'Externo/a', email: 'externo_med.zbsforcall@gmail.com', role: 'Médico', category: 'Medicina', pin: '147414' },
  // Enfermería
  { id: 'xelo', name: 'Xelo García', email: 'xelo.zbsforcall@gmail.com', role: 'Coordinador', category: 'Enfermería', pin: '666666' },
  { id: 'yolanda_lainez', name: 'Yolanda Lainez', email: 'yolanda_lainez.zbsforcall@gmail.com', role: 'Enfermera', category: 'Enfermería', pin: '111111' },
  { id: 'maite', name: 'Maite Beltrán', email: 'maite.zbsforcall@gmail.com', role: 'Enfermera', category: 'Enfermería', pin: '222222' },
  { id: 'yolanda_garcia', name: 'Yolanda García', email: 'yolanda_garcia.zbsforcall@gmail.com', role: 'Enfermera', category: 'Enfermería', pin: '333333' },
  { id: 'rosa', name: 'Rosa Carbó', email: 'rosa.zbsforcall@gmail.com', role: 'Enfermera', category: 'Enfermería', pin: '444444' },
  { id: 'externo_enf', name: 'Externo/a', email: 'externo_enf.zbsforcall@gmail.com', role: 'Enfermera', category: 'Enfermería', pin: '369636' },
  // Administrativos
  { id: 'joan', name: 'Joan', email: 'joan.zbsforcall@gmail.com', role: 'Administrador', category: 'Administrativos', pin: '999999' },
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
