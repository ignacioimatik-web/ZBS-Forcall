
export enum MeetingType {
  TEAM = 'Reunión de Equipo',
  MEDICINE = 'Reunión Medicina',
  NURSING = 'Reunión Enfermería',
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

export type UserRole = 'Administrador' | 'Coordinador' | 'Médico' | 'Enfermera';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; 
  role: UserRole;
  avatarUrl?: string;
  is2FAEnabled: boolean;
}

export type PersonnelType = 'Médica' | 'Enfermería';

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
}

export interface Dobla {
  id: string;
  date: Date;
  time?: string;
  type: PersonnelType;
  personnelName: string;
  isChange?: boolean;
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
