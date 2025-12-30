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
      ai_insights: {
        Row: {
          bank_profile_id: string | null
          created_at: string
          data: Json | null
          description: string
          id: string
          insight_type: string
          is_read: boolean | null
          period_end: string | null
          period_start: string | null
          title: string
          user_id: string
        }
        Insert: {
          bank_profile_id?: string | null
          created_at?: string
          data?: Json | null
          description: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          period_end?: string | null
          period_start?: string | null
          title: string
          user_id: string
        }
        Update: {
          bank_profile_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          period_end?: string | null
          period_start?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_bank_profile_id_fkey"
            columns: ["bank_profile_id"]
            isOneToOne: false
            referencedRelation: "bank_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_profiles: {
        Row: {
          account_type: string | null
          bank_name: string
          created_at: string
          id: string
          name: string
          parser_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          bank_name: string
          created_at?: string
          id?: string
          name: string
          parser_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          name?: string
          parser_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      statements: {
        Row: {
          bank_profile_id: string
          created_at: string
          error_message: string | null
          file_path: string
          file_size: number | null
          filename: string
          id: string
          processed_at: string | null
          statement_end_date: string | null
          statement_start_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          bank_profile_id: string
          created_at?: string
          error_message?: string | null
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          processed_at?: string | null
          statement_end_date?: string | null
          statement_start_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          bank_profile_id?: string
          created_at?: string
          error_message?: string | null
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          processed_at?: string | null
          statement_end_date?: string | null
          statement_start_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "statements_bank_profile_id_fkey"
            columns: ["bank_profile_id"]
            isOneToOne: false
            referencedRelation: "bank_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_audit_log: {
        Row: {
          changed_at: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          transaction_id: string
          user_id: string
        }
        Update: {
          changed_at?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_audit_log_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          anomaly_reason: string | null
          anomaly_score: number | null
          balance: number | null
          bank_profile_id: string
          category: string | null
          category_confidence: number | null
          created_at: string
          description: string
          id: string
          is_anomaly: boolean | null
          is_recurring: boolean | null
          merchant_name: string | null
          next_expected_date: string | null
          notes: string | null
          original_description: string
          recurring_frequency: string | null
          statement_id: string | null
          transaction_date: string
          transaction_hash: string
          transaction_type: string
          updated_at: string
          user_id: string
          user_override_category: string | null
        }
        Insert: {
          amount: number
          anomaly_reason?: string | null
          anomaly_score?: number | null
          balance?: number | null
          bank_profile_id: string
          category?: string | null
          category_confidence?: number | null
          created_at?: string
          description: string
          id?: string
          is_anomaly?: boolean | null
          is_recurring?: boolean | null
          merchant_name?: string | null
          next_expected_date?: string | null
          notes?: string | null
          original_description: string
          recurring_frequency?: string | null
          statement_id?: string | null
          transaction_date: string
          transaction_hash: string
          transaction_type: string
          updated_at?: string
          user_id: string
          user_override_category?: string | null
        }
        Update: {
          amount?: number
          anomaly_reason?: string | null
          anomaly_score?: number | null
          balance?: number | null
          bank_profile_id?: string
          category?: string | null
          category_confidence?: number | null
          created_at?: string
          description?: string
          id?: string
          is_anomaly?: boolean | null
          is_recurring?: boolean | null
          merchant_name?: string | null
          next_expected_date?: string | null
          notes?: string | null
          original_description?: string
          recurring_frequency?: string | null
          statement_id?: string | null
          transaction_date?: string
          transaction_hash?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
          user_override_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_profile_id_fkey"
            columns: ["bank_profile_id"]
            isOneToOne: false
            referencedRelation: "bank_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "statements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
