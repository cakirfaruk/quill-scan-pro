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
          media_url: string | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
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
      profiles: {
        Row: {
          bio: string | null
          birth_date: string | null
          birth_place: string | null
          birth_time: string | null
          created_at: string
          credits: number
          full_name: string | null
          gender: string | null
          id: string
          profile_photo: string | null
          show_in_matches: boolean
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          created_at?: string
          credits?: number
          full_name?: string | null
          gender?: string | null
          id?: string
          profile_photo?: string | null
          show_in_matches?: boolean
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          created_at?: string
          credits?: number
          full_name?: string | null
          gender?: string | null
          id?: string
          profile_photo?: string | null
          show_in_matches?: boolean
          updated_at?: string
          user_id?: string
          username?: string
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
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          media_type: string
          media_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: []
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
          target_user_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          credits_used?: number
          id?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          credits_used?: number
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_mutual_match: {
        Args: { p_user1_id: string; p_user2_id: string }
        Returns: boolean
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
