import type { UserRole } from '../types';

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  category: 'Medicina' | 'enfermeria' | 'Administrativos';
}

export const USERS: LocalUser[] = [
  // Medicina
  { id: 'elena', name: 'Elena Benages', email: 'elena.zbsforcall@gmail.com', role: 'Coordinador', category: 'Medicina' },
  { id: 'delia', name: 'Delia Mestre', email: 'delia.zbsforcall@gmail.com', role: 'Medico', category: 'Medicina' },
  { id: 'fran', name: 'Frank Castillo', email: 'fran.zbsforcall@gmail.com', role: 'Medico', category: 'Medicina' },
  { id: 'fernando', name: 'Fernando Sierra', email: 'fernando.zbsforcall@gmail.com', role: 'Medico', category: 'Medicina' },
  { id: 'jorge', name: 'Jorge Ramón', email: 'jorge.zbsforcall@gmail.com', role: 'Medico', category: 'Medicina' },
  { id: 'ilie', name: 'Ilie Popov', email: 'ilie.zbsforcall@gmail.com', role: 'Medico', category: 'Medicina' },
  { id: 'externo_med', name: 'Externo/a Medicina', email: 'externo_med.zbsforcall@gmail.com', role: 'Medico', category: 'Medicina' },
  // enfermeria
  { id: 'xelo', name: 'Xelo García', email: 'xelo.zbsforcall@gmail.com', role: 'Coordinador', category: 'enfermeria' },
  { id: 'yolanda_lainez', name: 'Yolanda Lainez', email: 'yolanda_lainez.zbsforcall@gmail.com', role: 'enfermera', category: 'enfermeria' },
  { id: 'maite', name: 'Maite Beltrán', email: 'maite.zbsforcall@gmail.com', role: 'enfermera', category: 'enfermeria' },
  { id: 'yolanda_garcia', name: 'Yolanda García', email: 'yolanda_garcia.zbsforcall@gmail.com', role: 'enfermera', category: 'enfermeria' },
  { id: 'rosa', name: 'Rosa Carbó', email: 'rosa.zbsforcall@gmail.com', role: 'enfermera', category: 'enfermeria' },
  { id: 'externo_enf', name: 'Externo/a Enfermeria', email: 'externo_enf.zbsforcall@gmail.com', role: 'enfermera', category: 'enfermeria' },
  // Administrativos
  { id: 'joan', name: 'Joan', email: 'joan.zbsforcall@gmail.com', role: 'Administrador', category: 'Administrativos' },
];

export const CATEGORIES: Array<{ id: string; label: string; icon: string }> = [
  { id: 'Medicina', label: 'Medicina', icon: 'stethoscope' },
  { id: 'enfermeria', label: 'Enfermeria', icon: 'medical_services' },
  { id: 'Administrativos', label: 'Administrativos', icon: 'admin_panel_settings' },
];

export function getUsersByCategory(category: string): LocalUser[] {
  return USERS.filter(u => u.category === category);
}
