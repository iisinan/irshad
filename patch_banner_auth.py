import re

content = open('web/src/App.jsx').read()

banner_old = """const CountdownBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });"""

banner_new = """const CountdownBanner = () => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });"""

content = content.replace(banner_old, banner_new)

display_logic_old = """const totalSecondsLeft = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  if (totalSecondsLeft <= 0) return null;"""

display_logic_new = """const totalSecondsLeft = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  if (totalSecondsLeft <= 0) return null;
  
  // Hide if the user already has a paid subscription (or is grandfathered in)
  if (user?.active_subscription) return null;
  // Also hide if they somehow have a tier that is NOT free, but wait, the free trial override makes them look like 'max' temporarily.
  // We can rely on the active_subscription property. Or simply if they are logged out, show it.
"""

content = content.replace(display_logic_old, display_logic_new)

with open('web/src/App.jsx', 'w') as f:
    f.write(content)
print("done")
