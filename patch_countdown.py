import re

content = open('web/src/App.jsx').read()

countdown_component = """
const CountdownBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const targetDate = new Date('2026-10-02T00:00:00+01:00').getTime(); // Oct 2nd at midnight
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalSecondsLeft = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  if (totalSecondsLeft <= 0) return null;

  return (
    <div style={{ background: '#0F3A40', color: 'white', padding: '10px 16px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#D9A05B' }}>✨</span> 
        Free Trial Ends on October 2nd. Subscribe now to lock in your premium features!
      </span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>{timeLeft.days}d</div>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>{timeLeft.hours}h</div>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>{timeLeft.minutes}m</div>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>{timeLeft.seconds}s</div>
        <Link to="/pricing" style={{ background: '#D9A05B', color: '#0F172A', textDecoration: 'none', padding: '4px 12px', borderRadius: '100px', fontWeight: 800, fontSize: '0.75rem', marginLeft: '8px', transition: 'all 0.2s' }} className="hover-lift">Upgrade</Link>
      </div>
    </div>
  );
};
"""

content = content.replace("const DocumentTitleUpdater = () => {", countdown_component + "\nconst DocumentTitleUpdater = () => {")

content = content.replace("<DocumentTitleUpdater />\n            <TopNavbar />", "<DocumentTitleUpdater />\n            <CountdownBanner />\n            <TopNavbar />")

with open('web/src/App.jsx', 'w') as f:
    f.write(content)
print("done")
