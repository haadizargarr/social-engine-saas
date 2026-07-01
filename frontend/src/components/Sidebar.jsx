import { LogOut, Activity, Cpu, Calendar as CalendarIcon, BarChart2, Shield } from 'lucide-react';

export default function Sidebar({ userEmail, userRole, isLive, token, activeView, onViewChange, onLogout, channelCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'channels',  label: 'Channels',  icon: Cpu, badge: channelCount },
    { id: 'calendar',  label: 'Calendar',  icon: CalendarIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  if (userRole === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <aside className="sidebar-glass" style={{
      width: 240,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, padding: '0 4px' }}>
        <div className="logo-icon">Ω</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
            SocialEngine
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Pro Console
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px', marginBottom: 6 }}>
          Navigation
        </div>
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`nav-item ${activeView === id ? 'active' : ''}`}
            style={{ width: '100%', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <Icon size={15} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <span style={{
                padding: '1px 7px',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--border-focus)',
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent)',
              }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom — Session info */}
      <div style={{ marginTop: 'auto' }}>
        <div className="divider" style={{ marginBottom: 16 }} />

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          marginBottom: 8,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isLive ? 'var(--success)' : 'var(--error)',
            flexShrink: 0,
            animation: isLive ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--text-main)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {isLive ? userEmail : 'Not authenticated'}
          </span>
        </div>

        {token && (
          <button
            className="btn-ghost btn-danger"
            onClick={onLogout}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
