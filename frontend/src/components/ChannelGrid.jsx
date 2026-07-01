import { useState } from 'react';
import { RefreshCw, Loader2, Plus } from 'lucide-react';

const PLATFORM_MAP = {
  Instagram:  { cls: 'platform-ig', short: 'IG' },
  Pinterest:  { cls: 'platform-pt', short: 'PT' },
  'Twitter/X':{ cls: 'platform-tw', short: 'X'  },
  TikTok:     { cls: 'platform-tt', short: 'TT' },
  LinkedIn:   { cls: 'platform-li', short: 'LI' },
};

export default function ChannelGrid({ channels, activeChannel, onSelectChannel, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
            Monitored Nodes
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            Channel Registry
          </div>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            width: 32, height: 32,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
            transition: 'all 0.2s ease',
          }}
          title="Refresh"
        >
          {refreshing
            ? <Loader2 size={13} className="animate-spin-slow" />
            : <RefreshCw size={13} />
          }
        </button>
      </div>

      {channels.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '48px 24px',
          border: '1px dashed var(--border-color)',
          borderRadius: 12,
          gap: 10,
        }}>
          <div style={{
            width: 44, height: 44,
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={18} color="var(--text-muted)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No channels registered</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Add a channel using the panel on the left</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {channels.map((c, i) => {
            const isActive = activeChannel?.id === c.id;
            const pInfo = PLATFORM_MAP[c.platform] || { cls: 'platform-default', short: c.platform?.slice(0,2).toUpperCase() };

            return (
              <div
                key={c.id}
                className={`channel-card ${isActive ? 'selected' : ''} animate-slide-up`}
                style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'both', opacity: 0 }}
                onClick={() => onSelectChannel(c)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Platform avatar */}
                  <div
                    className={pInfo.cls}
                    style={{
                      width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 900, color: 'white',
                    }}
                  >
                    {pInfo.short}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.page_name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>@{c.handle}</span>
                      <span style={{ color: 'var(--border-hover)' }}>·</span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.platform}</span>
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                    }} />
                  )}
                </div>

                {/* Bottom action row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 12, paddingTop: 12,
                  borderTop: '1px solid var(--border-color)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.is_connected ? (
                      <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--success)' }} /> Connected
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--error)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--error)' }} /> Disconnected
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    padding: '3px 8px',
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    border: isActive ? '1px solid var(--border-focus)' : '1px solid var(--border-color)',
                    borderRadius: 6,
                  }}>
                    {isActive ? 'Active' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
