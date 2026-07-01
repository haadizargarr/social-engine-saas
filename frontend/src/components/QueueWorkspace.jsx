import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, RefreshCw, Loader2, Inbox, CheckCircle2, Clock, Zap, Hash,
  Image, Video, Film, BookOpen, AlignLeft, FileText, BarChart2, Layers, Link as LinkIcon, Paperclip, X, Sparkles, Check, Shield } from 'lucide-react';

// ── Platform-specific content types ──────────────────────────────────────────
const PLATFORM_TYPES = {
  Instagram: [
    { id: 'photo',    label: 'Photo Post',  icon: Image,     desc: 'Single image, up to 10 photos' },
    { id: 'video',    label: 'Video',       icon: Video,     desc: 'Video up to 60 minutes' },
    { id: 'reel',     label: 'Reel',        icon: Film,      desc: 'Short-form vertical video' },
    { id: 'story',    label: 'Story',       icon: Layers,    desc: '24-hour disappearing content' },
    { id: 'carousel', label: 'Carousel',    icon: Layers,    desc: 'Swipeable multi-image post' },
  ],
  Pinterest: [
    { id: 'image_pin',label: 'Image Pin',   icon: Image,     desc: 'Standard image pin with link' },
    { id: 'video_pin',label: 'Video Pin',   icon: Video,     desc: 'Autoplay video pin' },
    { id: 'idea_pin', label: 'Idea Pin',    icon: BookOpen,  desc: 'Multi-page story-style pin' },
  ],
  'Twitter/X': [
    { id: 'tweet',    label: 'Tweet',       icon: AlignLeft, desc: 'Text tweet (up to 280 chars)' },
    { id: 'photo',    label: 'Photo Tweet', icon: Image,     desc: 'Tweet with 1–4 images' },
    { id: 'video',    label: 'Video Tweet', icon: Video,     desc: 'Tweet with video (up to 2:20)' },
    { id: 'thread',   label: 'Thread',      icon: Layers,    desc: 'Multi-part tweet chain' },
  ],
  TikTok: [
    { id: 'video',    label: 'TikTok Video',icon: Film,      desc: 'Short-form video (15s–10 min)' },
    { id: 'slideshow',label: 'Photo Slideshow',icon: Image,  desc: 'Image carousel with music' },
    { id: 'story',    label: 'Story',       icon: Layers,    desc: '24-hour story' },
  ],
  LinkedIn: [
    { id: 'post',     label: 'Text Post',   icon: AlignLeft, desc: 'Text-based professional update' },
    { id: 'article',  label: 'Article',     icon: FileText,  desc: 'Long-form LinkedIn article' },
    { id: 'photo',    label: 'Photo Post',  icon: Image,     desc: 'Post with single/multiple images' },
    { id: 'video',    label: 'Video Post',  icon: Video,     desc: 'Native video (3s–10 min)' },
    { id: 'document', label: 'Document/PDF',icon: FileText,  desc: 'PDF carousel (up to 300 pages)' },
    { id: 'poll',     label: 'Poll',        icon: BarChart2, desc: 'Up to 4 options, runs 1–2 weeks' },
  ],
};
const DEFAULT_TYPES = [
  { id: 'post',  label: 'Post',  icon: AlignLeft, desc: 'Standard post' },
  { id: 'video', label: 'Video', icon: Video,      desc: 'Video content' },
  { id: 'image', label: 'Image', icon: Image,      desc: 'Image content' },
];

const PLATFORM_MAP = {
  Instagram:  { cls: 'platform-ig' },
  Pinterest:  { cls: 'platform-pt' },
  'Twitter/X':{ cls: 'platform-tw' },
  TikTok:     { cls: 'platform-tt' },
  LinkedIn:   { cls: 'platform-li' },
};

export default function QueueWorkspace({ activeChannel, posts, userRole, onSchedulePost, onApprovePost, onRefresh, initiateOAuth, uploadMedia, generateAIContent }) {
  const platform = activeChannel.platform;
  const types = PLATFORM_TYPES[platform] || DEFAULT_TYPES;

  const [contentType, setContentType] = useState(types[0].id);
  const [postTitle,   setPostTitle]   = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [mediaFile,   setMediaFile]   = useState(null);
  const [mediaPreview,setMediaPreview] = useState(null);
  const [scheduledFor,setScheduledFor] = useState('');
  
  const [submitting,  setSubmitting]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  // AI Copilot State
  const [showCopilot, setShowCopilot] = useState(false);
  const [aiPrompt,    setAiPrompt]    = useState('');
  const [aiMode,      setAiMode]      = useState('caption_hashtags');
  const [generating,  setGenerating]  = useState(false);
  const [aiResult,    setAiResult]    = useState('');
  
  const titleRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset content type when channel/platform changes
  useEffect(() => {
    const newTypes = PLATFORM_TYPES[activeChannel.platform] || DEFAULT_TYPES;
    setContentType(newTypes[0].id);
    setPostTitle('');
    setPostCaption('');
    setMediaFile(null);
    setMediaPreview(null);
    setScheduledFor('');
    setShowCopilot(false);
    setAiResult('');
    setAiPrompt('');
  }, [activeChannel.id]);

  // Auto-refresh every 15s
  useEffect(() => {
    const iv = setInterval(onRefresh, 15000);
    return () => clearInterval(iv);
  }, [onRefresh]);

  const handleSubmit = async () => {
    setSubmitting(true);
    let finalMediaUrl = null;
    
    if (mediaFile) {
      setUploading(true);
      finalMediaUrl = await uploadMedia(mediaFile);
      setUploading(false);
      if (!finalMediaUrl) {
        setSubmitting(false);
        return; // upload failed
      }
    }
    
    const finalDate = scheduledFor ? new Date(scheduledFor).toISOString() : null;
    const ok = await onSchedulePost(postTitle, postCaption, contentType, finalMediaUrl, finalDate);
    if (ok) {
      setPostTitle('');
      setPostCaption('');
      setMediaFile(null);
      setMediaPreview(null);
      setScheduledFor('');
      titleRef.current?.focus();
    }
    setSubmitting(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      if (file.type.startsWith('image/')) {
        setMediaPreview(URL.createObjectURL(file));
      } else {
        setMediaPreview(null); // video/other
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    setAiResult('');
    const result = await generateAIContent(aiPrompt, aiMode, platform);
    if (result) {
      setAiResult(result);
    }
    setGenerating(false);
  };

  const handleApplyAI = () => {
    setPostCaption(prev => prev ? `${prev}\n\n${aiResult}` : aiResult);
    if (!postTitle) setPostTitle(`${platform} Draft - ${new Date().toLocaleDateString()}`);
    setShowCopilot(false);
    setAiResult('');
    setAiPrompt('');
  };

  const selectedType = types.find(t => t.id === contentType) || types[0];
  const dispatched = posts.filter(p => p.is_published);
  const pending    = posts.filter(p => !p.is_published);
  const pInfo = PLATFORM_MAP[platform] || { cls: 'platform-default' };

  return (
    <div className="card animate-slide-up" style={{
      padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={pInfo.cls} style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: 'white',
          }}>
            {platform?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {activeChannel.page_name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              @{activeChannel.handle} · {platform} · auto-refreshes every 15s
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span className="badge-pending"><Clock size={9} />{pending.length} pending</span>
          <span className="badge-dispatched"><Zap size={9} />{dispatched.length} done</span>
          <button onClick={handleRefresh} style={{
            width: 30, height: 30, background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            {refreshing ? <Loader2 size={12} className="animate-spin-slow" /> : <RefreshCw size={12} />}
          </button>
        </div>
      </div>

      <div className="divider" style={{ marginBottom: 20 }} />

      {/* ── Strict Auth Gate ── */}
      {!activeChannel.is_connected ? (
        <div style={{
          padding: 40, background: 'var(--accent-subtle)',
          border: '1px dashed var(--border-focus)', borderRadius: 12,
          textAlign: 'center', marginBottom: 20
        }}>
          <LinkIcon size={32} color="var(--accent)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
            OAuth Connection Required
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px' }}>
            Before scheduling posts, you must authorize SocialEngine to publish on behalf of this {platform} account.
          </p>
          <button
            className="btn-primary"
            onClick={() => initiateOAuth(activeChannel)}
            style={{ padding: '12px 24px', fontSize: 13 }}
          >
            Connect to {platform} securely
          </button>
        </div>
      ) : (
        <>
          {/* ── Content Type Selector ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Content Type for {platform}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {types.map(({ id, label, icon: Icon, desc }) => {
            const isSelected = contentType === id;
            return (
              <button
                key={id}
                onClick={() => setContentType(id)}
                title={desc}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px',
                  background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-hover)',
                  border: `1px solid ${isSelected ? 'var(--border-focus)' : 'var(--border-color)'}`,
                  borderRadius: 9,
                  fontSize: 11, fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>
        {/* Selected type description */}
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <selectedType.icon size={11} />
          {selectedType.desc}
        </div>
      </div>

      {/* ── Compose ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: showCopilot ? '1px solid #c084fc' : '1px solid var(--border-color)',
        borderRadius: 12, padding: 16, marginBottom: 16,
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Compose — {selectedType.label}
          </div>
          <button
            onClick={() => setShowCopilot(!showCopilot)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px',
              background: showCopilot ? 'rgba(192, 132, 252, 0.15)' : 'var(--bg-hover)',
              border: showCopilot ? '1px solid rgba(192, 132, 252, 0.3)' : '1px solid var(--border-color)',
              borderRadius: 8,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              color: showCopilot ? '#c084fc' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Sparkles size={12} color={showCopilot ? "#c084fc" : "var(--text-muted)"} />
            AI Copilot
          </button>
        </div>

        {/* ── AI Copilot Panel ── */}
        {showCopilot && (
          <div className="animate-slide-up" style={{
            background: 'var(--bg-main)', border: '1px solid #e9d5ff',
            borderRadius: 10, padding: 16, marginBottom: 16
          }}>
            <textarea
              className="input-premium"
              placeholder="What is this post about? (e.g., 'Announcing our new feature launch next week')"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              style={{ width: '100%', minHeight: 60, padding: '10px 14px', resize: 'vertical', marginBottom: 10, fontSize: 13 }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { id: 'caption_hashtags', label: 'Caption & Hashtags' },
                { id: 'professional_polish', label: 'Professional Polish' },
                { id: 'repurpose_thread', label: 'Twitter/X Thread' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setAiMode(m.id)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: aiMode === m.id ? '#f3e8ff' : 'var(--bg-hover)',
                    border: aiMode === m.id ? '1px solid #d8b4fe' : '1px solid transparent',
                    color: aiMode === m.id ? '#a855f7' : 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  {m.label}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button
                className="btn-primary"
                onClick={handleAIGenerate}
                disabled={generating || !aiPrompt}
                style={{ padding: '6px 14px', fontSize: 11, background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }}
              >
                {generating ? <Loader2 size={12} className="animate-spin-slow" /> : <Sparkles size={12} />}
                {generating ? 'Thinking...' : 'Generate'}
              </button>
            </div>

            {aiResult && (
              <div className="animate-slide-up" style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generated Payload:</div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 12 }}>
                  {aiResult}
                </div>
                <button onClick={handleApplyAI} className="btn-secondary" style={{ width: '100%', padding: '8px', justifyContent: 'center' }}>
                  <Check size={14} /> Apply to Composer
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Media Preview Area */}
        {mediaFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--bg-card)', borderRadius: 8, marginBottom: 12, border: '1px solid var(--border-color)' }}>
            {mediaPreview ? (
              <img src={mediaPreview} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <div style={{ width: 40, height: 40, background: 'var(--bg-hover)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Video size={16} color="var(--text-muted)" />
              </div>
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mediaFile.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <button onClick={() => { setMediaFile(null); setMediaPreview(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 5 }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 10 }}>
          <input
            ref={titleRef}
            className="input-premium"
            type="text"
            placeholder={`${selectedType.label} title...`}
            value={postTitle}
            onChange={e => setPostTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <div style={{ position: 'relative' }}>
            <Hash size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="input-premium"
              type="text"
              placeholder="Caption & hashtags"
              value={postCaption}
              onChange={e => setPostCaption(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ paddingLeft: 30 }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="datetime-local"
              className="input-premium"
              value={scheduledFor}
              onChange={e => setScheduledFor(e.target.value)}
              title="Schedule post for future"
              style={{ width: 150 }}
            />
          </div>
          
          {/* File Upload Button */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0 16px', background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)', borderRadius: 9,
              color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Attach Media"
          >
            <Paperclip size={14} />
          </button>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !postTitle}
            style={{ whiteSpace: 'nowrap', padding: '11px 18px' }}
          >
            {(submitting || uploading) ? <Loader2 size={13} className="animate-spin-slow" /> : (userRole === 'editor' ? <Shield size={13} /> : <Send size={13} />)}
            <span>{uploading ? 'Uploading...' : (userRole === 'editor' ? 'Submit for Approval' : 'Commit & Schedule')}</span>
          </button>
        </div>
      </div>

      {/* ── Queue List ── */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Queue Stack · {posts.length} total
        </div>

        {posts.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '36px 24px',
            border: '1px dashed var(--border-color)',
            borderRadius: 12, gap: 10,
          }}>
            <Inbox size={24} color="var(--text-muted)" />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Queue is empty. Compose a payload above.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pending.map((p, i) => <QueueRow key={p.id} post={p} index={i} userRole={userRole} onApprovePost={onApprovePost} />)}
            {dispatched.map((p, i) => <QueueRow key={p.id} post={p} index={pending.length + i} userRole={userRole} />)}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function QueueRow({ post, index, userRole, onApprovePost }) {
  const TypeIcon = getTypeIcon(post.content_type);
  return (
    <div className="queue-row animate-slide-up" style={{
      animationDelay: `${index * 0.03}s`,
      animationFillMode: 'both',
      opacity: post.is_published ? 0.5 : 1,
    }}>
      <div style={{
        width: 3, height: 38, borderRadius: 99, flexShrink: 0,
        background: post.is_published
          ? 'var(--success)'
          : 'var(--warning)',
      }} />

      {/* Content type icon */}
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: 'var(--bg-hover)',
        border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TypeIcon size={12} color="var(--text-muted)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
          {post.title}
          {post.media_url && <Paperclip size={10} color="var(--accent)" title="Media attached" />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {post.content_type && (
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>
              {post.content_type.replace(/_/g, ' ')}
            </span>
          )}
          {post.caption && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {post.caption}
            </span>
          )}
        </div>
      </div>

      {post.is_published ? (
        <span className="badge-dispatched"><CheckCircle2 size={9} />⚡ Done</span>
      ) : post.approval_status === 'pending' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge-pending" style={{ background: '#FEE2E2', color: 'var(--error)', border: '1px solid #FECACA' }}><Shield size={9} />⏳ Pending Approval</span>
          {userRole === 'admin' && (
            <button onClick={() => onApprovePost(post.id)} className="btn-primary" style={{ padding: '4px 8px', fontSize: 10 }}>
              Approve
            </button>
          )}
        </div>
      ) : (
        <span className="badge-pending"><Clock size={9} />⏳ Scheduled</span>
      )}
    </div>
  );
}

function getTypeIcon(contentType) {
  const map = {
    photo: Image, image_pin: Image, slideshow: Image,
    video: Video, video_pin: Video,
    reel: Film, idea_pin: Film,
    story: Layers, carousel: Layers, thread: Layers,
    tweet: AlignLeft, post: AlignLeft,
    article: FileText, document: FileText,
    poll: BarChart2,
  };
  return map[contentType] || AlignLeft;
}
