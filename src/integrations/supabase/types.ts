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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          cover_cta_text: string
          cover_enabled: boolean
          cover_subtitle: string
          cover_title: string
          created_at: string
          form_name: string
          gtm_id: string | null
          id: string
          subdomain: string
          success_description: string
          success_subtitle: string
          success_title: string
          updated_at: string
          webhook_url: string | null
          whatsapp_enabled: boolean
          whatsapp_message: string
          whatsapp_number: string
        }
        Insert: {
          cover_cta_text?: string
          cover_enabled?: boolean
          cover_subtitle?: string
          cover_title?: string
          created_at?: string
          form_name?: string
          gtm_id?: string | null
          id?: string
          subdomain?: string
          success_description?: string
          success_subtitle?: string
          success_title?: string
          updated_at?: string
          webhook_url?: string | null
          whatsapp_enabled?: boolean
          whatsapp_message?: string
          whatsapp_number?: string
        }
        Update: {
          cover_cta_text?: string
          cover_enabled?: boolean
          cover_subtitle?: string
          cover_title?: string
          created_at?: string
          form_name?: string
          gtm_id?: string | null
          id?: string
          subdomain?: string
          success_description?: string
          success_subtitle?: string
          success_title?: string
          updated_at?: string
          webhook_url?: string | null
          whatsapp_enabled?: boolean
          whatsapp_message?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      entidades: {
        Row: {
          cpf: string | null
          created_at: string
          dados_json: Json | null
          email: string | null
          id: string
          nome: string | null
          subdomain: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          dados_json?: Json | null
          email?: string | null
          id?: string
          nome?: string | null
          subdomain?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          dados_json?: Json | null
          email?: string | null
          id?: string
          nome?: string | null
          subdomain?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      form_a_respostas: {
        Row: {
          created_at: string
          dados_json: Json | null
          entidade_id: string
          form_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dados_json?: Json | null
          entidade_id: string
          form_name?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dados_json?: Json | null
          entidade_id?: string
          form_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_a_respostas_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      form_b_respostas: {
        Row: {
          created_at: string
          dados_json: Json | null
          entidade_id: string
          form_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dados_json?: Json | null
          entidade_id: string
          form_name?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dados_json?: Json | null
          entidade_id?: string
          form_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_b_respostas_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      form_c_respostas: {
        Row: {
          created_at: string
          dados_json: Json | null
          entidade_id: string
          form_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dados_json?: Json | null
          entidade_id: string
          form_name?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dados_json?: Json | null
          entidade_id?: string
          form_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_c_respostas_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      form_d_respostas: {
        Row: {
          created_at: string
          dados_json: Json | null
          entidade_id: string
          form_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dados_json?: Json | null
          entidade_id: string
          form_name?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dados_json?: Json | null
          entidade_id?: string
          form_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_d_respostas_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      form_questions: {
        Row: {
          conditional_logic: Json | null
          created_at: string
          field_name: string
          id: string
          input_placeholder: string | null
          input_type: string
          max_length: number | null
          options: Json
          question: string
          required: boolean
          step: number
          subdomain: string
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string
          field_name: string
          id?: string
          input_placeholder?: string | null
          input_type?: string
          max_length?: number | null
          options: Json
          question: string
          required?: boolean
          step: number
          subdomain?: string
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string
          field_name?: string
          id?: string
          input_placeholder?: string | null
          input_type?: string
          max_length?: number | null
          options?: Json
          question?: string
          required?: boolean
          step?: number
          subdomain?: string
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      forma_respostas: {
        Row: {
          created_at: string
          dados_json: Json | null
          entidade_id: string | null
          id: string
          pergunta_fixa_1: string | null
          pergunta_fixa_2: number | null
          pergunta_fixa_3: boolean | null
          subdomain: string
          updated_at: string
          versao_formulario: string | null
        }
        Insert: {
          created_at?: string
          dados_json?: Json | null
          entidade_id?: string | null
          id?: string
          pergunta_fixa_1?: string | null
          pergunta_fixa_2?: number | null
          pergunta_fixa_3?: boolean | null
          subdomain?: string
          updated_at?: string
          versao_formulario?: string | null
        }
        Update: {
          created_at?: string
          dados_json?: Json | null
          entidade_id?: string | null
          id?: string
          pergunta_fixa_1?: string | null
          pergunta_fixa_2?: number | null
          pergunta_fixa_3?: boolean | null
          subdomain?: string
          updated_at?: string
          versao_formulario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forma_respostas_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          form_data: Json
          id: string
        }
        Insert: {
          created_at?: string
          form_data?: Json
          id?: string
        }
        Update: {
          created_at?: string
          form_data?: Json
          id?: string
        }
        Relationships: []
      }
      leads_autoprotecta: {
        Row: {
          created_at: string
          form_data: Json
          id: string
        }
        Insert: {
          created_at?: string
          form_data?: Json
          id?: string
        }
        Update: {
          created_at?: string
          form_data?: Json
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      success_pages: {
        Row: {
          created_at: string
          description: string
          id: string
          page_key: string
          subdomain: string
          subtitle: string
          title: string
          updated_at: string
          whatsapp_enabled: boolean
          whatsapp_message: string
          whatsapp_number: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          page_key: string
          subdomain?: string
          subtitle?: string
          title?: string
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_message?: string
          whatsapp_number?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          page_key?: string
          subdomain?: string
          subtitle?: string
          title?: string
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_message?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_queue: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          phone_number: string
          position: number
          subdomain: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          phone_number: string
          position: number
          subdomain?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string
          position?: number
          subdomain?: string
        }
        Relationships: []
      }
      whatsapp_queue_state: {
        Row: {
          current_position: number
          id: string
          subdomain: string
          updated_at: string
        }
        Insert: {
          current_position?: number
          id?: string
          subdomain: string
          updated_at?: string
        }
        Update: {
          current_position?: number
          id?: string
          subdomain?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
