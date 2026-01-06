export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          module_name: string | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module_name?: string | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          module_name?: string | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_events: {
        Row: {
          animal_id: string
          created_at: string
          created_by: string | null
          details: Json | null
          event_date: string
          event_type: string
          id: string
          notes: string | null
          organization_id: string
          weight: number | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          event_date?: string
          event_type: string
          id?: string
          notes?: string | null
          organization_id: string
          weight?: number | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          event_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          organization_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_lots: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_lots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          birth_date: string | null
          breed: string | null
          category: Database["public"]["Enums"]["animal_category"]
          color: string | null
          created_at: string
          current_weight: number | null
          entry_date: string | null
          expected_calving_date: string | null
          father_id: string | null
          first_calving_date: string | null
          id: string
          last_calving_date: string | null
          last_service_date: string | null
          last_weight_date: string | null
          lot_name: string | null
          mother_id: string | null
          name: string | null
          notes: string | null
          organization_id: string
          origin: string | null
          purchase_date: string | null
          purchase_price: number | null
          reproductive_status: string | null
          rfid_tag: string | null
          sex: Database["public"]["Enums"]["animal_sex"]
          status: Database["public"]["Enums"]["animal_status"]
          status_date: string | null
          status_reason: string | null
          tag_id: string
          total_calvings: number | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          category: Database["public"]["Enums"]["animal_category"]
          color?: string | null
          created_at?: string
          current_weight?: number | null
          entry_date?: string | null
          expected_calving_date?: string | null
          father_id?: string | null
          first_calving_date?: string | null
          id?: string
          last_calving_date?: string | null
          last_service_date?: string | null
          last_weight_date?: string | null
          lot_name?: string | null
          mother_id?: string | null
          name?: string | null
          notes?: string | null
          organization_id: string
          origin?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          reproductive_status?: string | null
          rfid_tag?: string | null
          sex: Database["public"]["Enums"]["animal_sex"]
          status?: Database["public"]["Enums"]["animal_status"]
          status_date?: string | null
          status_reason?: string | null
          tag_id: string
          total_calvings?: number | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          category?: Database["public"]["Enums"]["animal_category"]
          color?: string | null
          created_at?: string
          current_weight?: number | null
          entry_date?: string | null
          expected_calving_date?: string | null
          father_id?: string | null
          first_calving_date?: string | null
          id?: string
          last_calving_date?: string | null
          last_service_date?: string | null
          last_weight_date?: string | null
          lot_name?: string | null
          mother_id?: string | null
          name?: string | null
          notes?: string | null
          organization_id?: string
          origin?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          reproductive_status?: string | null
          rfid_tag?: string | null
          sex?: Database["public"]["Enums"]["animal_sex"]
          status?: Database["public"]["Enums"]["animal_status"]
          status_date?: string | null
          status_reason?: string | null
          tag_id?: string
          total_calvings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "animals_father_id_fkey"
            columns: ["father_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_mother_id_fkey"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      milk_production: {
        Row: {
          afternoon_liters: number | null
          animal_id: string
          created_at: string
          created_by: string | null
          evening_liters: number | null
          fat_percentage: number | null
          id: string
          morning_liters: number | null
          notes: string | null
          organization_id: string
          production_date: string
          protein_percentage: number | null
          somatic_cell_count: number | null
          total_liters: number | null
        }
        Insert: {
          afternoon_liters?: number | null
          animal_id: string
          created_at?: string
          created_by?: string | null
          evening_liters?: number | null
          fat_percentage?: number | null
          id?: string
          morning_liters?: number | null
          notes?: string | null
          organization_id: string
          production_date?: string
          protein_percentage?: number | null
          somatic_cell_count?: number | null
          total_liters?: number | null
        }
        Update: {
          afternoon_liters?: number | null
          animal_id?: string
          created_at?: string
          created_by?: string | null
          evening_liters?: number | null
          fat_percentage?: number | null
          id?: string
          morning_liters?: number | null
          notes?: string | null
          organization_id?: string
          production_date?: string
          protein_percentage?: number | null
          somatic_cell_count?: number | null
          total_liters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "milk_production_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string
          farm_name: string | null
          full_name: string | null
          id: string
          is_blocked: boolean | null
          last_login: string | null
          organization_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          farm_name?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_login?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          farm_name?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_login?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reproductive_events: {
        Row: {
          animal_id: string
          birth_type: string | null
          bull_id: string | null
          calf_id: string | null
          calf_sex: string | null
          calf_weight: number | null
          created_at: string
          created_by: string | null
          estimated_gestation_days: number | null
          event_date: string
          event_type: string
          expected_birth_date: string | null
          id: string
          notes: string | null
          organization_id: string
          pregnancy_result: string | null
          semen_batch: string | null
          technician: string | null
        }
        Insert: {
          animal_id: string
          birth_type?: string | null
          bull_id?: string | null
          calf_id?: string | null
          calf_sex?: string | null
          calf_weight?: number | null
          created_at?: string
          created_by?: string | null
          estimated_gestation_days?: number | null
          event_date?: string
          event_type: string
          expected_birth_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          pregnancy_result?: string | null
          semen_batch?: string | null
          technician?: string | null
        }
        Update: {
          animal_id?: string
          birth_type?: string | null
          bull_id?: string | null
          calf_id?: string | null
          calf_sex?: string | null
          calf_weight?: number | null
          created_at?: string
          created_by?: string | null
          estimated_gestation_days?: number | null
          event_date?: string
          event_type?: string
          expected_birth_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          pregnancy_result?: string | null
          semen_batch?: string | null
          technician?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reproductive_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reproductive_events_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reproductive_events_calf_id_fkey"
            columns: ["calf_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reproductive_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          module_name: string
          organization_id: string | null
          permission: Database["public"]["Enums"]["permission_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_name: string
          organization_id?: string | null
          permission: Database["public"]["Enums"]["permission_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_name?: string
          organization_id?: string | null
          permission?: Database["public"]["Enums"]["permission_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_records: {
        Row: {
          animal_id: string
          condition_score: number | null
          created_at: string
          created_by: string | null
          daily_gain: number | null
          id: string
          notes: string | null
          organization_id: string
          weight_date: string
          weight_kg: number
          weight_type: string
        }
        Insert: {
          animal_id: string
          condition_score?: number | null
          created_at?: string
          created_by?: string | null
          daily_gain?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          weight_date?: string
          weight_kg: number
          weight_type?: string
        }
        Update: {
          animal_id?: string
          condition_score?: number | null
          created_at?: string
          created_by?: string | null
          daily_gain?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          weight_date?: string
          weight_kg?: number
          weight_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "weight_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      log_activity: {
        Args: { p_action: string; p_details?: Json; p_module_name?: string }
        Returns: string
      }
    }
    Enums: {
      animal_category:
        | "vaca"
        | "toro"
        | "novilla"
        | "novillo"
        | "ternera"
        | "ternero"
        | "becerra"
        | "becerro"
      animal_sex: "macho" | "hembra"
      animal_status:
        | "activo"
        | "vendido"
        | "muerto"
        | "descartado"
        | "trasladado"
      app_role: "admin" | "ganadero" | "tecnico" | "veterinario"
      permission_type: "read" | "write" | "delete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      animal_category: [
        "vaca",
        "toro",
        "novilla",
        "novillo",
        "ternera",
        "ternero",
        "becerra",
        "becerro",
      ],
      animal_sex: ["macho", "hembra"],
      animal_status: [
        "activo",
        "vendido",
        "muerto",
        "descartado",
        "trasladado",
      ],
      app_role: ["admin", "ganadero", "tecnico", "veterinario"],
      permission_type: ["read", "write", "delete"],
    },
  },
} as const
