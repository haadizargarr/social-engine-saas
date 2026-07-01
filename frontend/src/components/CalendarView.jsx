import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, Image as ImageIcon } from 'lucide-react';

const PLATFORM_COLORS = {
  Instagram:  { bg: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.4)', color: '#f472b6' },
  Pinterest:  { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   color: '#ef4444' },
  'Twitter/X':{ bg: 'rgba(56,189,248,0.15)',  border: 'rgba(56,189,248,0.4)',  color: '#38bdf8' },
  TikTok:     { bg: 'rgba(232,121,249,0.15)', border: 'rgba(232,121,249,0.4)', color: '#e879f9' },
  LinkedIn:   { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.4)',  color: '#60a5fa' },
  default:    { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)', color: '#94a3b8' },
};

export default function CalendarView({ globalPosts = [], channels = [], onQuickCompose }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Generate calendar grid data
  const gridData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for 1st (0 = Sunday, 1 = Monday...)
    const startingDay = firstDay.getDay(); 
    const totalDays = lastDay.getDate();
    
    // Get posts and group by date string (YYYY-MM-DD)
    // We assume scheduled_for is UTC, and we display in local time to simplify
    const postsByDate = {};
    globalPosts.forEach(post => {
      // Safely parse date
      let postDate;
      try {
        postDate = new Date(post.scheduled_for || post.created_at);
      } catch (e) { return; }
      
      const dateStr = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      if (!postsByDate[dateStr]) postsByDate[dateStr] = [];
      postsByDate[dateStr].push(post);
    });

    // Map channels for lookup
    const channelMap = {};
    channels.forEach(c => channelMap[c.id] = c);

    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDay; i++) {
      const pDay = prevMonthLastDay - startingDay + i + 1;
      const pDate = new Date(year, month - 1, pDay);
      days.push({ day: pDay, date: pDate, isCurrentMonth: false, posts: [] });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const cDate = new Date(year, month, i);
      const dateStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
      
      let dayPosts = postsByDate[dateStr] || [];
      // Attach channel info to posts
      dayPosts = dayPosts.map(p => ({ ...p, channel: channelMap[p.channel_id] })).sort((a,b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));

      days.push({ day: i, date: cDate, isCurrentMonth: true, posts: dayPosts });
    }
    
    // Next month padding to complete the 42-cell grid (6 weeks)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nDate = new Date(year, month + 1, i);
      days.push({ day: i, date: nDate, isCurrentMonth: false, posts: [] });
    }
    
    return days;
  }, [currentDate, globalPosts, channels]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
            Global Calendar
            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: 'var(--accent-subtle)', color: 'var(--accent)', borderRadius: 20, letterSpacing: '0.04em' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Visualize your scheduled payload deliveries across all nodes.
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goToToday} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
            Today
          </button>
          <div style={{ display: 'flex', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', padding: '8px 12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ width: 1, background: 'var(--border-color)' }} />
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', padding: '8px 12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div style={{ 
        flex: 1, 
        minHeight: 0,
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 16,
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-hover)' }}>
          {dayNames.map(day => (
            <div key={day} style={{ padding: '12px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, background: 'transparent' }}>
          {gridData.map((cell, idx) => {
            const isToday = new Date().toDateString() === cell.date.toDateString();
            return (
              <div 
                key={idx} 
                style={{
                  borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border-color)' : 'none',
                  borderBottom: idx < 35 ? '1px solid var(--border-color)' : 'none',
                  padding: '8px',
                  opacity: cell.isCurrentMonth ? 1 : 0.4,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  backgroundColor: isToday ? 'var(--bg-active)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isToday ? 'var(--bg-active)' : 'transparent'}
                onClick={() => onQuickCompose && onQuickCompose(cell.date)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ 
                    fontSize: 12, fontWeight: 700, 
                    color: isToday ? 'var(--accent)' : 'var(--text-main)',
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday ? 'var(--accent-subtle)' : 'transparent'
                  }}>
                    {cell.day}
                  </span>
                  
                  {/* Hover Add Button placeholder - implemented purely via CSS class hover usually, but keeping it simple here */}
                  <Plus size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 2 }}>
                  {cell.posts.map(post => {
                    const style = post.channel ? (PLATFORM_COLORS[post.channel.platform] || PLATFORM_COLORS.default) : PLATFORM_COLORS.default;
                    const dateObj = new Date(post.scheduled_for);
                    const timeStr = `${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2,'0')}`;
                    
                    return (
                      <div key={post.id} style={{
                        background: post.is_published ? 'transparent' : style.bg,
                        border: `1px solid ${post.is_published ? 'var(--border-color)' : style.border}`,
                        borderStyle: post.is_published ? 'dashed' : 'solid',
                        borderRadius: 6,
                        padding: '4px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        opacity: post.is_published ? 0.6 : 1
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: post.is_published ? 'var(--text-muted)' : style.color }}>
                            {timeStr}
                          </span>
                          {post.is_published ? <CheckCircle2 size={10} color="var(--success)" /> : <Clock size={10} color={style.color} />}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {post.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 8, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            @{post.channel?.handle || 'Unknown'}
                          </div>
                          {post.media_url && <ImageIcon size={8} color="var(--text-muted)" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
