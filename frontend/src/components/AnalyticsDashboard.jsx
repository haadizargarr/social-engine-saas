import React, { useMemo, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Eye, Heart, MessageCircle, Share2, TrendingUp, Trophy, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AnalyticsDashboard({ posts }) {
  // Filter for dispatched posts
  const publishedPosts = posts.filter(p => p.is_published);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalImpressions = 0;
    let totalLikes = 0;
    let totalShares = 0;
    let totalComments = 0;

    publishedPosts.forEach(post => {
      totalImpressions += (post.impressions || 0);
      totalLikes += (post.likes || 0);
      totalShares += (post.shares || 0);
      totalComments += (post.comments || 0);
    });

    const totalEngagement = totalLikes + totalShares + totalComments;
    const engagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(1) : 0;

    return {
      totalImpressions,
      totalLikes,
      totalShares,
      totalComments,
      totalEngagement,
      engagementRate
    };
  }, [publishedPosts]);

  // Aggregate daily trends
  const trendData = useMemo(() => {
    const datesMap = {};
    
    publishedPosts.forEach(post => {
      const date = new Date(post.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!datesMap[date]) datesMap[date] = { date, impressions: 0, engagement: 0 };
      
      datesMap[date].impressions += (post.impressions || 0);
      datesMap[date].engagement += ((post.likes || 0) + (post.shares || 0) + (post.comments || 0));
    });

    // Sort by actual date
    return Object.values(datesMap).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14); // Last 14 days
  }, [publishedPosts]);

  // Top performing posts
  const topPosts = [...publishedPosts].sort((a, b) => {
    const aEng = (a.likes || 0) + (a.shares || 0) + (a.comments || 0);
    const bEng = (b.likes || 0) + (b.shares || 0) + (b.comments || 0);
    return bEng - aEng;
  }).slice(0, 5);

  const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div className="card animate-slide-up" style={{ padding: 24, flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="var(--accent)" />
        </div>
        {trend && (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', background: '#D1FAE5', padding: '4px 8px', borderRadius: 12 }}>
            +{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
        {value.toLocaleString()}
      </div>
    </div>
  );

  const dashboardRef = useRef(null);

  const exportCSV = () => {
    if (publishedPosts.length === 0) return;
    const headers = ['ID,Title,Content Type,Impressions,Likes,Shares,Comments'];
    const rows = publishedPosts.map(p => 
      `${p.id},"${p.title?.replace(/"/g, '""')}","${p.content_type}",${p.impressions || 0},${p.likes || 0},${p.shares || 0},${p.comments || 0}`
    );
    const csvContent = headers.concat(rows).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'social_engine_analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('social_engine_analytics.pdf');
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  return (
    <div ref={dashboardRef} style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      {/* KPI Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', marginBottom: 4 }}>Performance Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Real-time metrics across all your connected channels.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCSV} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={exportPDF} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <StatCard title="Total Impressions" value={metrics.totalImpressions} icon={Eye} trend={12.5} />
        <StatCard title="Total Engagement" value={metrics.totalEngagement} icon={Activity} trend={8.2} />
        <StatCard title="Avg Engagement Rate" value={`${metrics.engagementRate}%`} icon={TrendingUp} trend={2.1} />
        <StatCard title="Total Dispatched" value={publishedPosts.length} icon={Share2} />
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Main Chart */}
        <div className="card animate-slide-up" style={{ flex: 2, minWidth: 400, padding: 24, animationDelay: '0.1s' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="var(--accent)" /> Engagement Trends (Last 14 Days)
          </div>
          <div style={{ height: 300, width: '100%' }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--text-main)', fontSize: 12, fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEngage)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No trend data available yet. Dispatch posts to see analytics.
              </div>
            )}
          </div>
        </div>

        {/* Top Posts Table */}
        <div className="card animate-slide-up" style={{ flex: 1, minWidth: 300, padding: 24, animationDelay: '0.2s' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={16} color="var(--warning)" /> Top Performing Posts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topPosts.length > 0 ? topPosts.map((post, idx) => (
              <div key={post.id} style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px', 
                background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 8 
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: idx === 0 ? '#FEF3C7' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: idx === 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                  #{idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={10} color="#f43f5e" /> {post.likes?.toLocaleString() || 0}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={10} color="#3b82f6" /> {post.comments?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                No published posts available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
