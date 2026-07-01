import { Activity, Layers, Clock, Zap, Radio, TrendingUp, ArrowRight } from 'lucide-react';

const PLATFORM_MAP = {
  Instagram:  { cls: 'platform-ig', short: 'IG', color: '#f472b6' },
  Pinterest:  { cls: 'platform-pt', short: 'PT', color: '#ef4444' },
  'Twitter/X':{ cls: 'platform-tw', short: 'X',  color: '#94a3b8' },
  TikTok:     { cls: 'platform-tt', short: 'TT', color: '#22d3ee' },
  LinkedIn:   { cls: 'platform-li', short: 'LI', color: '#3b82f6' },
};

// Platforms breakdown from channel list
function platformCounts(channels) {
  return channels.reduce((acc, c) => {
    acc[c.platform] = (acc[c.platform] || 0) + 1;
    return acc;
  }, {});
}

export default function DashboardView({ channels, posts, isLive, isLoading, onSelectChannel, activeChannel }) {
  const breakdown = platformCounts(channels);
  const totalPosts = posts.length;
  const dispatched = posts.filter(p => p.is_published).length;
  const pending    = posts.filter(p => !p.is_published).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Overview metrics row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          {
            icon: Layers,
            label: 'Total Channels',
            value: channels.length,
            sub: 'automation nodes',
            color: 'var(--accent)',
            bg: 'var(--accent-subtle)',
            border: 'var(--border-focus)',
          },
          {
            icon: Activity,
            label: 'API Status',
            value: isLive ? 'Online' : 'Offline',
            sub: isLive ? 'FastAPI connected' : 'Check server',
            color: isLive ? 'var(--success)' : 'var(--error)',
            bg: isLive ? '#D1FAE5' : '#FEE2E2',
            border: isLive ? '#A7F3D0' : '#FECACA',
          },
          {
            icon: Clock,
            label: 'Pending Queue',
            value: pending,
            sub: 'posts awaiting dispatch',
            color: 'var(--warning)',
            bg: '#FEF3C7',
            border: '#FDE68A',
          },
          {
            icon: Zap,
            label: 'Dispatched',
            value: dispatched,
            sub: 'posts published',
            color: 'var(--success)',
            bg: '#D1FAE5',
            border: '#A7F3D0',
          },
        ].map(({ icon: Icon, label, value, sub, color, bg, border }) => (
          <div key={label} className="metric-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={color} />
              </div>
              {isLive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 4 }} />}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>
              {isLoading ? '—' : value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Platform distribution + Channels overview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>

        {/* Platform breakdown */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
            Platform Distribution
          </div>
          {Object.keys(PLATFORM_MAP).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(PLATFORM_MAP).map(([platform, info]) => {
                const count = breakdown[platform] || 0;
                const pct = channels.length > 0 ? (count / channels.length) * 100 : 0;
                return (
                  <div key={platform}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={info.cls} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>
                          {info.short}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{platform}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: count > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: info.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
              No channels yet
            </div>
          )}
        </div>

        {/* Channel cards overview */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Channel Overview
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Radio size={11} color="var(--accent)" />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{channels.length} node{channels.length !== 1 ? 's' : ''} registered</span>
            </div>
          </div>

          {channels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 12 }}>
              No channels registered. Add one from the Channels tab.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {channels.map(c => {
                const pInfo = PLATFORM_MAP[c.platform] || { cls: 'platform-default', short: '??' };
                const isActive = activeChannel?.id === c.id;
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isActive ? 'var(--bg-active)' : 'var(--bg-card)',
                    border: `1px solid ${isActive ? 'var(--border-focus)' : 'var(--border-color)'}`,
                    borderRadius: 10,
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className={pInfo.cls} style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
                        {pInfo.short}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: 2 }}>{c.page_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>@{c.handle} · {c.platform}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectChannel(c)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px',
                        background: 'var(--accent-subtle)',
                        border: '1px solid var(--border-focus)',
                        borderRadius: 7,
                        fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                    >
                      Open Queue <ArrowRight size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Dispatch pipeline stats ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={14} color="var(--accent)" />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Dispatch Pipeline
          </span>
          {activeChannel && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
              Showing: {activeChannel.page_name}
            </span>
          )}
        </div>

        {!activeChannel ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
            Select a channel from the overview above to see its dispatch pipeline.
          </div>
        ) : totalPosts === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
            No posts in queue yet for {activeChannel.page_name}.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Summary bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: pending, height: 6, background: 'var(--warning)', borderRadius: 99, minWidth: 4, transition: 'flex 0.4s ease' }} />
              <div style={{ flex: dispatched, height: 6, background: 'var(--success)', borderRadius: 99, minWidth: dispatched > 0 ? 4 : 0, transition: 'flex 0.4s ease' }} />
            </div>
            {posts.slice(0, 5).map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: 9,
              }}>
                <div style={{
                  width: 3, height: 28, borderRadius: 99, flexShrink: 0,
                  background: p.is_published ? 'var(--success)' : 'var(--warning)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  {p.content_type && <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.content_type.replace(/_/g, ' ')}</div>}
                </div>
                <span className={p.is_published ? 'badge-dispatched' : 'badge-pending'} style={{ fontSize: 9 }}>
                  {p.is_published ? '⚡ Done' : '⏳ Pending'}
                </span>
              </div>
            ))}
            {totalPosts > 5 && (
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', paddingTop: 4 }}>
                +{totalPosts - 5} more posts — open Channels to see all
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
