import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ohbdqaqyomzwnmbfdxvl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oYmRxYXF5b216d25tYmZkeHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjA4NjgsImV4cCI6MjA4NDkzNjg2OH0.qWxxjrksWzD4cVNR0k-pqDs3-5UJRGc8EE_okvAAxsY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
