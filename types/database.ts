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
      bands: {
        Row: {
          id: string
          name: string
          leader_id: string
          calendar_submitted: boolean
          share_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          leader_id: string
          calendar_submitted?: boolean
          share_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          leader_id?: string
          calendar_submitted?: boolean
          share_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      band_calendars: {
        Row: {
          id: string
          band_id: string
          date: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          band_id: string
          date: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          band_id?: string
          date?: string
          is_available?: boolean
          created_at?: string
        }
      }
      bandmates: {
        Row: {
          id: string
          band_id: string
          name: string | null
          token: string
          created_at: string
        }
        Insert: {
          id?: string
          band_id: string
          name?: string | null
          token: string
          created_at?: string
        }
        Update: {
          id?: string
          band_id?: string
          name?: string | null
          token?: string
          created_at?: string
        }
      }
      bandmate_availability: {
        Row: {
          id: string
          bandmate_id: string
          date: string
          is_unavailable: boolean
          created_at: string
        }
        Insert: {
          id?: string
          bandmate_id: string
          date: string
          is_unavailable?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          bandmate_id?: string
          date?: string
          is_unavailable?: boolean
          created_at?: string
        }
      }
      bill_requests: {
        Row: {
          id: string
          requesting_band_id: string
          target_band_id: string
          date: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requesting_band_id: string
          target_band_id: string
          date: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requesting_band_id?: string
          target_band_id?: string
          date?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
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
      [_ in never]: never
    }
  }
}

