import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.js';
import LoginScreen from './LoginScreen.jsx';
import EcoHeroes from './EcoHeroes.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session on mount (handles refresh).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Subscribe to auth changes (sign-in / sign-out).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0908', color: '#f5f3eb',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        Loading…
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <EcoHeroes session={session} />;
}
