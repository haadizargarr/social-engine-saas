import React, { useState, useEffect } from 'react';
import { Shield, Users, Calendar as CalendarIcon, Key } from 'lucide-react';

export default function AdminPanel({ token }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: '#E0F2FE',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Shield size={20} color="#0284C7" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', marginBottom: 4 }}>System Administrator</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage platform identities and team collaboration roles.</p>
        </div>
      </div>

      <div className="card animate-slide-up" style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} color="var(--accent)" /> Registered Identities
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>Loading framework...</div>
        ) : error ? (
          <div style={{ color: 'var(--error)', fontSize: 13, textAlign: 'center', padding: 40 }}>Error: {error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Identity (Email)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Authorization Tier</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Onboarded Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>#{u.id}</td>
                    <td style={{ padding: '16px', color: 'var(--text-main)', fontSize: 14, fontWeight: 500 }}>{u.email}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: u.role === 'admin' ? '#E0F2FE' : 'var(--accent-subtle)',
                        color: u.role === 'admin' ? '#0284C7' : 'var(--accent)',
                        textTransform: 'uppercase'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: 13 }}>
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
