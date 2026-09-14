import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nhghzuqyzpajavqtpote.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZ2h6dXF5enBhamF2cXRwb3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTE1MjIsImV4cCI6MjEwNDk2NzUyMn0.9OYL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

