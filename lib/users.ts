import type { UserRole } from '../types';

export interface LocalUser {
  id: string;
  name: string;
  role: UserRole;
  category: 'Medicina' | 'Enfermería' | 'Administrativos';
  pin: string;
}

export const USERS: LocalUser[] = [
  // Enfermería
  { id: 'xelo', name: 'Xelo García', role: 'Coordinador', category: 'Enfermería', pin: '666666' },
  { id: 'yolanda_lainez', name: 'Yolanda Lainez', role: 'Enfermera', category: 'Enfermería', pin: '111111' },
  { id: 'maite', name: 'Maite Beltrán', role: 'Enfermera', category: 'Enfermería', pin: '222222' },
  { id: 'yolanda_garcia', name: 'Yolanda García', role: 'Enfermera', category: 'Enfermería', pin: '333333' },
  { id: 'rosa', name: 'Rosa Carbó', role: 'Enfermera', category: 'Enfermería', pin: '444444' },
];

export const CATEGORIES: Array<{ id: string; label: string; icon: string }> = [
  { id: 'Enfermería', label: 'Enfermería', icon: 'medical_services' },
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
