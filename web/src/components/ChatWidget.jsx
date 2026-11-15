import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Plus,
  History,
  ThumbsUp,
  ThumbsDown,
  Headphones,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchChatConversations,
  fetchChatConversation,
  sendChatMessage,
  sendPublicChatMessage,
  submitChatFeedback,
  escalateChatConversation,
} from '../services/api';
import { toastSuccess, toastError } from '../utils/toast';

const STARTER_PROMPTS = [
  'How does AAOIFI screening work?',
  'How do Zakat & Hawl work?',
  'How does dividend purification work?',
  'What plans & pricing does Irshad offer?',
  'I need billing or account help',
];

export default function ChatWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'history'
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const messagesEndRef = useRef(null);

  const userId = user?.id ?? null;
  useEffect(() => {
    setActiveConversation(null);
    setConversations([]);
    setMessages([]);
    setView('chat');
  }, [userId]);

  useEffect(() => {
    if (open && view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, view]);

  const loadConversations = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetchChatConversations();
      setConversations(res.data || []);
    } catch {
      toastError('Could not load chat history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setView('history');
    loadConversations();
  };

  const handleSelectConversation = async (convId) => {
    try {
      setLoadingHistory(true);
      const res = await fetchChatConversation(convId);
      setActiveConversation(res.conversation);
      setMessages(res.messages || []);
      setView('chat');
    } catch {
      toastError('Could not open conversation.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setView('chat');
  };

  const handleSend = async (customText = null) => {
    const text = (customText ?? input).trim();
    if (!text || sending) return;

    if (!customText) setInput('');

    const optimisticUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setSending(true);

    try {
      if (isAuthenticated) {
        const res = await sendChatMessage(text, activeConversation?.id ?? null);
        setActiveConversation(res.conversation);
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== optimisticUserMsg.id);
          return [...withoutTemp, res.user_message, res.assistant_message];
        });
      } else {
        const recentHistory = messages
          .filter((m) => typeof m.id !== 'string' || !m.id.startsWith('temp-'))
          .slice(-6)
          .map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content || '').slice(0, 600),
          }));
        const res = await sendPublicChatMessage(text, recentHistory);
        const persistedUserMsg = {
          ...optimisticUserMsg,
          id: `pub-u-${Date.now()}`,
        };
        const assistantMsg = {
          ...res.assistant_message,
          id: `pub-a-${Date.now()}`,
        };
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== optimisticUserMsg.id);
          return [...withoutTemp, persistedUserMsg, assistantMsg];
        });
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
      toastError(err?.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (messageId, feedback) => {
    try {
      await submitChatFeedback(messageId, feedback);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
      );
    } catch {
      toastError('Could not save feedback.');
    }
  };

  const handleEscalate = async () => {
    if (!activeConversation?.id || escalating) return;
    if (activeConversation.status === 'escalated') return;

    try {
      setEscalating(true);
      await escalateChatConversation(activeConversation.id);
      setActiveConversation((prev) => (prev ? { ...prev, status: 'escalated' } : prev));
      toastSuccess('Conversation sent to Irshad Support Team!');
    } catch (err) {
      toastError(err?.response?.data?.message || 'Could not escalate conversation.');
    } finally {
      setEscalating(false);
    }
  };

  const hasAssistantMessages = messages.some((m) => m.role === 'assistant');

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Irshad AI Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 980,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.22)',
          }}
        >
          <Sparkles size={18} />
          <span>Ask Irshad</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Irshad AI Chatboard"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: 'min(410px, calc(100vw - 24px))',
            height: 'min(610px, calc(100vh - 40px))',
            zIndex: 1100,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--bg-section)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {view === 'history' ? (
                <button
                  type="button"
                  onClick={() => setView('chat')}
                  aria-label="Back to chat"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dark)',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={17} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.94rem',
                    color: 'var(--text-dark)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {view === 'history' ? 'Past Conversations' : 'Irshad Assistant'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {view === 'history'
                    ? 'Select a thread to continue'
                    : 'AAOIFI guide, Zakat & support'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {view === 'chat' && (
                <>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    title="New conversation"
                    aria-label="New conversation"
                    style={iconBtnStyle}
                  >
                    <Plus size={16} />
                  </button>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={handleOpenHistory}
                      title="Chat history"
                      aria-label="Chat history"
                      style={iconBtnStyle}
                    >
                      <History size={16} />
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close chatboard"
                aria-label="Close chatboard"
                style={iconBtnStyle}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          {view === 'history' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {loadingHistory ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No past conversations yet. Start asking a question!
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px',
                      marginBottom: '8px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background:
                        activeConversation?.id === conv.id ? 'var(--primary-50)' : 'var(--bg-section)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-dark)' }}>
                        {conv.title}
                      </span>
                      {conv.status === 'escalated' && (
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: 'var(--primary-50)',
                            color: 'var(--primary)',
                          }}
                        >
                          Escalated
                        </span>
                      )}
                    </div>
                    {conv.preview && (
                      <span
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conv.preview}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'var(--bg-section)',
                        border: '1px solid var(--border)',
                        fontSize: '0.86rem',
                        lineHeight: 1.5,
                        color: 'var(--text-dark)',
                      }}
                    >
                      As-salamu alaykum! Ask me how AAOIFI screening works, Hawl & Zakat tracking, dividend purification, or your Irshad account & billing.
                    </div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', paddingLeft: '2px' }}>
                      QUICK QUESTIONS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSend(prompt)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '999px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-section)',
                            color: 'var(--text-dark)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const meta = msg.metadata || {};
                    const citedSymbols = meta.cited_symbols || [];
                    const resources = meta.matched_resources || [];
                    const followups = meta.suggested_followups || [];

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isUser ? 'flex-end' : 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '88%',
                            padding: '11px 14px',
                            borderRadius: '14px',
                            borderBottomRightRadius: isUser ? '4px' : '14px',
                            borderBottomLeftRadius: !isUser ? '4px' : '14px',
                            background: isUser ? 'var(--primary)' : 'var(--bg-section)',
                            color: isUser ? '#fff' : 'var(--text-dark)',
                            border: isUser ? 'none' : '1px solid var(--border)',
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
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

                        {!isUser && citedSymbols.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '88%' }}>
                            {citedSymbols.map((sym) => (
                              <button
                                key={sym}
                                type="button"
                                onClick={() => {
                                  navigate(isAuthenticated ? `/market/${sym}/aaoifi` : '/login');
                                  setOpen(false);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--primary-50)',
                                  color: 'var(--primary)',
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <span>View {sym} Screening</span>
                                <ArrowUpRight size={12} />
                              </button>
                            ))}
                          </div>
                        )}

                        {!isUser && resources.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '88%' }}>
                            {resources.slice(0, 2).map((res) => (
                              <button
                                key={res.id}
                                type="button"
                                onClick={() => {
                                  navigate(isAuthenticated ? '/portfolio#lectures' : '/resources');
                                  setOpen(false);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--bg-section)',
                                  color: 'var(--text-dark)',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <BookOpen size={12} />
                                <span>{res.title}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {!isUser && followups.length > 0 && msg.id === messages[messages.length - 1]?.id && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '92%' }}>
                            {followups.map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => handleSend(q)}
                                disabled={sending}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '999px',
                                  border: '1px dashed var(--border)',
                                  background: 'transparent',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}

                        {!isUser && typeof msg.id === 'number' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'up')}
                              aria-label="Helpful"
                              style={{
                                ...feedbackBtnStyle,
                                color: msg.feedback === 'up' ? 'var(--primary)' : 'var(--text-muted)',
                              }}
                            >
                              <ThumbsUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'down')}
                              aria-label="Not helpful"
                              style={{
                                ...feedbackBtnStyle,
                                color: msg.feedback === 'down' ? 'var(--non-compliant)' : 'var(--text-muted)',
                              }}
                            >
                              <ThumbsDown size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {sending && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      alignSelf: 'flex-start',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      background: 'var(--bg-section)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Thinking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Escalation / Sign-in bar */}
              {hasAssistantMessages && (
                isAuthenticated && activeConversation?.id ? (
                  <div
                    style={{
                      padding: '8px 14px',
                      borderTop: '1px solid var(--border)',
                      background: 'var(--bg-section)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    {activeConversation.status === 'escalated' ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Sent to Irshad Support Team</span>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Need a human admin?
                        </span>
                        <button
                          type="button"
                          onClick={handleEscalate}
                          disabled={escalating}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--text-dark)',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: escalating ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Headphones size={13} />
                          <span>{escalating ? 'Sending...' : 'Send to Support'}</span>
                        </button>
                      </>
                    )}
                  </div>
                ) : !isAuthenticated ? (
                  <div
                    style={{
                      padding: '8px 14px',
                      borderTop: '1px solid var(--border)',
                      background: 'var(--bg-section)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      Want full screening & support chat?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/login');
                        setOpen(false);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Sign In
                    </button>
                  </div>
                ) : null
              )}

              {/* Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                style={{
                  padding: '12px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg)',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={sending}
                  maxLength={1000}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-section)',
                    color: 'var(--text-dark)',
                    fontSize: '0.86rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                  style={{
                    padding: '0 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: sending || !input.trim() ? 0.55 : 1,
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

const iconBtnStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
  cursor: 'pointer',
};

const feedbackBtnStyle = {
  background: 'transparent',
  border: 'none',
  padding: '2px 4px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
};
