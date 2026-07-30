export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "user" | "admin" | "owner";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "user" | "admin" | "owner";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: "user" | "admin" | "owner";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "user" | "admin" | "owner";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: "user" | "admin" | "owner";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "user" | "admin" | "owner";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "manager" | "member" | "guest";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "owner" | "admin" | "manager" | "member" | "guest";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "manager" | "member" | "guest";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: "owner" | "admin" | "manager" | "member" | "guest";
          status: "pending" | "accepted" | "revoked" | "expired";
          invited_by: string;
          token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role?: "owner" | "admin" | "manager" | "member" | "guest";
          status?: "pending" | "accepted" | "revoked" | "expired";
          invited_by: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: "owner" | "admin" | "manager" | "member" | "guest";
          status?: "pending" | "accepted" | "revoked" | "expired";
          invited_by?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_notifications: {
        Row: {
          id: string;
          workspace_id: string;
          module: string;
          type: string;
          category: string;
          priority: string;
          title: string;
          body: string | null;
          action_url: string | null;
          read_at: string | null;
          created_by: string | null;
          recipient_user_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          module: string;
          type?: string;
          category?: string;
          priority?: string;
          title: string;
          body?: string | null;
          action_url?: string | null;
          read_at?: string | null;
          created_by?: string | null;
          recipient_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          module?: string;
          type?: string;
          category?: string;
          priority?: string;
          title?: string;
          body?: string | null;
          action_url?: string | null;
          read_at?: string | null;
          created_by?: string | null;
          recipient_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_notification_states: {
        Row: {
          id: string;
          user_id: string;
          notification_id: string;
          read_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_id: string;
          read_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_id?: string;
          read_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_notification_preferences: {
        Row: {
          user_id: string;
          email_notifications: boolean;
          in_app_notifications: boolean;
          marketing_emails: boolean;
          product_updates: boolean;
          security_alerts: boolean;
          billing_alerts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_notifications?: boolean;
          in_app_notifications?: boolean;
          marketing_emails?: boolean;
          product_updates?: boolean;
          security_alerts?: boolean;
          billing_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email_notifications?: boolean;
          in_app_notifications?: boolean;
          marketing_emails?: boolean;
          product_updates?: boolean;
          security_alerts?: boolean;
          billing_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_activity_events: {
        Row: {
          id: string;
          workspace_id: string;
          module: string;
          event_type: string;
          title: string;
          body: string | null;
          entity_type: string | null;
          entity_id: string | null;
          actor_id: string | null;
          action_url: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          module: string;
          event_type: string;
          title: string;
          body?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          actor_id?: string | null;
          action_url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          module?: string;
          event_type?: string;
          title?: string;
          body?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          actor_id?: string | null;
          action_url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_ai_memory: {
        Row: {
          id: string;
          workspace_id: string;
          source_module: string;
          scope: string;
          fact: string;
          summary: string | null;
          importance: number;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          source_module?: string;
          scope?: string;
          fact: string;
          summary?: string | null;
          importance?: number;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          source_module?: string;
          scope?: string;
          fact?: string;
          summary?: string | null;
          importance?: number;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          title: string;
          model: string;
          provider: string;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          title?: string;
          model?: string;
          provider?: string;
          pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          title?: string;
          model?: string;
          provider?: string;
          pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          model: string | null;
          input_tokens: number;
          output_tokens: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content?: string;
          model?: string | null;
          input_tokens?: number;
          output_tokens?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          model?: string | null;
          input_tokens?: number;
          output_tokens?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_credits: {
        Row: {
          workspace_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          balance?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          amount: number;
          reason: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          amount: number;
          reason: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          amount?: number;
          reason?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      crm_companies: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          domain: string | null;
          industry: string | null;
          website: string | null;
          phone: string | null;
          description: string | null;
          employee_count: number | null;
          annual_revenue: number | null;
          metadata: Json;
          owner_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          domain?: string | null;
          industry?: string | null;
          website?: string | null;
          phone?: string | null;
          description?: string | null;
          employee_count?: number | null;
          annual_revenue?: number | null;
          metadata?: Json;
          owner_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          domain?: string | null;
          industry?: string | null;
          website?: string | null;
          phone?: string | null;
          description?: string | null;
          employee_count?: number | null;
          annual_revenue?: number | null;
          metadata?: Json;
          owner_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_contacts: {
        Row: {
          id: string;
          workspace_id: string;
          company_id: string | null;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          title: string | null;
          lifecycle_stage: "lead" | "qualified" | "customer" | "churned" | "other";
          source: string | null;
          priority: string;
          metadata: Json;
          owner_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          company_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          title?: string | null;
          lifecycle_stage?: "lead" | "qualified" | "customer" | "churned" | "other";
          source?: string | null;
          priority?: string;
          metadata?: Json;
          owner_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          company_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          title?: string | null;
          lifecycle_stage?: "lead" | "qualified" | "customer" | "churned" | "other";
          source?: string | null;
          priority?: string;
          metadata?: Json;
          owner_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_deals: {
        Row: {
          id: string;
          workspace_id: string;
          company_id: string | null;
          contact_id: string | null;
          title: string;
          amount: number;
          currency: string;
          stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
          probability: number;
          expected_close_date: string | null;
          products: Json;
          notes: string | null;
          metadata: Json;
          owner_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          company_id?: string | null;
          contact_id?: string | null;
          title: string;
          amount?: number;
          currency?: string;
          stage?: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
          probability?: number;
          expected_close_date?: string | null;
          products?: Json;
          notes?: string | null;
          metadata?: Json;
          owner_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          company_id?: string | null;
          contact_id?: string | null;
          title?: string;
          amount?: number;
          currency?: string;
          stage?: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
          probability?: number;
          expected_close_date?: string | null;
          products?: Json;
          notes?: string | null;
          metadata?: Json;
          owner_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_activities: {
        Row: {
          id: string;
          workspace_id: string;
          type: "call" | "email" | "meeting" | "task" | "note" | "other";
          subject: string;
          body: string | null;
          due_at: string | null;
          completed_at: string | null;
          contact_id: string | null;
          company_id: string | null;
          deal_id: string | null;
          owner_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type?: "call" | "email" | "meeting" | "task" | "note" | "other";
          subject: string;
          body?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          owner_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          type?: "call" | "email" | "meeting" | "task" | "note" | "other";
          subject?: string;
          body?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          owner_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_notes: {
        Row: {
          id: string;
          workspace_id: string;
          body: string;
          contact_id: string | null;
          company_id: string | null;
          deal_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          body: string;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          body?: string;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_tags: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_taggings: {
        Row: {
          id: string;
          workspace_id: string;
          tag_id: string;
          entity_type: "contact" | "company" | "deal" | "lead";
          entity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          tag_id: string;
          entity_type: "contact" | "company" | "deal" | "lead";
          entity_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          tag_id?: string;
          entity_type?: "contact" | "company" | "deal" | "lead";
          entity_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      crm_pipelines: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          name: string;
          is_default: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          name: string;
          is_default?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          name?: string;
          is_default?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_pipeline_stages: {
        Row: {
          id: string;
          workspace_id: string;
          pipeline_id: string;
          name: string;
          slug: string;
          position: number;
          probability: number;
          is_won: boolean;
          is_lost: boolean;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          pipeline_id: string;
          name: string;
          slug: string;
          position?: number;
          probability?: number;
          is_won?: boolean;
          is_lost?: boolean;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          pipeline_id?: string;
          name?: string;
          slug?: string;
          position?: number;
          probability?: number;
          is_won?: boolean;
          is_lost?: boolean;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_tasks: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          title: string;
          description: string | null;
          status: "open" | "in_progress" | "done" | "cancelled";
          priority: "low" | "medium" | "high" | "urgent";
          due_at: string | null;
          reminder_at: string | null;
          assignee_id: string | null;
          contact_id: string | null;
          company_id: string | null;
          deal_id: string | null;
          completed_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          status?: "open" | "in_progress" | "done" | "cancelled";
          priority?: "low" | "medium" | "high" | "urgent";
          due_at?: string | null;
          reminder_at?: string | null;
          assignee_id?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          status?: "open" | "in_progress" | "done" | "cancelled";
          priority?: "low" | "medium" | "high" | "urgent";
          due_at?: string | null;
          reminder_at?: string | null;
          assignee_id?: string | null;
          contact_id?: string | null;
          company_id?: string | null;
          deal_id?: string | null;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_attachments: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          entity_type: "contact" | "company" | "deal" | "lead";
          entity_id: string;
          file_name: string;
          file_path: string;
          mime_type: string | null;
          file_size: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          entity_type: "contact" | "company" | "deal" | "lead";
          entity_id: string;
          file_name: string;
          file_path: string;
          mime_type?: string | null;
          file_size?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          entity_type?: "contact" | "company" | "deal" | "lead";
          entity_id?: string;
          file_name?: string;
          file_path?: string;
          mime_type?: string | null;
          file_size?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_settings: {
        Row: {
          workspace_id: string;
          lead_sources: Json;
          custom_fields: Json;
          automation_rules: Json;
          default_pipeline_id: string | null;
          permissions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          lead_sources?: Json;
          custom_fields?: Json;
          automation_rules?: Json;
          default_pipeline_id?: string | null;
          permissions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          lead_sources?: Json;
          custom_fields?: Json;
          automation_rules?: Json;
          default_pipeline_id?: string | null;
          permissions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inbox_accounts: {
        Row: {
          id: string;
          workspace_id: string;
          provider: "gmail" | "outlook";
          email: string;
          display_name: string | null;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          scopes: string[];
          status: "connected" | "syncing" | "error" | "disconnected";
          last_synced_at: string | null;
          history_id: string | null;
          sync_error: string | null;
          metadata: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          provider: "gmail" | "outlook";
          email: string;
          display_name?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          status?: "connected" | "syncing" | "error" | "disconnected";
          last_synced_at?: string | null;
          history_id?: string | null;
          sync_error?: string | null;
          metadata?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          provider?: "gmail" | "outlook";
          email?: string;
          display_name?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          status?: "connected" | "syncing" | "error" | "disconnected";
          last_synced_at?: string | null;
          history_id?: string | null;
          sync_error?: string | null;
          metadata?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inbox_threads: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string;
          external_id: string | null;
          subject: string;
          snippet: string;
          participants: Json;
          status: "open" | "archived" | "trashed" | "spam";
          is_unread: boolean;
          is_starred: boolean;
          message_count: number;
          has_attachments: boolean;
          last_message_at: string;
          contact_id: string | null;
          company_id: string | null;
          ai_summary: string | null;
          ai_summary_structured: Json | null;
          ai_priority: string | null;
          ai_classification: string | null;
          ai_suggested_actions: Json;
          meeting_detected: boolean;
          meeting_confidence: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id: string;
          external_id?: string | null;
          subject?: string;
          snippet?: string;
          participants?: Json;
          status?: "open" | "archived" | "trashed" | "spam";
          is_unread?: boolean;
          is_starred?: boolean;
          message_count?: number;
          has_attachments?: boolean;
          last_message_at?: string;
          contact_id?: string | null;
          company_id?: string | null;
          ai_summary?: string | null;
          ai_summary_structured?: Json | null;
          ai_priority?: string | null;
          ai_classification?: string | null;
          ai_suggested_actions?: Json;
          meeting_detected?: boolean;
          meeting_confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string;
          external_id?: string | null;
          subject?: string;
          snippet?: string;
          participants?: Json;
          status?: "open" | "archived" | "trashed" | "spam";
          is_unread?: boolean;
          is_starred?: boolean;
          message_count?: number;
          has_attachments?: boolean;
          last_message_at?: string;
          contact_id?: string | null;
          company_id?: string | null;
          ai_summary?: string | null;
          ai_summary_structured?: Json | null;
          ai_priority?: string | null;
          ai_classification?: string | null;
          ai_suggested_actions?: Json;
          meeting_detected?: boolean;
          meeting_confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inbox_messages: {
        Row: {
          id: string;
          workspace_id: string;
          thread_id: string;
          account_id: string;
          external_id: string | null;
          direction: "inbound" | "outbound";
          from_email: string;
          from_name: string | null;
          to_emails: Json;
          cc_emails: Json;
          subject: string;
          body_text: string;
          body_html: string | null;
          sent_at: string;
          is_draft: boolean;
          ai_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          thread_id: string;
          account_id: string;
          external_id?: string | null;
          direction?: "inbound" | "outbound";
          from_email: string;
          from_name?: string | null;
          to_emails?: Json;
          cc_emails?: Json;
          subject?: string;
          body_text?: string;
          body_html?: string | null;
          sent_at?: string;
          is_draft?: boolean;
          ai_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          thread_id?: string;
          account_id?: string;
          external_id?: string | null;
          direction?: "inbound" | "outbound";
          from_email?: string;
          from_name?: string | null;
          to_emails?: Json;
          cc_emails?: Json;
          subject?: string;
          body_text?: string;
          body_html?: string | null;
          sent_at?: string;
          is_draft?: boolean;
          ai_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inbox_labels: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string | null;
          name: string;
          color: string;
          external_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id?: string | null;
          name: string;
          color?: string;
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string | null;
          name?: string;
          color?: string;
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inbox_thread_labels: {
        Row: {
          id: string;
          workspace_id: string;
          thread_id: string;
          label_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          thread_id: string;
          label_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          thread_id?: string;
          label_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      inbox_attachments: {
        Row: {
          id: string;
          workspace_id: string;
          message_id: string;
          filename: string;
          mime_type: string;
          size_bytes: number;
          storage_url: string | null;
          external_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          message_id: string;
          filename: string;
          mime_type?: string;
          size_bytes?: number;
          storage_url?: string | null;
          external_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          message_id?: string;
          filename?: string;
          mime_type?: string;
          size_bytes?: number;
          storage_url?: string | null;
          external_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      inbox_tasks: {
        Row: {
          id: string;
          workspace_id: string;
          thread_id: string | null;
          message_id: string | null;
          title: string;
          description: string | null;
          due_at: string | null;
          status: "open" | "done" | "cancelled";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          thread_id?: string | null;
          message_id?: string | null;
          title: string;
          description?: string | null;
          due_at?: string | null;
          status?: "open" | "done" | "cancelled";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          thread_id?: string | null;
          message_id?: string | null;
          title?: string;
          description?: string | null;
          due_at?: string | null;
          status?: "open" | "done" | "cancelled";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inbox_ai_reply_drafts: {
        Row: {
          id: string;
          workspace_id: string;
          thread_id: string;
          account_id: string | null;
          created_by: string;
          style: "professional" | "friendly" | "concise" | "detailed";
          body: string;
          subject: string | null;
          gmail_draft_id: string | null;
          gmail_message_id: string | null;
          status: "draft" | "sent" | "discarded";
          credits_used: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          thread_id: string;
          account_id?: string | null;
          created_by: string;
          style?: "professional" | "friendly" | "concise" | "detailed";
          body: string;
          subject?: string | null;
          gmail_draft_id?: string | null;
          gmail_message_id?: string | null;
          status?: "draft" | "sent" | "discarded";
          credits_used?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          thread_id?: string;
          account_id?: string | null;
          created_by?: string;
          style?: "professional" | "friendly" | "concise" | "detailed";
          body?: string;
          subject?: string | null;
          gmail_draft_id?: string | null;
          gmail_message_id?: string | null;
          status?: "draft" | "sent" | "discarded";
          credits_used?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
        };
        Relationships: [];
      };
      inbox_calendar_events: {
        Row: {
          id: string;
          workspace_id: string;
          thread_id: string | null;
          title: string;
          starts_at: string;
          ends_at: string;
          location: string | null;
          attendees: Json;
          provider: "gmail" | "outlook" | null;
          external_id: string | null;
          status: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          thread_id?: string | null;
          title: string;
          starts_at: string;
          ends_at: string;
          location?: string | null;
          attendees?: Json;
          provider?: "gmail" | "outlook" | null;
          external_id?: string | null;
          status?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          thread_id?: string | null;
          title?: string;
          starts_at?: string;
          ends_at?: string;
          location?: string | null;
          attendees?: Json;
          provider?: "gmail" | "outlook" | null;
          external_id?: string | null;
          status?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_items: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          title: string;
          body: string;
          content_type: string;
          status: "draft" | "scheduled" | "published" | "archived";
          scheduled_at: string | null;
          published_at: string | null;
          tags: string[];
          ai_generated: boolean;
          source_item_id: string | null;
          analytics: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          title?: string;
          body?: string;
          content_type?: string;
          status?: "draft" | "scheduled" | "published" | "archived";
          scheduled_at?: string | null;
          published_at?: string | null;
          tags?: string[];
          ai_generated?: boolean;
          source_item_id?: string | null;
          analytics?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          title?: string;
          body?: string;
          content_type?: string;
          status?: "draft" | "scheduled" | "published" | "archived";
          scheduled_at?: string | null;
          published_at?: string | null;
          tags?: string[];
          ai_generated?: boolean;
          source_item_id?: string | null;
          analytics?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_brand_voices: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          tone: string;
          writing_style: string;
          cta_preferences: string;
          keywords: string[];
          audience_profile: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          tone?: string;
          writing_style?: string;
          cta_preferences?: string;
          keywords?: string[];
          audience_profile?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          tone?: string;
          writing_style?: string;
          cta_preferences?: string;
          keywords?: string[];
          audience_profile?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_assets: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          name: string;
          asset_type: string;
          url: string | null;
          storage_path: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          name: string;
          asset_type?: string;
          url?: string | null;
          storage_path?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          name?: string;
          asset_type?: string;
          url?: string | null;
          storage_path?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      content_templates: {
        Row: {
          id: string;
          workspace_id: string | null;
          created_by: string | null;
          name: string;
          template_type: string;
          body: string;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          created_by?: string | null;
          name: string;
          template_type: string;
          body: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          created_by?: string | null;
          name?: string;
          template_type?: string;
          body?: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_accounts: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          platform: string;
          handle: string;
          display_name: string | null;
          status: "connected" | "disconnected" | "error";
          external_id: string | null;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          platform: string;
          handle: string;
          display_name?: string | null;
          status?: "connected" | "disconnected" | "error";
          external_id?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          platform?: string;
          handle?: string;
          display_name?: string | null;
          status?: "connected" | "disconnected" | "error";
          external_id?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_posts: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          assigned_to: string | null;
          source_content_id: string | null;
          title: string;
          body: string;
          media: Json;
          platforms: string[];
          status: "draft" | "queued" | "scheduled" | "published" | "failed";
          approval_status: "not_required" | "pending" | "approved" | "rejected";
          scheduled_at: string | null;
          published_at: string | null;
          failure_reason: string | null;
          analytics: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          assigned_to?: string | null;
          source_content_id?: string | null;
          title?: string;
          body?: string;
          media?: Json;
          platforms?: string[];
          status?: "draft" | "queued" | "scheduled" | "published" | "failed";
          approval_status?: "not_required" | "pending" | "approved" | "rejected";
          scheduled_at?: string | null;
          published_at?: string | null;
          failure_reason?: string | null;
          analytics?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          assigned_to?: string | null;
          source_content_id?: string | null;
          title?: string;
          body?: string;
          media?: Json;
          platforms?: string[];
          status?: "draft" | "queued" | "scheduled" | "published" | "failed";
          approval_status?: "not_required" | "pending" | "approved" | "rejected";
          scheduled_at?: string | null;
          published_at?: string | null;
          failure_reason?: string | null;
          analytics?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_engagement: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string | null;
          post_id: string | null;
          engagement_type: "comment" | "mention" | "message";
          author_name: string | null;
          body: string;
          external_id: string | null;
          status: "open" | "replied" | "archived";
          reply_suggestion: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id?: string | null;
          post_id?: string | null;
          engagement_type: "comment" | "mention" | "message";
          author_name?: string | null;
          body: string;
          external_id?: string | null;
          status?: "open" | "replied" | "archived";
          reply_suggestion?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string | null;
          post_id?: string | null;
          engagement_type?: "comment" | "mention" | "message";
          author_name?: string | null;
          body?: string;
          external_id?: string | null;
          status?: "open" | "replied" | "archived";
          reply_suggestion?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      social_analytics_snapshots: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string | null;
          post_id: string | null;
          captured_at: string;
          followers: number;
          reach: number;
          impressions: number;
          engagement_rate: number;
          clicks: number;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id?: string | null;
          post_id?: string | null;
          captured_at?: string;
          followers?: number;
          reach?: number;
          impressions?: number;
          engagement_rate?: number;
          clicks?: number;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string | null;
          post_id?: string | null;
          captured_at?: string;
          followers?: number;
          reach?: number;
          impressions?: number;
          engagement_rate?: number;
          clicks?: number;
        };
        Relationships: [];
      };
      website_projects: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          name: string;
          project_type: string;
          template: string;
          status: "draft" | "published" | "archived";
          slug: string;
          theme: Json;
          settings: Json;
          analytics: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          name: string;
          project_type?: string;
          template?: string;
          status?: "draft" | "published" | "archived";
          slug: string;
          theme?: Json;
          settings?: Json;
          analytics?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          name?: string;
          project_type?: string;
          template?: string;
          status?: "draft" | "published" | "archived";
          slug?: string;
          theme?: Json;
          settings?: Json;
          analytics?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      website_pages: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          created_by: string;
          title: string;
          slug: string;
          blocks: Json;
          seo: Json;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          created_by: string;
          title: string;
          slug: string;
          blocks?: Json;
          seo?: Json;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string;
          created_by?: string;
          title?: string;
          slug?: string;
          blocks?: Json;
          seo?: Json;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      website_links: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          created_by: string;
          label: string;
          url: string;
          icon: string | null;
          sort_order: number;
          clicks: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          created_by: string;
          label: string;
          url: string;
          icon?: string | null;
          sort_order?: number;
          clicks?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string;
          created_by?: string;
          label?: string;
          url?: string;
          icon?: string | null;
          sort_order?: number;
          clicks?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      website_forms: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          created_by: string;
          name: string;
          form_type: string;
          fields: Json;
          submissions: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          created_by: string;
          name: string;
          form_type?: string;
          fields?: Json;
          submissions?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          created_by?: string;
          name?: string;
          form_type?: string;
          fields?: Json;
          submissions?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      website_domains: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          domain: string;
          status: string;
          ssl_status: string;
          dns_instructions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          domain: string;
          status?: string;
          ssl_status?: string;
          dns_instructions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          domain?: string;
          status?: string;
          ssl_status?: string;
          dns_instructions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          id: string;
          name: string;
          email: string;
          company: string | null;
          team_size: string;
          status: string;
          referral_code: string;
          referred_by: string | null;
          share_company_publicly: boolean;
          marketing_consent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          company?: string | null;
          team_size: string;
          status?: string;
          referral_code: string;
          referred_by?: string | null;
          share_company_publicly?: boolean;
          marketing_consent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          team_size?: string;
          status?: string;
          referral_code?: string;
          referred_by?: string | null;
          share_company_publicly?: boolean;
          marketing_consent?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waitlist_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "waitlist";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          company: string | null;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          company?: string | null;
          message: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          message?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      finance_invoices: {
        Row: {
          id: string; workspace_id: string; created_by: string; customer_id: string | null;
          customer_name: string; invoice_number: string; status: string; items: Json;
          subtotal: number; tax: number; discount: number; total: number; currency: string;
          notes: string | null; due_date: string | null; paid_at: string | null;
          provider: string | null; provider_invoice_id: string | null; metadata: Json;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; customer_id?: string | null;
          customer_name: string; invoice_number: string; status?: string; items?: Json;
          subtotal?: number; tax?: number; discount?: number; total?: number; currency?: string;
          notes?: string | null; due_date?: string | null; paid_at?: string | null;
          provider?: string | null; provider_invoice_id?: string | null; metadata?: Json;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; customer_id?: string | null;
          customer_name?: string; invoice_number?: string; status?: string; items?: Json;
          subtotal?: number; tax?: number; discount?: number; total?: number; currency?: string;
          notes?: string | null; due_date?: string | null; paid_at?: string | null;
          provider?: string | null; provider_invoice_id?: string | null; metadata?: Json;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      finance_expenses: {
        Row: {
          id: string; workspace_id: string; created_by: string; category: string; vendor: string;
          amount: number; currency: string; expense_date: string; notes: string | null;
          receipt_path: string | null; status: string; provider: string | null;
          provider_transaction_id: string | null; metadata: Json; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; category: string; vendor: string;
          amount: number; currency?: string; expense_date?: string; notes?: string | null;
          receipt_path?: string | null; status?: string; provider?: string | null;
          provider_transaction_id?: string | null; metadata?: Json; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; category?: string; vendor?: string;
          amount?: number; currency?: string; expense_date?: string; notes?: string | null;
          receipt_path?: string | null; status?: string; provider?: string | null;
          provider_transaction_id?: string | null; metadata?: Json; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      finance_transactions: {
        Row: {
          id: string; workspace_id: string; created_by: string; type: string; description: string;
          amount: number; currency: string; transaction_date: string; reference_id: string | null;
          provider: string | null; provider_transaction_id: string | null; metadata: Json; created_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; type: string; description: string;
          amount: number; currency?: string; transaction_date?: string; reference_id?: string | null;
          provider?: string | null; provider_transaction_id?: string | null; metadata?: Json; created_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; type?: string; description?: string;
          amount?: number; currency?: string; transaction_date?: string; reference_id?: string | null;
          provider?: string | null; provider_transaction_id?: string | null; metadata?: Json; created_at?: string;
        };
        Relationships: [];
      };
      finance_customers: {
        Row: {
          id: string; workspace_id: string; created_by: string; crm_company_id: string | null;
          name: string; email: string | null; phone: string | null; billing_address: string | null;
          notes: string | null; metadata: Json; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; crm_company_id?: string | null;
          name: string; email?: string | null; phone?: string | null; billing_address?: string | null;
          notes?: string | null; metadata?: Json; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; crm_company_id?: string | null;
          name?: string; email?: string | null; phone?: string | null; billing_address?: string | null;
          notes?: string | null; metadata?: Json; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      finance_vendors: {
        Row: {
          id: string; workspace_id: string; created_by: string; name: string; email: string | null;
          category: string | null; notes: string | null; metadata: Json; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; name: string; email?: string | null;
          category?: string | null; notes?: string | null; metadata?: Json; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; name?: string; email?: string | null;
          category?: string | null; notes?: string | null; metadata?: Json; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      finance_invoice_items: {
        Row: {
          id: string; workspace_id: string; invoice_id: string; description: string; quantity: number;
          unit_price: number; amount: number; sort_order: number; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; invoice_id: string; description: string; quantity?: number;
          unit_price?: number; amount?: number; sort_order?: number; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; invoice_id?: string; description?: string; quantity?: number;
          unit_price?: number; amount?: number; sort_order?: number; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      finance_budgets: {
        Row: {
          id: string; workspace_id: string; created_by: string; name: string; category: string | null;
          department: string | null; period_start: string; period_end: string; amount: number;
          alert_threshold: number; status: string; notes: string | null; metadata: Json;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; name: string; category?: string | null;
          department?: string | null; period_start: string; period_end: string; amount: number;
          alert_threshold?: number; status?: string; notes?: string | null; metadata?: Json;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; name?: string; category?: string | null;
          department?: string | null; period_start?: string; period_end?: string; amount?: number;
          alert_threshold?: number; status?: string; notes?: string | null; metadata?: Json;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      finance_cash_flow: {
        Row: {
          id: string; workspace_id: string; created_by: string; flow_type: string; description: string;
          category: string | null; amount: number; currency: string; flow_date: string;
          is_forecast: boolean; status: string; reference_id: string | null; metadata: Json;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; flow_type: string; description: string;
          category?: string | null; amount: number; currency?: string; flow_date?: string;
          is_forecast?: boolean; status?: string; reference_id?: string | null; metadata?: Json;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; flow_type?: string; description?: string;
          category?: string | null; amount?: number; currency?: string; flow_date?: string;
          is_forecast?: boolean; status?: string; reference_id?: string | null; metadata?: Json;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      finance_reports: {
        Row: {
          id: string; workspace_id: string; created_by: string; report_type: string; period_start: string;
          period_end: string; title: string; summary: string | null; data: Json; format: string;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; report_type: string; period_start: string;
          period_end: string; title: string; summary?: string | null; data?: Json; format?: string;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; report_type?: string; period_start?: string;
          period_end?: string; title?: string; summary?: string | null; data?: Json; format?: string;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      finance_settings: {
        Row: {
          workspace_id: string; currency: string; tax_rate: number; invoice_number_format: string;
          fiscal_year_start_month: number; payment_methods: Json; default_categories: Json;
          created_at: string; updated_at: string;
        };
        Insert: {
          workspace_id: string; currency?: string; tax_rate?: number; invoice_number_format?: string;
          fiscal_year_start_month?: number; payment_methods?: Json; default_categories?: Json;
          created_at?: string; updated_at?: string;
        };
        Update: {
          workspace_id?: string; currency?: string; tax_rate?: number; invoice_number_format?: string;
          fiscal_year_start_month?: number; payment_methods?: Json; default_categories?: Json;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      feedback_items: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          title: string;
          description: string;
          category: string;
          priority: string;
          status: string;
          screenshot_path: string | null;
          assignee_id: string | null;
          vote_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          title: string;
          description: string;
          category: string;
          priority?: string;
          status?: string;
          screenshot_path?: string | null;
          assignee_id?: string | null;
          vote_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          title?: string;
          description?: string;
          category?: string;
          priority?: string;
          status?: string;
          screenshot_path?: string | null;
          assignee_id?: string | null;
          vote_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feedback_votes: {
        Row: {
          id: string;
          feedback_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          feedback_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          feedback_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      calendar_booking_links: {
        Row: {
          id: string; workspace_id: string; created_by: string; name: string; slug: string;
          duration_minutes: number; buffer_minutes: number; timezone: string;
          working_hours: Json; active: boolean; booking_count: number; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; name: string; slug: string;
          duration_minutes?: number; buffer_minutes?: number; timezone?: string; working_hours?: Json;
          active?: boolean; booking_count?: number; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; name?: string; slug?: string;
          duration_minutes?: number; buffer_minutes?: number; timezone?: string; working_hours?: Json;
          active?: boolean; booking_count?: number; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      calendar_availability: {
        Row: {
          id: string; workspace_id: string; created_by: string; name: string; timezone: string;
          working_days: Json; hours: Json; holidays: Json; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; created_by: string; name?: string; timezone?: string;
          working_days?: Json; hours?: Json; holidays?: Json; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; created_by?: string; name?: string; timezone?: string;
          working_days?: Json; hours?: Json; holidays?: Json; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      calendar_meeting_notes: {
        Row: {
          id: string; workspace_id: string; event_id: string | null; created_by: string;
          summary: string; action_items: Json; crm_synced: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; event_id?: string | null; created_by: string;
          summary?: string; action_items?: Json; crm_synced?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; event_id?: string | null; created_by?: string;
          summary?: string; action_items?: Json; crm_synced?: boolean; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      calendar_reminders: {
        Row: {
          id: string; workspace_id: string; event_id: string | null; booking_link_id: string | null;
          created_by: string; channel: string; minutes_before: number; sent_at: string | null; created_at: string;
        };
        Insert: {
          id?: string; workspace_id: string; event_id?: string | null; booking_link_id?: string | null;
          created_by: string; channel?: string; minutes_before?: number; sent_at?: string | null; created_at?: string;
        };
        Update: {
          id?: string; workspace_id?: string; event_id?: string | null; booking_link_id?: string | null;
          created_by?: string; channel?: string; minutes_before?: number; sent_at?: string | null; created_at?: string;
        };
        Relationships: [];
      };
      security_audit_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          actor_user_id: string | null;
          event_type: string;
          resource_type: string | null;
          resource_id: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          actor_user_id?: string | null;
          event_type: string;
          resource_type?: string | null;
          resource_id?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          actor_user_id?: string | null;
          event_type?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_ai_settings: {
        Row: {
          workspace_id: string;
          memory_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          memory_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          memory_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kairos_agent_runs: {
        Row: {
          id: string;
          workspace_id: string;
          agent_id: string;
          title: string;
          prompt: string;
          status: string;
          result_summary: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          agent_id: string;
          title: string;
          prompt?: string;
          status?: string;
          result_summary?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          agent_id?: string;
          title?: string;
          prompt?: string;
          status?: string;
          result_summary?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_output_versions: {
        Row: {
          id: string;
          workspace_id: string;
          entity_type: string;
          entity_id: string | null;
          title: string;
          content: string;
          version_number: number;
          is_current: boolean;
          created_by: string | null;
          parent_version_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          entity_type: string;
          entity_id?: string | null;
          title?: string;
          content?: string;
          version_number?: number;
          is_current?: boolean;
          created_by?: string | null;
          parent_version_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          entity_type?: string;
          entity_id?: string | null;
          title?: string;
          content?: string;
          version_number?: number;
          is_current?: boolean;
          created_by?: string | null;
          parent_version_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_onboarding_progress: {
        Row: {
          workspace_id: string;
          completed_steps: Json;
          celebrated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          completed_steps?: Json;
          celebrated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          completed_steps?: Json;
          celebrated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_ai_suggestions: {
        Row: {
          id: string;
          workspace_id: string;
          module: string;
          title: string;
          body: string;
          action_label: string | null;
          action_url: string | null;
          severity: string;
          dismissed_at: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          module?: string;
          title: string;
          body?: string;
          action_label?: string | null;
          action_url?: string | null;
          severity?: string;
          dismissed_at?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          module?: string;
          title?: string;
          body?: string;
          action_label?: string | null;
          action_url?: string | null;
          severity?: string;
          dismissed_at?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integrations: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string;
          logo_key: string | null;
          auth_type: string;
          featured: boolean;
          launch: boolean;
          kairos_actions: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          category: string;
          description?: string;
          logo_key?: string | null;
          auth_type?: string;
          featured?: boolean;
          launch?: boolean;
          kairos_actions?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string;
          logo_key?: string | null;
          auth_type?: string;
          featured?: boolean;
          launch?: boolean;
          kairos_actions?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_accounts: {
        Row: {
          id: string;
          workspace_id: string;
          provider: string;
          account_email: string | null;
          account_name: string | null;
          external_account_id: string | null;
          status:
            | "connected"
            | "not_connected"
            | "error"
            | "syncing"
            | "disconnected";
          permissions: string[];
          scopes: string[];
          last_sync_at: string | null;
          sync_frequency: string;
          auto_sync: boolean;
          notifications_enabled: boolean;
          kairos_access: boolean;
          health: string;
          error_message: string | null;
          connected_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          provider: string;
          account_email?: string | null;
          account_name?: string | null;
          external_account_id?: string | null;
          status?:
            | "connected"
            | "not_connected"
            | "error"
            | "syncing"
            | "disconnected";
          permissions?: string[];
          scopes?: string[];
          last_sync_at?: string | null;
          sync_frequency?: string;
          auto_sync?: boolean;
          notifications_enabled?: boolean;
          kairos_access?: boolean;
          health?: string;
          error_message?: string | null;
          connected_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          provider?: string;
          account_email?: string | null;
          account_name?: string | null;
          external_account_id?: string | null;
          status?:
            | "connected"
            | "not_connected"
            | "error"
            | "syncing"
            | "disconnected";
          permissions?: string[];
          scopes?: string[];
          last_sync_at?: string | null;
          sync_frequency?: string;
          auto_sync?: boolean;
          notifications_enabled?: boolean;
          kairos_access?: boolean;
          health?: string;
          error_message?: string | null;
          connected_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_tokens: {
        Row: {
          id: string;
          account_id: string;
          workspace_id: string;
          access_token_encrypted: string;
          refresh_token_encrypted: string | null;
          token_type: string;
          expires_at: string | null;
          encryption_version: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          workspace_id: string;
          access_token_encrypted: string;
          refresh_token_encrypted?: string | null;
          token_type?: string;
          expires_at?: string | null;
          encryption_version?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          workspace_id?: string;
          access_token_encrypted?: string;
          refresh_token_encrypted?: string | null;
          token_type?: string;
          expires_at?: string | null;
          encryption_version?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_activity: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string | null;
          provider: string;
          event_type:
            | "connected"
            | "disconnected"
            | "permission_updated"
            | "manual_sync"
            | "automatic_sync"
            | "error"
            | "token_refreshed"
            | "reconnect";
          title: string;
          body: string | null;
          actor_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id?: string | null;
          provider: string;
          event_type:
            | "connected"
            | "disconnected"
            | "permission_updated"
            | "manual_sync"
            | "automatic_sync"
            | "error"
            | "token_refreshed"
            | "reconnect";
          title: string;
          body?: string | null;
          actor_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string | null;
          provider?: string;
          event_type?:
            | "connected"
            | "disconnected"
            | "permission_updated"
            | "manual_sync"
            | "automatic_sync"
            | "error"
            | "token_refreshed"
            | "reconnect";
          title?: string;
          body?: string | null;
          actor_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      integration_sync_jobs: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string;
          provider: string;
          status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
          trigger: string;
          attempts: number;
          max_attempts: number;
          started_at: string | null;
          finished_at: string | null;
          error_message: string | null;
          result: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id: string;
          provider: string;
          status?: "queued" | "running" | "succeeded" | "failed" | "cancelled";
          trigger?: string;
          attempts?: number;
          max_attempts?: number;
          started_at?: string | null;
          finished_at?: string | null;
          error_message?: string | null;
          result?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string;
          provider?: string;
          status?: "queued" | "running" | "succeeded" | "failed" | "cancelled";
          trigger?: string;
          attempts?: number;
          max_attempts?: number;
          started_at?: string | null;
          finished_at?: string | null;
          error_message?: string | null;
          result?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_workspace: {
        Args: {
          workspace_name: string;
          workspace_slug: string;
        };
        Returns: Database["public"]["Tables"]["workspaces"]["Row"];
      };
      is_workspace_member: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      is_workspace_admin: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: { target_workspace_id: string };
        Returns: boolean;
      };
      transfer_workspace_ownership: {
        Args: {
          target_workspace_id: string;
          new_owner_user_id: string;
        };
        Returns: Database["public"]["Tables"]["workspaces"]["Row"];
      };
      delete_workspace: {
        Args: { target_workspace_id: string };
        Returns: undefined;
      };
      get_waitlist_public_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      deduct_workspace_credits: {
        Args: {
          target_workspace_id: string;
          deduct_amount: number;
          reason: string;
          metadata?: Json;
        };
        Returns: number;
      };
    };
    Enums: {
      app_role: "user" | "admin" | "owner";
      workspace_role: "owner" | "admin" | "manager" | "member" | "guest";
      invitation_status: "pending" | "accepted" | "revoked" | "expired";
      crm_lifecycle_stage: "lead" | "qualified" | "customer" | "churned" | "other";
      crm_deal_stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
      crm_activity_type: "call" | "email" | "meeting" | "task" | "note" | "other";
      crm_entity_type: "contact" | "company" | "deal" | "lead";
      inbox_provider: "gmail" | "outlook";
      inbox_account_status: "connected" | "syncing" | "error" | "disconnected";
      inbox_thread_status: "open" | "archived" | "trashed" | "spam";
      inbox_message_direction: "inbound" | "outbound";
      inbox_task_status: "open" | "done" | "cancelled";
      integration_connection_status:
        | "connected"
        | "not_connected"
        | "error"
        | "syncing"
        | "disconnected";
      integration_activity_event:
        | "connected"
        | "disconnected"
        | "permission_updated"
        | "manual_sync"
        | "automatic_sync"
        | "error"
        | "token_refreshed"
        | "reconnect";
      integration_sync_job_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
