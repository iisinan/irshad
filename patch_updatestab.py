import re

content = open('web/src/components/portfolio/UpdatesTab.jsx').read()

# 1. Add lock icon and PricingModal imports
if 'Lock' not in content:
    content = content.replace("import { Search, ChevronRight", "import { Search, ChevronRight, Lock")
if 'PricingModal' not in content:
    content = content.replace("import UpdatesIPO from './UpdatesIPO';", "import UpdatesIPO from './UpdatesIPO';\nimport PricingModal from '../PricingModal';")

# 2. Add isTabLocked logic inside UpdatesTab
if 'const isTabLocked' not in content:
    content = content.replace(
        "const [activeSubTab, setActiveSubTab] = useState('news');",
        "const [activeSubTab, setActiveSubTab] = useState('news');\n  const [showUpgradeModal, setShowUpgradeModal] = useState(false);\n\n  const isTabLocked = (tabId) => {\n    const userTier = user?.tier?.slug || 'free';\n    if (userTier === 'max') return false;\n    if (userTier === 'pro') return tabId === 'compliance';\n    return tabId !== 'news';\n  };"
    )

# 3. Add PricingModal to the return block
if '<PricingModal' not in content:
    content = content.replace(
        "return (\n    <div",
        "return (\n    <div"
    ).replace(
        "{/* ── Compact Greeting Banner ── */}",
        "{showUpgradeModal && <PricingModal onClose={() => setShowUpgradeModal(false)} />}\n\n      {/* ── Compact Greeting Banner ── */}"
    )

# 4. Modify the tab click and rendering
OLD_BUTTON = """              onClick={() => {
                if (tab.isExternal) {
                  window.location.hash = tab.id;
                } else {
                  setActiveSubTab(tab.id);
                }
              }}
              className={`animate-slide-up stagger-${index + 1}`}
              style={{
                position: 'relative', display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '30px',
                background: isActive ? 'var(--primary)' : 'var(--bg-section)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                color: isActive ? 'white' : 'var(--text-dark)',
                fontWeight: 700,"""

NEW_BUTTON = """              onClick={() => {
                if (isTabLocked(tab.id)) {
                  setShowUpgradeModal(true);
                  return;
                }
                if (tab.isExternal) {
                  window.location.hash = tab.id;
                } else {
                  setActiveSubTab(tab.id);
                }
              }}
              className={`animate-slide-up stagger-${index + 1}`}
              style={{
                position: 'relative', display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '30px',
                background: isActive ? 'var(--primary)' : 'var(--bg-section)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                color: isActive ? 'white' : isTabLocked(tab.id) ? 'var(--text-muted)' : 'var(--text-dark)',
                opacity: isTabLocked(tab.id) ? 0.8 : 1,
                fontWeight: 700,"""

content = content.replace(OLD_BUTTON, NEW_BUTTON)

# 5. Add Lock icon to the rendered text inside the button
OLD_TEXT = """                {tab.hasNew && (
                  <span style={{ position: 'absolute', top: '8px', right: '12px', width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                )}
              </div>
              {tab.label}
            </button>"""

NEW_TEXT = """                {tab.hasNew && !isTabLocked(tab.id) && (
                  <span style={{ position: 'absolute', top: '8px', right: '12px', width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                )}
              </div>
              {tab.label}
              {isTabLocked(tab.id) && <Lock size={12} style={{ marginLeft: 2, opacity: 0.6 }} />}
            </button>"""

content = content.replace(OLD_TEXT, NEW_TEXT)

open('web/src/components/portfolio/UpdatesTab.jsx', 'w').write(content)
print("Patched UpdatesTab.jsx")
