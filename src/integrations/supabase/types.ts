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
      alert_configurations: {
        Row: {
          conditions: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          recipients: string[]
          slack_webhook_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          recipients?: string[]
          slack_webhook_url?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          recipients?: string[]
          slack_webhook_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      alert_escalations: {
        Row: {
          alert_types: string[] | null
          created_at: string | null
          enabled: boolean | null
          escalation_delay_minutes: number
          escalation_levels: Json
          id: string
          name: string
          severity_levels: string[]
          updated_at: string | null
        }
        Insert: {
          alert_types?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          escalation_delay_minutes?: number
          escalation_levels?: Json
          id?: string
          name: string
          severity_levels?: string[]
          updated_at?: string | null
        }
        Update: {
          alert_types?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          escalation_delay_minutes?: number
          escalation_levels?: Json
          id?: string
          name?: string
          severity_levels?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      alert_logs: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_config_id: string | null
          details: Json | null
          id: string
          message: string
          sent_at: string
          severity: string
          type: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_config_id?: string | null
          details?: Json | null
          id?: string
          message: string
          sent_at?: string
          severity: string
          type: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_config_id?: string | null
          details?: Json | null
          id?: string
          message?: string
          sent_at?: string
          severity?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_logs_alert_config_id_fkey"
            columns: ["alert_config_id"]
            isOneToOne: false
            referencedRelation: "alert_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_snoozes: {
        Row: {
          alert_config_id: string | null
          alert_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          reason: string | null
          snooze_until: string
          user_id: string | null
        }
        Insert: {
          alert_config_id?: string | null
          alert_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          snooze_until: string
          user_id?: string | null
        }
        Update: {
          alert_config_id?: string | null
          alert_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          snooze_until?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_snoozes_alert_config_id_fkey"
            columns: ["alert_config_id"]
            isOneToOne: false
            referencedRelation: "alert_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_history: {
        Row: {
          analysis_type: string
          created_at: string
          credits_used: number
          id: string
          image_data: string | null
          result: Json | null
          selected_topics: string[] | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          credits_used: number
          id?: string
          image_data?: string | null
          result?: Json | null
          selected_topics?: string[] | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          credits_used?: number
          id?: string
          image_data?: string | null
          result?: Json | null
          selected_topics?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auto_responses: {
        Row: {
          created_at: string
          days_of_week: string[] | null
          enabled: boolean | null
          end_time: string | null
          id: string
          message: string
          start_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: string[] | null
          enabled?: boolean | null
          end_time?: string | null
          id?: string
          message: string
          start_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: string[] | null
          enabled?: boolean | null
          end_time?: string | null
          id?: string
          message?: string
          start_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string
          id: string
          name: string
          rarity: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon: string
          id?: string
          name: string
          rarity?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          rarity?: string | null
        }
        Relationships: []
      }
      birth_chart_analyses: {
        Row: {
          birth_date: string
          birth_place: string
          birth_time: string
          created_at: string
          credits_used: number
          full_name: string
          id: string
          result: Json | null
          selected_topics: string[]
          user_id: string
        }
        Insert: {
          birth_date: string
          birth_place: string
          birth_time: string
          created_at?: string
          credits_used: number
          full_name: string
          id?: string
          result?: Json | null
          selected_topics: string[]
          user_id: string
        }
        Update: {
          birth_date?: string
          birth_place?: string
          birth_time?: string
          created_at?: string
          credits_used?: number
          full_name?: string
          id?: string
          result?: Json | null
          selected_topics?: string[]
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          call_id: string | null
          call_type: string
          caller_id: string
          duration: number | null
          ended_at: string | null
          has_screen_share: boolean | null
          has_video: boolean | null
          id: string
          receiver_id: string
          started_at: string
          status: string
        }
        Insert: {
          call_id?: string | null
          call_type: string
          caller_id: string
          duration?: number | null
          ended_at?: string | null
          has_screen_share?: boolean | null
          has_video?: boolean | null
          id?: string
          receiver_id: string
          started_at?: string
          status: string
        }
        Update: {
          call_id?: string | null
          call_type?: string
          caller_id?: string
          duration?: number | null
          ended_at?: string | null
          has_screen_share?: boolean | null
          has_video?: boolean | null
          id?: string
          receiver_id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      call_signals: {
        Row: {
          call_id: string
          created_at: string | null
          from_user_id: string
          id: string
          signal_data: Json
          signal_type: string
          to_user_id: string
        }
        Insert: {
          call_id: string
          created_at?: string | null
          from_user_id: string
          id?: string
          signal_data: Json
          signal_type: string
          to_user_id: string
        }
        Update: {
          call_id?: string
          created_at?: string | null
          from_user_id?: string
          id?: string
          signal_data?: Json
          signal_type?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_signals_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      close_friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "close_friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "close_friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coffee_fortune_readings: {
        Row: {
          created_at: string
          credits_used: number
          id: string
          image1_data: string
          image2_data: string
          image3_data: string
          interpretation: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          id?: string
          image1_data: string
          image2_data: string
          image3_data: string
          interpretation?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          id?: string
          image1_data?: string
          image2_data?: string
          image3_data?: string
          interpretation?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_analyses: {
        Row: {
          created_at: string
          credits_used: number
          gender1: string
          gender2: string
          id: string
          image1_data: string
          image2_data: string
          result: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          gender1: string
          gender2: string
          id?: string
          image1_data: string
          image2_data: string
          result?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          gender1?: string
          gender2?: string
          id?: string
          image1_data?: string
          image2_data?: string
          result?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      conversation_pins: {
        Row: {
          conversation_id: string
          conversation_type: string
          created_at: string
          id: string
          pinned_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          conversation_type: string
          created_at?: string
          id?: string
          pinned_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          conversation_type?: string
          created_at?: string
          id?: string
          pinned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string
          credits: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_try: number
        }
        Insert: {
          created_at?: string
          credits: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_try: number
        }
        Update: {
          created_at?: string
          credits?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_try?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          details: Json | null
          duration_ms: number | null
          error_message: string | null
          id: string
          job_id: number | null
          job_name: string
          max_retries: number | null
          next_retry_at: string | null
          retry_count: number | null
          retry_delay_seconds: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_id?: number | null
          job_name: string
          max_retries?: number | null
          next_retry_at?: string | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_id?: number | null
          job_name?: string
          max_retries?: number | null
          next_retry_at?: string | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      cron_jobs: {
        Row: {
          auto_disable_enabled: boolean | null
          auto_scale_enabled: boolean | null
          created_at: string | null
          current_interval_seconds: number | null
          description: string | null
          disabled_at: string | null
          disabled_reason: string | null
          enabled: boolean | null
          failure_threshold: number | null
          failure_window_minutes: number | null
          function_name: string
          id: number
          last_scale_check_at: string | null
          max_interval_seconds: number | null
          min_interval_seconds: number | null
          name: string
          schedule: string
          success_rate_threshold_high: number | null
          success_rate_threshold_low: number | null
          updated_at: string | null
        }
        Insert: {
          auto_disable_enabled?: boolean | null
          auto_scale_enabled?: boolean | null
          created_at?: string | null
          current_interval_seconds?: number | null
          description?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          enabled?: boolean | null
          failure_threshold?: number | null
          failure_window_minutes?: number | null
          function_name: string
          id?: number
          last_scale_check_at?: string | null
          max_interval_seconds?: number | null
          min_interval_seconds?: number | null
          name: string
          schedule: string
          success_rate_threshold_high?: number | null
          success_rate_threshold_low?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_disable_enabled?: boolean | null
          auto_scale_enabled?: boolean | null
          created_at?: string | null
          current_interval_seconds?: number | null
          description?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          enabled?: boolean | null
          failure_threshold?: number | null
          failure_window_minutes?: number | null
          function_name?: string
          id?: number
          last_scale_check_at?: string | null
          max_interval_seconds?: number | null
          min_interval_seconds?: number | null
          name?: string
          schedule?: string
          success_rate_threshold_high?: number | null
          success_rate_threshold_low?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_notification_settings: {
        Row: {
          created_at: string | null
          email_on_error: boolean | null
          email_on_success: boolean | null
          email_recipients: string[] | null
          id: string
          push_on_error: boolean | null
          push_on_success: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_on_error?: boolean | null
          email_on_success?: boolean | null
          email_recipients?: string[] | null
          id?: string
          push_on_error?: boolean | null
          push_on_success?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_on_error?: boolean | null
          email_on_success?: boolean | null
          email_recipients?: string[] | null
          id?: string
          push_on_error?: boolean | null
          push_on_success?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_horoscopes: {
        Row: {
          created_at: string
          credits_used: number
          horoscope_text: Json | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          horoscope_text?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          horoscope_text?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_missions: {
        Row: {
          action_type: string
          category: string
          created_at: string | null
          credit_reward: number
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          is_premium_only: boolean | null
          sort_order: number | null
          target_count: number
          title: string
          xp_reward: number
        }
        Insert: {
          action_type: string
          category: string
          created_at?: string | null
          credit_reward?: number
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_premium_only?: boolean | null
          sort_order?: number | null
          target_count?: number
          title: string
          xp_reward?: number
        }
        Update: {
          action_type?: string
          category?: string
          created_at?: string | null
          credit_reward?: number
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_premium_only?: boolean | null
          sort_order?: number | null
          target_count?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      date_shares: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          match_user_id: string
          meeting_location: string | null
          meeting_time: string | null
          notes: string | null
          shared_with_user_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          match_user_id: string
          meeting_location?: string | null
          meeting_time?: string | null
          notes?: string | null
          shared_with_user_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          match_user_id?: string
          meeting_location?: string | null
          meeting_time?: string | null
          notes?: string | null
          shared_with_user_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_shares_match_user_id_fkey"
            columns: ["match_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "date_shares_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "date_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dream_interpretations: {
        Row: {
          created_at: string
          credits_used: number
          dream_description: string
          id: string
          interpretation: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          dream_description: string
          id?: string
          interpretation?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          dream_description?: string
          id?: string
          interpretation?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          browser_info: Json | null
          context: Json | null
          count: number | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          fingerprint: string | null
          id: string
          notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          timestamp: string
          url: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser_info?: Json | null
          context?: Json | null
          count?: number | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          fingerprint?: string | null
          id?: string
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          timestamp?: string
          url: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser_info?: Json | null
          context?: Json | null
          count?: number | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          fingerprint?: string | null
          id?: string
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          timestamp?: string
          url?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      escalation_logs: {
        Row: {
          alert_log_id: string | null
          escalation_config_id: string | null
          escalation_level: number
          id: string
          notification_type: string
          recipients: string[]
          sent_at: string | null
        }
        Insert: {
          alert_log_id?: string | null
          escalation_config_id?: string | null
          escalation_level: number
          id?: string
          notification_type: string
          recipients: string[]
          sent_at?: string | null
        }
        Update: {
          alert_log_id?: string | null
          escalation_config_id?: string | null
          escalation_level?: number
          id?: string
          notification_type?: string
          recipients?: string[]
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_logs_alert_log_id_fkey"
            columns: ["alert_log_id"]
            isOneToOne: false
            referencedRelation: "alert_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_escalation_config_id_fkey"
            columns: ["escalation_config_id"]
            isOneToOne: false
            referencedRelation: "alert_escalations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "group_events"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_analyses: {
        Row: {
          analysis_id: string
          analysis_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          analysis_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          analysis_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_streaks: {
        Row: {
          created_at: string
          current_streak: number
          friend_id: string
          id: string
          last_interaction_at: string
          longest_streak: number
          streak_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          friend_id: string
          id?: string
          last_interaction_at?: string
          longest_streak?: number
          streak_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          friend_id?: string
          id?: string
          last_interaction_at?: string
          longest_streak?: number
          streak_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_streaks_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friend_suggestions: {
        Row: {
          common_interests: string[] | null
          compatibility_score: number
          created_at: string
          dismissed: boolean | null
          id: string
          reason: string | null
          suggested_user_id: string
          user_id: string
        }
        Insert: {
          common_interests?: string[] | null
          compatibility_score?: number
          created_at?: string
          dismissed?: boolean | null
          id?: string
          reason?: string | null
          suggested_user_id: string
          user_id: string
        }
        Update: {
          common_interests?: string[] | null
          compatibility_score?: number
          created_at?: string
          dismissed?: boolean | null
          id?: string
          reason?: string | null
          suggested_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gift_transactions: {
        Row: {
          created_at: string | null
          gift_id: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          gift_id: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          gift_id?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "virtual_gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gift_transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          group_id: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          group_id: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          group_id?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_announcements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_call_participants: {
        Row: {
          call_id: string
          duration: number | null
          id: string
          joined_at: string | null
          left_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          call_id: string
          duration?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          call_id?: string
          duration?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_call_participants_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "group_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      group_calls: {
        Row: {
          call_id: string | null
          call_type: string
          created_at: string | null
          ended_at: string | null
          group_id: string
          id: string
          started_at: string
          started_by: string
          status: string
        }
        Insert: {
          call_id?: string | null
          call_type: string
          created_at?: string | null
          ended_at?: string | null
          group_id: string
          id?: string
          started_at?: string
          started_by: string
          status: string
        }
        Update: {
          call_id?: string | null
          call_type?: string
          created_at?: string | null
          ended_at?: string | null
          group_id?: string
          id?: string
          started_at?: string
          started_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_calls_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_events: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          event_date: string
          group_id: string
          id: string
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          event_date: string
          group_id: string
          id?: string
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          event_date?: string
          group_id?: string
          id?: string
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          group_id: string
          id: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          group_id: string
          id?: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          group_id?: string
          id?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_files_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string | null
          edited_at: string | null
          group_id: string
          id: string
          media_type: string | null
          media_url: string | null
          pinned_at: string | null
          pinned_by: string | null
          reply_to: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_at?: string | null
          group_id: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_at?: string | null
          group_id?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_ids: string[]
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_ids: string[]
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_ids?: string[]
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "group_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      group_polls: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string
          group_id: string
          id: string
          multiple_choice: boolean | null
          options: Json
          question: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at: string
          group_id: string
          id?: string
          multiple_choice?: boolean | null
          options: Json
          question: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string
          group_id?: string
          id?: string
          multiple_choice?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_polls_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          tag: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tag?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      hidden_words: {
        Row: {
          created_at: string
          id: string
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ice_breaker_questions: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: []
      }
      leaderboards: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          rank: number | null
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          period_type: string
          rank?: number | null
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          rank?: number | null
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      matches: {
        Row: {
          compatibility_birth_chart: Json | null
          compatibility_numerology: Json | null
          id: string
          matched_at: string | null
          overall_compatibility_score: number | null
          tarot_reading: Json | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          compatibility_birth_chart?: Json | null
          compatibility_numerology?: Json | null
          id?: string
          matched_at?: string | null
          overall_compatibility_score?: number | null
          tarot_reading?: Json | null
          user1_id: string
          user2_id: string
        }
        Update: {
          compatibility_birth_chart?: Json | null
          compatibility_numerology?: Json | null
          id?: string
          matched_at?: string | null
          overall_compatibility_score?: number | null
          tarot_reading?: Json | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      message_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          message_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          forwarded_from: string | null
          id: string
          message_category: string | null
          pinned_at: string | null
          read: boolean | null
          receiver_id: string
          reply_to: string | null
          sender_id: string
          transcription: string | null
          transcription_language: string | null
          translation: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          forwarded_from?: string | null
          id?: string
          message_category?: string | null
          pinned_at?: string | null
          read?: boolean | null
          receiver_id: string
          reply_to?: string | null
          sender_id: string
          transcription?: string | null
          transcription_language?: string | null
          translation?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          forwarded_from?: string | null
          id?: string
          message_category?: string | null
          pinned_at?: string | null
          read?: boolean | null
          receiver_id?: string
          reply_to?: string | null
          sender_id?: string
          transcription?: string | null
          transcription_language?: string | null
          translation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_forwarded_from_fkey"
            columns: ["forwarded_from"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mission_completions: {
        Row: {
          completed_at: string | null
          credits_earned: number
          id: string
          mission_id: string | null
          mission_type: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          credits_earned: number
          id?: string
          mission_id?: string | null
          mission_type: string
          user_id: string
          xp_earned: number
        }
        Update: {
          completed_at?: string | null
          credits_earned?: number
          id?: string
          mission_id?: string | null
          mission_type?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "daily_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          alert_severity_threshold: string
          created_at: string
          enable_analysis_results: boolean
          enable_email_notifications: boolean
          enable_friend_accepted: boolean
          enable_friend_requests: boolean
          enable_group_invites: boolean
          enable_group_messages: boolean
          enable_match_notifications: boolean
          enable_mentions: boolean
          enable_new_messages: boolean
          enable_post_comments: boolean
          enable_post_likes: boolean
          enable_push_notifications: boolean
          error_alerts_enabled: boolean
          id: string
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_severity_threshold?: string
          created_at?: string
          enable_analysis_results?: boolean
          enable_email_notifications?: boolean
          enable_friend_accepted?: boolean
          enable_friend_requests?: boolean
          enable_group_invites?: boolean
          enable_group_messages?: boolean
          enable_match_notifications?: boolean
          enable_mentions?: boolean
          enable_new_messages?: boolean
          enable_post_comments?: boolean
          enable_post_likes?: boolean
          enable_push_notifications?: boolean
          error_alerts_enabled?: boolean
          id?: string
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_severity_threshold?: string
          created_at?: string
          enable_analysis_results?: boolean
          enable_email_notifications?: boolean
          enable_friend_accepted?: boolean
          enable_friend_requests?: boolean
          enable_group_invites?: boolean
          enable_group_messages?: boolean
          enable_match_notifications?: boolean
          enable_mentions?: boolean
          enable_new_messages?: boolean
          enable_post_comments?: boolean
          enable_post_likes?: boolean
          enable_push_notifications?: boolean
          error_alerts_enabled?: boolean
          id?: string
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      numerology_analyses: {
        Row: {
          birth_date: string
          created_at: string
          credits_used: number
          full_name: string
          id: string
          result: Json | null
          selected_topics: string[]
          user_id: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          credits_used: number
          full_name: string
          id?: string
          result?: Json | null
          selected_topics: string[]
          user_id: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          credits_used?: number
          full_name?: string
          id?: string
          result?: Json | null
          selected_topics?: string[]
          user_id?: string
        }
        Relationships: []
      }
      palmistry_readings: {
        Row: {
          created_at: string
          credits_used: number
          hand_image_data: string
          id: string
          interpretation: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          hand_image_data: string
          id?: string
          interpretation?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          hand_image_data?: string
          id?: string
          interpretation?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      passport_locations: {
        Row: {
          activated_at: string
          created_at: string
          credits_used: number
          expires_at: string
          id: string
          user_id: string
          virtual_latitude: number | null
          virtual_location: string
          virtual_longitude: number | null
        }
        Insert: {
          activated_at?: string
          created_at?: string
          credits_used?: number
          expires_at: string
          id?: string
          user_id: string
          virtual_latitude?: number | null
          virtual_location: string
          virtual_longitude?: number | null
        }
        Update: {
          activated_at?: string
          created_at?: string
          credits_used?: number
          expires_at?: string
          id?: string
          user_id?: string
          virtual_latitude?: number | null
          virtual_location?: string
          virtual_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "passport_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          connection_type: string | null
          created_at: string | null
          device_type: string | null
          id: string
          metric_name: string
          metric_value: number
          rating: string | null
          timestamp: string | null
          url: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          connection_type?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          metric_name: string
          metric_value: number
          rating?: string | null
          timestamp?: string | null
          url: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          connection_type?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          rating?: string | null
          timestamp?: string | null
          url?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      photo_verifications: {
        Row: {
          created_at: string
          id: string
          reference_photo_url: string
          rejected_reason: string | null
          selfie_url: string
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reference_photo_url: string
          rejected_reason?: string | null
          selfie_url: string
          updated_at?: string
          user_id: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reference_photo_url?: string
          rejected_reason?: string | null
          selfie_url?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_ids: string[]
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_ids: string[]
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_ids?: string[]
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          multiple_choice: boolean | null
          options: Json
          question: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          multiple_choice?: boolean | null
          options: Json
          question: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          multiple_choice?: boolean | null
          options?: Json
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string | null
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          shared_post_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          shared_post_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          shared_post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_shared_post_id_fkey"
            columns: ["shared_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          analysis_data: Json | null
          analysis_type: string | null
          content: string | null
          created_at: string | null
          id: string
          location_latitude: number | null
          location_longitude: number | null
          location_name: string | null
          media_type: string | null
          media_types: string[] | null
          media_url: string | null
          media_urls: string[] | null
          post_type: string | null
          quoted_post_id: string | null
          shared_post_id: string | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          analysis_type?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          media_type?: string | null
          media_types?: string[] | null
          media_url?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          quoted_post_id?: string | null
          shared_post_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          analysis_type?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          media_type?: string | null
          media_types?: string[] | null
          media_url?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          quoted_post_id?: string | null
          shared_post_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_quoted_post_id_fkey"
            columns: ["quoted_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_shared_post_id_fkey"
            columns: ["shared_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_boosts: {
        Row: {
          boost_type: string
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          boost_type: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          boost_type?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_translate_messages: boolean | null
          ban_reason: string | null
          bff_mode_enabled: boolean | null
          bio: string | null
          birth_date: string | null
          birth_place: string | null
          birth_time: string | null
          boost_end_time: string | null
          created_at: string
          credits: number
          current_location: string | null
          daily_streak: number | null
          daily_swipes_remaining: number | null
          full_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_banned: boolean | null
          is_online: boolean | null
          is_premium: boolean | null
          is_suspended: boolean | null
          is_verified: boolean | null
          last_daily_claim: string | null
          last_seen: string | null
          last_swipe_reset: string | null
          level: number | null
          looking_for: string[] | null
          looking_for_bff: string[] | null
          moderation_notes: string | null
          preferred_language: string | null
          profile_photo: string | null
          referral_code: string | null
          show_in_matches: boolean
          suspended_until: string | null
          suspension_reason: string | null
          total_missions_completed: number | null
          updated_at: string
          user_id: string
          username: string
          visibility: string | null
          xp: number | null
          zodiac_sign: string | null
        }
        Insert: {
          auto_translate_messages?: boolean | null
          ban_reason?: string | null
          bff_mode_enabled?: boolean | null
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          boost_end_time?: string | null
          created_at?: string
          credits?: number
          current_location?: string | null
          daily_streak?: number | null
          daily_swipes_remaining?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_banned?: boolean | null
          is_online?: boolean | null
          is_premium?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_daily_claim?: string | null
          last_seen?: string | null
          last_swipe_reset?: string | null
          level?: number | null
          looking_for?: string[] | null
          looking_for_bff?: string[] | null
          moderation_notes?: string | null
          preferred_language?: string | null
          profile_photo?: string | null
          referral_code?: string | null
          show_in_matches?: boolean
          suspended_until?: string | null
          suspension_reason?: string | null
          total_missions_completed?: number | null
          updated_at?: string
          user_id: string
          username: string
          visibility?: string | null
          xp?: number | null
          zodiac_sign?: string | null
        }
        Update: {
          auto_translate_messages?: boolean | null
          ban_reason?: string | null
          bff_mode_enabled?: boolean | null
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          boost_end_time?: string | null
          created_at?: string
          credits?: number
          current_location?: string | null
          daily_streak?: number | null
          daily_swipes_remaining?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_banned?: boolean | null
          is_online?: boolean | null
          is_premium?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_daily_claim?: string | null
          last_seen?: string | null
          last_swipe_reset?: string | null
          level?: number | null
          looking_for?: string[] | null
          looking_for_bff?: string[] | null
          moderation_notes?: string | null
          preferred_language?: string | null
          profile_photo?: string | null
          referral_code?: string | null
          show_in_matches?: boolean
          suspended_until?: string | null
          suspension_reason?: string | null
          total_missions_completed?: number | null
          updated_at?: string
          user_id?: string
          username?: string
          visibility?: string | null
          xp?: number | null
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string | null
          last_request_at: string | null
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: string | null
          last_request_at?: string | null
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string | null
          last_request_at?: string | null
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_claimed: boolean | null
          bonus_credits: number | null
          created_at: string | null
          id: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          bonus_claimed?: boolean | null
          bonus_credits?: number | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          bonus_claimed?: boolean | null
          bonus_credits?: number | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_content_id: string | null
          reported_content_type: string
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_content_id?: string | null
          reported_content_type: string
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_content_id?: string | null
          reported_content_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          collection_id: string | null
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          receiver_id: string
          scheduled_for: string
          sender_id: string
          sent: boolean | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          receiver_id: string
          scheduled_for: string
          sender_id: string
          sent?: boolean | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          receiver_id?: string
          scheduled_for?: string
          sender_id?: string
          sent?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          media_types: string[] | null
          media_urls: string[] | null
          scheduled_for: string
          sent: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_types?: string[] | null
          media_urls?: string[] | null
          scheduled_for: string
          sent?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_types?: string[] | null
          media_urls?: string[] | null
          scheduled_for?: string
          sent?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      search_history: {
        Row: {
          clicked_result_id: string | null
          clicked_result_type: string | null
          created_at: string | null
          id: string
          query: string
          result_count: number | null
          search_type: string | null
          user_id: string
        }
        Insert: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string | null
          id?: string
          query: string
          result_count?: number | null
          search_type?: string | null
          user_id: string
        }
        Update: {
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string | null
          id?: string
          query?: string
          result_count?: number | null
          search_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_analyses: {
        Row: {
          allowed_user_ids: string[] | null
          analysis_id: string
          analysis_type: string
          blocked_user_ids: string[] | null
          created_at: string | null
          id: string
          is_public: boolean | null
          is_visible: boolean | null
          shared_with_user_id: string | null
          user_id: string
          visibility_type: string | null
        }
        Insert: {
          allowed_user_ids?: string[] | null
          analysis_id: string
          analysis_type: string
          blocked_user_ids?: string[] | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          is_visible?: boolean | null
          shared_with_user_id?: string | null
          user_id: string
          visibility_type?: string | null
        }
        Update: {
          allowed_user_ids?: string[] | null
          analysis_id?: string
          analysis_type?: string
          blocked_user_ids?: string[] | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          is_visible?: boolean | null
          shared_with_user_id?: string | null
          user_id?: string
          visibility_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_analyses_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shared_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stories: {
        Row: {
          background_color: string | null
          created_at: string
          expires_at: string
          filter_name: string | null
          filter_value: string | null
          gifs: Json | null
          has_poll: boolean | null
          has_question: boolean | null
          id: string
          media_type: string
          media_url: string
          music_artist: string | null
          music_name: string | null
          music_url: string | null
          stickers: Json | null
          text_effects: Json | null
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          filter_name?: string | null
          filter_value?: string | null
          gifs?: Json | null
          has_poll?: boolean | null
          has_question?: boolean | null
          id?: string
          media_type: string
          media_url: string
          music_artist?: string | null
          music_name?: string | null
          music_url?: string | null
          stickers?: Json | null
          text_effects?: Json | null
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          filter_name?: string | null
          filter_value?: string | null
          gifs?: Json | null
          has_poll?: boolean | null
          has_question?: boolean | null
          id?: string
          media_type?: string
          media_url?: string
          music_artist?: string | null
          music_name?: string | null
          music_url?: string | null
          stickers?: Json | null
          text_effects?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      story_music_plays: {
        Row: {
          id: string
          played_at: string | null
          story_id: string
          user_id: string
        }
        Insert: {
          id?: string
          played_at?: string | null
          story_id: string
          user_id: string
        }
        Update: {
          id?: string
          played_at?: string | null
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_music_plays_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "story_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      story_polls: {
        Row: {
          created_at: string | null
          id: string
          options: Json
          question: string
          story_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          options: Json
          question: string
          story_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          options?: Json
          question?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_polls_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_question_answers: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "story_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      story_questions: {
        Row: {
          created_at: string | null
          id: string
          question: string
          story_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question: string
          story_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_questions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          action: string
          created_at: string | null
          credits_used: number
          id: string
          is_super_like: boolean | null
          target_user_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          credits_used?: number
          id?: string
          is_super_like?: boolean | null
          target_user_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          credits_used?: number
          id?: string
          is_super_like?: boolean | null
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tarot_readings: {
        Row: {
          created_at: string
          credits_used: number
          id: string
          interpretation: Json | null
          question: string | null
          selected_cards: Json
          spread_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          id?: string
          interpretation?: Json | null
          question?: string | null
          selected_cards: Json
          spread_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          id?: string
          interpretation?: Json | null
          question?: string | null
          selected_cards?: Json
          spread_type?: string
          user_id?: string
        }
        Relationships: []
      }
      transit_notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          is_read: boolean | null
          notification_date: string
          planet: string
          sign: string
          transit_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_read?: boolean | null
          notification_date: string
          planet: string
          sign: string
          transit_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_read?: boolean | null
          notification_date?: string
          planet?: string
          sign?: string
          transit_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trending_searches: {
        Row: {
          created_at: string | null
          id: string
          last_searched_at: string | null
          query: string
          search_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_searched_at?: string | null
          query: string
          search_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_searched_at?: string | null
          query?: string
          search_count?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          is_displayed: boolean | null
          progress: number | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          is_displayed?: boolean | null
          progress?: number | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          is_displayed?: boolean | null
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_leagues: {
        Row: {
          created_at: string
          current_league: string
          demoted_at: string | null
          id: string
          league_xp: number
          promoted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_league?: string
          demoted_at?: string | null
          id?: string
          league_xp?: number
          promoted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_league?: string
          demoted_at?: string | null
          id?: string
          league_xp?: number
          promoted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_leagues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_mission_progress: {
        Row: {
          claimed_at: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          id: string
          mission_date: string | null
          mission_id: string | null
          reward_claimed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          mission_date?: string | null
          mission_id?: string | null
          reward_claimed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          mission_date?: string | null
          mission_id?: string | null
          reward_claimed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "daily_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          moderator_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          moderator_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          moderator_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      user_sessions: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          events_count: number | null
          id: string
          last_page: string | null
          page_views: number | null
          session_id: string
          started_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          events_count?: number | null
          id?: string
          last_page?: string | null
          page_views?: number | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          events_count?: number | null
          id?: string
          last_page?: string | null
          page_views?: number | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_videos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          thumbnail_url: string | null
          title: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_weekly_progress: {
        Row: {
          challenge_id: string | null
          claimed_at: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          progress_data: Json | null
          reward_claimed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          claimed_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          reward_claimed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          claimed_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          reward_claimed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      video_calls: {
        Row: {
          caller_id: string
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          receiver_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          caller_id: string
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          receiver_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          caller_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          receiver_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      video_prompts: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          prompt_question: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          prompt_question?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          prompt_question?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      video_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_reactions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "user_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_views: {
        Row: {
          id: string
          video_id: string
          viewed_at: string | null
          viewer_id: string
          watch_duration: number | null
        }
        Insert: {
          id?: string
          video_id: string
          viewed_at?: string | null
          viewer_id: string
          watch_duration?: number | null
        }
        Update: {
          id?: string
          video_id?: string
          viewed_at?: string | null
          viewer_id?: string
          watch_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "user_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_gifts: {
        Row: {
          cost_credits: number
          created_at: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          cost_credits: number
          created_at?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          cost_credits?: number
          created_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      voice_prompts: {
        Row: {
          audio_url: string
          created_at: string
          duration_seconds: number
          id: string
          prompt_question: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration_seconds?: number
          id?: string
          prompt_question?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          prompt_question?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          badge_reward: string | null
          created_at: string | null
          credit_reward: number
          description: string | null
          end_date: string
          icon: string
          id: string
          is_active: boolean | null
          requirements: Json
          start_date: string
          title: string
          xp_reward: number
        }
        Insert: {
          badge_reward?: string | null
          created_at?: string | null
          credit_reward?: number
          description?: string | null
          end_date: string
          icon?: string
          id?: string
          is_active?: boolean | null
          requirements?: Json
          start_date: string
          title: string
          xp_reward?: number
        }
        Update: {
          badge_reward?: string | null
          created_at?: string | null
          credit_reward?: number
          description?: string | null
          end_date?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          requirements?: Json
          start_date?: string
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenges_badge_reward_fkey"
            columns: ["badge_reward"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_alert: {
        Args: { p_alert_log_id: string; p_user_id: string }
        Returns: undefined
      }
      check_mutual_match: {
        Args: { p_user1_id: string; p_user2_id: string }
        Returns: boolean
      }
      cleanup_expired_snoozes: { Args: never; Returns: undefined }
      create_group_with_admin: {
        Args: {
          p_created_by: string
          p_description: string
          p_name: string
          p_photo_url?: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_reference_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      deduct_credits_atomic: {
        Args: {
          p_amount: number
          p_description: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: number
      }
      delete_expired_stories: { Args: never; Returns: undefined }
      get_league_for_xp: { Args: { xp: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_hashtag_usage: { Args: { tag_text: string }; Returns: string }
      is_alert_snoozed: {
        Args: { p_alert_config_id: string; p_alert_type: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      reset_daily_swipes: { Args: never; Returns: undefined }
      send_scheduled_messages: { Args: never; Returns: undefined }
      update_trending_search: {
        Args: { search_query: string }
        Returns: undefined
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
