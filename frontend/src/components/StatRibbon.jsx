import { HardDrive, Wifi, WifiOff, TrendingUp, Clock } from 'lucide-react';

const METRICS = [
  {
    id: 'db',
    icon: HardDrive,
    label: 'Database Core',
    iconBg: 'rgba(52,211,153,0.1)',
    iconBorder: 'rgba(52,211,153,0.2)',
    iconColor: '#34d399',
    getValue: () => 'SQLite · Daemon Active',
    getColor: () => '#34d399',
    dot: true,
  },
  {
    id: 'dispatch',
    icon: TrendingUp,
    label: 'Dispatch Rate',
    iconBg: 'rgba(99,102,241,0.1)',
    iconBorder: 'rgba(99,102,241,0.2)',
    iconColor: '#818cf8',
    getValue: (_, posts) => {
      const total = posts.length;
      const done = posts.filter(p => p.is_published).length;
      return total > 0 ? `${done}/${total} dispatched` : 'No payloads';
    },
    getColor: () => '#818cf8',
  },
  {
    id: 'queue',
    icon: Clock,
    label: 'Pending Queue',
    iconBg: 'rgba(251,191,36,0.1)',
    iconBorder: 'rgba(251,191,36,0.2)',
    iconColor: '#fbbf24',
    getValue: (_, posts) => {
      const pending = posts.filter(p => !p.is_published).length;
      return `${pending} vector${pending !== 1 ? 's' : ''} pending`;
    },
    getColor: (_, posts) => {
      const p = posts.filter(x => !x.is_published).length;
      return p > 0 ? '#fbbf24' : '#34d399';
    },
  },
];

export default function StatRibbon({ channels, isLive, isLoading, posts = [] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

      {/* API Status — always first */}
      <div className="metric-card" style={{ gridColumn: isLive ? 'auto' : 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: isLive ? '#D1FAE5' : '#FEE2E2',
            border: `1px solid ${isLive ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isLive
              ? <Wifi size={17} color="var(--success)" />
              : <WifiOff size={17} color="var(--error)" />
            }
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>
              API Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLive && (
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--success)',
                  display: 'inline-block',
                }} />
              )}
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: isLive ? 'var(--success)' : 'var(--error)',
              }}>
                {isLoading ? 'Connecting...' : isLive ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Channels count */}
      <div className="metric-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'var(--accent-subtle)',
            border: '1px solid var(--border-focus)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HardDrive size={17} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>
              Active Nodes
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {isLoading ? '—' : channels.length}
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 5 }}>channels</span>
            </div>
          </div>
        </div>
        {channels.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(channels.length * 10, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Pending queue */}
      <div className="metric-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={17} color="var(--warning)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>
              Queue Depth
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {posts.filter(p => !p.is_published).length}
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 5 }}>pending</span>
            </div>
          </div>
        </div>
        {posts.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${(posts.filter(p => p.is_published).length / posts.length) * 100}%`,
                background: 'var(--success)',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
