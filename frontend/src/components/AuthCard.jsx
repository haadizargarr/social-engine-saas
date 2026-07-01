import { useState } from 'react';
import { Shield, Eye, EyeOff, Loader2, Zap, Key, ArrowRight, RefreshCw } from 'lucide-react';

export default function AuthCard({ onAuth, onRequestReset, onResetPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // modes: 'login', 'signup', 'recovery', 'reset'
  const [mode, setMode] = useState('login');

  const submit = async () => {
    setLoading(true);
    if (mode === 'recovery') {
      const token = await onRequestReset(email);
      if (token) {
        // Show token in alert for prototype demonstration
        alert(`MOCK EMAIL SENT!\n\nYour recovery token is: ${token}\n\n(In production, this would be emailed to you)`);
        setMode('reset');
      }
    } else if (mode === 'reset') {
      const success = await onResetPassword(email, resetToken, password);
      if (success) {
        setMode('login');
        setPassword('');
        setResetToken('');
      }
    } else {
      await onAuth(mode, email, password);
    }
    setLoading(false);
  };

  return (
    <div
      className="card animate-fade"
      style={{
        padding: '36px 32px',
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--accent-subtle)',
            border: '1px solid var(--border-focus)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {mode === 'recovery' || mode === 'reset' ? <Key size={15} color="var(--accent)" /> : <Shield size={15} color="var(--accent)" />}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {mode === 'recovery' || mode === 'reset' ? 'Identity Recovery' : 'Identity Authentication'}
          </span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {mode === 'recovery' ? 'Recover Your' : mode === 'reset' ? 'Set New' : 'Access Your'}<br />
          <span style={{ color: 'var(--accent)' }}>
            {mode === 'recovery' ? 'Account Access' : mode === 'reset' ? 'Password' : 'Command Console'}
          </span>
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          {mode === 'recovery' || mode === 'reset' 
            ? 'Enterprise secure account recovery protocol' 
            : 'Enterprise-grade JWT + Bcrypt authentication'}
        </p>
      </div>

      {/* Mode toggle (hide during recovery/reset) */}
      {(mode === 'login' || mode === 'signup') && (
        <div style={{
          display: 'flex', background: 'var(--bg-hover)', border: '1px solid var(--border-color)',
          borderRadius: 10, padding: 4, marginBottom: 20, gap: 4,
        }}>
          {['login', 'signup'].map(m => (
            <button
              key={m} onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Email input - needed for all modes except reset (we already have it, but show it disabled/read-only) */}
        <input
          className="input-premium"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={mode === 'reset'}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />

        {mode === 'reset' && (
          <input
            className="input-premium"
            type="text"
            placeholder="Recovery Token (e.g. A1B2)"
            value={resetToken}
            onChange={e => setResetToken(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        )}

        {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
          <div style={{ position: 'relative' }}>
            <input
              className="input-premium"
              type={showPass ? 'text' : 'password'}
              placeholder={mode === 'reset' ? 'New Password' : 'Password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ paddingRight: 44 }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center',
              }}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        )}

        <button className="btn-primary" onClick={submit} disabled={loading} style={{ marginTop: 4 }}>
          {loading ? (
            <Loader2 size={14} className="animate-spin-slow" />
          ) : mode === 'recovery' ? (
            <ArrowRight size={13} />
          ) : mode === 'reset' ? (
            <RefreshCw size={13} />
          ) : (
            <Zap size={13} />
          )}
          <span>
            {mode === 'login' ? 'Authorize Access' : 
             mode === 'signup' ? 'Create Account' : 
             mode === 'recovery' ? 'Send Recovery Code' : 'Reset Password'}
          </span>
        </button>

        {mode === 'login' && (
          <button 
            onClick={() => setMode('recovery')} 
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, 
              cursor: 'pointer', marginTop: 4, display: 'inline-block' 
            }}
          >
            Forgot Password?
          </button>
        )}

        {(mode === 'recovery' || mode === 'reset') && (
          <button 
            onClick={() => setMode('login')} 
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, 
              cursor: 'pointer', marginTop: 4 
            }}
          >
            Back to Sign In
          </button>
        )}
      </div>

      {/* Footer note */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
        Session secured with RS256 · SQLite backed
      </p>
    </div>
  );
}
