import re

with open('web/src/components/Portfolio.jsx', 'r') as f:
    content = f.read()

if 'import SuggestModal' not in content:
    content = content.replace("import PortfolioTab from './portfolio/PortfolioTab';", "import PortfolioTab from './portfolio/PortfolioTab';\nimport SuggestModal from './SuggestModal';")

if 'const [showSuggestModal, setShowSuggestModal] = useState(false);' not in content:
    content = content.replace("const [showAddModal, setShowAddModal] = useState(false);", "const [showAddModal, setShowAddModal] = useState(false);\n  const [showSuggestModal, setShowSuggestModal] = useState(false);")

button_old = """      <a 
        href="mailto:hello@iirshad.com?subject=Suggestion%20for%20Irshad"
        style={{
          position: 'fixed',"""

button_new = """      <button 
        onClick={() => setShowSuggestModal(true)}
        style={{
          position: 'fixed',
          border: 'none',
          cursor: 'pointer',"""

content = content.replace(button_old, button_new)
content = content.replace("Suggest for Irshad\n      </a>", "Suggest for Irshad\n      </button>")

if '{showSuggestModal && <SuggestModal onClose={() => setShowSuggestModal(false)} />}' not in content:
    content = content.replace("{showAddModal && (", "{showSuggestModal && <SuggestModal onClose={() => setShowSuggestModal(false)} />}\n      {showAddModal && (")

with open('web/src/components/Portfolio.jsx', 'w') as f:
    f.write(content)

