import re

content = open('web/src/components/Portfolio.jsx').read()

if "PricingModal" not in content:
    content = content.replace("import { useAuth }", "import PricingModal from './PricingModal';\nimport { useAuth }")

if "showUpgradeModal" not in content:
    content = content.replace("const [showAddModal, setShowAddModal] = useState(false);", "const [showAddModal, setShowAddModal] = useState(false);\n  const [showUpgradeModal, setShowUpgradeModal] = useState(false);")

# Modify handleAdd
OLD_HANDLE_ADD = """  const handleAdd = async (payload) => {
    try {
      setIsAdding(true);
      const { addBulkHoldings } = await import('../services/api');
      await addBulkHoldings(payload);
      loadData();
      toastSuccess('Holdings added to portfolio');
      return true;
    } catch (err) {
      toastError(err?.message || 'Failed to add holdings');
      return false;
    } finally {
      setIsAdding(false);
    }
  };"""

NEW_HANDLE_ADD = """  const handleAdd = async (payload) => {
    try {
      setIsAdding(true);
      const { addBulkHoldings } = await import('../services/api');
      await addBulkHoldings(payload);
      loadData();
      toastSuccess('Holdings added to portfolio');
      return true;
    } catch (err) {
      if (err?.message?.toLowerCase().includes('upgrade') || err?.message?.toLowerCase().includes('limit') || err?.response?.status === 403) {
        setShowAddModal(false);
        setTimeout(() => setShowUpgradeModal(true), 150);
      } else {
        toastError(err?.message || 'Failed to add holdings');
      }
      return false;
    } finally {
      setIsAdding(false);
    }
  };"""
content = content.replace(OLD_HANDLE_ADD, NEW_HANDLE_ADD)

# Add pre-emptive check
NEW_OPEN_ADD = """  const handleOpenAddModal = (mode = true) => {
    const tierSlug = user?.tier?.slug || 'max';
    let limit = -1;
    if (tierSlug === 'free') limit = 1;
    else if (tierSlug === 'pro') limit = 7;
    
    if (limit !== -1 && data?.holdings?.length >= limit) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddModal(mode);
  };"""

if "handleOpenAddModal" not in content:
    content = content.replace("const handleAdd = async", NEW_OPEN_ADD + "\n\n  const handleAdd = async")

# Replace setShowAddModal props with handleOpenAddModal
content = content.replace("setShowAddModal={setShowAddModal}", "setShowAddModal={handleOpenAddModal}")
content = content.replace("onClose={() => setShowAddModal(false)}", "onClose={() => setShowAddModal(false)}")

# Add PricingModal to render
if "PricingModal onClose" not in content:
    content = content.replace("{showSuggestModal && <SuggestModal", "{showUpgradeModal && <PricingModal onClose={() => setShowUpgradeModal(false)} />}\n      {showSuggestModal && <SuggestModal")

open('web/src/components/Portfolio.jsx', 'w').write(content)
print("Patched Portfolio.jsx")
