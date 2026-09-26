content = open('web/src/components/portfolio/UpdatesTab.jsx').read()

OLD_TEXT = """              <Icon size={16} />
              {tab.label}"""

NEW_TEXT = """              <Icon size={16} />
              {tab.label}
              {isTabLocked(tab.id) && <Lock size={12} style={{ marginLeft: 2, opacity: 0.6 }} />}"""

content = content.replace(OLD_TEXT, NEW_TEXT)

open('web/src/components/portfolio/UpdatesTab.jsx', 'w').write(content)
print("Added Lock icon")
