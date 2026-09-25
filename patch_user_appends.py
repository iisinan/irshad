import re

content = open('backend/app/Models/User.php').read()

appends_code = """
    protected $appends = [
        'tier',
        'active_subscription',
    ];

"""

content = content.replace("protected $hidden = [", appends_code + "    protected $hidden = [")

with open('backend/app/Models/User.php', 'w') as f:
    f.write(content)
print("done")
