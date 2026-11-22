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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          category: string
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string
          featured: boolean
          id: string
          pixel_art_image: string
          published_at: string | null
          reading_time: number
          slug: string
          status: string
          substack_post_id: string | null
          substack_url: string | null
          subtitle: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          pixel_art_image?: string
          published_at?: string | null
          reading_time?: number
          slug: string
          status?: string
          substack_post_id?: string | null
          substack_url?: string | null
          subtitle?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          pixel_art_image?: string
          published_at?: string | null
          reading_time?: number
          slug?: string
          status?: string
          substack_post_id?: string | null
          substack_url?: string | null
          subtitle?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      mf_factsheets: {
        Row: {
          as_of: string
          aum_cr: number | null
          avg_maturity_yrs: number | null
          benchmark: string | null
          beta: number | null
          cash_pct: number | null
          created_at: string
          debt_pct: number | null
          equity_pct: number | null
          exit_load: string | null
          expense_ratio: number | null
          id: string
          inception_date: string | null
          large_cap_pct: number | null
          macaulay_duration: number | null
          mid_cap_pct: number | null
          min_investment: number | null
          modified_duration: number | null
          notes: string
          other_pct: number | null
          pb: number | null
          pe: number | null
          rating_mix: Json
          scheme_code: number
          sharpe: number | null
          small_cap_pct: number | null
          source: string
          std_dev: number | null
          turnover_ratio: number | null
          ytm: number | null
        }
        Insert: {
          as_of: string
          aum_cr?: number | null
          avg_maturity_yrs?: number | null
          benchmark?: string | null
          beta?: number | null
          cash_pct?: number | null
          created_at?: string
          debt_pct?: number | null
          equity_pct?: number | null
          exit_load?: string | null
          expense_ratio?: number | null
          id?: string
          inception_date?: string | null
          large_cap_pct?: number | null
          macaulay_duration?: number | null
          mid_cap_pct?: number | null
          min_investment?: number | null
          modified_duration?: number | null
          notes?: string
          other_pct?: number | null
          pb?: number | null
          pe?: number | null
          rating_mix?: Json
          scheme_code: number
          sharpe?: number | null
          small_cap_pct?: number | null
          source?: string
          std_dev?: number | null
          turnover_ratio?: number | null
          ytm?: number | null
        }
        Update: {
          as_of?: string
          aum_cr?: number | null
          avg_maturity_yrs?: number | null
          benchmark?: string | null
          beta?: number | null
          cash_pct?: number | null
          created_at?: string
          debt_pct?: number | null
          equity_pct?: number | null
          exit_load?: string | null
          expense_ratio?: number | null
          id?: string
          inception_date?: string | null
          large_cap_pct?: number | null
          macaulay_duration?: number | null
          mid_cap_pct?: number | null
          min_investment?: number | null
          modified_duration?: number | null
          notes?: string
          other_pct?: number | null
          pb?: number | null
          pe?: number | null
          rating_mix?: Json
          scheme_code?: number
          sharpe?: number | null
          small_cap_pct?: number | null
          source?: string
          std_dev?: number | null
          turnover_ratio?: number | null
          ytm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mf_factsheets_scheme_code_fkey"
            columns: ["scheme_code"]
            isOneToOne: false
            referencedRelation: "mf_schemes"
            referencedColumns: ["scheme_code"]
          },
        ]
      }
      mf_holdings: {
        Row: {
          as_of: string
          asset_type: string | null
          id: string
          instrument: string
          isin: string | null
          market_value_cr: number | null
          quantity: number | null
          rating: string | null
          scheme_code: number
          sector: string | null
          weight_pct: number
        }
        Insert: {
          as_of: string
          asset_type?: string | null
          id?: string
          instrument: string
          isin?: string | null
          market_value_cr?: number | null
          quantity?: number | null
          rating?: string | null
          scheme_code: number
          sector?: string | null
          weight_pct?: number
        }
        Update: {
          as_of?: string
          asset_type?: string | null
          id?: string
          instrument?: string
          isin?: string | null
          market_value_cr?: number | null
          quantity?: number | null
          rating?: string | null
          scheme_code?: number
          sector?: string | null
          weight_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "mf_holdings_scheme_code_fkey"
            columns: ["scheme_code"]
            isOneToOne: false
            referencedRelation: "mf_schemes"
            referencedColumns: ["scheme_code"]
          },
        ]
      }
      mf_managers: {
        Row: {
          bio: string
          created_at: string
          experience_years: number | null
          id: string
          name: string
          qualifications: string
        }
        Insert: {
          bio?: string
          created_at?: string
          experience_years?: number | null
          id?: string
          name: string
          qualifications?: string
        }
        Update: {
          bio?: string
          created_at?: string
          experience_years?: number | null
          id?: string
          name?: string
          qualifications?: string
        }
        Relationships: []
      }
      mf_nav_history: {
        Row: {
          nav: number
          nav_date: string
          scheme_code: number
        }
        Insert: {
          nav: number
          nav_date: string
          scheme_code: number
        }
        Update: {
          nav?: number
          nav_date?: string
          scheme_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "mf_nav_history_scheme_code_fkey"
            columns: ["scheme_code"]
            isOneToOne: false
            referencedRelation: "mf_schemes"
            referencedColumns: ["scheme_code"]
          },
        ]
      }
      mf_news: {
        Row: {
          author: string | null
          fetched_at: string
          fund_house: string | null
          id: string
          published_at: string | null
          scheme_code: number | null
          source_name: string
          source_type: string
          summary: string
          title: string
          url: string
        }
        Insert: {
          author?: string | null
          fetched_at?: string
          fund_house?: string | null
          id?: string
          published_at?: string | null
          scheme_code?: number | null
          source_name?: string
          source_type: string
          summary?: string
          title: string
          url: string
        }
        Update: {
          author?: string | null
          fetched_at?: string
          fund_house?: string | null
          id?: string
          published_at?: string | null
          scheme_code?: number | null
          source_name?: string
          source_type?: string
          summary?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "mf_news_scheme_code_fkey"
            columns: ["scheme_code"]
            isOneToOne: false
            referencedRelation: "mf_schemes"
            referencedColumns: ["scheme_code"]
          },
        ]
      }
      mf_return_metrics: {
        Row: {
          as_of: string
          computed_at: string
          max_drawdown: number | null
          r_10y: number | null
          r_1m: number | null
          r_1y: number | null
          r_3m: number | null
          r_3y: number | null
          r_5y: number | null
          r_6m: number | null
          r_since: number | null
          rolling_1y_avg: number | null
          rolling_1y_max: number | null
          rolling_1y_min: number | null
          rolling_1y_pos_pct: number | null
          rolling_3y_avg: number | null
          rolling_3y_max: number | null
          rolling_3y_min: number | null
          scheme_code: number
          sharpe_3y: number | null
          sortino_3y: number | null
          volatility_1y: number | null
        }
        Insert: {
          as_of: string
          computed_at?: string
          max_drawdown?: number | null
          r_10y?: number | null
          r_1m?: number | null
          r_1y?: number | null
          r_3m?: number | null
          r_3y?: number | null
          r_5y?: number | null
          r_6m?: number | null
          r_since?: number | null
          rolling_1y_avg?: number | null
          rolling_1y_max?: number | null
          rolling_1y_min?: number | null
          rolling_1y_pos_pct?: number | null
          rolling_3y_avg?: number | null
          rolling_3y_max?: number | null
          rolling_3y_min?: number | null
          scheme_code: number
          sharpe_3y?: number | null
          sortino_3y?: number | null
          volatility_1y?: number | null
        }
        Update: {
          as_of?: string
          computed_at?: string
          max_drawdown?: number | null
          r_10y?: number | null
          r_1m?: number | null
          r_1y?: number | null
          r_3m?: number | null
          r_3y?: number | null
          r_5y?: number | null
          r_6m?: number | null
          r_since?: number | null
          rolling_1y_avg?: number | null
          rolling_1y_max?: number | null
          rolling_1y_min?: number | null
          rolling_1y_pos_pct?: number | null
          rolling_3y_avg?: number | null
          rolling_3y_max?: number | null
          rolling_3y_min?: number | null
          scheme_code?: number
          sharpe_3y?: number | null
          sortino_3y?: number | null
          volatility_1y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mf_return_metrics_scheme_code_fkey"
            columns: ["scheme_code"]
            isOneToOne: true
            referencedRelation: "mf_schemes"
            referencedColumns: ["scheme_code"]
          },
        ]
      }
      mf_scheme_managers: {
        Row: {
          end_date: string | null
          id: string
          manager_id: string
          role: string
          scheme_code: number
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          id?: string
          manager_id: string
          role?: string
          scheme_code: number
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          id?: string
          manager_id?: string
          role?: string
          scheme_code?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mf_scheme_managers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "mf_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mf_scheme_managers_scheme_code_fkey"
            columns: ["scheme_code"]
            isOneToOne: false
            referencedRelation: "mf_schemes"
            referencedColumns: ["scheme_code"]
          },
        ]
      }
      mf_schemes: {
        Row: {
          category: string | null
          fund_house: string | null
          history_points: number
          history_start: string | null
          history_synced_at: string | null
          isin_growth: string | null
          isin_reinvest: string | null
          latest_nav: number | null
          nav_date: string | null
          option_type: string | null
          plan: string | null
          scheme_code: number
          scheme_name: string
          scheme_type: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          fund_house?: string | null
          history_points?: number
          history_start?: string | null
          history_synced_at?: string | null
          isin_growth?: string | null
          isin_reinvest?: string | null
          latest_nav?: number | null
          nav_date?: string | null
          option_type?: string | null
          plan?: string | null
          scheme_code: number
          scheme_name: string
          scheme_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          fund_house?: string | null
          history_points?: number
          history_start?: string | null
          history_synced_at?: string | null
          isin_growth?: string | null
          isin_reinvest?: string | null
          latest_nav?: number | null
          nav_date?: string | null
          option_type?: string | null
          plan?: string | null
          scheme_code?: number
          scheme_name?: string
          scheme_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mf_sector_allocation: {
        Row: {
          as_of: string
          scheme_code: number
          sector: string
          weight_pct: number
        }
        Insert: {
          as_of: string
          scheme_code: number
          sector: string
          weight_pct?: number
        }
        Update: {
          as_of?: string
          scheme_code?: number
          sector?: string
          weight_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "mf_sector_allocation_scheme_code_fkey"
            columns: ["scheme_code"]
            isOneToOne: false
            referencedRelation: "mf_schemes"
            referencedColumns: ["scheme_code"]
          },
        ]
      }
      mf_sync_runs: {
        Row: {
          created_at: string
          detail: string
          id: string
          kind: string
          ok: boolean
          rows_written: number
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          kind: string
          ok?: boolean
          rows_written?: number
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          ok?: boolean
          rows_written?: number
        }
        Relationships: []
      }
      newsletter_sends: {
        Row: {
          article_id: string | null
          failed_count: number
          id: string
          recipient_count: number
          sent_at: string
          subject: string
        }
        Insert: {
          article_id?: string | null
          failed_count?: number
          id?: string
          recipient_count?: number
          sent_at?: string
          subject: string
        }
        Update: {
          article_id?: string | null
          failed_count?: number
          id?: string
          recipient_count?: number
          sent_at?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_sends_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          status: string
          unsubscribe_token: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          status?: string
          unsubscribe_token?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          status?: string
          unsubscribe_token?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      increment_article_view: { Args: { _slug: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
