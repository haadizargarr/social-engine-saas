import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

let _id = 0;

const CONFIG = {
  success: { icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
  error:   { icon: XCircle,     color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  warning: { icon: AlertTriangle,color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
  info:    { icon: Info,         color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
};

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const cfg = CONFIG[toast.type] || CONFIG.info;
  const Icon = cfg.icon;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 280);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const t = setTimeout(dismiss, toast.duration || 4500);
    return () => clearTimeout(t);
  }, [dismiss]);

  return (
    <div
      className={exiting ? 'toast-out' : 'toast-in'}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '13px 16px',
        background: `${cfg.bg}`,
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: '360px',
        width: '100%',
      }}
    >
      <Icon size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45, fontWeight: 500 }}>
        {toast.message}
      </span>
      <button onClick={dismiss} style={{ color: '#475569', cursor: 'pointer', flexShrink: 0, background: 'none', border: 'none', padding: 0, marginTop: 1 }}>
        <X size={13} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info', duration = 4500) => {
    setToasts(p => [...p, { id: ++_id, message, type, duration }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
}
