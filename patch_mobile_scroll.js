const fs = require('fs');
let file = fs.readFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', 'utf8');

file = file.replace(/return Column\(\n      crossAxisAlignment: CrossAxisAlignment\.stretch,\n      children: \[/, 
  "return SingleChildScrollView(\n      controller: _scrollController,\n      child: Column(\n        crossAxisAlignment: CrossAxisAlignment.stretch,\n        children: [");

file = file.replace(/                  \),\n                \),\n              \),\n            \],/,
  "                  ),\n                ),\n              ),\n            ],\n          ),\n        ),"); // wait, this regex might fail.

fs.writeFileSync('mobile/lib/features/portfolio/ui/tabs/updates/updates_inbox_tab.dart', file);
