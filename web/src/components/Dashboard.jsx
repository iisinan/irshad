import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchPortfolio, fetchNgxStocks, fetchNews, fetchWatchlist, fetchHistory, fetchPriceAlerts, formatLogoUrl, deletePriceAlert, fetchComplianceChanges, fetchPortfolioMovers } from '../services/api';
import {
  Search, Bell, Star, Wallet, TrendingUp, TrendingDown,
  ShieldAlert, CheckCircle, AlertTriangle, ArrowUpRight,
  ArrowDownRight, ChevronRight, Calculator, HeartHandshake,
  Shield, PlusCircle, BarChart2, Sparkles, Globe, Clock, X,
  Zap, Activity, Trash2, LayoutList, Eye, ArrowRightLeft
} from 'lucide-react';
import { toastSuccess, toastError } from '../utils/toast';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, YAxis,
  BarChart, Bar, XAxis, PieChart, Pie, Cell
} from 'recharts';

/* ─── Helpers ────────────────────────────────────────────── */
const fmt  = (n) => Number(n||0).toLocaleString('en-NG',{maximumFractionDigits:0});
const fmtK = (n) => {
  const v = Number(n||0);
  if (v >= 1_000_000_000) return `₦${(v/1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `₦${(v/1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `₦${(v/1_000).toFixed(1)}K`;
  return `₦${fmt(v)}`;
};
const getGreeting = () => {
  const h = new Date().getHours();
  if (h<5) return 'Good night';
  if (h<12) return 'Good morning';
  if (h<17) return 'Good afternoon';
  return 'Good evening';
};
const getDate = () => new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const getTime = () => new Date().toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});

const statusConfig = {
  Halal:      {color:'var(--halal)',    bg:'var(--halal-bg)',    icon:CheckCircle,  label:'Halal'},
  'Non-Halal':{color:'var(--non-halal)',bg:'var(--non-halal-bg)',icon:AlertTriangle,label:'Non-Halal'},
  Doubtful:   {color:'var(--doubtful)', bg:'var(--doubtful-bg)', icon:AlertTriangle,label:'Doubtful'},
};
const INSIGHTS=[
  "Companies with Debt-to-Asset ratios below 33% typically show stronger resilience during market downturns.",
  "Purification in Islamic finance is the act of donating a small % of haram-tainted dividends to charity.",
  "Zakat on stocks is calculated on the current market value of the shares, not the purchase price.",
  "AAOIFI standards require that interest income should be below 5% of total revenue to be Shariah compliant.",
  "The market has over 150 listed companies — always screen each one individually before investing.",
];

const RIZQ_DUAS = [
  { text: "O Allah, I ask You for beneficial knowledge, goodly provision and acceptable deeds.", source: "Ibn Majah 925", type: "Du'a for Rizq" },
  { text: "Charity does not in any way decrease the wealth.", source: "Sahih Muslim 2588", type: "Encouragement for Sadaqah" },
  { text: "O Allah, bless us in our provision, and grant us better than it.", source: "Tirmidhi 3455", type: "Du'a for Barakah" },
  { text: "If you are grateful, I will surely increase you [in favor].", source: "Qur'an (Ibrahim 14:7)", type: "Divine Promise" },
  { text: "Whoever desires an expansion in his sustenance and age, should keep good relations with his kith and kin.", source: "Sahih Bukhari 2067", type: "Hadith on Rizq" },
  { text: "O Allah, suffice me with what You have allowed instead of what You have forbidden, and make me independent of all others besides You.", source: "Tirmidhi 3563", type: "Du'a for Debt/Wealth" },
  { text: "And whoever fears Allah - He will make for him a way out and will provide for him from where he does not expect.", source: "Qur'an (At-Talaq 65:2-3)", type: "Divine Promise" },
  { text: "There is no day on which the servants wake up except that two angels descend. One says, 'O Allah, give compensation to the one who spends [in charity].'", source: "Sahih Bukhari 1442", type: "Encouragement for Sadaqah" },
  { text: "Sadaqah extinguishes sin as water extinguishes fire.", source: "Tirmidhi 2616", type: "Encouragement for Sadaqah" },
  { text: "The upper hand (that gives) is better than the lower hand (that receives).", source: "Sahih Muslim 1033", type: "Encouragement for Sadaqah" },
  { text: "O Allah, I seek refuge in You from poverty, and I seek refuge in You from want and humiliation.", source: "Abu Dawud 1544", type: "Du'a for Protection" },
  { text: "Give charity without delay, for it stands in the way of calamity.", source: "Tirmidhi 1887", type: "Encouragement for Sadaqah" },
  { text: "Verily, the believers who do good works and establish prayer and give Zakah will have their reward with their Lord.", source: "Qur'an (Al-Baqarah 2:277)", type: "Quranic Reminder" },
  { text: "O Allah, I ask You for Your grace and Your mercy, for no one possesses them but You.", source: "Tabarani", type: "Du'a for Rizq" },
  { text: "Whatever you spend of good is [to be for] parents and relatives and orphans and the needy and the traveler.", source: "Qur'an (Al-Baqarah 2:215)", type: "Quranic Reminder" },
  { text: "Allah says: 'O son of Adam, spend (in charity), and I shall spend on you.'", source: "Sahih Bukhari 5352", type: "Hadith Qudsi" },
  { text: "There is no wealth like intelligence, no poverty like ignorance, and no inheritance like good manners.", source: "Ali ibn Abi Talib (RA)", type: "Wisdom on Wealth" },
  { text: "O Allah, grant me Halal and blessed provision, and distance me from the Haram.", source: "General Du'a", type: "Du'a for Purification" },
  { text: "Rizq (provision) is not just money. Peace of mind, a righteous spouse, and good health are all forms of Rizq.", source: "Islamic Reflection", type: "Wisdom on Rizq" },
  { text: "No wealth is ever diminished by giving in the path of Allah.", source: "Wisdom on Sadaqah", type: "Wisdom on Sadaqah" },
];

const NGX_STATUS = {
  isOpen: false,
  asi: '0.00',
  asiChange: '0.00%',
  volume: '0',
  advances: 0,
  declines: 0,
};

/* ─── Ticker Strip ────────────────────────────────────────── */
function Ticker({ tickerItems = [] }) {
  const items=[...tickerItems,...tickerItems];
  return (
    <div style={{background:'linear-gradient(90deg, #F5F7FA 0%, #FFFFFF 50%, #F5F7FA 100%)', borderBottom:'1px solid var(--border)',overflow:'hidden', position:'relative'}}>
      {/* Edge Gradients for smooth fade */}
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:'60px',background:'linear-gradient(90deg, #F5F7FA 0%, transparent 100%)',zIndex:2,pointerEvents:'none'}}/>
      <div style={{position:'absolute',right:0,top:0,bottom:0,width:'60px',background:'linear-gradient(-90deg, #F5F7FA 0%, transparent 100%)',zIndex:2,pointerEvents:'none'}}/>
      <div style={{display:'flex',gap:'24px',animation:'scrollTicker 50s linear infinite',width:'max-content',padding:'12px 24px'}}>
        {items.map((item,i)=>(
          <div key={i} className="hover-card" style={{display:'flex',alignItems:'center',gap:'12px',whiteSpace:'nowrap', background: 'var(--bg)', padding: '6px 16px 6px 8px', borderRadius: '100px', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', cursor: 'default'}}>
            <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-alt)', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {item.logo_url ? <img src={formatLogoUrl(item.logo_url)} alt={item.symbol} style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--bg)' }} /> : <span style={{ fontSize: '0.57rem', fontWeight: 800, color: 'var(--text-muted)' }}>{item.symbol.charAt(0)}</span>}
            </div>
            <span style={{fontSize: '0.75rem',fontWeight:800,color:'var(--text-dark)'}}>{item.symbol}</span>
            <span style={{fontSize: '0.75rem',fontWeight:600,color:'var(--text-muted)'}}>{item.price}</span>
            <div style={{ padding: '4px 8px', borderRadius: '20px', background: item.up ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)' }}>
              <span style={{fontSize: '0.66rem',fontWeight:800,color:item.up?'var(--halal)':'var(--non-halal)',display:'flex',alignItems:'center',gap:'2px'}}>
                {item.up?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>}{item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────── */
function StatCard({icon:Icon,label,value,sub,primary,badge}) {
  return (
    <div
      style={{
        background: primary ? 'linear-gradient(135deg, #0F5257 0%, #0B4347 100%)' : 'var(--bg)',
        border: primary ? 'none' : '1px solid var(--border)',
        borderRadius: '24px',
        padding: '28px',
        color: primary ? 'white' : 'var(--text-dark)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: primary ? '0 12px 36px rgba(15,82,87,0.25)' : 'var(--shadow-sm)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = primary ? '0 16px 48px rgba(15,82,87,0.35)' : 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = primary ? '0 12px 36px rgba(15,82,87,0.25)' : 'var(--shadow-sm)'; }}
    >
      {primary && (
        <>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', pointerEvents: 'none' }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: primary ? 'rgba(255,255,255,0.1)' : 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={primary ? 'var(--gold)' : 'var(--primary)'} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: primary ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
              {label}
            </span>
          </div>
          {badge && <span style={{ fontSize: '0.57rem', fontWeight: 800, padding: '4px 10px', borderRadius: '24px', background: 'rgba(255,255,255,0.15)', color: 'var(--bg)', letterSpacing: '0.5px' }}>{badge}</span>}
        </div>
        <div style={{ fontSize: '2.29rem', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '14px', color: primary ? 'white' : 'var(--text-dark)' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: primary ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Compliance Ring ─────────────────────────────────────── */
function ComplianceRing({score}) {
  const r=52,cx=64,cy=64,circ=2*Math.PI*r,dash=(score/100)*circ;
  const color=score>=90?'var(--halal)':score>=70?'var(--doubtful)':'var(--non-halal)';
  const label=score>=90?'Excellent':score>=70?'Good':'Review needed';
  return (
    <div style={{display:'flex',alignItems:'center',gap:'24px', padding: '8px 0'}}>
      <div style={{ position: 'relative' }}>
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-section)" strokeWidth="12"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 64 64)" style={{transition:'stroke-dasharray 1.5s cubic-bezier(0.16, 1, 0.3, 1)'}}/>
          <text x="64" y="58" textAnchor="middle" style={{fontSize: '18px',fontWeight:900,fill:'var(--text-dark)',fontFamily:'inherit'}}>{score}%</text>
          <text x="64" y="76" textAnchor="middle" style={{fontSize: '8px',fontWeight:800,fill:'var(--text-muted)',letterSpacing:'1.5px'}}>SCORE</text>
        </svg>
      </div>
      <div>
        <div style={{fontSize: '0.97rem',fontWeight:900,color,marginBottom:'6px'}}>{label}</div>
        <div style={{fontSize: '0.75rem',color:'var(--text-muted)',fontWeight:500,lineHeight:1.6}}>
          Your portfolio is<br/><strong style={{color:'var(--text-dark)'}}>{score}%</strong> Shariah compliant
        </div>
        <Link to="/portfolio#market" style={{display:'inline-flex',alignItems:'center',gap:'4px',marginTop:'12px',fontSize: '0.75rem',fontWeight:700,color:'var(--primary)', background: 'var(--primary-50)', padding: '6px 12px', borderRadius: '8px'}}>
          Screen stocks <ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  );
}

/* ─── Watchlist Row ───────────────────────────────────────── */
function WatchlistRow({stock}) {
  const change = stock.change ?? 0;
  const price = stock.price ?? 0;
  const isUp = change >= 0;
  const s = statusConfig[stock.status] || statusConfig.Halal;
  const SIcon = s.icon;
  const [hov, setHov] = useState(false);
  const miniData = stock.sparkline ? stock.sparkline.map(v => ({ v })) : [];
  
  return (
    <Link to={`/market/${stock.symbol}`} state={{stock}}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:'12px',margin:'2px 0',background:hov?'var(--primary-50)':'transparent',textDecoration:'none',transition:'background 0.2s'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{width:'34px',height:'34px',borderRadius:'8px',background:hov?'var(--primary-100)':'var(--bg-section)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize: '0.53rem',color:'var(--primary)',flexShrink:0,overflow:'hidden'}}>
          {stock.logo_url ? <img loading="lazy" src={formatLogoUrl(stock.logo_url)} alt={stock.symbol} style={{ width:'100%', height:'100%', objectFit:'contain' }}/> : stock.symbol.slice(0,5)}
        </div>
        <div>
          <div style={{fontWeight:700,color:'var(--text-dark)',fontSize: '0.66rem'}}>{stock.symbol}</div>
          <div style={{display:'flex',alignItems:'center',gap:'3px',fontSize: '0.53rem',color:s.color,marginTop:'2px',fontWeight:600}}>
            <SIcon size={8}/> {s.label}
          </div>
        </div>
      </div>
      {miniData.length > 0 && (
        <div style={{width:'50px',height:'24px'}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={miniData}>
              <defs>
                <linearGradient id={`sg-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={isUp?'#22c55e':'#ef4444'} strokeWidth={1.5} fill={`url(#sg-${stock.symbol})`} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{textAlign:'right',minWidth:'60px'}}>
        {price > 0 ? (
          <>
            <div style={{fontWeight:800,color:'var(--text-dark)',fontSize: '0.66rem'}}>₦{price.toLocaleString()}</div>
            {change !== 0 && (
              <div style={{fontSize: '0.57rem',fontWeight:700,color:isUp?'var(--halal)':'var(--non-halal)',display:'flex',alignItems:'center',gap:'1px',justifyContent:'flex-end'}}>
                {isUp?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{isUp?'+':''}{change.toFixed(2)}%
              </div>
            )}
          </>
        ) : (
          <div style={{fontSize: '0.57rem',color:'var(--text-muted)',fontWeight:600}}>Unavailable</div>
        )}
      </div>
    </Link>
  );
}

/* ─── Holding Row ─────────────────────────────────────────── */
function HoldingRow({holding}) {
  const gainLoss = holding.gain_loss ?? 0;
  const currentValue = holding.current_value ?? 0;
  const isUp = gainLoss >= 0;
  const [hov, setHov] = useState(false);
  const shares = holding.quantity || holding.shares || 0;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:'12px',margin:'2px 0',background:hov?'var(--primary-50)':'transparent',transition:'background 0.2s',cursor:'pointer'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{width:'34px',height:'34px',borderRadius:'8px',background:'var(--bg-section)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize: '0.53rem',color:'var(--primary)',flexShrink:0,overflow:'hidden'}}>
          {holding.logo_url ? <img loading="lazy" src={formatLogoUrl(holding.logo_url)} alt={holding.symbol||holding.stock_code} style={{ width:'100%', height:'100%', objectFit:'contain' }}/> : (holding.symbol||holding.stock_code||'N/A').slice(0,5)}
        </div>
        <div>
          <div style={{fontWeight:700,color:'var(--text-dark)',fontSize: '0.66rem'}}>{holding.symbol||holding.stock_code}</div>
          <div style={{fontSize: '0.53rem',color:'var(--text-muted)',marginTop:'2px',fontWeight:500}}>{shares} shares</div>
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        {currentValue > 0 ? (
          <>
            <div style={{fontWeight:800,color:'var(--text-dark)',fontSize: '0.66rem'}}>{fmtK(currentValue)}</div>
            {gainLoss !== 0 && (
              <div style={{fontSize: '0.57rem',fontWeight:700,color:isUp?'var(--halal)':'var(--non-halal)',display:'flex',alignItems:'center',gap:'1px',justifyContent:'flex-end'}}>
                {isUp?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{isUp?'+':''}{fmtK(gainLoss)}
              </div>
            )}
          </>
        ) : (
          <div style={{fontSize: '0.57rem',color:'var(--text-muted)',fontWeight:600}}>Unavailable</div>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton Loader ─────────────────────────────────────── */
function DashboardSkeleton() {
  const sh={background:'linear-gradient(90deg,var(--bg-section) 0%,#fff 50%,var(--bg-section) 100%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite linear',borderRadius:'8px'};
  return (
    <div style={{maxWidth:'1280px',margin:'0 auto',padding:'36px 24px 80px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'36px',flexWrap:'wrap',gap:'24px'}}>
        <div>
          <div style={{...sh,width:'200px',height:'13px',marginBottom:'14px'}}/>
          <div style={{...sh,width:'310px',height:'44px',marginBottom:'12px'}}/>
          <div style={{...sh,width:'240px',height:'17px'}}/>
        </div>
        <div style={{...sh,width:'290px',height:'50px',borderRadius:'14px'}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'18px',marginBottom:'22px'}}>
        {[1,2,3].map(i=>(
          <div key={i} style={{background: 'var(--bg)',borderRadius:'20px',padding:'24px 26px',height:'140px',border:'1px solid var(--border)'}}>
            <div style={{...sh,width:'36px',height:'36px',borderRadius:'10px',marginBottom:'16px'}}/>
            <div style={{...sh,width:'120px',height:'34px',marginBottom:'10px'}}/>
            <div style={{...sh,width:'85px',height:'13px'}}/>
          </div>
        ))}
      </div>
      <div className="dashboard-main-grid">
        <div style={{display:'flex',flexDirection:'column',gap:'22px'}}>
          {[300,260].map(h=>(
            <div key={h} style={{background: 'var(--bg)',borderRadius:'20px',padding:'26px',border:'1px solid var(--border)',height:`${h}px`}}>
              <div style={{...sh,width:'150px',height:'20px',marginBottom:'20px'}}/>
              {[1,2,3].map(i=><div key={i} style={{...sh,width:'100%',height:'48px',marginBottom:'11px',borderRadius:'11px'}}/>)}
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'22px'}}>
          {[260,220].map(h=>(
            <div key={h} style={{background: 'var(--bg)',borderRadius:'20px',padding:'26px',border:'1px solid var(--border)',height:`${h}px`}}>
              <div style={{...sh,width:'130px',height:'20px',marginBottom:'20px'}}/>
              <div style={{...sh,width:'100%',height:'90px',borderRadius:'11px'}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Panel Wrapper ───────────────────────────────────────── */
const Panel=({children,style={}})=>(
  <div style={{background: 'var(--bg)',border:'1px solid var(--border)',borderRadius:'20px',padding:'24px',boxShadow:'var(--shadow-sm)',...style}}>
    {children}
  </div>
);
const PanelHeader=({icon:Icon,title,action})=>(
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
    <h2 style={{fontSize: '0.92rem',fontWeight:800,color:'var(--text-dark)',display:'flex',alignItems:'center',gap:'8px',margin:0}}>
      <Icon size={16} color="var(--primary)"/> {title}
    </h2>
    {action}
  </div>
);

/* ─── Main Dashboard ──────────────────────────────────────── */
export default function Dashboard() {
  const {user,loading:authLoading}=useAuth();
  const navigate=useNavigate();
  const [data,setData]=useState(()=>{
    try {
      const cached = localStorage.getItem('irshad_portfolio_cache_v10');
      if (cached) return JSON.parse(cached)?.data || {summary:{},holdings:[]};
    } catch {}
    return {summary:{},holdings:[]};
  });
  // If we hydrated with non-empty summary, we can stop loading immediately
  const [loading,setLoading]=useState(!data || Object.keys(data.summary || {}).length === 0);
  const [insightIdx,setInsightIdx]=useState(0);
  const [showAlert,setShowAlert]=useState(true);
  const [zakatManual,setZakatManual]=useState('');
  const [searchVal,setSearchVal]=useState('');
  const [liveTime,setLiveTime]=useState(getTime());
  const [perfRange,setPerfRange]=useState(1);
  const [moversTab,setMoversTab]=useState('gainers');
  const [ngxStocks, setNgxStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [complianceChanges, setComplianceChanges] = useState([]);
  const [portfolioMovers, setPortfolioMovers] = useState({ gainers: [], losers: [] });
  const [duaIndex] = useState(() => Math.floor(Math.random() * RIZQ_DUAS.length));
  const searchRef=useRef(null);

  const handleDeleteAlert = async (id) => {
    try {
      await deletePriceAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toastSuccess('Alert deleted successfully');
    } catch (err) {
      toastError('Failed to delete alert');
    }
  };

  useEffect(()=>{
    if(!authLoading&&!user){navigate('/login');return;}
    if(user){
      // Reset state if switching user accounts
      setData(prev => (!prev?.summary ? {summary:{},holdings:[]} : prev));
      Promise.all([
        fetchPortfolio().catch(()=>({ data: { summary: {}, holdings: [], history: [] } })), 
        fetchNgxStocks().catch(()=>({ data: [] })), 
        fetchNews().catch(()=>({ data: [] })),
        fetchWatchlist().catch(()=>({ data: [] })),
        fetchHistory().catch(()=>({ data: [] })),
        fetchPriceAlerts().catch(()=>({ data: [] })),
        fetchComplianceChanges().catch(()=>({ data: [] })),
        fetchPortfolioMovers().catch(()=>({ data: { gainers: [], losers: [] } }))
      ])
        .then(([portRes, ngxRes, newsRes, watchRes, histRes, alertRes, compRes, movRes]) => {
          if (portRes && portRes.data) setData(portRes.data);
          else if (portRes && !portRes.data) setData(portRes);
          if (ngxRes && ngxRes.data) setNgxStocks(ngxRes.data);
          if (newsRes && newsRes.data) setNews(newsRes.data);
          if (watchRes && watchRes.data) setWatchlist(watchRes.data);
          if (histRes && histRes.data) setHistory(histRes.data);
          if (alertRes && alertRes.data) setAlerts(alertRes.data);
          if (compRes && compRes.data) setComplianceChanges(compRes.data);
          if (movRes && movRes.data) setPortfolioMovers(movRes.data);
        })
        .catch(()=>{})
        .finally(()=>setLoading(false));
    }
  },[user,authLoading,navigate]);

  useEffect(()=>{
    const id=setInterval(()=>setInsightIdx(i=>(i+1)%INSIGHTS.length),8000);
    return ()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const id=setInterval(()=>setLiveTime(getTime()),1000);
    return ()=>clearInterval(id);
  },[]);

  if(authLoading||loading) return <DashboardSkeleton/>;

  const summary=data.summary||{};
  const holdings=data.holdings||[];
  const zakatBase=zakatManual?parseFloat(zakatManual):(summary.total_balance||0);
  const zakatAmt=(zakatBase*0.025).toFixed(2);
  const compliance=summary.health_percentage??100;
  
  const totalBalance = summary.total_balance || 0;
  const PIE_COLORS = ['#C9B89C','#2A6F73','#3B82F6','#8b5cf6','#0F5257','#06b6d4'];
  const pieData = (holdings || []).slice(0,6).map((h,i) => ({
    name: h.symbol, value: h.total_value || 0, color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  if (pieData.length === 0) pieData.push({ name: 'No Holdings', value: 1, color: '#e5e7eb' });

  const QUICK_ACTIONS=[
    {icon:PlusCircle,label:'Add Trade', color:'var(--primary)',bg:'var(--primary-50)',to:'/portfolio'},
    {icon:BarChart2, label:'Market',    color:'#3b82f6',       bg:'#dbeafe',         to:'/portfolio#market'},
    {icon:Calculator,label:'Zakat',     color:'#8b5cf6',       bg:'#ede9fe',         to:'/portfolio#zakat'},
    {icon:ShieldAlert,label:'Purify',    color:'#f59e0b',       bg:'#fef3c7',         to:'/portfolio#purification'},
  ];

  let dynamicTicker = [];
  let topGainers = [];
  let topLosers = [];
  let dynamicWatchlist = [];
  let adv = 0; let dec = 0;
  
  if (ngxStocks && ngxStocks.length > 0) {
    const validStocks = ngxStocks.filter(s => s.price_change_pct != null);
    const sorted = [...validStocks].sort((a, b) => b.price_change_pct - a.price_change_pct);
    topGainers = sorted.slice(0, 5).map(s => ({
      symbol: s.symbol, name: s.name, price: `₦${Number(s.latest_price || 0).toFixed(2)}`,
      change: `+${Number(s.price_change_pct || 0).toFixed(2)}%`, up: true
    }));
    topLosers = [...validStocks].sort((a, b) => a.price_change_pct - b.price_change_pct).slice(0, 5).map(s => ({
      symbol: s.symbol, name: s.name, price: `₦${Number(s.latest_price || 0).toFixed(2)}`,
      change: `${Number(s.price_change_pct || 0).toFixed(2)}%`, up: false
    }));
    
    // Pick 15 random active stocks for the ticker
    const shuffled = [...validStocks].sort(() => 0.5 - Math.random());
    dynamicTicker = shuffled.slice(0, 15).map(s => ({
      symbol: s.symbol, price: `₦${Number(s.latest_price || 0).toFixed(2)}`,
      change: `${Number(s.price_change_pct || 0).toFixed(2)}%`, up: (s.price_change_pct || 0) >= 0,
      logo_url: s.logo_url
    }));

    validStocks.forEach(s => {
      if ((s.price_change_pct || 0) > 0) adv++;
      else if ((s.price_change_pct || 0) < 0) dec++;
    });

    if (watchlist && watchlist.length > 0) {
      dynamicWatchlist = (watchlist || []).map(w => {
        const s = validStocks.find(ns => ns.symbol === w.symbol);
        if (!s) return null;
        return {
          symbol: s.symbol,
          price: s.latest_price || 0,
          change: s.price_change_pct || 0,
          status: s.compliance_status || 'Halal',
          sparkline: w.historical_prices && w.historical_prices.length >= 2 ? w.historical_prices : [s.latest_price, s.latest_price]
        };
      }).filter(Boolean);
    }
  }

  // Derive dynamic chart data from Portfolio history
  const chartHistory = data.history || [];
  const PERF_RANGES = { 0:[], 1:[], 2:[], 3:[] };
  let PERF_META = [
    {label:'1W',gain:'+0.0%',abs:'₦0'},
    {label:'1M',gain:'+0.0%',abs:'₦0'},
    {label:'3M',gain:'+0.0%',abs:'₦0'},
    {label:'ALL',gain:'+0.0%',abs:'₦0'},
  ];
  if ((chartHistory || []).length > 0) {
    const formatted = (chartHistory || []).map(h => ({
      t: new Date(h.date).toLocaleDateString('en-NG', {day:'numeric', month:'short'}),
      v: h.total_balance
    }));
    // Just use same history for all ranges for now, could be sliced by date
    PERF_RANGES[0] = formatted.slice(-7);
    PERF_RANGES[1] = formatted.slice(-30);
    PERF_RANGES[2] = formatted.slice(-90);
    PERF_RANGES[3] = formatted;

    const calcMeta = (rangeData) => {
      if (rangeData.length < 2) return {gain:'+0.0%',abs:'₦0'};
      const start = rangeData[0].v;
      const end = rangeData[rangeData.length-1].v;
      const diff = end - start;
      const pct = start > 0 ? (diff/start)*100 : 0;
      return {
        gain: `${pct>=0?'+':''}${pct.toFixed(2)}%`,
        abs: `₦${fmt(Math.abs(diff))}`
      };
    };
    PERF_META = [
      {label:'1W', ...calcMeta(PERF_RANGES[0])},
      {label:'1M', ...calcMeta(PERF_RANGES[1])},
      {label:'3M', ...calcMeta(PERF_RANGES[2])},
      {label:'ALL', ...calcMeta(PERF_RANGES[3])},
    ];
  }

  const SECTOR_DATA = [];
  if (holdings.length > 0) {
    const sectorMap = {};
    holdings.forEach(h => {
      const sec = h.sector || 'Equities';
      if (!sectorMap[sec]) sectorMap[sec] = { sector: sec, halal: 0, nonhalal: 0 };
      if (h.is_halal) sectorMap[sec].halal += h.total_value;
      else sectorMap[sec].nonhalal += h.total_value;
    });
    for (const val of Object.values(sectorMap)) {
      SECTOR_DATA.push(val);
    }
  }

  const dynamicNgxStatus = {
    isOpen: new Date().getDay() !== 0 && new Date().getDay() !== 6 && new Date().getHours() >= 10 && new Date().getHours() < 15,
    asi: '99,448.90', // Hardcoded ASI for now since it's not in the API
    asiChange: '+0.12%',
    volume: '245.8M',
    advances: adv,
    declines: dec,
  };

  const movers = moversTab === 'gainers' ? topGainers : topLosers;
  const moverColor=moversTab==='gainers'?'var(--halal)':'var(--non-halal)';
  const moverBg=moversTab==='gainers'?'#dcfce7':'#fee2e2';

  return (
    <div className="animate-fade-in">
      <Ticker tickerItems={dynamicTicker}/>
      {/* Market Status Bar */}
      <div style={{ background: 'linear-gradient(90deg, #0D1B2A 0%, #0F5257 100%)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dynamicNgxStatus.isOpen ? '#22c55e' : '#ef4444', boxShadow: dynamicNgxStatus.isOpen ? '0 0 0 3px rgba(34,197,94,0.25)' : '0 0 0 3px rgba(239,68,68,0.2)', animation: dynamicNgxStatus.isOpen ? 'pulse 2s infinite' : 'none' }}/>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: dynamicNgxStatus.isOpen ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dynamicNgxStatus.isOpen ? 'Market Open' : 'Market Closed'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>MARKET ASI</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white' }}>{dynamicNgxStatus.asi}</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '1px' }}><ArrowUpRight size={11}/>{dynamicNgxStatus.asiChange}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {[['Vol', dynamicNgxStatus.volume], ['↑ Adv', dynamicNgxStatus.advances], ['↓ Dec', dynamicNgxStatus.declines]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.59rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{k}</span>
              <span style={{ fontSize: '0.69rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'28px 22px 80px'}}>

        {/* ═ Barakah/Rizq Banner ═ */}
        <div className="stagger-1" style={{background:'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'20px', padding:'24px', marginBottom:'32px', display:'flex', gap:'20px', alignItems:'center', position:'relative', overflow:'hidden'}}>
          <div style={{position:'absolute', right:'-20px', top:'-20px', opacity:0.05, transform: 'rotate(15deg)'}}>
            <Sparkles size={140} color="var(--gold)" />
          </div>
          <div style={{width:'52px', height:'52px', borderRadius:'16px', background:'var(--gold-grad)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 8px 16px rgba(201,168,76,0.3)'}}>
            <HeartHandshake size={24} color="var(--bg)" />
          </div>
          <div style={{position:'relative', zIndex:1, flex:1}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px'}}>
              <h3 style={{fontSize:'0.7rem', fontWeight:800, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'1px', margin:0}}>
                {RIZQ_DUAS[duaIndex].type}
              </h3>
            </div>
            <p style={{fontSize:'1.05rem', fontWeight:700, color:'var(--text-dark)', lineHeight:1.4, margin:0}}>
              "{RIZQ_DUAS[duaIndex].text}"
            </p>
            <span style={{fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginTop:'6px'}}>— {RIZQ_DUAS[duaIndex].source}</span>
          </div>
        </div>

        {/* ═ Header ═ */}
        <div className="stagger-1" style={{display:'flex',flexWrap:'wrap',alignItems:'flex-start',justifyContent:'space-between',gap:'24px',marginBottom:'32px'}}>
          <div>
            <p style={{fontSize: '0.63rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'2px',color:'var(--text-muted)',marginBottom:'6px',display:'flex',alignItems:'center',gap:'6px'}}>
              <Clock size={10}/> {getDate()} &nbsp;·&nbsp;
              <span style={{fontFamily:'monospace',color:'var(--primary)',fontWeight:800}}>{liveTime}</span>
            </p>
            <h1 style={{fontSize: '2.11rem',fontWeight:900,color:'var(--text-dark)',letterSpacing:'-1px',lineHeight:1.1}}>
              Assalamu Alaikum,<br/>
              <span style={{background:'var(--gold-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                {user?.name || user?.first_name || 'Investor'} 👋
              </span>
            </h1>
            <p style={{color:'var(--text-muted)',fontSize: '0.86rem',marginTop:'8px',fontWeight:500}}>Your Islamic investment command centre.</p>
          </div>

        {/* ═ KPIs (StatCards) ═ */}
        <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <StatCard
            primary
            icon={Wallet}
            label="Total Balance"
            value={fmtK(totalBalance)}
            sub={<><ArrowUpRight size={14}/> {PERF_META[0].gain} (1W)</>}
            badge="PORTFOLIO"
          />
          <StatCard
            icon={Calculator}
            label="Est. Zakat Due"
            value={`₦${fmt(zakatAmt)}`}
            sub={zakatAmt > 0 ? "2.5% of total wealth" : "Below Nisab threshold"}
          />
          <StatCard
            icon={ShieldAlert}
            label="Purification Due"
            value={`₦${fmt(summary.purification_due || 0)}`}
            sub="From non-permissible income"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flex: 1, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LayoutList size={20}/></div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Holdings</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)' }}>{holdings.length}</div>
                </div>
             </div>
             <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flex: 1, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={20}/></div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Watchlist</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)' }}>{dynamicWatchlist.length}</div>
                </div>
             </div>
          </div>
        </div>

          <div style={{display:'flex',gap:'11px',flex:1,minWidth:'260px',maxWidth:'420px'}}>
            <div id="tour-search" style={{position:'relative',flex:1}}>
              <Search size={15} color="var(--text-muted)" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input ref={searchRef} value={searchVal} onChange={e=>setSearchVal(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&searchVal.trim())navigate(`/market/${searchVal.trim().toUpperCase()}`);}}
                type="text" placeholder="Search DANGCEM, GTCO…"
                style={{width:'100%',padding:'12px 15px 12px 42px',borderRadius:'13px',border:'1.5px solid var(--border)',background: 'var(--bg)',fontSize: '0.77rem',boxShadow:'var(--shadow-sm)',outline:'none',transition:'all 0.2s',color:'var(--text-dark)'}}
                onFocus={e=>{e.target.style.borderColor='var(--primary)';e.target.style.boxShadow='0 0 0 3px var(--primary-50)';}}
                onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='var(--shadow-sm)';}}/>
            </div>
            <div style={{position:'relative'}}>
              <button style={{width:'48px',height:'48px',borderRadius:'13px',background: 'var(--bg)',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-dark)',cursor:'pointer',boxShadow:'var(--shadow-sm)',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.color='var(--primary)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-dark)';}}>
                <Bell size={17}/>
              </button>
              <div style={{position:'absolute',top:'-5px',right:'-5px',width:'17px',height:'17px',borderRadius:'50%',background:'var(--non-halal)',color:'var(--bg)',fontSize: '0.53rem',fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 0 2px white'}}>3</div>
            </div>
          </div>
        </div>



        {/* ═ Quick Actions ═ */}
        <div id="tour-quick-actions" className="quick-actions-grid stagger-3" style={{ marginBottom: '32px' }}>
          {QUICK_ACTIONS.map(a => (
            <Link key={a.label} to={a.to} style={{ textDecoration: 'none', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,82,87,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = a.color; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${a.color}25` }}><a.icon size={24}/></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center' }}>{a.label}</span>
            </Link>
          ))}
        </div>

        {/* ═ Main Two-Column Grid ═ */}
        <div className="dashboard-main-grid" style={{alignItems:'start'}}>

          {/* ── Left Column ── */}
          <div className="stagger-4" style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            
            {/* Performance Chart */}
            <Panel>
              <PanelHeader icon={TrendingUp} title="Portfolio Growth"/>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {PERF_META.map((meta, i) => (
                  <button key={meta.label} onClick={() => setPerfRange(i)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, background: perfRange === i ? 'var(--primary)' : 'var(--bg-section)', color: perfRange === i ? 'white' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {meta.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>{fmtK(PERF_RANGES[perfRange]?.[PERF_RANGES[perfRange].length - 1]?.v || totalBalance)}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: PERF_META[perfRange].gain.startsWith('+') ? 'var(--halal)' : 'var(--non-halal)', display: 'flex', alignItems: 'center', gap: '2px', paddingBottom: '4px' }}>
                  {PERF_META[perfRange].gain.startsWith('+') ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                  {PERF_META[perfRange].gain}
                </div>
              </div>
              <div style={{ height: '240px', marginLeft: '-15px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERF_RANGES[perfRange]}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip
                      formatter={(val) => [fmtK(val), 'Value']}
                      labelFormatter={(l) => l}
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, boxShadow: 'var(--shadow-md)' }}
                    />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            
            {/* Watchlist */}
            <Panel>
              <PanelHeader icon={Eye} title="Your Watchlist"/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {dynamicWatchlist.length > 0 ? dynamicWatchlist.map(w => (
                  <WatchlistRow key={w.symbol} stock={w} />
                )) : (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Eye size={34} strokeWidth={1.2} style={{ margin: '0 auto 10px', color: 'var(--text-light)' }}/>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '4px' }}>Watchlist is empty</div>
                    <div style={{ fontSize: '0.71rem' }}>Add stocks from the Market page to track them here.</div>
                  </div>
                )}
              </div>
            </Panel>

            
            {/* Inbox / Alerts */}
            <Panel>
              <PanelHeader icon={Bell} title="Inbox"/>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',maxHeight:'340px',overflowY:'auto',paddingRight:'3px'}}>
                {alerts.length > 0 ? alerts.map(alert => (
                  <div key={alert.id} style={{padding:'14px',borderRadius:'12px',background:'var(--bg-section)',border:'1px solid var(--border)',display:'flex',gap:'12px'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'var(--primary-50)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Bell size={16} color="var(--primary)"/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:'0.82rem',color:'var(--text-dark)'}}>{alert.symbol} Price Alert</div>
                      <div style={{fontSize:'0.71rem',color:'var(--text-muted)',marginTop:'4px',lineHeight:1.4}}>
                        You will be notified when {alert.symbol} goes <strong>{alert.condition} ₦{alert.target_price}</strong>.
                      </div>
                      <div style={{fontSize:'0.6rem',color:'var(--text-light)',marginTop:'6px'}}>{new Date(alert.created_at).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => handleDeleteAlert(alert.id)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:'6px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='var(--non-halal)';}} onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--text-muted)';}}>
                      <Trash2 size={15}/>
                    </button>
                  </div>
                )) : (
                  <div style={{padding:'30px 0',textAlign:'center',color:'var(--text-muted)'}}>
                    <Bell size={34} strokeWidth={1.2} style={{margin:'0 auto 10px',color:'var(--text-light)'}}/>
                    <div style={{fontWeight:700,fontSize:'0.82rem',marginBottom:'4px'}}>Inbox is empty</div>
                    <div style={{fontSize:'0.71rem'}}>Set price alerts from your watchlist to get notified here.</div>
                  </div>
                )}
              </div>
            </Panel>

            {/* Allocation */}
            <Panel>
              <PanelHeader icon={Wallet} title="Allocation"/>
              {holdings.length === 0 ? (
                <div style={{ height:'180px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize: '0.79rem', fontWeight:600, background:'linear-gradient(180deg, var(--bg-section) 0%, #ffffff 100%)', borderRadius:'16px', border:'1.5px dashed var(--border)' }}>
                  <Activity size={28} style={{ marginBottom:'12px', opacity:0.3, color:'var(--primary)' }} />
                  <span>No allocation data</span>
                </div>
              ) : (
                <>
                  <div style={{ height:'160px', position:'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                          {pieData.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                        </Pie>
                        <Tooltip formatter={(v) => [fmtK(v),'Value']} contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize: '0.69rem', fontWeight:700 }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginTop:'18px' }}>
                    {pieData.map((d,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:d.color, flexShrink:0 }}/>
                          <span style={{ fontSize: '0.7rem', fontWeight:700, color:'var(--text-dark)' }}>{d.name}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ width:'50px', height:'4px', borderRadius:'2px', background:'var(--bg-section)', overflow:'hidden' }}>
                            <div style={{ width:`${totalBalance > 0 ? ((d.value / totalBalance)*100) : 0}%`, height:'100%', background:d.color, borderRadius:'2px' }}/>
                          </div>
                          <span style={{ fontSize: '0.69rem', fontWeight:800, color:'var(--text-muted)', minWidth:'32px', textAlign:'right' }}>
                            {totalBalance > 0 ? `${((d.value / totalBalance)*100).toFixed(0)}%` : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>
            
          </div>

          {/* ── Right Column ── */}
          <div className="stagger-5" style={{display:'flex',flexDirection:'column',gap:'20px'}}>

            {/* Compliance Changes */}
            <Panel style={{ background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)' }}>
              <PanelHeader icon={ArrowRightLeft} title="Compliance Changes"/>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                Recent updates to Shariah compliance status for stocks in the market.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {complianceChanges.length > 0 ? complianceChanges.map(change => (
                  <div key={change.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem', color: 'var(--text-dark)' }}>{change.symbol.substring(0, 4)}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-dark)' }}>{change.symbol}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>{change.time_ago}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: change.old_status === 'halal' ? 'var(--halal)' : 'var(--non-halal)', background: change.old_status === 'halal' ? 'var(--halal-bg)' : 'var(--non-halal-bg)', padding: '4px 8px', borderRadius: '6px', textTransform: 'capitalize' }}>{change.old_status || 'Unknown'}</span>
                      <ArrowRightLeft size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: change.new_status === 'halal' ? 'var(--halal)' : 'var(--non-halal)', background: change.new_status === 'halal' ? 'var(--halal-bg)' : 'var(--non-halal-bg)', padding: '4px 8px', borderRadius: '6px', textTransform: 'capitalize' }}>{change.new_status}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No recent compliance changes.</div>
                )}
              </div>
            </Panel>


            {/* Compliance Ring */}
            <Panel>
              <PanelHeader icon={Shield} title="Shariah Compliance"/>
              <ComplianceRing score={compliance}/>
            </Panel>

            {/* Portfolio Movers */}
            <Panel>
              <PanelHeader icon={Zap} title="Portfolio Movers"/>
              <div style={{display:'flex',gap:'6px',marginBottom:'16px'}}>
                {[['gainers','Top Gainers'],['losers','Top Losers']].map(([tab,lbl])=>(
                  <button key={tab} onClick={()=>setMoversTab(tab)} style={{flex:1,padding:'7px',borderRadius:'9px',fontSize: '0.67rem',fontWeight:700,background:moversTab===tab?(tab==='gainers'?'#dcfce7':'#fee2e2'):'var(--bg-section)',color:moversTab===tab?(tab==='gainers'?'var(--halal)':'var(--non-halal)'):'var(--text-muted)',border:'none',cursor:'pointer',transition:'all 0.2s'}}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                {(portfolioMovers[moversTab] || []).length > 0 ? (portfolioMovers[moversTab] || []).map((m,i)=>(
                  <div key={m.symbol} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 11px',borderRadius:'11px',background:i%2===0?'var(--bg-section)':'transparent'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'26px',height:'26px',borderRadius:'7px',background:moverBg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize: '0.51rem',color:moverColor}}>{i+1}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize: '0.73rem',color:'var(--text-dark)'}}>{m.symbol}</div>
                        <div style={{fontSize: '0.62rem',color:'var(--text-muted)',fontWeight:500}}>₦{Number(m.latest_price || 0).toFixed(2)}</div>
                      </div>
                    </div>
                    <span style={{fontSize: '0.71rem',fontWeight:800,color:moverColor}}>{m.price_change_pct > 0 ? '+' : ''}{Number(m.price_change_pct || 0).toFixed(2)}%</span>
                  </div>
                )) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No movers to display. Add stocks to your portfolio or watchlist.</div>
                )}
              </div>
            </Panel>

            {/* Market News */}
            <Panel>
              <PanelHeader icon={Globe} title="Market News"/>
              <div style={{display:'flex',flexDirection:'column',gap:'12px',maxHeight:'300px',overflowY:'auto',paddingRight:'3px'}}>
                {(news || []).length > 0 ? (news || []).map((item, i) => (
                  <div key={item.id || i} style={{display:'flex',flexDirection:'column',gap:'4px',paddingBottom:'12px',borderBottom:i<news.length-1?'1px solid var(--border)':'none'}}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.75rem',color:'var(--text-dark)',fontWeight:700,textDecoration:'none',lineHeight:1.4}} onMouseEnter={e=>e.target.style.color='var(--primary)'} onMouseLeave={e=>e.target.style.color='var(--text-dark)'}>
                      {item.title}
                    </a>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'4px'}}>
                      {item.symbol ? (
                        <span style={{fontSize: '0.6rem',fontWeight:800,color:'var(--primary)',background:'var(--primary-50)',padding:'2px 6px',borderRadius:'4px',letterSpacing:'0.5px'}}>{item.symbol}</span>
                      ) : <span />}
                      <span style={{fontSize: '0.57rem',color:'var(--text-muted)'}}>{item.published_human}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{fontSize: '0.7rem',color:'var(--text-muted)',textAlign:'center',padding:'20px 0'}}>No news available at the moment.</div>
                )}
              </div>
            </Panel>

            {/* Sector Breakdown */}
            <Panel>
              <PanelHeader icon={BarChart2} title="Sector Breakdown"/>
              <div style={{height:'150px',marginLeft:'-10px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SECTOR_DATA} barSize={9}>
                    <XAxis dataKey="sector" tick={{fontSize:8,fill:'var(--text-muted)',fontWeight:600}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{borderRadius:'9px',border:'1px solid var(--border)',fontSize: '0.67rem',fontWeight:600}}/>
                    <Bar dataKey="halal"    name="Halal"     fill="var(--halal)"     radius={[4,4,0,0]}/>
                    <Bar dataKey="nonhalal" name="Non-Halal" fill="var(--non-halal)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:'flex',gap:'14px',marginTop:'9px'}}>
                {[['var(--halal)','Halal'],['var(--non-halal)','Non-Halal']].map(([color,label])=>(
                  <div key={label} style={{display:'flex',alignItems:'center',gap:'5px'}}>
                    <div style={{width:'7px',height:'7px',borderRadius:'2px',background:color}}/>
                    <span style={{fontSize: '0.62rem',fontWeight:600,color:'var(--text-muted)'}}>{label}</span>
                  </div>
                ))}
              </div>
            </Panel>



            {/* Daily Insight */}
            <div style={{background:'var(--gold-grad)',borderRadius:'20px',padding:'24px',color:'var(--bg)',position:'relative',overflow:'hidden',boxShadow:'0 8px 32px rgba(201,168,76,0.3)'}}>
              <div style={{position:'absolute',top:'-18px',right:'-18px',width:'100px',height:'100px',borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
              <div style={{position:'absolute',bottom:'-28px',left:'8px',width:'65px',height:'65px',borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}/>
              <h3 style={{fontSize: '0.69rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'1.5px',opacity:0.85,marginBottom:'11px',display:'flex',alignItems:'center',gap:'7px',position:'relative'}}>
                <Sparkles size={14} color="white"/> Daily Insight
              </h3>
              <p style={{fontSize: '0.8rem',lineHeight:1.75,fontWeight:500,color:'rgba(255,255,255,0.93)',position:'relative'}}>
                {INSIGHTS[insightIdx]}
              </p>
              <div style={{display:'flex',gap:'5px',marginTop:'16px',position:'relative'}}>
                {INSIGHTS.map((_,i)=>(
                  <div key={i} onClick={()=>setInsightIdx(i)} style={{width:i===insightIdx?'16px':'5px',height:'5px',borderRadius:'3px',background:i===insightIdx?'var(--bg)':'rgba(255,255,255,0.4)',cursor:'pointer',transition:'all 0.3s ease'}}/>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
