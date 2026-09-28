import re

content = open('backend/app/Models/Suggestion.php').read()

OLD = "protected $fillable = ['user_id', 'message', 'status'];"
NEW = "protected $fillable = ['user_id', 'message', 'status', 'is_admin_reply'];"

if OLD in content:
    content = content.replace(OLD, NEW)
    open('backend/app/Models/Suggestion.php', 'w').write(content)
    print("Patched Suggestion model")
else:
    print("Could not find fillable in model")
