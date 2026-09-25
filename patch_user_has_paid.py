import re

content = open('backend/app/Models/User.php').read()

appends_old = """    protected $appends = [
        'tier',
        'active_subscription',
    ];"""
    
appends_new = """    protected $appends = [
        'tier',
        'has_paid_subscription',
    ];"""
    
content = content.replace(appends_old, appends_new)

attr_new = """    public function getHasPaidSubscriptionAttribute()
    {
        return $this->subscriptions()->where('status', 'active')->exists();
    }
"""

content = content.replace("public function getTierAttribute()", attr_new + "\n    public function getTierAttribute()")

with open('backend/app/Models/User.php', 'w') as f:
    f.write(content)
print("done")
