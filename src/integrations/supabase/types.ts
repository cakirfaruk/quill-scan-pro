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
          sender_id: string
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
          sender_id: string
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
          sender_id?: string
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
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
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
      posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          media_type: string | null
          media_types: string[] | null
          media_url: string | null
          media_urls: string[] | null
          post_type: string | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_types?: string[] | null
          media_url?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_types?: string[] | null
          media_url?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
          bio: string | null
          birth_date: string | null
          birth_place: string | null
          birth_time: string | null
          created_at: string
          credits: number
          current_location: string | null
          full_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_online: boolean | null
          last_seen: string | null
          looking_for: string[] | null
          profile_photo: string | null
          show_in_matches: boolean
          updated_at: string
          user_id: string
          username: string
          visibility: string | null
          zodiac_sign: string | null
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          created_at?: string
          credits?: number
          current_location?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_online?: boolean | null
          last_seen?: string | null
          looking_for?: string[] | null
          profile_photo?: string | null
          show_in_matches?: boolean
          updated_at?: string
          user_id: string
          username: string
          visibility?: string | null
          zodiac_sign?: string | null
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          created_at?: string
          credits?: number
          current_location?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_online?: boolean | null
          last_seen?: string | null
          looking_for?: string[] | null
          profile_photo?: string | null
          show_in_matches?: boolean
          updated_at?: string
          user_id?: string
          username?: string
          visibility?: string | null
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
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
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
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          is_displayed: boolean | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          is_displayed?: boolean | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          is_displayed?: boolean | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_mutual_match: {
        Args: { p_user1_id: string; p_user2_id: string }
        Returns: boolean
      }
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
      delete_expired_stories: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_hashtag_usage: { Args: { tag_text: string }; Returns: string }
      send_scheduled_messages: { Args: never; Returns: undefined }
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
