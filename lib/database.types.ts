// Tipos de base de datos generados por Supabase
// Para regenerar: supabase gen types typescript --local > lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole = 
  | 'admin'
  | 'coordinador_medico'
  | 'coordinadora_enfermeria'
  | 'medico'
  | 'enfermera';

export type StaffGroup = 'medico' | 'enfermeria';

export type AlertaSeverity = 'info' | 'warning' | 'critical';

export type AuditAction = 'VALIDACION' | 'CAMBIO' | 'PERMUTA' | 'CREACION' | 'ELIMINACION';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: AppRole;
          staff_group: StaffGroup | null;
          is_active: boolean;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: AppRole;
          is_active?: boolean;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: AppRole;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
      };
      guardias: {
        Row: {
          id: string;
          date: string;
          personnel_user_id: string | null;
          personnel_name: string;
          type: 'Médica' | 'Enfermería';
          is_change: boolean;
          modified_by: string | null;
          modified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          personnel_user_id?: string | null;
          personnel_name: string;
          type: 'Médica' | 'Enfermería';
          is_change?: boolean;
          modified_by?: string | null;
          modified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          personnel_user_id?: string | null;
          personnel_name?: string;
          type?: 'Médica' | 'Enfermería';
          is_change?: boolean;
          modified_by?: string | null;
          modified_at?: string | null;
          updated_at?: string;
        };
      };
      libranzas: {
        Row: {
          id: string;
          date: string;
          personnel_user_id: string | null;
          personnel_name: string;
          type: 'Médica' | 'Enfermería';
          is_change: boolean;
          modified_by: string | null;
          modified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          personnel_user_id?: string | null;
          personnel_name: string;
          type: 'Médica' | 'Enfermería';
          is_change?: boolean;
          modified_by?: string | null;
          modified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          personnel_user_id?: string | null;
          personnel_name?: string;
          type?: 'Médica' | 'Enfermería';
          is_change?: boolean;
          modified_by?: string | null;
          modified_at?: string | null;
          updated_at?: string;
        };
      };
      doblas: {
        Row: {
          id: string;
          date: string;
          personnel_user_id: string | null;
          personnel_name: string;
          type: 'Médica' | 'Enfermería';
          is_change: boolean;
          modified_by: string | null;
          modified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          personnel_user_id?: string | null;
          personnel_name: string;
          type: 'Médica' | 'Enfermería';
          is_change?: boolean;
          modified_by?: string | null;
          modified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          personnel_user_id?: string | null;
          personnel_name?: string;
          type?: 'Médica' | 'Enfermería';
          is_change?: boolean;
          modified_by?: string | null;
          modified_at?: string | null;
          updated_at?: string;
        };
      };
      meetings: {
        Row: {
          id: string;
          title: string;
          type: string;
          description: string | null;
          date: string;
          time: string | null;
          location: string | null;
          speaker: string | null;
          author_user_id: string | null;
          author_name: string | null;
          target_group: string | null;
          is_confirmed: boolean;
          is_cancelled: boolean;
          cancellation_reason: string | null;
          presentation_url: string | null;
          summary: string | null;
          proposals: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type: string;
          description?: string | null;
          date: string;
          time?: string | null;
          location?: string | null;
          speaker?: string | null;
          author_user_id?: string | null;
          author_name?: string | null;
          target_group?: string | null;
          is_confirmed?: boolean;
          is_cancelled?: boolean;
          cancellation_reason?: string | null;
          presentation_url?: string | null;
          summary?: string | null;
          proposals?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          type?: string;
          description?: string | null;
          date?: string;
          time?: string | null;
          location?: string | null;
          speaker?: string | null;
          author_user_id?: string | null;
          author_name?: string | null;
          target_group?: string | null;
          is_confirmed?: boolean;
          is_cancelled?: boolean;
          cancellation_reason?: string | null;
          presentation_url?: string | null;
          summary?: string | null;
          proposals?: Json;
          updated_at?: string;
        };
      };
      calendarios: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          config?: Json;
          updated_at?: string;
        };
      };
      manual_holidays: {
        Row: {
          id: string;
          date: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          name?: string;
        };
      };
      alertas: {
        Row: {
          id: string;
          title: string;
          content: string;
          severity: AlertaSeverity;
          source: string | null;
          published_at: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          severity?: AlertaSeverity;
          source?: string | null;
          published_at?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          severity?: AlertaSeverity;
          source?: string | null;
          published_at?: string;
        };
      };
      avisos: {
        Row: {
          id: string;
          channel: string;
          sender_user_id: string | null;
          sender_name: string;
          text: string;
          is_urgent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel?: string;
          sender_user_id?: string | null;
          sender_name: string;
          text: string;
          is_urgent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel?: string;
          sender_name?: string;
          text?: string;
          is_urgent?: boolean;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          actor_name: string | null;
          entity_type: string;
          entity_id: string | null;
          action: AuditAction;
          description: string;
          category: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          actor_name?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: AuditAction;
          description: string;
          category?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string | null;
          action?: AuditAction;
          description?: string;
          category?: string | null;
          payload?: Json;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_app_role: {
        Args: Record<PropertyKey, never>;
        Returns: AppRole;
      };
      current_staff_group: {
        Args: Record<PropertyKey, never>;
        Returns: StaffGroup;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      can_manage_medical_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      can_manage_nursing_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      belongs_to_current_user: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
      staff_group: StaffGroup;
      alerta_severity: AlertaSeverity;
      audit_action: AuditAction;
    };
  };
}
