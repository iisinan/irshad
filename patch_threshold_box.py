import os

filepath = 'mobile/lib/features/portfolio/ui/tabs/guide_tab.dart'
with open(filepath, 'r') as f:
    content = f.read()

old_block = """              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: context.bg,
                  border: Border.all(color: context.divider),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(threshold, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: color)),
              ),"""

new_block = """              const SizedBox(width: 12),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: context.bg,
                    border: Border.all(color: context.divider),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    threshold, 
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: color),
                    textAlign: TextAlign.right,
                  ),
                ),
              ),"""

content = content.replace(old_block, new_block)

with open(filepath, 'w') as f:
    f.write(content)
