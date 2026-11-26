import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  CheckCircle2,
  Headphones,
  Mail,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import api, {
  fetchAdminChatConversation,
  fetchAdminChatConversations,
  replyAdminChatConversation,
  updateAdminChatStatus,
} from '../services/api';
import { toastError, toastSuccess } from '../utils/toast';
import { customConfirm } from '../utils/confirm';

const STATUS_BADGES = {
  escalated: { label: 'Needs Admin', bg: 'var(--non-compliant-bg)', color: 'var(--non-compliant)' },
  admin_joined: { label: 'Admin Live', bg: 'var(--halal-bg)', color: 'var(--halal)' },
  active: { label: 'AI Active', bg: 'var(--primary-50)', color: 'var(--primary)' },
  closed: { label: 'Resolved', bg: 'var(--bg-section)', color: 'var(--text-muted)' },
};

export default function AdminInbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvParam = searchParams.get('conversation_id');

  const [mode, setMode] = useState('chats'); // 'chats' | 'suggestions'

  // Live AI Chats state
  const [chatFilter, setChatFilter] = useState('all'); // 'attention' | 'all' | 'closed'
  const [chatConversations, setChatConversations] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState(() =>
    initialConvParam ? Number(initialConvParam) : null
  );
  const [activeChat, setActiveChat] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [chatReply, setChatReply] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [sendingChatReply, setSendingChatReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Direct Suggestions state
  const [conversations, setConversations] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [error, setError] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const chatEndRef = useRef(null);

  const loadChats = useCallback(async (silent = false) => {
    try {
      if (!silent) setChatLoading(true);
      const res = await fetchAdminChatConversations(chatFilter);
      setChatConversations(res.data || []);
    } catch (err) {
      if (!silent) setError(err?.response?.data?.message || 'Failed to load chats.');
    } finally {
      if (!silent) setChatLoading(false);
    }
  }, [chatFilter]);

  const openChatThread = useCallback(async (convId, silent = false) => {
    try {
      const res = await fetchAdminChatConversation(convId);
      setActiveChatId(convId);
      setActiveChat(res.conversation);
      setActiveMessages(res.messages || []);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('conversation_id', String(convId));
        return next;
      }, { replace: true });
      if (!silent) {
        window.dispatchEvent(new Event('suggestions-updated'));
      }
    } catch (err) {
      if (!silent) toastError(err?.response?.data?.message || 'Failed to open chat.');
    }
  }, [setSearchParams]);

  const loadSuggestions = async (silent = false) => {
    try {
      if (!silent) setLoadingSuggestions(true);
      const res = await api.get('/admin/suggestions');
      setConversations(res.data.data || []);
    } catch (err) {
      if (!silent) setError(err?.response?.data?.message || 'Failed to load inbox.');
    } finally {
      if (!silent) setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (initialConvParam) {
      openChatThread(Number(initialConvParam));
    }
  }, [initialConvParam, openChatThread]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeChatId]);

  // Poll live chat list and active thread every 5s when AdminInbox is open
  useEffect(() => {
    if (mode !== 'chats') return undefined;
    const interval = setInterval(() => {
      loadChats(true);
      if (activeChatId) {
        openChatThread(activeChatId, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [mode, activeChatId, loadChats, openChatThread]);

  const handleChatReplySubmit = async (e) => {
    e.preventDefault();
    if (!chatReply.trim() || !activeChatId || sendingChatReply) return;

    try {
      setSendingChatReply(true);
      const res = await replyAdminChatConversation(activeChatId, chatReply.trim(), notifyEmail);
      setActiveChat((prev) => (prev ? { ...prev, ...res.conversation } : res.conversation));
      setActiveMessages(res.messages || []);
      setChatReply('');
      toastSuccess(res.message || 'Reply sent to live chat');
      loadChats(true);
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingChatReply(false);
    }
  };

  const handleChatStatusChange = async (nextStatus) => {
    if (!activeChatId || updatingStatus) return;
    try {
      setUpdatingStatus(true);
      const res = await updateAdminChatStatus(activeChatId, nextStatus);
      setActiveChat((prev) => (prev ? { ...prev, ...res.conversation } : res.conversation));
      setActiveMessages(res.messages || []);
      loadChats(true);
      toastSuccess(
        nextStatus === 'active'
          ? 'Conversation handed back to Ask Irshad AI'
          : 'Conversation marked resolved'
      );
    } catch (err) {
      toastError(err?.response?.data?.message || 'Could not update chat status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Legacy Direct Suggestions handlers
  const handleMarkRead = async (userId) => {
    try {
      const userConv = conversations.find((c) => c.user.id === userId);
      if (!userConv) return;
      const unreadMsgs = userConv.messages.filter((m) => m.status === 'unread' && !m.is_admin_reply);
      await Promise.all(unreadMsgs.map((m) => api.put(`/admin/suggestions/${m.id}/status`, { status: 'read' })));
      setConversations((prev) =>
        prev.map((c) =>
          c.user.id === userId
            ? { ...c, has_unread: false, messages: c.messages.map((m) => ({ ...m, status: 'read' })) }
            : c
        )
      );
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch {
      toastError('Failed to update status');
    }
  };

  const handleDeleteConversation = async (userId) => {
    if (!(await customConfirm('Delete all messages with this user?'))) return;
    try {
      const userConv = conversations.find((c) => c.user.id === userId);
      await Promise.all(userConv.messages.map((m) => api.delete(`/admin/suggestions/${m.id}`)));
      setConversations((prev) => prev.filter((c) => c.user.id !== userId));
      if (activeUser?.id === userId) setActiveUser(null);
      toastSuccess('Conversation deleted');
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch {
      toastError('Failed to delete');
    }
  };

  const handleSuggestionReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeUser) return;
    const userConv = conversations.find((c) => c.user.id === activeUser.id);
    const lastUserMsg = [...(userConv?.messages || [])].reverse().find((m) => !m.is_admin_reply);

    if (!lastUserMsg) {
      toastError('Cannot reply: No user message found.');
      return;
    }

    try {
      setReplyLoading(true);
      await api.post(`/admin/suggestions/${lastUserMsg.id}/reply`, { reply: replyMessage });
      toastSuccess('Reply sent successfully');

      const newMsg = {
        id: Math.random(),
        message: replyMessage,
        status: 'read',
        is_admin_reply: true,
        created_at: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.user.id === activeUser.id
            ? {
                ...c,
                has_unread: false,
                messages: [...c.messages.map((m) => ({ ...m, status: 'read' })), newMsg],
              }
            : c
        )
      );
      setReplyMessage('');
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const attentionCount = chatConversations.filter((c) => c.needs_attention).length;
  const unreadDirectCount = conversations.filter((c) => c.has_unread).length;

  if (error) return <div style={{ padding: '40px', color: 'var(--non-compliant)' }}>{error}</div>;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        minHeight: 'calc(100vh - 96px)',
        maxWidth: '1240px',
        margin: '0 auto',
        background: 'var(--bg)',
        borderRadius: '18px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Left Sidebar */}
      <div
        style={{
          width: '360px',
          maxWidth: '100%',
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-section)',
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'var(--primary-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircle size={19} color="var(--primary)" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>
                Admin Support Inbox
              </h1>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                Chip into user chats &amp; respond live
              </div>
            </div>
          </div>

          {/* Primary Mode Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: mode === 'chats' ? '10px' : 0 }}>
            <button
              type="button"
              onClick={() => setMode('chats')}
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: mode === 'chats' ? 'var(--primary)' : 'var(--border)',
                background: mode === 'chats' ? 'var(--primary)' : 'var(--bg)',
                color: mode === 'chats' ? '#fff' : 'var(--text-dark)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Headphones size={14} />
              <span>AI Chats</span>
              {attentionCount > 0 && (
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: mode === 'chats' ? 'rgba(255,255,255,0.24)' : 'var(--non-compliant-bg)',
                    color: mode === 'chats' ? '#fff' : 'var(--non-compliant)',
                  }}
                >
                  {attentionCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMode('suggestions')}
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: mode === 'suggestions' ? 'var(--primary)' : 'var(--border)',
                background: mode === 'suggestions' ? 'var(--primary)' : 'var(--bg)',
                color: mode === 'suggestions' ? '#fff' : 'var(--text-dark)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Mail size={14} />
              <span>Feedback</span>
              {unreadDirectCount > 0 && (
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: mode === 'suggestions' ? 'rgba(255,255,255,0.24)' : 'var(--non-compliant-bg)',
                    color: mode === 'suggestions' ? '#fff' : 'var(--non-compliant)',
                  }}
                >
                  {unreadDirectCount}
                </span>
              )}
            </button>
          </div>

          {mode === 'chats' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'attention', label: 'Needs Attention' },
                { key: 'all', label: 'All Chats' },
                { key: 'closed', label: 'Resolved' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setChatFilter(f.key)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: chatFilter === f.key ? 'var(--primary)' : 'var(--border)',
                    background: chatFilter === f.key ? 'var(--primary-50)' : 'transparent',
                    color: chatFilter === f.key ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.71rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 245px)' }}>
          {mode === 'chats' ? (
            chatLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Loading conversations...
              </div>
            ) : chatConversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                No conversations match this filter.
              </div>
            ) : (
              chatConversations.map((conv) => {
                const badge = STATUS_BADGES[conv.status] || STATUS_BADGES.active;
                const isSelected = activeChatId === conv.id;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => openChatThread(conv.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '15px 18px',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-50)' : 'transparent',
                      display: 'flex',
                      gap: '11px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: conv.needs_attention ? 'var(--gold-50)' : 'var(--primary-50)',
                        color: conv.needs_attention ? 'var(--gold)' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {(conv.user?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.user?.name || 'User'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: badge.bg,
                            color: badge.color,
                            flexShrink: 0,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                        {conv.title}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.preview}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : loadingSuggestions ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              Loading inbox...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No direct feedback messages yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.user.id}
                onClick={() => setActiveUser(conv.user)}
                style={{
                  padding: '16px 18px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: activeUser?.id === conv.user.id ? 'var(--primary-50)' : 'transparent',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'var(--primary-50)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {(conv.user.name || conv.user.first_name || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.user.name || conv.user.first_name || 'Anonymous User'}
                    </div>
                    {conv.has_unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--non-compliant)' }} />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.messages[conv.messages.length - 1]?.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Workspace */}
      <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {mode === 'chats' ? (
          activeChat ? (
            <>
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-section)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                      {activeChat.user?.name || 'User'}
                    </h2>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: (STATUS_BADGES[activeChat.status] || STATUS_BADGES.active).bg,
                        color: (STATUS_BADGES[activeChat.status] || STATUS_BADGES.active).color,
                      }}
                    >
                      {(STATUS_BADGES[activeChat.status] || STATUS_BADGES.active).label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {activeChat.user?.email} · Topic: <strong>{activeChat.title}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {activeChat.status !== 'active' && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleChatStatusChange('active')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '9px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text-dark)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: updatingStatus ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <RotateCcw size={14} /> Hand Back to AI
                    </button>
                  )}
                  {activeChat.status !== 'closed' && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleChatStatusChange('closed')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '9px',
                        border: 'none',
                        background: 'var(--halal-bg)',
                        color: 'var(--halal)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: updatingStatus ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <CheckCircle2 size={14} /> Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  overflowY: 'auto',
                  maxHeight: 'calc(100vh - 300px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {activeMessages.map((msg) => {
                  if (msg.role === 'system') {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: 'center',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          background: 'var(--bg-section)',
                          border: '1px solid var(--border)',
                          padding: '4px 12px',
                          borderRadius: '999px',
                        }}
                      >
                        {msg.content}
                      </div>
                    );
                  }

                  const isAdmin = msg.role === 'admin';
                  const isUser = msg.role === 'user';
                  const adminName = msg.metadata?.admin_name || 'Irshad Admin';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isAdmin ? 'flex-end' : 'flex-start',
                        gap: '4px',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: isAdmin ? 'var(--primary)' : isUser ? 'var(--text-dark)' : 'var(--gold)',
                          padding: '0 4px',
                        }}
                      >
                        {isAdmin ? <Headphones size={12} /> : isUser ? <UserIcon size={12} /> : <Bot size={12} />}
                        <span>{isAdmin ? `${adminName} (You / Admin)` : isUser ? activeChat.user?.name || 'User' : 'Ask Irshad AI'}</span>
                      </div>

                      <div
                        style={{
                          maxWidth: '78%',
                          padding: '12px 15px',
                          borderRadius: '14px',
                          borderBottomRightRadius: isAdmin ? '4px' : '14px',
                          borderBottomLeftRadius: !isAdmin ? '4px' : '14px',
                          background: isAdmin
                            ? 'var(--primary)'
                            : isUser
                              ? 'var(--bg-section)'
                              : 'var(--gold-50)',
                          color: isAdmin ? '#FFFFFF' : 'var(--text-dark)',
                          border: isAdmin
                            ? 'none'
                            : isUser
                              ? '1px solid var(--border)'
                              : '1px solid var(--gold-border)',
                          fontSize: '0.88rem',
                          lineHeight: 1.55,
                        }}
                      >
                        {isUser ? (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        ) : (
                          <div className="chat-markdown">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0 4px' }}>
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-section)' }}>
                <form onSubmit={handleChatReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={chatReply}
                      onChange={(e) => setChatReply(e.target.value)}
                      placeholder={`Chip in and reply live to ${activeChat.user?.name || 'user'}...`}
                      disabled={sendingChatReply}
                      style={{
                        flex: 1,
                        padding: '13px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text-dark)',
                        fontSize: '0.92rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={sendingChatReply || !chatReply.trim()}
                      style={{
                        padding: '0 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 800,
                        cursor: sendingChatReply || !chatReply.trim() ? 'not-allowed' : 'pointer',
                        opacity: sendingChatReply || !chatReply.trim() ? 0.65 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                      }}
                    >
                      <Send size={16} />
                      <span>{sendingChatReply ? 'Sending...' : 'Chip In'}</span>
                    </button>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', width: 'fit-content' }}>
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                    />
                    <span>Also notify user by email on initial reply (so they see it if offline)</span>
                  </label>
                </form>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.96rem',
                flexDirection: 'column',
                gap: '12px',
                padding: '40px',
                textAlign: 'center',
              }}
            >
              <Sparkles size={40} opacity={0.25} />
              <div>Select any user conversation on the left to inspect context or chip in live.</div>
            </div>
          )
        ) : activeUser ? (
          <>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
                  {activeUser.name || activeUser.first_name || 'Anonymous'}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{activeUser.email}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleMarkRead(activeUser.id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleDeleteConversation(activeUser.id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '22px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {conversations
                .find((c) => c.user.id === activeUser.id)
                ?.messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.is_admin_reply ? 'flex-end' : 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: '72%',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        borderBottomRightRadius: msg.is_admin_reply ? '4px' : '14px',
                        borderBottomLeftRadius: !msg.is_admin_reply ? '4px' : '14px',
                        background: msg.is_admin_reply ? 'var(--primary)' : 'var(--bg-section)',
                        color: msg.is_admin_reply ? 'white' : 'var(--text-dark)',
                        border: msg.is_admin_reply ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px', padding: '0 4px' }}>
                      {new Date(msg.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-section)' }}>
              <form onSubmit={handleSuggestionReplySubmit} style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type a reply... It will be sent via email."
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.92rem', outline: 'none' }}
                  disabled={replyLoading}
                />
                <button
                  type="submit"
                  disabled={replyLoading || !replyMessage.trim()}
                  style={{ padding: '0 22px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 800, cursor: replyLoading || !replyMessage.trim() ? 'not-allowed' : 'pointer', opacity: replyLoading || !replyMessage.trim() ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Send size={17} /> Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.96rem', flexDirection: 'column', gap: '14px', padding: '40px' }}>
            <MessageCircle size={44} opacity={0.22} />
            Select a feedback thread to view and reply
          </div>
        )}
      </div>
    </div>
  );
}
