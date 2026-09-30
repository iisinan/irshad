import React, { useState, useEffect } from 'react';
import { Mail, Search, CheckCircle, Clock, Trash2, Reply, Send, MessageCircle } from 'lucide-react';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/toast';

import { customConfirm } from '../utils/confirm';

export default function AdminInbox() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeUser, setActiveUser] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/suggestions');
      setConversations(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkRead = async (userId) => {
    try {
      // Find all unread messages for this user
      const userConv = conversations.find(c => c.user.id === userId);
      if (!userConv) return;
      
      const unreadMsgs = userConv.messages.filter(m => m.status === 'unread' && !m.is_admin_reply);
      
      await Promise.all(unreadMsgs.map(m => api.put(`/admin/suggestions/${m.id}/status`, { status: 'read' })));
      
      setConversations(prev => prev.map(c => {
        if (c.user.id === userId) {
          return {
            ...c,
            has_unread: false,
            messages: c.messages.map(m => ({ ...m, status: 'read' }))
          };
        }
        return c;
      }));
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch (err) {
      toastError('Failed to update status');
    }
  };

  const handleDeleteConversation = async (userId) => {
    if (!await customConfirm('Delete all messages with this user?')) return;
    try {
      const userConv = conversations.find(c => c.user.id === userId);
      await Promise.all(userConv.messages.map(m => api.delete(`/admin/suggestions/${m.id}`)));
      setConversations(prev => prev.filter(c => c.user.id !== userId));
      if (activeUser?.id === userId) setActiveUser(null);
      toastSuccess('Conversation deleted');
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch (err) {
      toastError('Failed to delete');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeUser) return;
    
    // We need the ID of the last user message to reply to
    const userConv = conversations.find(c => c.user.id === activeUser.id);
    const lastUserMsg = [...userConv.messages].reverse().find(m => !m.is_admin_reply);
    
    if (!lastUserMsg) {
       toastError("Cannot reply: No user message found.");
       return;
    }

    try {
      setReplyLoading(true);
      await api.post(`/admin/suggestions/${lastUserMsg.id}/reply`, { reply: replyMessage });
      toastSuccess('Reply sent successfully');
      
      // Update local state
      const newMsg = {
         id: Math.random(),
         message: replyMessage,
         status: 'read',
         is_admin_reply: true,
         created_at: new Date().toISOString()
      };
      
      setConversations(prev => prev.map(c => {
        if (c.user.id === activeUser.id) {
          return {
            ...c,
            has_unread: false,
            messages: [...c.messages.map(m => ({ ...m, status: 'read' })), newMsg]
          };
        }
        return c;
      }));
      
      setReplyMessage('');
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>Loading inbox...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', maxWidth: '1200px', margin: '0 auto', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      
      {/* Sidebar - Conversation List */}
      <div style={{ width: '350px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-section)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={20} color="var(--primary)" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>Support Inbox</h1>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>No messages yet</div>
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.user.id} 
                onClick={() => setActiveUser(conv.user)}
                style={{ 
                  padding: '20px', 
                  borderBottom: '1px solid var(--border)', 
                  cursor: 'pointer', 
                  background: activeUser?.id === conv.user.id ? 'var(--primary-10)' : 'transparent',
                  display: 'flex',
                  gap: '12px'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                  {(conv.user.name || conv.user.first_name || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.user.name || conv.user.first_name || 'Anonymous User'}
                    </div>
                    {conv.has_unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--non-compliant)' }} />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.messages[conv.messages.length - 1].message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {activeUser ? (
          <>
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-section)' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>{activeUser.name || activeUser.first_name || 'Anonymous'}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeUser.email}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleMarkRead(activeUser.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Mark Read</button>
                <button onClick={() => handleDeleteConversation(activeUser.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>

            {/* Chat History */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {conversations.find(c => c.user.id === activeUser.id)?.messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.is_admin_reply ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '70%', 
                    padding: '16px', 
                    borderRadius: '16px',
                    borderBottomRightRadius: msg.is_admin_reply ? '4px' : '16px',
                    borderBottomLeftRadius: !msg.is_admin_reply ? '4px' : '16px',
                    background: msg.is_admin_reply ? 'var(--primary)' : 'var(--bg-section)',
                    color: msg.is_admin_reply ? 'white' : 'var(--text-dark)',
                    border: msg.is_admin_reply ? 'none' : '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{msg.message}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', padding: '0 4px' }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg-section)' }}>
              <form onSubmit={handleReplySubmit} style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text"
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type a reply... It will be sent via email."
                  style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.95rem', outline: 'none' }}
                  disabled={replyLoading}
                />
                <button type="submit" disabled={replyLoading || !replyMessage.trim()} style={{ padding: '0 24px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 800, cursor: (replyLoading || !replyMessage.trim()) ? 'not-allowed' : 'pointer', opacity: (replyLoading || !replyMessage.trim()) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} /> Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem', flexDirection: 'column', gap: '16px' }}>
            <MessageCircle size={48} opacity={0.2} />
            Select a conversation to view and reply
          </div>
        )}
      </div>

    </div>
  );
}
