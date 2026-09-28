content = open('backend/app/Http/Controllers/SuggestionController.php').read()

OLD = "$count = Suggestion::where('status', 'unread')->count();"
NEW = "$count = Suggestion::where('status', 'unread')->where('is_admin_reply', false)->count();"

content = content.replace(OLD, NEW)
open('backend/app/Http/Controllers/SuggestionController.php', 'w').write(content)
