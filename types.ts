import type { AppRole } from './lib/database.types';

export enum MeetingType {
  TEAM = 'Reunión de Equipo',
  MEDICINE = 'Reunión Medicina',
  NURSING = 'Reunión Enfermeria',
  CLINICAL = 'Sesión Clínica',
  WORKSHOP = 'Taller',
  OTHER = 'Otros'
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  date: Date;
  time?: string; 
  speaker?: string; 
  location?: string;
  description?: string;
  isConfirmed: boolean;
  presentationUrl?: string; 
  summary?: string; 
  proposals?: Comment[]; 
  isCancelled?: boolean;
  cancellationReason?: string;
}

// Mapeo de roles UI heredados a nuevos roles Supabase
export type UserRole = 'Administrador' | 'Coordinador' | 'Medico' | 'enfermera';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; 
  role: UserRole;
  avatarUrl?: string;
  is2FAEnabled: boolean;
  staffGroup?: 'medico' | 'enfermeria' | null;
}

// Nuevos tipos Supabase
export type { AppRole };

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  staff_group: 'medico' | 'enfermeria' | null;
  is_active: boolean;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Helper para convertir de AppRole a UserRole legacy
export function appRoleToUserRole(appRole: AppRole): UserRole {
  switch (appRole) {
    case 'admin':
      return 'Administrador';
    case 'coordinador_medico':
    case 'coordinadora_enfermeria':
      return 'Coordinador';
    case 'medico':
      return 'Medico';
    case 'enfermera':
      return 'enfermera';
    default:
      return 'Medico';
  }
}

// Helper para convertir de UserRole legacy a AppRole
export function userRoleToAppRole(userRole: UserRole, isNursing: boolean = false): AppRole {
  switch (userRole) {
    case 'Administrador':
      return 'admin';
    case 'Coordinador':
      return isNursing ? 'coordinadora_enfermeria' : 'coordinador_medico';
    case 'Medico':
      return 'medico';
    case 'enfermera':
      return 'enfermera';
    default:
      return 'medico';
  }
}

export type PersonnelType = 'medica' | 'enfermeria';

export interface Guardia {
  id: string;
  date: Date;
  time?: string; 
  type: PersonnelType;
  personnelName: string;
  isChange?: boolean;
  modifiedBy?: string;
  modifiedAt?: Date;
}

export interface Libranza {
  id: string;
  date: Date;
  type: PersonnelType;
  personnelName: string;
  isChange?: boolean;
  modifiedBy?: string;
  modifiedAt?: Date;
}

export interface Dobla {
  id: string;
  date: Date;
  time?: string;
  type: PersonnelType;
  personnelName: string;
  isChange?: boolean;
  modifiedBy?: string;
  modifiedAt?: Date;
}

export interface Vacacion {
  id: string;
  date: Date;
  type: PersonnelType;
  personnelName: string;
  isChange?: boolean;
  modifiedBy?: string;
  modifiedAt?: Date;
}

export interface ManualHoliday {
  id: string;
  date: Date;
  name: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isUrgent?: boolean;
}

export interface AuditLog {
  id: string;
  type: 'VALIDACION' | 'CAMBIO' | 'PERMUTA';
  user: string;
  timestamp: Date;
  description: string;
  category: string;
  details?: {
    from: string;
    to: string;
    date1: Date;
    date2: Date;
  };
}

