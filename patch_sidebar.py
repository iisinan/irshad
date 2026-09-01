import re

with open('web/src/components/AdminSidebar.jsx', 'r') as f:
    content = f.read()

if "{ label: 'Inbox'," not in content:
    content = content.replace("{ label: 'Alerts & Stocks',     icon: Activity,        to: '/admin/alerts' },", "{ label: 'Alerts & Stocks',     icon: Activity,        to: '/admin/alerts' },\n    { label: 'Inbox',               icon: Mail,            to: '/admin/inbox' },")

with open('web/src/components/AdminSidebar.jsx', 'w') as f:
    f.write(content)

