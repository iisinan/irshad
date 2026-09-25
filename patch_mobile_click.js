const fs = require('fs');
let file = fs.readFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', 'utf8');

file = file.replace(/if \(category == 'digest' && item\['meta'\] != null\) \{/, 
  "if ((category == 'digest' || item['title'] == 'Irshad Digest is Ready') && item['meta'] != null) {");

fs.writeFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', file);
