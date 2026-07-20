import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchPortfolio, fetchNgxStocks, fetchNews, fetchWatchlist, fetchHistory, fetchPriceAlerts } from '../services/api';
import {
  Search, Bell, Star, Wallet, TrendingUp, TrendingDown,
  ShieldAlert, CheckCircle, AlertTriangle, ArrowUpRight,
  ArrowDownRight, ChevronRight, Calculator, HeartHandshake,
  Shield, PlusCircle, BarChart2, Sparkles, Globe, Clock, X,
  Zap, Activity
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, YAxis,
  BarChart, Bar, XAxis
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
    <div style={{background:'linear-gradient(90deg, #F5F7FA 0%, #FFFFFF 50%, #F5F7FA 100%)', borderBottom:'1px solid var(--border)',overflow:'hidden',paddingLeft:'8px', position:'relative'}}>
      {/* Edge Gradients for smooth fade */}
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:'40px',background:'linear-gradient(90deg, #F5F7FA 0%, transparent 100%)',zIndex:2,pointerEvents:'none'}}/>
      <div style={{position:'absolute',right:0,top:0,bottom:0,width:'40px',background:'linear-gradient(-90deg, #F5F7FA 0%, transparent 100%)',zIndex:2,pointerEvents:'none'}}/>
      <div style={{display:'flex',gap:'48px',animation:'scrollTicker 40s linear infinite',width:'max-content',padding:'12px 0'}}>
        {items.map((item,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap'}}>
            <span style={{fontSize:'0.77rem',fontWeight:800,color:'var(--text-dark)'}}>{item.symbol}</span>
            <span style={{fontSize:'0.77rem',fontWeight:500,color:'var(--text-muted)'}}>{item.price}</span>
            <span style={{fontSize:'0.74rem',fontWeight:700,color:item.up?'var(--halal)':'var(--non-halal)',display:'flex',alignItems:'center',gap:'1px'}}>
              {item.up?<ArrowUpRight size={11}/>:<ArrowDownRight size={11}/>}{item.change}
            </span>
            <span style={{color:'var(--border-strong)',fontSize:'0.6rem'}}>•</span>
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
        background: primary ? 'linear-gradient(135deg, #0F5257 0%, #0B4347 100%)' : 'white',
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
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: primary ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
              {label}
            </span>
          </div>
          {badge && <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: '24px', background: 'rgba(255,255,255,0.15)', color: 'white', letterSpacing: '0.5px' }}>{badge}</span>}
        </div>
        <div style={{ fontSize: '2.6rem', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '14px', color: primary ? 'white' : 'var(--text-dark)' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.85rem', fontWeight: 600, color: primary ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>{sub}</div>}
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
          <text x="64" y="58" textAnchor="middle" style={{fontSize:'20px',fontWeight:900,fill:'var(--text-dark)',fontFamily:'inherit'}}>{score}%</text>
          <text x="64" y="76" textAnchor="middle" style={{fontSize:'8px',fontWeight:800,fill:'var(--text-muted)',letterSpacing:'1.5px'}}>SCORE</text>
        </svg>
      </div>
      <div>
        <div style={{fontSize:'1.1rem',fontWeight:900,color,marginBottom:'6px'}}>{label}</div>
        <div style={{fontSize:'0.85rem',color:'var(--text-muted)',fontWeight:500,lineHeight:1.6}}>
          Your portfolio is<br/><strong style={{color:'var(--text-dark)'}}>{score}%</strong> Shariah compliant
        </div>
        <Link to="/market" style={{display:'inline-flex',alignItems:'center',gap:'4px',marginTop:'12px',fontSize:'0.85rem',fontWeight:700,color:'var(--primary)', background: 'var(--primary-50)', padding: '6px 12px', borderRadius: '8px'}}>
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
        <div style={{width:'34px',height:'34px',borderRadius:'8px',background:hov?'var(--primary-100)':'var(--bg-section)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'0.6rem',color:'var(--primary)',flexShrink:0}}>
          {stock.symbol.slice(0,5)}
        </div>
        <div>
          <div style={{fontWeight:700,color:'var(--text-dark)',fontSize:'0.75rem'}}>{stock.symbol}</div>
          <div style={{display:'flex',alignItems:'center',gap:'3px',fontSize:'0.6rem',color:s.color,marginTop:'2px',fontWeight:600}}>
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
            <div style={{fontWeight:800,color:'var(--text-dark)',fontSize:'0.75rem'}}>₦{price.toLocaleString()}</div>
            {change !== 0 && (
              <div style={{fontSize:'0.65rem',fontWeight:700,color:isUp?'var(--halal)':'var(--non-halal)',display:'flex',alignItems:'center',gap:'1px',justifyContent:'flex-end'}}>
                {isUp?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{isUp?'+':''}{change.toFixed(2)}%
              </div>
            )}
          </>
        ) : (
          <div style={{fontSize:'0.65rem',color:'var(--text-muted)',fontWeight:600}}>Unavailable</div>
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
        <div style={{width:'34px',height:'34px',borderRadius:'8px',background:'var(--bg-section)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'0.6rem',color:'var(--primary)',flexShrink:0}}>
          {(holding.symbol||holding.stock_code||'N/A').slice(0,5)}
        </div>
        <div>
          <div style={{fontWeight:700,color:'var(--text-dark)',fontSize:'0.75rem'}}>{holding.symbol||holding.stock_code}</div>
          <div style={{fontSize:'0.6rem',color:'var(--text-muted)',marginTop:'2px',fontWeight:500}}>{shares} shares</div>
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        {currentValue > 0 ? (
          <>
            <div style={{fontWeight:800,color:'var(--text-dark)',fontSize:'0.75rem'}}>{fmtK(currentValue)}</div>
            {gainLoss !== 0 && (
              <div style={{fontSize:'0.65rem',fontWeight:700,color:isUp?'var(--halal)':'var(--non-halal)',display:'flex',alignItems:'center',gap:'1px',justifyContent:'flex-end'}}>
                {isUp?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{isUp?'+':''}{fmtK(gainLoss)}
              </div>
            )}
          </>
        ) : (
          <div style={{fontSize:'0.65rem',color:'var(--text-muted)',fontWeight:600}}>Unavailable</div>
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
          <div key={i} style={{background:'white',borderRadius:'20px',padding:'24px 26px',height:'140px',border:'1px solid var(--border)'}}>
            <div style={{...sh,width:'36px',height:'36px',borderRadius:'10px',marginBottom:'16px'}}/>
            <div style={{...sh,width:'120px',height:'34px',marginBottom:'10px'}}/>
            <div style={{...sh,width:'85px',height:'13px'}}/>
          </div>
        ))}
      </div>
      <div className="dashboard-main-grid">
        <div style={{display:'flex',flexDirection:'column',gap:'22px'}}>
          {[300,260].map(h=>(
            <div key={h} style={{background:'white',borderRadius:'20px',padding:'26px',border:'1px solid var(--border)',height:`${h}px`}}>
              <div style={{...sh,width:'150px',height:'20px',marginBottom:'20px'}}/>
              {[1,2,3].map(i=><div key={i} style={{...sh,width:'100%',height:'48px',marginBottom:'11px',borderRadius:'11px'}}/>)}
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'22px'}}>
          {[260,220].map(h=>(
            <div key={h} style={{background:'white',borderRadius:'20px',padding:'26px',border:'1px solid var(--border)',height:`${h}px`}}>
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
  <div style={{background:'white',border:'1px solid var(--border)',borderRadius:'20px',padding:'24px',boxShadow:'var(--shadow-sm)',...style}}>
    {children}
  </div>
);
const PanelHeader=({icon:Icon,title,action})=>(
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
    <h2 style={{fontSize:'1.05rem',fontWeight:800,color:'var(--text-dark)',display:'flex',alignItems:'center',gap:'8px',margin:0}}>
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
  const searchRef=useRef(null);

  useEffect(()=>{
    if(!authLoading&&!user){navigate('/login');return;}
    if(user){
      Promise.all([
        fetchPortfolio(), 
        fetchNgxStocks(), 
        fetchNews().catch(()=>({ data: [] })),
        fetchWatchlist().catch(()=>({ data: [] })),
        fetchHistory().catch(()=>({ data: [] })),
        fetchPriceAlerts().catch(()=>({ data: [] }))
      ])
        .then(([portRes, ngxRes, newsRes, watchRes, histRes, alertRes]) => {
          if (portRes && portRes.data) setData(portRes.data);
          else if (portRes && !portRes.data) setData(portRes);
          if (ngxRes && ngxRes.data) setNgxStocks(ngxRes.data);
          if (newsRes && newsRes.data) setNews(newsRes.data);
          if (watchRes && watchRes.data) setWatchlist(watchRes.data);
          if (histRes && histRes.data) setHistory(histRes.data);
          if (alertRes && alertRes.data) setAlerts(alertRes.data);
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

  const QUICK_ACTIONS=[
    {icon:PlusCircle,label:'Add Trade', color:'var(--primary)',bg:'var(--primary-50)',to:'/portfolio'},
    {icon:BarChart2, label:'Market',    color:'#3b82f6',       bg:'#dbeafe',         to:'/portfolio#market'},

    {icon:Calculator,label:'Zakat',     color:'#8b5cf6',       bg:'#ede9fe',         to:'/portfolio#zakat'},
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
      symbol: s.symbol, name: s.name, price: `₦${(s.latest_price || 0).toFixed(2)}`,
      change: `+${(s.price_change_pct || 0).toFixed(2)}%`, up: true
    }));
    topLosers = [...validStocks].sort((a, b) => a.price_change_pct - b.price_change_pct).slice(0, 5).map(s => ({
      symbol: s.symbol, name: s.name, price: `₦${(s.latest_price || 0).toFixed(2)}`,
      change: `${(s.price_change_pct || 0).toFixed(2)}%`, up: false
    }));
    
    // Pick 15 random active stocks for the ticker
    const shuffled = [...validStocks].sort(() => 0.5 - Math.random());
    dynamicTicker = shuffled.slice(0, 15).map(s => ({
      symbol: s.symbol, price: `₦${(s.latest_price || 0).toFixed(2)}`,
      change: `${(s.price_change_pct || 0).toFixed(2)}%`, up: (s.price_change_pct || 0) >= 0
    }));

    validStocks.forEach(s => {
      if ((s.price_change_pct || 0) > 0) adv++;
      else if ((s.price_change_pct || 0) < 0) dec++;
    });

    if (watchlist && watchlist.length > 0) {
      dynamicWatchlist = watchlist.map(w => {
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
  if (chartHistory.length > 0) {
    const formatted = chartHistory.map(h => ({
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
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: dynamicNgxStatus.isOpen ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dynamicNgxStatus.isOpen ? 'Market Open' : 'Market Closed'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>MARKET ASI</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white' }}>{dynamicNgxStatus.asi}</span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '1px' }}><ArrowUpRight size={11}/>{dynamicNgxStatus.asiChange}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {[['Vol', dynamicNgxStatus.volume], ['↑ Adv', dynamicNgxStatus.advances], ['↓ Dec', dynamicNgxStatus.declines]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.67rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{k}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'28px 22px 80px'}}>

        {/* ═ Purification Banner ═ */}
        {showAlert&&summary.purification_due>0&&(
          <div className="stagger-1" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',padding:'13px 18px',marginBottom:'24px',borderRadius:'13px',background:'rgba(230,81,0,0.07)',border:'1px solid var(--doubtful-border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'11px'}}>
              <ShieldAlert size={19} color="var(--doubtful)"/>
              <span style={{fontSize:'0.88rem',fontWeight:600,color:'var(--doubtful)'}}>
                Purification required — ₦{fmt(summary.purification_due)} pending from non-compliant income.
              </span>
            </div>
            <div style={{display:'flex',gap:'10px',alignItems:'center',flexShrink:0}}>
              <button style={{padding:'8px 16px',background:'var(--doubtful)',color:'white',border:'none',borderRadius:'8px',fontWeight:700,fontSize:'0.83rem',cursor:'pointer'}}>Purify Now</button>
              <button onClick={()=>setShowAlert(false)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex',padding:'4px'}}><X size={15}/></button>
            </div>
          </div>
        )}

        {/* ═ Header ═ */}
        <div className="stagger-1" style={{display:'flex',flexWrap:'wrap',alignItems:'flex-start',justifyContent:'space-between',gap:'24px',marginBottom:'32px'}}>
          <div>
            <p style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'2px',color:'var(--text-muted)',marginBottom:'6px',display:'flex',alignItems:'center',gap:'6px'}}>
              <Clock size={10}/> {getDate()} &nbsp;·&nbsp;
              <span style={{fontFamily:'monospace',color:'var(--primary)',fontWeight:800}}>{liveTime}</span>
            </p>
            <h1 style={{fontSize:'2.4rem',fontWeight:900,color:'var(--text-dark)',letterSpacing:'-1px',lineHeight:1.1}}>
              Assalamu Alaikum,<br/>
              <span style={{background:'var(--gold-grad)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                {user?.name || user?.first_name || 'Investor'} 👋
              </span>
            </h1>
            <p style={{color:'var(--text-muted)',fontSize:'0.98rem',marginTop:'8px',fontWeight:500}}>Your Islamic investment command centre.</p>
          </div>
          <div style={{display:'flex',gap:'11px',flex:1,minWidth:'260px',maxWidth:'420px'}}>
            <div style={{position:'relative',flex:1}}>
              <Search size={15} color="var(--text-muted)" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input ref={searchRef} value={searchVal} onChange={e=>setSearchVal(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&searchVal.trim())navigate(`/market/${searchVal.trim().toUpperCase()}`);}}
                type="text" placeholder="Search DANGCEM, GTCO…"
                style={{width:'100%',padding:'12px 15px 12px 42px',borderRadius:'13px',border:'1.5px solid var(--border)',background:'white',fontSize:'0.88rem',boxShadow:'var(--shadow-sm)',outline:'none',transition:'all 0.2s',color:'var(--text-dark)'}}
                onFocus={e=>{e.target.style.borderColor='var(--primary)';e.target.style.boxShadow='0 0 0 3px var(--primary-50)';}}
                onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='var(--shadow-sm)';}}/>
            </div>
            <div style={{position:'relative'}}>
              <button style={{width:'48px',height:'48px',borderRadius:'13px',background:'white',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-dark)',cursor:'pointer',boxShadow:'var(--shadow-sm)',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.color='var(--primary)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-dark)';}}>
                <Bell size={17}/>
              </button>
              <div style={{position:'absolute',top:'-5px',right:'-5px',width:'17px',height:'17px',borderRadius:'50%',background:'var(--non-halal)',color:'white',fontSize:'0.6rem',fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 0 2px white'}}>3</div>
            </div>
          </div>
        </div>

        {/* ═ Stats Grid ═ */}
        <div className="stagger-2" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px',marginBottom:'18px'}}>
          <StatCard icon={Wallet} label="Portfolio Value" primary={true}
            value={`₦${fmt(summary.total_balance)}`}
            sub={<><TrendingUp size={12}/> Active portfolio</>} badge="Market"/>
          <StatCard icon={Shield} label="Compliance Score" value={`${compliance}%`}
            sub={compliance>=90?<><CheckCircle size={12} color="var(--halal)"/> Excellent standing</>:<><AlertTriangle size={12} color="var(--doubtful)"/> Needs review</>}/>
          <StatCard icon={Activity} label="Total Holdings" value={holdings.length||0}
            sub={<><Zap size={12} color="var(--primary)"/> Across all sectors</>}/>
        </div>

        {/* ═ Quick Actions ═ */}
        <div className="quick-actions-grid stagger-3" style={{ marginBottom: '32px' }}>
          {QUICK_ACTIONS.map(a => (
            <Link key={a.label} to={a.to} style={{ textDecoration: 'none', background: 'white', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,82,87,0.1)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = a.color; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${a.color}25` }}><a.icon size={24}/></div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center' }}>{a.label}</span>
            </Link>
          ))}
        </div>

        {/* ═ Main Two-Column Grid ═ */}
        <div className="dashboard-main-grid" style={{alignItems:'start'}}>

          {/* ── Left Column ── */}
          <div className="stagger-4" style={{display:'flex',flexDirection:'column',gap:'20px'}}>

            {/* Performance Chart */}
            <Panel>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'18px',flexWrap:'wrap',gap:'10px'}}>
                <div>
                  <h2 style={{fontSize:'1.05rem',fontWeight:800,color:'var(--text-dark)',display:'flex',alignItems:'center',gap:'7px',margin:'0 0 4px'}}>
                    <TrendingUp size={16} color="var(--primary)"/> Portfolio Performance
                  </h2>
                  <div style={{fontSize:'0.81rem',color:'var(--text-muted)',fontWeight:500}}>
                    {PERF_META[perfRange].label}&nbsp;
                    <span style={{color:'var(--halal)',fontWeight:800}}>{PERF_META[perfRange].gain} ▲</span>
                    <span style={{color:'var(--text-muted)',fontWeight:600}}>&nbsp;({PERF_META[perfRange].abs})</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:'5px'}}>
                  {PERF_META.map((m,i)=>(
                    <button key={m.label} onClick={()=>setPerfRange(i)} style={{padding:'5px 12px',borderRadius:'8px',fontSize:'0.71rem',fontWeight:700,background:perfRange===i?'var(--primary)':'var(--bg-section)',color:perfRange===i?'white':'var(--text-muted)',border:'none',cursor:'pointer',transition:'all 0.2s'}}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{height:'230px',marginLeft:'-10px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERF_RANGES[perfRange]}>
                    <defs>
                      <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.22}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{fontSize:9,fill:'var(--text-muted)',fontWeight:600}} axisLine={false} tickLine={false}/>
                    <YAxis domain={['dataMin - 80000','dataMax + 80000']} hide/>
                    <Tooltip contentStyle={{borderRadius:'11px',border:'1px solid var(--border)',boxShadow:'var(--shadow-md)',fontWeight:700,fontSize:'0.81rem',background:'white'}}
                      formatter={v=>[`₦${fmt(v)}`,'Portfolio Value']} labelStyle={{display:'none'}}/>
                    <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#perfGrad)" dot={false} activeDot={{r:5,fill:'var(--primary)',stroke:'white',strokeWidth:2}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Holdings */}
            <Panel>
              <PanelHeader icon={Wallet} title="My Holdings"
                action={<Link to="/portfolio" style={{fontSize:'0.78rem',fontWeight:700,color:'var(--primary)',display:'flex',alignItems:'center',gap:'3px'}}>Manage <ChevronRight size={12}/></Link>}/>
              <div style={{maxHeight:'360px',overflowY:'auto',paddingRight:'3px'}}>
                {holdings.length>0?holdings.map(h=><HoldingRow key={h.id} holding={h}/>):(
                  <div style={{padding:'34px 0',textAlign:'center',color:'var(--text-muted)'}}>
                    <BarChart2 size={34} strokeWidth={1.2} style={{margin:'0 auto 10px',color:'var(--text-light)'}}/>
                    <div style={{fontWeight:700,fontSize:'0.93rem',marginBottom:'4px'}}>No holdings yet</div>
                    <div style={{fontSize:'0.81rem'}}>Add your first trade to start tracking</div>
                    <Link to="/portfolio" style={{display:'inline-flex',alignItems:'center',gap:'5px',marginTop:'13px',padding:'9px 17px',borderRadius:'10px',background:'var(--primary-50)',color:'var(--primary)',fontWeight:700,fontSize:'0.81rem'}}>
                      <PlusCircle size={13}/> Add Trade
                    </Link>
                  </div>
                )}
              </div>
            </Panel>

            {/* Recent Transactions */}
            <Panel>
              <PanelHeader icon={Activity} title="Recent Transactions"
                action={<Link to="/portfolio" style={{fontSize:'0.78rem',fontWeight:700,color:'var(--primary)',display:'flex',alignItems:'center',gap:'3px'}}>View All <ChevronRight size={12}/></Link>}/>
              <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                {history.slice(0,5).map((tx,i)=>{
                  const isBuy=tx.type==='buy';
                  const isDiv=tx.type==='div';
                  const txColor=isDiv?'#8b5cf6':isBuy?'var(--halal)':'var(--non-halal)';
                  const txBg=isDiv?'#ede9fe':isBuy?'#dcfce7':'#fee2e2';
                  const txLabel=isDiv?'DIV':isBuy?'BUY':'SELL';
                  return (
                    <div key={tx.id} style={{display:'flex',alignItems:'center',gap:'13px',padding:'11px 10px',borderRadius:'12px',transition:'background 0.2s',cursor:'default'}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-section)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{width:'36px',height:'36px',borderRadius:'10px',background:txBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:800,color:txColor,flexShrink:0,letterSpacing:'0.3px'}}>
                        {txLabel}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:'0.87rem',color:'var(--text-dark)'}}>{tx.symbol}</div>
                        <div style={{fontSize:'0.71rem',color:'var(--text-muted)',fontWeight:500,marginTop:'1px'}}>
                          {isDiv?`Dividend received`:(`${tx.quantity} shares @ ₦${tx.price}`)}
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontWeight:800,fontSize:'0.88rem',color:txColor}}>₦{Number(tx.total).toLocaleString()}</div>
                        <div style={{fontSize:'0.69rem',color:'var(--text-muted)',fontWeight:500,marginTop:'1px'}}>{new Date(tx.date).toLocaleDateString('en-NG')}</div>
                      </div>
                    </div>
                  );
                })}
                {history.length===0 && (
                  <div style={{padding:'20px 0',textAlign:'center',color:'var(--text-muted)',fontSize:'0.81rem'}}>
                    No recent transactions
                  </div>
                )}
              </div>
            </Panel>

            {/* Watchlist */}
            <Panel>
              <PanelHeader icon={Star} title="Watchlist"
                action={<Link to="/market" style={{fontSize:'0.78rem',fontWeight:700,color:'var(--primary)',display:'flex',alignItems:'center',gap:'3px'}}>Browse Market <ChevronRight size={12}/></Link>}/>
              <div style={{maxHeight:'340px',overflowY:'auto',paddingRight:'3px'}}>
                {dynamicWatchlist.length > 0 ? dynamicWatchlist.map(s=><WatchlistRow key={s.symbol} stock={s}/>) : (
                  <div style={{padding:'20px 0',textAlign:'center',color:'var(--text-muted)',fontSize:'0.81rem'}}>
                    Your watchlist is empty
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* ── Right Column ── */}
          <div className="stagger-5" style={{display:'flex',flexDirection:'column',gap:'20px'}}>

            {/* Compliance Ring */}
            <Panel>
              <PanelHeader icon={Shield} title="Shariah Compliance"/>
              <ComplianceRing score={compliance}/>
            </Panel>

            {/* Market Movers */}
            <Panel>
              <PanelHeader icon={Zap} title="Market Movers"/>
              <div style={{display:'flex',gap:'6px',marginBottom:'16px'}}>
                {[['gainers','Top Gainers'],['losers','Top Losers']].map(([tab,lbl])=>(
                  <button key={tab} onClick={()=>setMoversTab(tab)} style={{flex:1,padding:'7px',borderRadius:'9px',fontSize:'0.76rem',fontWeight:700,background:moversTab===tab?(tab==='gainers'?'#dcfce7':'#fee2e2'):'var(--bg-section)',color:moversTab===tab?(tab==='gainers'?'var(--halal)':'var(--non-halal)'):'var(--text-muted)',border:'none',cursor:'pointer',transition:'all 0.2s'}}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                {movers.map((m,i)=>(
                  <div key={m.symbol} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 11px',borderRadius:'11px',background:i%2===0?'var(--bg-section)':'transparent'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'26px',height:'26px',borderRadius:'7px',background:moverBg,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'0.58rem',color:moverColor}}>{i+1}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:'0.83rem',color:'var(--text-dark)'}}>{m.symbol}</div>
                        <div style={{fontSize:'0.7rem',color:'var(--text-muted)',fontWeight:500}}>{m.price}</div>
                      </div>
                    </div>
                    <span style={{fontSize:'0.81rem',fontWeight:800,color:moverColor}}>{m.change}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Islamic Obligations */}
            <Panel>
              <PanelHeader icon={HeartHandshake} title="Islamic Obligations"/>
              {/* Purification */}
              <div style={{padding:'14px',borderRadius:'13px',marginBottom:'12px',background:summary.purification_due>0?'rgba(230,81,0,0.06)':'var(--bg-section)',border:`1px solid ${summary.purification_due>0?'var(--doubtful-border)':'var(--border)'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                  <span style={{fontSize:'0.69rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:summary.purification_due>0?'var(--doubtful)':'var(--text-muted)'}}>Purification Due</span>
                  <ShieldAlert size={13} color={summary.purification_due>0?'var(--doubtful)':'var(--text-light)'}/>
                </div>
                <div style={{fontSize:'1.8rem',fontWeight:900,color:summary.purification_due>0?'var(--doubtful)':'var(--text-dark)',letterSpacing:'-0.5px'}}>₦{fmt(summary.purification_due)}</div>
                {summary.purification_due>0&&(
                  <button style={{width:'100%',marginTop:'11px',padding:'9px',background:'var(--doubtful)',color:'white',border:'none',borderRadius:'9px',fontWeight:700,fontSize:'0.84rem',cursor:'pointer'}}
                    onMouseEnter={e=>e.target.style.opacity='0.88'} onMouseLeave={e=>e.target.style.opacity='1'}>
                    Purify Now →
                  </button>
                )}
              </div>
              {/* Zakat */}
              <div style={{padding:'14px',borderRadius:'13px',background:'var(--bg-section)',border:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                  <span style={{fontSize:'0.69rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--text-muted)'}}>Zakat Calculator (2.5%)</span>
                  <Calculator size={12} color="var(--text-muted)"/>
                </div>
                <input type="number" placeholder="Enter custom amount…" value={zakatManual}
                  onChange={e=>setZakatManual(e.target.value)}
                  style={{width:'100%',padding:'8px 12px',borderRadius:'9px',border:'1.5px solid var(--border)',background:'white',fontSize:'0.85rem',outline:'none',color:'var(--text-dark)',marginBottom:'10px',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor='var(--primary)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'0.78rem',color:'var(--text-muted)',fontWeight:500}}>Estimated Zakat:</span>
                  <span style={{fontSize:'1.25rem',fontWeight:900,color:'var(--text-dark)',letterSpacing:'-0.5px'}}>₦{fmt(parseFloat(zakatAmt)||0)}</span>
                </div>
                <p style={{fontSize:'0.68rem',color:'var(--text-light)',marginTop:'6px',lineHeight:1.5}}>
                  Based on {zakatManual?'your input':'portfolio value'} of ₦{fmt(zakatBase)}
                </p>
              </div>
            </Panel>

            {/* Market News */}
            <Panel>
              <PanelHeader icon={Globe} title="Market News"/>
              <div style={{display:'flex',flexDirection:'column',gap:'12px',maxHeight:'300px',overflowY:'auto',paddingRight:'3px'}}>
                {news.length > 0 ? news.map((item, i) => (
                  <div key={item.id || i} style={{display:'flex',flexDirection:'column',gap:'4px',paddingBottom:'12px',borderBottom:i<news.length-1?'1px solid var(--border)':'none'}}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'0.85rem',color:'var(--text-dark)',fontWeight:700,textDecoration:'none',lineHeight:1.4}} onMouseEnter={e=>e.target.style.color='var(--primary)'} onMouseLeave={e=>e.target.style.color='var(--text-dark)'}>
                      {item.title}
                    </a>
                    <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center'}}>
                      <span style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>{item.published_human}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',textAlign:'center',padding:'20px 0'}}>No news available at the moment.</div>
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
                    <Tooltip contentStyle={{borderRadius:'9px',border:'1px solid var(--border)',fontSize:'0.76rem',fontWeight:600}}/>
                    <Bar dataKey="halal"    name="Halal"     fill="var(--halal)"     radius={[4,4,0,0]}/>
                    <Bar dataKey="nonhalal" name="Non-Halal" fill="var(--non-halal)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:'flex',gap:'14px',marginTop:'9px'}}>
                {[['var(--halal)','Halal'],['var(--non-halal)','Non-Halal']].map(([color,label])=>(
                  <div key={label} style={{display:'flex',alignItems:'center',gap:'5px'}}>
                    <div style={{width:'7px',height:'7px',borderRadius:'2px',background:color}}/>
                    <span style={{fontSize:'0.7rem',fontWeight:600,color:'var(--text-muted)'}}>{label}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Alerts */}
            <Panel>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <h2 style={{fontSize:'1.05rem',fontWeight:800,color:'var(--text-dark)',display:'flex',alignItems:'center',gap:'7px',margin:0}}>
                  <Bell size={16} color="var(--primary)"/> Alerts
                </h2>
                {alerts.length > 0 && <span style={{fontSize:'0.69rem',fontWeight:800,padding:'3px 9px',borderRadius:'20px',background:'var(--non-halal-bg)',color:'var(--non-halal)'}}>{alerts.length} active</span>}
              </div>
              <div style={{display:'flex',flexDirection:'column',maxHeight:'300px',overflowY:'auto',paddingRight:'3px'}}>
                {alerts.length > 0 ? alerts.map((alert,i)=>(
                  <div key={alert.id} style={{display:'flex',gap:'12px',alignItems:'flex-start',padding:'12px 0',borderBottom:i<alerts.length-1?'1px solid var(--border)':'none'}}>
                    <div style={{width:'34px',height:'34px',flexShrink:0,borderRadius:'9px',background:'var(--bg-section)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.95rem',position:'relative'}}>
                      <Bell size={14} color="var(--primary)"/>
                    </div>
                    <div>
                      <div style={{fontSize:'0.84rem',color:'var(--text-dark)',fontWeight:600,lineHeight:1.5}}>
                        {alert.symbol} alert set at ₦{alert.target_price}
                      </div>
                      <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:'3px',fontWeight:500}}>{new Date(alert.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{padding:'20px 0',textAlign:'center',color:'var(--text-muted)',fontSize:'0.81rem'}}>
                    No active price alerts
                  </div>
                )}
              </div>
            </Panel>

            {/* Daily Insight */}
            <div style={{background:'var(--gold-grad)',borderRadius:'20px',padding:'24px',color:'white',position:'relative',overflow:'hidden',boxShadow:'0 8px 32px rgba(201,168,76,0.3)'}}>
              <div style={{position:'absolute',top:'-18px',right:'-18px',width:'100px',height:'100px',borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
              <div style={{position:'absolute',bottom:'-28px',left:'8px',width:'65px',height:'65px',borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}/>
              <h3 style={{fontSize:'0.78rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'1.5px',opacity:0.85,marginBottom:'11px',display:'flex',alignItems:'center',gap:'7px',position:'relative'}}>
                <Sparkles size={14} color="white"/> Daily Insight
              </h3>
              <p style={{fontSize:'0.91rem',lineHeight:1.75,fontWeight:500,color:'rgba(255,255,255,0.93)',position:'relative'}}>
                {INSIGHTS[insightIdx]}
              </p>
              <div style={{display:'flex',gap:'5px',marginTop:'16px',position:'relative'}}>
                {INSIGHTS.map((_,i)=>(
                  <div key={i} onClick={()=>setInsightIdx(i)} style={{width:i===insightIdx?'16px':'5px',height:'5px',borderRadius:'3px',background:i===insightIdx?'white':'rgba(255,255,255,0.4)',cursor:'pointer',transition:'all 0.3s ease'}}/>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
