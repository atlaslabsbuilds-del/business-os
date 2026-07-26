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
          role: "owner" | "admin" | "member";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
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
          role: "owner" | "admin" | "member";
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
          role?: "owner" | "admin" | "member";
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
          role?: "owner" | "admin" | "member";
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
          title: string;
          body: string | null;
          action_url: string | null;
          read_at: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          module: string;
          type?: string;
          title: string;
          body?: string | null;
          action_url?: string | null;
          read_at?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          module?: string;
          type?: string;
          title?: string;
          body?: string | null;
          action_url?: string | null;
          read_at?: string | null;
          created_by?: string | null;
          metadata?: Json;
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
          stage: "qualified" | "proposal" | "negotiation" | "won" | "lost";
          probability: number;
          expected_close_date: string | null;
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
          stage?: "qualified" | "proposal" | "negotiation" | "won" | "lost";
          probability?: number;
          expected_close_date?: string | null;
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
          stage?: "qualified" | "proposal" | "negotiation" | "won" | "lost";
          probability?: number;
          expected_close_date?: string | null;
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
      workspace_role: "owner" | "admin" | "member";
      invitation_status: "pending" | "accepted" | "revoked" | "expired";
      crm_lifecycle_stage: "lead" | "qualified" | "customer" | "churned" | "other";
      crm_deal_stage: "qualified" | "proposal" | "negotiation" | "won" | "lost";
      crm_activity_type: "call" | "email" | "meeting" | "task" | "note" | "other";
      crm_entity_type: "contact" | "company" | "deal" | "lead";
      inbox_provider: "gmail" | "outlook";
      inbox_account_status: "connected" | "syncing" | "error" | "disconnected";
      inbox_thread_status: "open" | "archived" | "trashed" | "spam";
      inbox_message_direction: "inbound" | "outbound";
      inbox_task_status: "open" | "done" | "cancelled";
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
