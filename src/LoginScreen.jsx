import React, { useEffect, useState, useRef } from 'react';
import { supabase, signInWithPin } from './lib/supabase.js';

export default function LoginScreen({ onSignedIn }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const pinInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, color, emoji')
        .order('created_at', { ascending: true });
      if (error) {
        setLoadError(error.message);
      } else {
        setProfiles(data || []);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selected && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [selected]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!selected || pin.length < 4) return;
    setSubmitting(true);
    setPinError(null);
    try {
      await signInWithPin(selected.username, pin);
      onSignedIn?.();
    } catch (err) {
      setPinError('Incorrect PIN. Try again.');
      setPin('');
      pinInputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  function pickAnother() {
    setSelected(null);
    setPin('');
    setPinError(null);
  }

  return (
    <div style={styles.root}>
      <div style={styles.bgGradient} />

      <div style={styles.content}>
        <div style={styles.logoWrap}>
          <div style={styles.logoMark}>🦊</div>
          <h1 style={styles.title}>ECO HEROES</h1>
          <div style={styles.tagline}>DISCOVER · DESIGN · TRADE</div>
        </div>

        {loading && <div style={styles.loadingText}>Loading family roster…</div>}

        {loadError && (
          <div style={styles.errorBox}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Can't reach Supabase</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{loadError}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
              Check that .env.local has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
            </div>
          </div>
        )}

        {!loading && !loadError && !selected && (
          <div style={styles.pickerWrap}>
            <div style={styles.pickerLabel}>WHO'S EXPLORING?</div>
            <div style={styles.profileGrid}>
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    ...styles.profileButton,
                    borderColor: p.color,
                    boxShadow: `0 0 0 0 ${p.color}40`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = `0 0 24px ${p.color}60, inset 0 0 0 1px ${p.color}`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = `0 0 0 0 ${p.color}40`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ ...styles.profileEmoji, background: `${p.color}22`, color: p.color }}>
                    {p.emoji}
                  </div>
                  <div style={styles.profileName}>{p.display_name}</div>
                </button>
              ))}
            </div>
            {profiles.length === 0 && (
              <div style={{ ...styles.loadingText, marginTop: 16 }}>
                No profiles found. Did you run the seed SQL?
              </div>
            )}
          </div>
        )}

        {!loading && selected && (
          <form onSubmit={handleSubmit} style={styles.pinWrap}>
            <button type="button" onClick={pickAnother} style={styles.backButton}>
              ← Not {selected.display_name}? Pick someone else
            </button>

            <div style={{ ...styles.profileEmoji, ...styles.bigEmoji, background: `${selected.color}22`, color: selected.color, borderColor: selected.color }}>
              {selected.emoji}
            </div>
            <div style={styles.welcomeText}>WELCOME, {selected.display_name.toUpperCase()}</div>
            <div style={styles.pinLabel}>ENTER YOUR PIN</div>

            <input
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={e => {
                setPin(e.target.value.replace(/\D/g, ''));
                setPinError(null);
              }}
              style={{
                ...styles.pinInput,
                borderColor: pinError ? '#ef4444' : selected.color,
              }}
              placeholder="••••"
              disabled={submitting}
            />

            {pinError && <div style={styles.pinErrorText}>{pinError}</div>}

            <button
              type="submit"
              disabled={pin.length < 4 || submitting}
              style={{
                ...styles.signInButton,
                background: selected.color,
                opacity: (pin.length < 4 || submitting) ? 0.4 : 1,
              }}
            >
              {submitting ? 'SIGNING IN…' : 'EXPLORE'}
            </button>

            <div style={styles.hintText}>
              Forgot your PIN? Ask whoever set up the family accounts to reset it.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: 'fixed', inset: 0,
    background: '#0a0908',
    color: '#f5f3eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
    padding: 24,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  bgGradient: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 30% 20%, rgba(34,197,94,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(56,189,248,0.12) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
  },
  logoWrap: { textAlign: 'center' },
  logoMark: { fontSize: 64, lineHeight: 1, marginBottom: 8 },
  title: {
    fontFamily: 'Bebas Neue, Inter, sans-serif',
    fontSize: 44,
    letterSpacing: 4,
    margin: 0,
    fontWeight: 400,
    background: 'linear-gradient(180deg, #fff 0%, #999 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  tagline: { fontSize: 11, letterSpacing: 4, opacity: 0.55, marginTop: 6, fontWeight: 600 },
  loadingText: { fontSize: 14, opacity: 0.6 },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 12, padding: 16, maxWidth: 380,
  },
  pickerWrap: { width: '100%' },
  pickerLabel: {
    fontSize: 12, letterSpacing: 3, opacity: 0.5, fontWeight: 700,
    textAlign: 'center', marginBottom: 16,
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
  },
  profileButton: {
    background: 'rgba(255,255,255,0.03)',
    border: '2px solid',
    borderRadius: 16,
    padding: '16px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    cursor: 'pointer',
    color: '#f5f3eb',
    fontFamily: 'inherit',
    transition: 'all 180ms ease',
  },
  profileEmoji: {
    fontSize: 32,
    width: 56, height: 56,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bigEmoji: { fontSize: 56, width: 96, height: 96, border: '2px solid' },
  profileName: { fontSize: 14, fontWeight: 700, letterSpacing: 0.5 },
  pinWrap: {
    width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 14,
  },
  backButton: {
    background: 'none', border: 'none', color: '#f5f3eb',
    opacity: 0.5, cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', padding: 4, marginBottom: 8,
  },
  welcomeText: {
    fontSize: 13, letterSpacing: 3, fontWeight: 700, opacity: 0.7,
    marginTop: 4,
  },
  pinLabel: { fontSize: 11, letterSpacing: 4, opacity: 0.5, fontWeight: 700, marginTop: -6 },
  pinInput: {
    background: 'rgba(255,255,255,0.06)',
    border: '2px solid',
    borderRadius: 12,
    padding: '14px 18px',
    fontSize: 28, letterSpacing: 12, textAlign: 'center',
    color: '#f5f3eb',
    width: 200,
    fontFamily: 'inherit',
    outline: 'none',
  },
  pinErrorText: {
    color: '#ef4444', fontSize: 13, fontWeight: 600,
  },
  signInButton: {
    border: 'none', borderRadius: 12,
    padding: '14px 40px',
    fontSize: 14, letterSpacing: 3, fontWeight: 800,
    color: '#0a0908',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'opacity 180ms',
    marginTop: 8,
  },
  hintText: { fontSize: 11, opacity: 0.4, textAlign: 'center', maxWidth: 280, marginTop: 6 },
};
