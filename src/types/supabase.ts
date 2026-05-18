export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          business_name: string | null
          city: string | null
          state: string | null
          phone: string | null
          email: string
          website: string | null
          bio: string | null
          headshot_url: string | null
          years_experience: number
          rating: number
          total_reviews: number
          price_min: number
          price_max: number
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_youtube: string | null
          photo_gallery: string[] | null
          video_url: string | null
          created_at: string
          updated_at: string
          user_type?: string | null
          wedding_date?: string | null
          partner_name?: string | null
          location?: string | null
          square_customer_id?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          business_name?: string | null
          city?: string | null
          state?: string | null
          phone?: string | null
          email: string
          website?: string | null
          bio?: string | null
          headshot_url?: string | null
          years_experience?: number
          rating?: number
          total_reviews?: number
          price_min?: number
          price_max?: number
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          photo_gallery?: string[] | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
          user_type?: string | null
          wedding_date?: string | null
          partner_name?: string | null
          location?: string | null
          square_customer_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          business_name?: string | null
          city?: string | null
          state?: string | null
          phone?: string | null
          email?: string
          website?: string | null
          bio?: string | null
          headshot_url?: string | null
          years_experience?: number
          rating?: number
          total_reviews?: number
          price_min?: number
          price_max?: number
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          photo_gallery?: string[] | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
          user_type?: string | null
          wedding_date?: string | null
          partner_name?: string | null
          location?: string | null
          square_customer_id?: string | null
        }
      }
      couples: {
        Row: {
          id: number
          user_id: string
          bride_name: string
          bride_email: string | null
          bride_phone: string | null
          bride_address: string | null
          groom_name: string
          groom_email: string | null
          groom_phone: string | null
          groom_address: string | null
          address: string | null
          emergency_contact: string | null
          special_requests: string | null
          is_active: boolean
          colors: Json | null
          created_at: string
          updated_at: string
          venue_name?: string | null
          venue_address?: string | null
          wedding_date?: string | null
          start_time?: string | null
          end_time?: string | null
          expected_guests?: number | null
          notes?: string | null
        }
        Insert: {
          id?: number
          user_id: string
          bride_name: string
          bride_email?: string | null
          bride_phone?: string | null
          bride_address?: string | null
          groom_name: string
          groom_email?: string | null
          groom_phone?: string | null
          groom_address?: string | null
          address?: string | null
          emergency_contact?: string | null
          special_requests?: string | null
          is_active?: boolean
          colors?: Json | null
          created_at?: string
          updated_at?: string
          venue_name?: string | null
          venue_address?: string | null
          wedding_date?: string | null
          start_time?: string | null
          end_time?: string | null
          expected_guests?: number | null
          notes?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          bride_name?: string
          bride_email?: string | null
          bride_phone?: string | null
          bride_address?: string | null
          groom_name?: string
          groom_email?: string | null
          groom_phone?: string | null
          groom_address?: string | null
          address?: string | null
          emergency_contact?: string | null
          special_requests?: string | null
          is_active?: boolean
          colors?: Json | null
          created_at?: string
          updated_at?: string
          venue_name?: string | null
          venue_address?: string | null
          wedding_date?: string | null
          start_time?: string | null
          end_time?: string | null
          expected_guests?: number | null
          notes?: string | null
        }
      }
      ceremonies: {
        Row: {
          id: number
          couple_id: number
          user_id: string
          venue_name: string | null
          venue_address: string | null
          wedding_date: string | null
          start_time: string | null
          end_time: string | null
          expected_guests: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          couple_id: number
          user_id: string
          venue_name?: string | null
          venue_address?: string | null
          wedding_date?: string | null
          start_time?: string | null
          end_time?: string | null
          expected_guests?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          couple_id?: number
          user_id?: string
          venue_name?: string | null
          venue_address?: string | null
          wedding_date?: string | null
          start_time?: string | null
          end_time?: string | null
          expected_guests?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'aspirant' | 'professional'
          status: 'active' | 'canceled' | 'past_due'
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier?: 'aspirant' | 'professional'
          status?: 'active' | 'canceled' | 'past_due'
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'aspirant' | 'professional'
          status?: 'active' | 'canceled' | 'past_due'
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: number
          couple_id: number
          user_id: string
          sender: string
          sender_name: string | null
          content: string
          body: string | null
          recipient_email: string | null
          timestamp: string
          read: boolean
          created_at: string
          attachments: Json | null
        }
        Insert: {
          id?: number
          couple_id: number
          user_id: string
          sender: string
          sender_name?: string | null
          content: string
          body?: string | null
          recipient_email?: string | null
          timestamp?: string
          read?: boolean
          created_at?: string
          attachments?: Json | null
        }
        Update: {
          id?: number
          couple_id?: number
          user_id?: string
          sender?: string
          sender_name?: string | null
          content?: string
          body?: string | null
          recipient_email?: string | null
          timestamp?: string
          read?: boolean
          created_at?: string
          attachments?: Json | null
        }
      }
      payments: {
        Row: {
          id: number
          couple_id: number
          user_id: string
          invoice_number: string
          amount: number
          status: string
          due_date: string | null
          paid_date: string | null
          payment_method: string | null
          notes: string | null
          description: string | null
          payment_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          couple_id: number
          user_id: string
          invoice_number: string
          amount: number
          status?: string
          due_date?: string | null
          paid_date?: string | null
          payment_method?: string | null
          notes?: string | null
          description?: string | null
          payment_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          couple_id?: number
          user_id?: string
          invoice_number?: string
          amount?: number
          status?: string
          due_date?: string | null
          paid_date?: string | null
          payment_method?: string | null
          notes?: string | null
          description?: string | null
          payment_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scripts: {
        Row: {
          id: number
          user_id: string
          couple_id: number | null
          title: string
          type: string
          status: string
          content: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          couple_id?: number | null
          title: string
          type?: string
          status?: string
          content: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          couple_id?: number | null
          title?: string
          type?: string
          status?: string
          content?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: number
          couple_id: number
          user_id: string
          name: string
          file_url: string
          file_type: string
          file_size: number
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: number
          couple_id: number
          user_id: string
          name: string
          file_url: string
          file_type: string
          file_size: number
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: number
          couple_id?: number
          user_id?: string
          name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          uploaded_by?: string
          created_at?: string
        }
      }
      contracts: {
        Row: {
          id: number
          user_id: string
          couple_id: number | null
          name: string
          description: string | null
          type: string
          status: 'draft' | 'sent' | 'signed' | 'expired'
          expiry_date: string | null
          file_url: string
          file_type: string | null
          file_size: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          couple_id?: number | null
          name: string
          description?: string | null
          type: string
          status?: 'draft' | 'sent' | 'signed' | 'expired'
          expiry_date?: string | null
          file_url: string
          file_type?: string | null
          file_size?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          couple_id?: number | null
          name?: string
          description?: string | null
          type?: string
          status?: 'draft' | 'sent' | 'signed' | 'expired'
          expiry_date?: string | null
          file_url?: string
          file_type?: string | null
          file_size?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: number
          couple_id: number
          user_id: string
          task: string
          details: string | null
          due_date: string | null
          due_time: string | null
          priority: string | null
          category: string | null
          completed: boolean
          email_reminder: boolean | null
          reminder_days: number | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          couple_id: number
          user_id: string
          task: string
          details?: string | null
          due_date?: string | null
          due_time?: string | null
          priority?: string | null
          category?: string | null
          completed?: boolean
          email_reminder?: boolean | null
          reminder_days?: number | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          couple_id?: number
          user_id?: string
          task?: string
          details?: string | null
          due_date?: string | null
          due_time?: string | null
          priority?: string | null
          category?: string | null
          completed?: boolean
          email_reminder?: boolean | null
          reminder_days?: number | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: number
          couple_id: number
          user_id: string
          title: string
          date: string
          time: string
          location: string | null
          notes: string | null
          duration: number | null
          meeting_type: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          couple_id: number
          user_id: string
          title: string
          date: string
          time: string
          location?: string | null
          notes?: string | null
          duration?: number | null
          meeting_type?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          couple_id?: number
          user_id?: string
          title?: string
          date?: string
          time?: string
          location?: string | null
          notes?: string | null
          duration?: number | null
          meeting_type?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      couple_files: {
        Row: {
          id: number
          user_id: string
          couple_id: number
          file_name: string
          file_url: string
          file_type: string | null
          file_size: number | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          couple_id: number
          file_name: string
          file_url: string
          file_type?: string | null
          file_size?: number | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          couple_id?: number
          file_name?: string
          file_url?: string
          file_type?: string | null
          file_size?: number | null
          category?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'aspirant' | 'professional'
      subscription_status: 'active' | 'canceled' | 'past_due'
      payment_status: 'pending' | 'paid' | 'overdue'
    }
  }
}
