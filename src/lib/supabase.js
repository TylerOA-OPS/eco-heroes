import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Check that .env.local exists in the project root and contains ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper: turn a username into the fake email we use in Supabase Auth.
export function usernameToEmail(username) {
  return `${username.toLowerCase()}@eco-heroes.local`;
}

// Sign in with username + PIN (PIN is the password).
export async function signInWithPin(username, pin) {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}
