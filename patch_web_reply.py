import re

content = open('web/src/components/AdminInbox.jsx').read()

# Add states for replying
if "const [replyingTo, setReplyingTo]" not in content:
    content = content.replace("const [error, setError] = useState(null);", "const [error, setError] = useState(null);\n  const [replyingTo, setReplyingTo] = useState(null);\n  const [replyMessage, setReplyMessage] = useState('');\n  const [replyLoading, setReplyLoading] = useState(false);")

# Add handleReply function
HANDLE_REPLY = """  const handleReplySubmit = async (e, id) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    
    try {
      setReplyLoading(true);
      await api.post(`/admin/suggestions/${id}/reply`, { reply: replyMessage });
      toastSuccess('Reply sent successfully');
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'read' } : s));
      setReplyingTo(null);
      setReplyMessage('');
      window.dispatchEvent(new Event('suggestions-updated'));
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };"""

if "handleReplySubmit" not in content:
    content = content.replace("const handleUpdateStatus = async", HANDLE_REPLY + "\n\n  const handleUpdateStatus = async")

# Replace mailto link with inline reply trigger
OLD_REPLY_BTN = """                <a href={`mailto:${s.user?.email || ''}?subject=Re: Your Suggestion for Irshad`} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--primary-50)', color: 'var(--primary)',
                  fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
                }}>
                  <Reply size={14} /> Reply
                </a>"""

NEW_REPLY_BTN = """                <button onClick={() => { setReplyingTo(replyingTo === s.id ? null : s.id); setReplyMessage(''); }} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: 'var(--primary-50)', color: 'var(--primary)',
                  fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Reply size={14} /> {replyingTo === s.id ? 'Cancel Reply' : 'Reply'}
                </button>"""

content = content.replace(OLD_REPLY_BTN, NEW_REPLY_BTN)

# Add reply box UI
OLD_END_CARD = """              </div>
            </div>
          ))}"""

NEW_END_CARD = """              </div>
              
              {replyingTo === s.id && (
                <div style={{ marginTop: '12px', background: 'var(--bg-section)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <form onSubmit={(e) => handleReplySubmit(e, s.id)}>
                    <textarea 
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder={`Draft your reply to ${s.user?.name || 'this user'}...`}
                      style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: '12px' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      disabled={replyLoading}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" onClick={() => setReplyingTo(null)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" disabled={replyLoading || !replyMessage.trim()} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: (replyLoading || !replyMessage.trim()) ? 'not-allowed' : 'pointer', opacity: (replyLoading || !replyMessage.trim()) ? 0.7 : 1 }}>
                        {replyLoading ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}"""

content = content.replace(OLD_END_CARD, NEW_END_CARD)

open('web/src/components/AdminInbox.jsx', 'w').write(content)
print("Patched web reply")
