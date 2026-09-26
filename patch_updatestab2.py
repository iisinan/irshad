content = open('web/src/components/portfolio/UpdatesTab.jsx').read()

if 'Lock' not in content:
    content = content.replace(
        "import { Newspaper, Bell, Moon, Clock, Star, Mail, Droplet, Shield, Rocket }", 
        "import { Newspaper, Bell, Moon, Clock, Star, Mail, Droplet, Shield, Rocket, Lock }"
    )

open('web/src/components/portfolio/UpdatesTab.jsx', 'w').write(content)
print("Added Lock icon")
