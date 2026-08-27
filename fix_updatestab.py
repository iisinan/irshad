import re

with open('web/src/components/portfolio/UpdatesTab.jsx', 'r') as f:
    content = f.read()

# Add unread counts state
if 'const [unreadInbox, setUnreadInbox] = useState(' not in content:
    state_code = """  const [activeTab, setActiveTab] = useState('news');
  const [mountedTabs, setMountedTabs] = useState(['news']);
  const [unreadInbox, setUnreadInbox] = useState(0);
  const [unreadNews, setUnreadNews] = useState(1); // Default to 1 to show the red dot for News & Insights

  useEffect(() => {
    import('../../services/api').then(({ fetchUnreadCount }) => {
      fetchUnreadCount().then(res => {
        setUnreadInbox(res?.data?.count || res?.count || 0);
      }).catch(()=>{});
    });
  }, []);"""
    content = re.sub(r"  const \[activeTab, setActiveTab\] = useState\('news'\);\n  const \[mountedTabs, setMountedTabs\] = useState\(\['news'\]\);", state_code, content)

# Change tabs array to include hasNew logic
content = content.replace("badge: unreadCount,", "hasNew: unreadInbox > 0,")
content = content.replace("id: 'news',", "id: 'news',\n      hasNew: unreadNews > 0,")

# Update badge rendering to red dot
badge_old = """              {tab.badge > 0 && (
                <span style={{
                  background: isActive ? 'white' : 'var(--primary)',
                  color: isActive ? 'var(--primary)' : 'white',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  boxShadow: isActive ? 'none' : '0 2px 8px rgba(91,41,113,0.3)',
                }}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}"""

badge_new = """              {tab.hasNew && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--non-compliant)',
                  border: '2px solid var(--bg)',
                  boxShadow: '0 0 0 1px var(--non-compliant-bg)',
                  zIndex: 10
                }} />
              )}"""

content = content.replace(badge_old, badge_new)

with open('web/src/components/portfolio/UpdatesTab.jsx', 'w') as f:
    f.write(content)

