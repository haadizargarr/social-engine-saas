import { useState, useEffect, useCallback } from 'react';

// All requests go to the Vite dev server proxy (/api/* → 127.0.0.1:8000/*)
// This bypasses Safari's cross-origin localhost security restrictions.
const API_BASE = '/api';

// Safari says "Load failed", Chrome says "Failed to fetch", Firefox says "NetworkError when attempting to fetch resource."
const isNetworkError = (err) =>
  err.message === 'Failed to fetch' ||
  err.message === 'Load failed' ||
  err.message.toLowerCase().includes('networkerror') ||
  err.message.toLowerCase().includes('network request failed') ||
  err.message === 'The string did not match the expected pattern.' ||
  err.message.includes('Unexpected token') ||
  err.message.includes('JSON');

export function useAuth(addToast) {
  const [token, setToken] = useState(() => localStorage.getItem('se_token') || '');
  const [userEmail, setUserEmail] = useState('Disconnected');
  const [userRole, setUserRole] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(() => {
    try {
      const saved = localStorage.getItem('se_active_channel');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [posts, setPosts] = useState([]);
  const [globalPosts, setGlobalPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('se_token');
    localStorage.removeItem('se_active_channel');
    setToken('');
    setUserEmail('Disconnected');
    setUserRole('');
    setIsLive(false);
    setChannels([]);
    setActiveChannel(null);
    setPosts([]);
    setGlobalPosts([]);
  }, []);

  const loadDashboard = useCallback(async (tok) => {
    const authToken = tok || token;
    if (!authToken) return;
    setIsLoading(true);
    try {
      const uRes = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (uRes.status === 401) {
        logout();
        addToast('Session expired. Please sign in again.', 'warning');
        return;
      }
      if (!uRes.ok) throw new Error('Failed to load profile.');
      const uData = await uRes.json();
      setUserEmail(uData.email);
      setUserRole(uData.role);
      setIsLive(true);

      const cRes = await fetch(`${API_BASE}/channels`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!cRes.ok) throw new Error('Failed to load channels.');
      const cData = await cRes.json();
      setChannels(cData);

      // Load all global posts for the calendar
      await loadAllPosts(authToken);

    } catch (err) {
      if (isNetworkError(err)) {
        addToast('Cannot reach backend. Is the FastAPI server running on port 8000?', 'error');
      } else {
        addToast(isNetworkError(err) ? 'Backend is offline or unreachable.' : err.message, 'error');
      }
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [token, logout, addToast]);

  useEffect(() => {
    if (token) loadDashboard(token);
  }, [token]);

  // Restore posts for persisted active channel on refresh
  useEffect(() => {
    if (token && activeChannel) loadPosts(activeChannel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuth = async (type, email, password) => {
    if (!email || !password) {
      addToast('Email and password are required.', 'warning');
      return;
    }
    const url = `${API_BASE}/${type === 'signup' ? 'users' : 'login'}`;
    const body =
      type === 'signup'
        ? JSON.stringify({ email, password })
        : new URLSearchParams({ username: email, password });
    const headers =
      type === 'signup' ? { 'Content-Type': 'application/json' } : {};

    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      const data = await res.json();
      if (!res.ok) {
        // Pydantic v2 returns detail as an array of error objects; older HTTPException returns a string
        let msg;
        if (Array.isArray(data.detail)) {
          msg = data.detail.map(e => e.msg || e.message || JSON.stringify(e)).join('. ');
        } else {
          msg = data.detail || 'Authentication failed.';
        }
        if (msg.includes('already mapped'))       addToast('That email is already registered. Try signing in.', 'error');
        else if (msg.includes('Invalid access'))  addToast('Incorrect email or password.', 'error');
        else                                      addToast(msg, 'error');
        return;
      }
      if (type === 'login') {
        localStorage.setItem('se_token', data.access_token);
        setToken(data.access_token);
        addToast('Signed in successfully. Welcome back!', 'success');
      } else {
        addToast('Account created! You can now sign in.', 'success');
      }
    } catch (err) {
      if (isNetworkError(err)) {
        addToast('Cannot reach the backend server on port 8000.', 'error');
      } else {
        addToast(isNetworkError(err) ? 'Backend is offline or unreachable.' : err.message, 'error');
      }
    }
  };

  const createChannel = async (platform, pageName, handle) => {
    if (!pageName || !handle) {
      addToast('Page name and handle are required.', 'warning');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform, page_name: pageName, handle }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail || 'Failed to create channel.';
        if (msg.includes('already tracked')) addToast(`@${handle} is already registered.`, 'error');
        else addToast(msg, 'error');
        return false;
      }
      addToast(`Channel @${handle} added successfully!`, 'success');
      await loadDashboard();
      return true;
    } catch (err) {
      addToast(isNetworkError(err) ? 'Backend is offline.' : err.message, 'error');
      return false;
    }
  };

  const loadPosts = async (channel) => {
    try {
      const res = await fetch(`${API_BASE}/channels/${channel.id}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load posts.');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      addToast(isNetworkError(err) ? 'Backend is offline.' : err.message, 'error');
    }
  };

  const loadAllPosts = async (authToken = token) => {
    try {
      const res = await fetch(`${API_BASE}/posts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalPosts(data);
      }
    } catch (err) {
      console.error('Failed to load global posts', err);
    }
  };

  const selectChannel = async (channel) => {
    setActiveChannel(channel);
    localStorage.setItem('se_active_channel', JSON.stringify(channel));
    await loadPosts(channel);
  };

  const schedulePost = async (postTitle, postCaption, contentType = 'post', mediaUrl = null, scheduledFor = null) => {
    if (!postTitle) { addToast('Post title is required.', 'warning'); return false; }
    try {
      const res = await fetch(`${API_BASE}/channels/${activeChannel.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: postTitle, caption: postCaption, content_type: contentType, media_url: mediaUrl, scheduled_for: scheduledFor }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to queue post.');
      }
      addToast('Post committed to queue!', 'success');
      await loadPosts(activeChannel);
      return true;
    } catch (err) {
      addToast(isNetworkError(err) ? 'Backend is offline.' : err.message, 'error');
      return false;
    }
  };

  const initiateOAuth = async (channel) => {
    try {
      const res = await fetch(`${API_BASE}/auth/${channel.id}/connect`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to start OAuth flow.');
      const data = await res.json();
      window.location.href = data.redirect_url;
    } catch (err) {
      addToast(isNetworkError(err) ? 'Backend is offline.' : err.message, 'error');
    }
  };

  const approvePost = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve post.');
      addToast('Post approved and scheduled for dispatch!', 'success');
      if (activeChannel) await loadPosts(activeChannel);
      await loadAllPosts();
      return true;
    } catch (err) {
      addToast(isNetworkError(err) ? 'Backend is offline.' : err.message, 'error');
      return false;
    }
  };

  const uploadMedia = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed.');
      const data = await res.json();
      return data.media_url;
    } catch (err) {
      addToast(isNetworkError(err) ? 'Backend is offline or unreachable.' : err.message, 'error');
      return null;
    }
  };

  const generateAIContent = async (prompt, mode, platform) => {
    try {
      const res = await fetch(`${API_BASE}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, mode, platform }),
      });
      if (!res.ok) throw new Error('AI Generation failed.');
      const data = await res.json();
      return data.generated_text;
    } catch (err) {
      addToast(isNetworkError(err) ? 'Backend is offline or unreachable.' : err.message, 'error');
      return null;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.detail || 'Failed to request reset.';
        if (Array.isArray(data.detail)) {
          msg = data.detail.map(e => e.msg || e.message || JSON.stringify(e)).join('. ');
        }
        addToast(msg, 'error');
        return null;
      }
      return data.mock_token;
    } catch (err) {
      addToast(isNetworkError(err) ? 'Cannot reach the backend server on port 8000.' : err.message, 'error');
      return null;
    }
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: resetToken, new_password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        let msg = data.detail || 'Failed to reset password.';
        if (Array.isArray(data.detail)) {
          msg = data.detail.map(e => e.msg || e.message || JSON.stringify(e)).join('. ');
        }
        addToast(msg, 'error');
        return false;
      }
      addToast('Password successfully reset! You can now sign in.', 'success');
      return true;
    } catch (err) {
      addToast(isNetworkError(err) ? 'Cannot reach the backend server on port 8000.' : err.message, 'error');
      return false;
    }
  };

  return {
    token, userEmail, userRole, isLive, channels, activeChannel,
    posts, globalPosts, isLoading, handleAuth, createChannel,
    selectChannel, schedulePost, approvePost, logout, loadDashboard, loadPosts, loadAllPosts,
    initiateOAuth, uploadMedia, generateAIContent, requestPasswordReset, resetPassword
  };
}
