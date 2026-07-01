import { useState, useCallback } from 'react';
import { useToast, ToastContainer } from './components/Toast.jsx';
import { useAuth } from './hooks/useAuth.js';
import Sidebar from './components/Sidebar.jsx';
import AuthCard from './components/AuthCard.jsx';
import ChannelInjector from './components/ChannelInjector.jsx';
import StatRibbon from './components/StatRibbon.jsx';
import ChannelGrid from './components/ChannelGrid.jsx';
import QueueWorkspace from './components/QueueWorkspace.jsx';
import DashboardView from './components/DashboardView.jsx';
import CalendarView from './components/CalendarView.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import { Zap, Shield, Clock, BarChart3, CheckCircle, Loader2 } from 'lucide-react';

const API_BASE = '/api';

function OAuthMock({ token, addToast }) {
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel_id');
    const platform = params.get('platform');
    
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/${channelId}/callback`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('OAuth mock failure');
        addToast(`Successfully authenticated with ${platform}!`, 'success');
      } catch (err) {
        addToast('OAuth handshake failed', 'error');
      } finally {
        window.location.href = '/';
      }
    }, 1500);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Loader2 size={48} className="animate-spin-slow" color="var(--accent)" style={{ marginBottom: 20 }} />
      <h2 style={{ fontSize: 24, fontWeight: 800 }}>Authenticating...</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: 10 }}>Simulating secure OAuth handshake with platform.</p>
    </div>
  );
}

const FEATURES = [
  { icon: Zap,       label: 'Background Daemon',  desc: 'Auto-dispatch runs every 10s in a background thread' },
  { icon: Shield,    label: 'JWT + Bcrypt Auth',   desc: 'Enterprise-grade token security on every request' },
  { icon: Clock,     label: 'Queue Scheduling',    desc: 'Commit posts and let the engine handle delivery' },
  { icon: BarChart3, label: 'Multi-Platform',      desc: 'Instagram, Pinterest, TikTok, LinkedIn, Twitter/X' },
];

export default function App() {
  const { toasts, addToast, removeToast } = useToast();
  const [activeView, setActiveView] = useState('dashboard');

  const {
    token, userEmail, userRole, isLive, channels, activeChannel,
    posts, globalPosts, isLoading, handleAuth, createChannel,
    selectChannel, schedulePost, approvePost, logout, loadDashboard, loadPosts, loadAllPosts,
    initiateOAuth, uploadMedia, generateAIContent, requestPasswordReset, resetPassword
  } = useAuth(addToast);

  const refreshPosts = useCallback(() => {
    if (activeChannel) loadPosts(activeChannel);
  }, [activeChannel, loadPosts]);

  // When user clicks "Open Queue" from dashboard, switch to channels view
  const handleOpenQueue = useCallback((channel) => {
    selectChannel(channel);
    setActiveView('channels');
  }, [selectChannel]);

  if (window.location.pathname === '/oauth-mock') {
    return <OAuthMock token={token} addToast={addToast} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-main)', overflow: 'hidden', position: 'relative' }}>


      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Sidebar */}
      <Sidebar
        userEmail={userEmail}
        userRole={userRole}
        isLive={isLive}
        token={token}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={logout}
        channelCount={channels.length}
      />

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflow: 'hidden' }}>

        {/* Top bar */}
        <header className="navbar-glass" style={{
          padding: '14px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {activeView === 'dashboard' ? 'Dashboard' : 'Channels'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {isLive
                ? `${userEmail} · ${channels.length} node${channels.length !== 1 ? 's' : ''} · Engine running`
                : 'Sign in to access your workspace'
              }
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isLive ? 'var(--success)' : 'var(--error)',
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </header>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* ── Unauthenticated ── */}
          {!token ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 380px',
              gap: 32,
              alignItems: 'start',
              maxWidth: 1100,
              margin: '0 auto',
              paddingTop: 20,
            }}>
              {/* Hero */}
              <div style={{ paddingTop: 16 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '5px 12px',
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--border-focus)',
                  borderRadius: 99,
                  fontSize: 10, fontWeight: 700,
                  color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase',
                  marginBottom: 18,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
                  Enterprise Social Automation
                </div>

                <h1 style={{
                  fontSize: 42, fontWeight: 900,
                  color: 'var(--text-main)', letterSpacing: '-0.04em',
                  lineHeight: 1.08, marginBottom: 16,
                }}>
                  The Command<br />
                  Console for<br />
                  <span className="gradient-text-brand">Social Scale.</span>
                </h1>

                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
                  Automate your entire social media operation from a single interface.
                  Schedule content across all platforms with platform-specific content types,
                  and let the daemon engine handle dispatch.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {FEATURES.map(({ icon: Icon, label, desc }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'var(--accent-subtle)',
                        border: '1px solid var(--border-focus)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={14} color="var(--accent)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auth card */}
              <div style={{ position: 'sticky', top: 20 }}>
                <AuthCard onAuth={handleAuth} onRequestReset={requestPasswordReset} onResetPassword={resetPassword} />
              </div>
            </div>

          ) : activeView === 'dashboard' ? (
            /* ── DASHBOARD VIEW ── */
            <DashboardView
              channels={channels}
              posts={posts}
              isLive={isLive}
              isLoading={isLoading}
              onSelectChannel={handleOpenQueue}
              activeChannel={activeChannel}
            />

          ) : activeView === 'calendar' ? (
            /* ── CALENDAR VIEW ── */
            <CalendarView 
              globalPosts={globalPosts} 
              channels={channels} 
              onQuickCompose={(date) => {
                setActiveView('channels');
                addToast(`Select a channel and schedule your post for ${date.toLocaleDateString()}`, 'success');
              }}
            />

          ) : activeView === 'analytics' ? (
            /* ── ANALYTICS VIEW ── */
            <AnalyticsDashboard posts={globalPosts} />

          ) : activeView === 'admin' ? (
            /* ── ADMIN PANEL VIEW ── */
            <AdminPanel token={token} />

          ) : (
            /* ── CHANNELS VIEW ── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: 20,
              alignItems: 'start',
              maxWidth: 1200,
              margin: '0 auto',
            }}>
              {/* Left panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ChannelInjector onCreateChannel={createChannel} token={token} />

                {/* System health */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                    System Health
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {[
                      { label: 'FastAPI Server',    ok: isLive   },
                      { label: 'Background Daemon', ok: true     },
                      { label: 'SQLite Database',   ok: true     },
                      { label: 'JWT Session',       ok: !!token  },
                    ].map(({ label, ok }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-main)' }}>{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: ok ? 'var(--success)' : 'var(--error)',
                          }} />
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ok ? 'var(--success)' : 'var(--error)' }}>
                            {ok ? 'OK' : 'DOWN'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right workspace */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <StatRibbon channels={channels} isLive={isLive} isLoading={isLoading} posts={posts} />

                <ChannelGrid
                  channels={channels}
                  activeChannel={activeChannel}
                  onSelectChannel={selectChannel}
                  onRefresh={loadDashboard}
                />

                {activeChannel && (
                  <QueueWorkspace
                    activeChannel={activeChannel}
                    posts={posts}
                    userRole={userRole}
                    onSchedulePost={schedulePost}
                    onApprovePost={approvePost}
                    onRefresh={refreshPosts}
                    initiateOAuth={initiateOAuth}
                    uploadMedia={uploadMedia}
                    generateAIContent={generateAIContent}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}