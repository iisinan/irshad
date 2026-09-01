import re

with open('web/src/App.jsx', 'r') as f:
    content = f.read()

import_stmt = "import AdminInbox from './components/AdminInbox';\n"
if "import AdminInbox" not in content:
    content = content.replace("import AdminOverview from './components/AdminOverview';", "import AdminOverview from './components/AdminOverview';\n" + import_stmt)

route_stmt = "                    <Route path=\"/admin/inbox\" element={<AdminInbox />} />\n"
if "/admin/inbox" not in content:
    content = content.replace("<Route path=\"/admin/alerts\" element={<AdminDashboard />} />", route_stmt + "                    <Route path=\"/admin/alerts\" element={<AdminDashboard />} />")

with open('web/src/App.jsx', 'w') as f:
    f.write(content)

