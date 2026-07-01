import { useState } from 'react';
import { Radio, Plus, Loader2, ChevronDown } from 'lucide-react';

const PLATFORMS = ['Instagram', 'Pinterest', 'Twitter/X', 'TikTok', 'LinkedIn'];

export default function ChannelInjector({ onCreateChannel, token }) {
  const [platform, setPlatform] = useState('Instagram');
  const [pageName, setPageName] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const ok = await onCreateChannel(platform, pageName, handle);
    if (ok) { setPageName(''); setHandle(''); }
    setLoading(false);
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{
          width: 28, height: 28,
          background: 'var(--accent-subtle)',
          border: '1px solid var(--border-focus)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Radio size={13} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Add Channel</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Register a new automation node</div>
        </div>
      </div>

      {!token ? (
        <div style={{
          padding: '16px',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          fontSize: 12, color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Sign in to register channels
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <select
              className="input-premium"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <input
            className="input-premium"
            type="text"
            placeholder="Page title (e.g. Anime Vault)"
            value={pageName}
            onChange={e => setPageName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, pointerEvents: 'none',
            }}>@</span>
            <input
              className="input-premium"
              type="text"
              placeholder="handle"
              value={handle}
              onChange={e => setHandle(e.target.value.replace('@', ''))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ paddingLeft: 28 }}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || !pageName || !handle}
            style={{ marginTop: 4 }}
          >
            {loading ? <Loader2 size={13} className="animate-spin-slow" /> : <Plus size={13} />}
            <span>Register Node</span>
          </button>
        </div>
      )}
    </div>
  );
}
