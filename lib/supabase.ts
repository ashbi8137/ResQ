import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ktzizjqvuqaknuvnxidi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eml6anF2dXFha251dm54aWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjM2ODAsImV4cCI6MjA3MDU5OTY4MH0.CXMG1YVq1BPERGviGN_N7ukuqGH4__sQ-Nuj_MmShFU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface EmergencyAlert {
  id: string
  created_at: string
  phone_number: string
  location_lat: number
  location_lng: number
  emergency_type: 'domestic_violence' | 'accident' | 'disaster' | 'medical' | 'other'
  safe_to_call: boolean
  status: 'pending' | 'received' | 'in_progress' | 'resolved'
  incident_id: string
  media_urls?: string[]
  notes?: string
}

export interface AuthorityContact {
  id: string
  name: string
  phone_number: string
  email: string
  department: string
  is_active: boolean
}
