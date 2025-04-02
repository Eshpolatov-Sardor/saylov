import { createClient, SupabaseClient } from "@supabase/supabase-js";

const BASE_PROJECT_URL: string = "https://hzogmrkizfqbkjzxgyuq.supabase.co";
const BASE_API_KEY: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6b2dtcmtpemZxYmtqenhneXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MDk2MjQsImV4cCI6MjA1ODQ4NTYyNH0.7ZnZNJkiFrrG9wk6VoVKrU7b0gPNaLSsl4lkj-ls2hA";

export const supabase: SupabaseClient = createClient(BASE_PROJECT_URL, BASE_API_KEY);