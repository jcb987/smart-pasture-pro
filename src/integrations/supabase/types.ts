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
      animal_custom_scores: {
        Row: {
          animal_id: string
          boolean_value: boolean | null
          created_at: string
          id: string
          notes: string | null
          numeric_value: number | null
          organization_id: string
          recorded_at: string
          recorded_by: string | null
          score_definition_id: string
          text_value: string | null
        }
        Insert: {
          animal_id: string
          boolean_value?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          numeric_value?: number | null
          organization_id: string
          recorded_at?: string
          recorded_by?: string | null
          score_definition_id: string
          text_value?: string | null
        }
        Update: {
          animal_id?: string
          boolean_value?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          numeric_value?: number | null
          organization_id?: string
          recorded_at?: string
          recorded_by?: string | null
          score_definition_id?: string
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_custom_scores_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_custom_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animal_custom_scores_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "animal_custom_scores_score_definition_id_fkey"
            columns: ["score_definition_id"]
            isOneToOne: false
            referencedRelation: "custom_score_definitions"
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
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          permissions: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          permissions?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          permissions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      birth_delay_config: {
        Row: {
          bovine_gestation_days: number
          buffalo_gestation_days: number
          created_at: string
          id: string
          organization_id: string
          updated_at: string
          urgent_days: number
          warning_days: number
        }
        Insert: {
          bovine_gestation_days?: number
          buffalo_gestation_days?: number
          created_at?: string
          id?: string
          organization_id: string
          updated_at?: string
          urgent_days?: number
          warning_days?: number
        }
        Update: {
          bovine_gestation_days?: number
          buffalo_gestation_days?: number
          created_at?: string
          id?: string
          organization_id?: string
          updated_at?: string
          urgent_days?: number
          warning_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "birth_delay_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_suggestions: {
        Row: {
          bull_name: string | null
          compatibility_score: number | null
          created_at: string
          created_by: string | null
          executed_date: string | null
          expected_improvement: Json | null
          female_id: string
          id: string
          inbreeding_coefficient: number | null
          male_id: string | null
          notes: string | null
          organization_id: string
          priority: number | null
          semen_code: string | null
          status: string | null
          suggested_date: string | null
        }
        Insert: {
          bull_name?: string | null
          compatibility_score?: number | null
          created_at?: string
          created_by?: string | null
          executed_date?: string | null
          expected_improvement?: Json | null
          female_id: string
          id?: string
          inbreeding_coefficient?: number | null
          male_id?: string | null
          notes?: string | null
          organization_id: string
          priority?: number | null
          semen_code?: string | null
          status?: string | null
          suggested_date?: string | null
        }
        Update: {
          bull_name?: string | null
          compatibility_score?: number | null
          created_at?: string
          created_by?: string | null
          executed_date?: string | null
          expected_improvement?: Json | null
          female_id?: string
          id?: string
          inbreeding_coefficient?: number | null
          male_id?: string | null
          notes?: string | null
          organization_id?: string
          priority?: number | null
          semen_code?: string | null
          status?: string | null
          suggested_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "breeding_suggestions_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_suggestions_male_id_fkey"
            columns: ["male_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_score_definitions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_value: number | null
          min_value: number | null
          name: string
          organization_id: string
          scale_labels: Json | null
          score_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_value?: number | null
          min_value?: number | null
          name: string
          organization_id: string
          scale_labels?: Json | null
          score_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_value?: number | null
          min_value?: number | null
          name?: string
          organization_id?: string
          scale_labels?: Json | null
          score_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_score_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_consumption: {
        Row: {
          animal_id: string | null
          consumption_date: string
          cost: number | null
          created_at: string
          created_by: string | null
          feed_id: string
          id: string
          lot_name: string | null
          notes: string | null
          organization_id: string
          quantity_kg: number
        }
        Insert: {
          animal_id?: string | null
          consumption_date?: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          feed_id: string
          id?: string
          lot_name?: string | null
          notes?: string | null
          organization_id: string
          quantity_kg: number
        }
        Update: {
          animal_id?: string | null
          consumption_date?: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          feed_id?: string
          id?: string
          lot_name?: string | null
          notes?: string | null
          organization_id?: string
          quantity_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_consumption_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_consumption_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feed_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_diet_ingredients: {
        Row: {
          created_at: string
          diet_id: string
          feed_id: string
          id: string
          quantity_kg: number
        }
        Insert: {
          created_at?: string
          diet_id: string
          feed_id: string
          id?: string
          quantity_kg: number
        }
        Update: {
          created_at?: string
          diet_id?: string
          feed_id?: string
          id?: string
          quantity_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_diet_ingredients_diet_id_fkey"
            columns: ["diet_id"]
            isOneToOne: false
            referencedRelation: "feed_diets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_diet_ingredients_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feed_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_diets: {
        Row: {
          created_at: string
          created_by: string | null
          daily_cost: number | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          organization_id: string
          target_dry_matter: number | null
          target_energy: number | null
          target_fdn: number | null
          target_group: string | null
          target_lot: string | null
          target_protein: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          daily_cost?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          organization_id: string
          target_dry_matter?: number | null
          target_energy?: number | null
          target_fdn?: number | null
          target_group?: string | null
          target_lot?: string | null
          target_protein?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          daily_cost?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          organization_id?: string
          target_dry_matter?: number | null
          target_energy?: number | null
          target_fdn?: number | null
          target_group?: string | null
          target_lot?: string | null
          target_protein?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      feed_inventory: {
        Row: {
          category: string
          created_at: string
          current_stock: number | null
          dry_matter_percentage: number | null
          energy_mcal: number | null
          fdn_percentage: number | null
          id: string
          min_stock: number | null
          name: string
          notes: string | null
          organization_id: string
          protein_percentage: number | null
          supplier: string | null
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_stock?: number | null
          dry_matter_percentage?: number | null
          energy_mcal?: number | null
          fdn_percentage?: number | null
          id?: string
          min_stock?: number | null
          name: string
          notes?: string | null
          organization_id: string
          protein_percentage?: number | null
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number | null
          dry_matter_percentage?: number | null
          energy_mcal?: number | null
          fdn_percentage?: number | null
          id?: string
          min_stock?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          protein_percentage?: number | null
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      field_tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string
          priority: string
          related_animal_id: string | null
          related_paddock_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          priority?: string
          related_animal_id?: string | null
          related_paddock_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: string
          related_animal_id?: string | null
          related_paddock_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "field_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "field_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_tasks_related_animal_id_fkey"
            columns: ["related_animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_tasks_related_paddock_id_fkey"
            columns: ["related_paddock_id"]
            isOneToOne: false
            referencedRelation: "paddocks"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_budgets: {
        Row: {
          budgeted_amount: number
          category: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
        }
        Insert: {
          budgeted_amount: number
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          period_end: string
          period_start: string
        }
        Update: {
          budgeted_amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          animal_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lot_name: string | null
          notes: string | null
          organization_id: string
          payment_method: string | null
          reference_number: string | null
          subcategory: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          animal_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lot_name?: string | null
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          reference_number?: string | null
          subcategory?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          animal_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lot_name?: string | null
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          reference_number?: string | null
          subcategory?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      forage_measurements: {
        Row: {
          created_at: string
          created_by: string | null
          dry_matter_percentage: number | null
          forage_kg_per_ha: number | null
          grass_height_cm: number | null
          id: string
          measurement_date: string
          measurement_type: string | null
          notes: string | null
          organization_id: string
          paddock_id: string
          quality_score: number | null
          total_forage_kg: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dry_matter_percentage?: number | null
          forage_kg_per_ha?: number | null
          grass_height_cm?: number | null
          id?: string
          measurement_date?: string
          measurement_type?: string | null
          notes?: string | null
          organization_id: string
          paddock_id: string
          quality_score?: number | null
          total_forage_kg?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dry_matter_percentage?: number | null
          forage_kg_per_ha?: number | null
          grass_height_cm?: number | null
          id?: string
          measurement_date?: string
          measurement_type?: string | null
          notes?: string | null
          organization_id?: string
          paddock_id?: string
          quality_score?: number | null
          total_forage_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forage_measurements_paddock_id_fkey"
            columns: ["paddock_id"]
            isOneToOne: false
            referencedRelation: "paddocks"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_access_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          founder_user_id: string
          id: string
          ip_address: string | null
          target_organization_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          founder_user_id: string
          id?: string
          ip_address?: string | null
          target_organization_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          founder_user_id?: string
          id?: string
          ip_address?: string | null
          target_organization_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_access_logs_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      genetic_evaluations: {
        Row: {
          animal_id: string
          body_conformation_score: number | null
          calving_ease_index: number | null
          created_at: string
          created_by: string | null
          disease_resistance_index: number | null
          evaluation_date: string
          evaluator: string | null
          fertility_index: number | null
          growth_rate_index: number | null
          id: string
          legs_feet_score: number | null
          longevity_index: number | null
          maternal_ability_index: number | null
          meat_production_index: number | null
          milk_production_index: number | null
          notes: string | null
          organization_id: string
          overall_genetic_value: number | null
          reliability_percentage: number | null
          udder_score: number | null
        }
        Insert: {
          animal_id: string
          body_conformation_score?: number | null
          calving_ease_index?: number | null
          created_at?: string
          created_by?: string | null
          disease_resistance_index?: number | null
          evaluation_date?: string
          evaluator?: string | null
          fertility_index?: number | null
          growth_rate_index?: number | null
          id?: string
          legs_feet_score?: number | null
          longevity_index?: number | null
          maternal_ability_index?: number | null
          meat_production_index?: number | null
          milk_production_index?: number | null
          notes?: string | null
          organization_id: string
          overall_genetic_value?: number | null
          reliability_percentage?: number | null
          udder_score?: number | null
        }
        Update: {
          animal_id?: string
          body_conformation_score?: number | null
          calving_ease_index?: number | null
          created_at?: string
          created_by?: string | null
          disease_resistance_index?: number | null
          evaluation_date?: string
          evaluator?: string | null
          fertility_index?: number | null
          growth_rate_index?: number | null
          id?: string
          legs_feet_score?: number | null
          longevity_index?: number | null
          maternal_ability_index?: number | null
          meat_production_index?: number | null
          milk_production_index?: number | null
          notes?: string | null
          organization_id?: string
          overall_genetic_value?: number | null
          reliability_percentage?: number | null
          udder_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "genetic_evaluations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_events: {
        Row: {
          animal_id: string
          cost: number | null
          created_at: string
          created_by: string | null
          diagnosis: string | null
          dosage: string | null
          duration_days: number | null
          event_date: string
          event_type: string
          id: string
          medication: string | null
          next_dose_date: string | null
          notes: string | null
          organization_id: string
          outcome: string | null
          status: string | null
          treatment: string | null
          veterinarian: string | null
          withdrawal_days: number | null
          withdrawal_end_date: string | null
        }
        Insert: {
          animal_id: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          dosage?: string | null
          duration_days?: number | null
          event_date?: string
          event_type: string
          id?: string
          medication?: string | null
          next_dose_date?: string | null
          notes?: string | null
          organization_id: string
          outcome?: string | null
          status?: string | null
          treatment?: string | null
          veterinarian?: string | null
          withdrawal_days?: number | null
          withdrawal_end_date?: string | null
        }
        Update: {
          animal_id?: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          dosage?: string | null
          duration_days?: number | null
          event_date?: string
          event_type?: string
          id?: string
          medication?: string | null
          next_dose_date?: string | null
          notes?: string | null
          organization_id?: string
          outcome?: string | null
          status?: string | null
          treatment?: string | null
          veterinarian?: string | null
          withdrawal_days?: number | null
          withdrawal_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      help_guide_versions: {
        Row: {
          change_note: string | null
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          guide_id: string
          id: string
          title: string
          version_number: number
        }
        Insert: {
          change_note?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          guide_id: string
          id?: string
          title: string
          version_number?: number
        }
        Update: {
          change_note?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          guide_id?: string
          id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "help_guide_versions_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "help_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      help_guides: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          module: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          module: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          module?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      help_resources: {
        Row: {
          created_at: string
          display_order: number | null
          file_path: string | null
          file_size: number | null
          guide_id: string
          id: string
          mime_type: string | null
          resource_type: string
          thumbnail_url: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          file_path?: string | null
          file_size?: number | null
          guide_id: string
          id?: string
          mime_type?: string | null
          resource_type: string
          thumbnail_url?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          file_path?: string | null
          file_size?: number | null
          guide_id?: string
          id?: string
          mime_type?: string | null
          resource_type?: string
          thumbnail_url?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_resources_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "help_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          invoice_number: string | null
          invoice_type: string
          issue_date: string | null
          items: Json | null
          notes: string | null
          organization_id: string
          parsed_data: Json | null
          status: string
          subtotal: number
          supplier_id: string | null
          supplier_name: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string | null
          invoice_type?: string
          issue_date?: string | null
          items?: Json | null
          notes?: string | null
          organization_id: string
          parsed_data?: Json | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string | null
          invoice_type?: string
          issue_date?: string | null
          items?: Json | null
          notes?: string | null
          organization_id?: string
          parsed_data?: Json | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
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
      organization_settings: {
        Row: {
          country: string | null
          created_at: string
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          municipality: string | null
          organization_id: string
          region: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          municipality?: string | null
          organization_id: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          municipality?: string | null
          organization_id?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
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
      paddock_rotations: {
        Row: {
          animals_count: number | null
          created_at: string
          created_by: string | null
          days_occupied: number | null
          entry_date: string
          entry_forage_kg: number | null
          exit_date: string | null
          exit_forage_kg: number | null
          forage_consumed_kg: number | null
          id: string
          lot_name: string | null
          notes: string | null
          organization_id: string
          paddock_id: string
        }
        Insert: {
          animals_count?: number | null
          created_at?: string
          created_by?: string | null
          days_occupied?: number | null
          entry_date: string
          entry_forage_kg?: number | null
          exit_date?: string | null
          exit_forage_kg?: number | null
          forage_consumed_kg?: number | null
          id?: string
          lot_name?: string | null
          notes?: string | null
          organization_id: string
          paddock_id: string
        }
        Update: {
          animals_count?: number | null
          created_at?: string
          created_by?: string | null
          days_occupied?: number | null
          entry_date?: string
          entry_forage_kg?: number | null
          exit_date?: string | null
          exit_forage_kg?: number | null
          forage_consumed_kg?: number | null
          id?: string
          lot_name?: string | null
          notes?: string | null
          organization_id?: string
          paddock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paddock_rotations_paddock_id_fkey"
            columns: ["paddock_id"]
            isOneToOne: false
            referencedRelation: "paddocks"
            referencedColumns: ["id"]
          },
        ]
      }
      paddocks: {
        Row: {
          area_hectares: number | null
          created_at: string
          current_animals: number | null
          current_status: string | null
          grass_type: string | null
          id: string
          irrigation: boolean | null
          last_occupation_date: string | null
          last_rest_start: string | null
          max_capacity: number | null
          name: string
          notes: string | null
          organization_id: string
          recommended_rest_days: number | null
          soil_type: string | null
          updated_at: string
        }
        Insert: {
          area_hectares?: number | null
          created_at?: string
          current_animals?: number | null
          current_status?: string | null
          grass_type?: string | null
          id?: string
          irrigation?: boolean | null
          last_occupation_date?: string | null
          last_rest_start?: string | null
          max_capacity?: number | null
          name: string
          notes?: string | null
          organization_id: string
          recommended_rest_days?: number | null
          soil_type?: string | null
          updated_at?: string
        }
        Update: {
          area_hectares?: number | null
          created_at?: string
          current_animals?: number | null
          current_status?: string | null
          grass_type?: string | null
          id?: string
          irrigation?: boolean | null
          last_occupation_date?: string | null
          last_rest_start?: string | null
          max_capacity?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          recommended_rest_days?: number | null
          soil_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      palpation_records: {
        Row: {
          ai_alert_level: string | null
          ai_diagnosis: string | null
          ai_recommendations: string[] | null
          animal_id: string
          body_condition_score: number | null
          created_at: string
          created_by: string | null
          gestation_days: number | null
          id: string
          is_pregnant: boolean
          notes: string | null
          organization_id: string
          ovary_findings: string[] | null
          palpation_date: string
          reproductive_condition: string | null
          reproductive_event_id: string | null
          species: string | null
          updated_at: string
          uterus_findings: string[] | null
          veterinarian: string | null
        }
        Insert: {
          ai_alert_level?: string | null
          ai_diagnosis?: string | null
          ai_recommendations?: string[] | null
          animal_id: string
          body_condition_score?: number | null
          created_at?: string
          created_by?: string | null
          gestation_days?: number | null
          id?: string
          is_pregnant?: boolean
          notes?: string | null
          organization_id: string
          ovary_findings?: string[] | null
          palpation_date?: string
          reproductive_condition?: string | null
          reproductive_event_id?: string | null
          species?: string | null
          updated_at?: string
          uterus_findings?: string[] | null
          veterinarian?: string | null
        }
        Update: {
          ai_alert_level?: string | null
          ai_diagnosis?: string | null
          ai_recommendations?: string[] | null
          animal_id?: string
          body_condition_score?: number | null
          created_at?: string
          created_by?: string | null
          gestation_days?: number | null
          id?: string
          is_pregnant?: boolean
          notes?: string | null
          organization_id?: string
          ovary_findings?: string[] | null
          palpation_date?: string
          reproductive_condition?: string | null
          reproductive_event_id?: string | null
          species?: string | null
          updated_at?: string
          uterus_findings?: string[] | null
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "palpation_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpation_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "palpation_records_reproductive_event_id_fkey"
            columns: ["reproductive_event_id"]
            isOneToOne: false
            referencedRelation: "reproductive_events"
            referencedColumns: ["id"]
          },
        ]
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
      rfid_devices: {
        Row: {
          created_at: string
          device_id: string | null
          device_name: string
          device_type: string
          id: string
          is_active: boolean
          last_connected_at: string | null
          organization_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          device_name: string
          device_type?: string
          id?: string
          is_active?: boolean
          last_connected_at?: string | null
          organization_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          device_name?: string
          device_type?: string
          id?: string
          is_active?: boolean
          last_connected_at?: string | null
          organization_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfid_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rfid_readings: {
        Row: {
          action_triggered: string | null
          animal_id: string | null
          created_at: string
          device_id: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          organization_id: string
          read_at: string
          signal_strength: number | null
          tag_id: string
        }
        Insert: {
          action_triggered?: string | null
          animal_id?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          organization_id: string
          read_at?: string
          signal_strength?: number | null
          tag_id: string
        }
        Update: {
          action_triggered?: string | null
          animal_id?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          organization_id?: string
          read_at?: string
          signal_strength?: number | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfid_readings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfid_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rfid_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfid_readings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplies: {
        Row: {
          category: string
          created_at: string
          current_stock: number
          id: string
          is_active: boolean | null
          location: string | null
          min_stock: number
          name: string
          notes: string | null
          organization_id: string
          supplier: string | null
          unit: string
          unit_cost: number | null
          updated_at: string
          withdrawal_days: number | null
        }
        Insert: {
          category: string
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean | null
          location?: string | null
          min_stock?: number
          name: string
          notes?: string | null
          organization_id: string
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
          withdrawal_days?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean | null
          location?: string | null
          min_stock?: number
          name?: string
          notes?: string | null
          organization_id?: string
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
          withdrawal_days?: number | null
        }
        Relationships: []
      }
      supply_lots: {
        Row: {
          created_at: string
          expiration_date: string | null
          id: string
          is_depleted: boolean | null
          lot_number: string
          manufacture_date: string | null
          notes: string | null
          organization_id: string
          purchase_date: string | null
          quantity: number
          supplier: string | null
          supply_id: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          is_depleted?: boolean | null
          lot_number: string
          manufacture_date?: string | null
          notes?: string | null
          organization_id: string
          purchase_date?: string | null
          quantity?: number
          supplier?: string | null
          supply_id: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          is_depleted?: boolean | null
          lot_number?: string
          manufacture_date?: string | null
          notes?: string | null
          organization_id?: string
          purchase_date?: string | null
          quantity?: number
          supplier?: string | null
          supply_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_lots_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_movements: {
        Row: {
          animal_id: string | null
          created_at: string
          created_by: string | null
          id: string
          lot_id: string | null
          lot_name: string | null
          movement_date: string
          movement_type: string
          notes: string | null
          organization_id: string
          quantity: number
          reason: string | null
          reference_number: string | null
          supply_id: string
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lot_id?: string | null
          lot_name?: string | null
          movement_date?: string
          movement_type: string
          notes?: string | null
          organization_id: string
          quantity: number
          reason?: string | null
          reference_number?: string | null
          supply_id: string
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lot_id?: string | null
          lot_name?: string | null
          movement_date?: string
          movement_type?: string
          notes?: string | null
          organization_id?: string
          quantity?: number
          reason?: string | null
          reference_number?: string | null
          supply_id?: string
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_movements_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "supply_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_movements_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      traceability_records: {
        Row: {
          animal_id: string
          created_by: string | null
          destination_organization: string | null
          document_hash: string | null
          export_data: Json | null
          id: string
          notes: string | null
          organization_id: string
          record_date: string
          record_type: string
          source_organization: string | null
          verification_code: string | null
        }
        Insert: {
          animal_id: string
          created_by?: string | null
          destination_organization?: string | null
          document_hash?: string | null
          export_data?: Json | null
          id?: string
          notes?: string | null
          organization_id: string
          record_date?: string
          record_type: string
          source_organization?: string | null
          verification_code?: string | null
        }
        Update: {
          animal_id?: string
          created_by?: string | null
          destination_organization?: string | null
          document_hash?: string | null
          export_data?: Json | null
          id?: string
          notes?: string | null
          organization_id?: string
          record_date?: string
          record_type?: string
          source_organization?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traceability_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          completed_at: string
          created_at: string
          herd_size: string
          id: string
          main_challenge: string
          organization_id: string | null
          primary_role: string
          production_type: string
          species: string[]
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          herd_size: string
          id?: string
          main_challenge: string
          organization_id?: string | null
          primary_role: string
          production_type: string
          species?: string[]
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          herd_size?: string
          id?: string
          main_challenge?: string
          organization_id?: string | null
          primary_role?: string
          production_type?: string
          species?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_organization_id_fkey"
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
      vaccination_schedule: {
        Row: {
          animal_id: string | null
          applied_date: string | null
          created_at: string
          created_by: string | null
          dose_number: number | null
          id: string
          is_applied: boolean | null
          lot_name: string | null
          next_application_date: string | null
          notes: string | null
          organization_id: string
          scheduled_date: string
          vaccine_name: string
        }
        Insert: {
          animal_id?: string | null
          applied_date?: string | null
          created_at?: string
          created_by?: string | null
          dose_number?: number | null
          id?: string
          is_applied?: boolean | null
          lot_name?: string | null
          next_application_date?: string | null
          notes?: string | null
          organization_id: string
          scheduled_date: string
          vaccine_name: string
        }
        Update: {
          animal_id?: string | null
          applied_date?: string | null
          created_at?: string
          created_by?: string | null
          dose_number?: number | null
          id?: string
          is_applied?: boolean | null
          lot_name?: string | null
          next_application_date?: string | null
          notes?: string | null
          organization_id?: string
          scheduled_date?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_schedule_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
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
      is_founder: { Args: { _user_id: string }; Returns: boolean }
      log_activity: {
        Args: { p_action: string; p_details?: Json; p_module_name?: string }
        Returns: string
      }
      log_founder_access: {
        Args: {
          p_action?: string
          p_details?: Json
          p_target_org_id?: string
          p_target_user_id?: string
        }
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
        | "bufala"
        | "bufalo"
      animal_sex: "macho" | "hembra"
      animal_status:
        | "activo"
        | "vendido"
        | "muerto"
        | "descartado"
        | "trasladado"
      app_role: "admin" | "ganadero" | "tecnico" | "veterinario" | "founder"
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
        "bufala",
        "bufalo",
      ],
      animal_sex: ["macho", "hembra"],
      animal_status: [
        "activo",
        "vendido",
        "muerto",
        "descartado",
        "trasladado",
      ],
      app_role: ["admin", "ganadero", "tecnico", "veterinario", "founder"],
      permission_type: ["read", "write", "delete"],
    },
  },
} as const
