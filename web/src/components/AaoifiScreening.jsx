import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle,
  HelpCircle, ShieldCheck, ChevronRight, FileText, Download, Droplets,
  Calendar, TrendingUp, Calculator, ExternalLink, Activity,
  Building2, CreditCard, Coins, BarChart3, AlertCircle, X,
  Trash2, Sliders, Brain, Sparkles, Send, Plus, Star,
  BrainCircuit, BarChart2, Newspaper, Clock, RefreshCw,
  ChevronDown, ChevronUp, MessageSquare, DollarSign, Percent,
  Info, TrendingDown, Award, BookOpen, Zap, Bell, Search
} from 'lucide-react';
import { fetchAaoifiScreening, fetchStockDetails, updateAaoifiData, chatAboutStock, fetchNgxStocks } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatAppJustification } from '../utils/screeningFormatter';
import CompanyLogo from './CompanyLogo';

/* ─── Loading steps ─────────────────────────────────────── */
const LOADING_STEPS = [
  'Initializing AAOIFI Screening...','Reading latest financial statements...',
  'Fetching regulatory filings...','Analyzing business activities...',
  'Consulting Irshad Engine...','Calculating AAOIFI financial ratios...',
  'Running compliance engine...','Generating transparent report...',
];

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (val) => {
  if (!val && val !== 0) return '—';
  const n = parseFloat(val); if (isNaN(n)) return '—';
  if (n >= 1e12) return '₦' + (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '₦' + (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '₦' + (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return '₦' + (n/1e3).toFixed(2) + 'K';
  return '₦' + n.toFixed(2);
};
const fmtCount = (val) => {
  if (!val && val !== 0) return '—';
  const n = parseFloat(val); if (isNaN(n)) return '—';
  if (n >= 1e12) return (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(2) + 'K';
  return n.toLocaleString();
};
const fmtRaw = (val) => { const n=parseFloat(val); return isNaN(n)?'—':`₦${n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`; };
const fmtDate  = (d) => {
  if (!d) return null;
  try { if (/^\d{4}$/.test(d)||/^Q\d\s+\d{4}$/i.test(d)) return d; const dt=new Date(d); if(isNaN(dt))return d; return dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); } catch { return d; }
};
const pct = (n) => isNaN(parseFloat(n))?'—':`${parseFloat(n).toFixed(2)}%`;

/* ─── Section wrapper ───────────────────────────────────── */
const Section = ({ children, style }) => (
  <div style={{ background:'var(--bg-section)',borderRadius:18,border:'1px solid var(--border)',overflow:'hidden',marginBottom:16,...style }}>
    {children}
  </div>
);
const SectionHead = ({ icon:Icon, iconColor='#C49852', iconBg='rgba(196,152,82,0.1)', iconBorder='rgba(196,152,82,0.22)', title, subtitle, right, accent }) => (
  <div style={{ padding:'24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',background:'var(--bg-section)',position:'relative',overflow:'hidden' }}>
    {accent&&<div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:accent }}/>}
    <div style={{ display:'flex',alignItems:'center',gap:10,marginTop:accent?4:0 }}>
      <div style={{ width:32,height:32,borderRadius:10,background:iconBg,border:`1px solid ${iconBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <Icon size={15} color={iconColor}/>
      </div>
      <div>
        <div style={{ fontWeight:800,color:'var(--text-dark)',fontSize:'0.9rem',letterSpacing:'-0.2px' }}>{title}</div>
        {subtitle&&<div style={{ fontSize:'0.65rem',color:'var(--text-muted)',fontWeight:600,marginTop:1 }}>{subtitle}</div>}
      </div>
    </div>
    {right&&<div>{right}</div>}
  </div>
);

/* ─── Stage pill ────────────────────────────────────────── */
const StagePill = ({ label }) => (
  <div style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:8,background:'rgba(196,152,82,0.1)',border:'1px solid rgba(196,152,82,0.22)',marginBottom:8 }}>
    <Sparkles size={11} color="#C49852"/>
    <span style={{ fontSize:'0.65rem',fontWeight:800,color:'#C49852',textTransform:'uppercase',letterSpacing:'0.9px' }}>{label}</span>
  </div>
);

/* ─── Status badge ──────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    halal:       { label:'PASS',   icon:<CheckCircle size={12}/>,   color:'var(--halal)',     bg:'var(--halal-bg)',      border:'rgba(16,185,129,0.3)' },
    doubtful:    { label:'REVIEW', icon:<AlertTriangle size={12}/>, color:'#D97706',           bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.3)' },
    'non-halal': { label:'FAIL',   icon:<XCircle size={12}/>,       color:'var(--non-halal)', bg:'var(--non-halal-bg)', border:'rgba(239,68,68,0.3)'  },
  };
  const cfg = map[status] || { label:'—', icon:<HelpCircle size={12}/>, color:'var(--text-muted)', bg:'var(--bg-section)', border:'var(--border)' };
  return (
    <div style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'5px 14px',borderRadius:100,background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color,fontSize:'0.69rem',fontWeight:900,letterSpacing:'0.8px',textTransform:'uppercase',boxShadow:`0 2px 8px ${cfg.border}` }}>
      {cfg.icon} {cfg.label}
    </div>
  );
};

/* ─── Ratio bar ─────────────────────────────────────────── */
const RatioBar = ({ title, subtitle, ratio, threshold, numLabel, numVal, denLabel, denVal, formula, onInspect }) => {
  if (ratio === null || ratio === undefined || isNaN(parseFloat(ratio))) {
    return (
      <div style={{ background:'var(--bg)',borderRadius:14,padding:'15px 20px',marginBottom:10,border:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:16,alignItems:'center' }}>
        <div><div style={{ fontWeight:800,color:'var(--text-dark)',fontSize:'0.88rem',marginBottom:2 }}>{title}</div><div style={{ fontSize:'0.7rem',color:'var(--text-muted)' }}>{subtitle}</div></div>
        <div style={{ height:9,background:'rgba(0,0,0,0.06)',borderRadius:100 }}/>
        <div style={{ textAlign:'right',fontSize:'1.2rem',fontWeight:900,color:'var(--text-muted)' }}>N/A</div>
      </div>
    );
  }
  const rv  = parseFloat(ratio)||0;
  const thr = parseFloat(threshold);
  const ok  = rv <= thr;
  const diff= Math.abs(thr - rv).toFixed(2);
  const col = ok ? 'var(--halal)' : 'var(--non-halal)';
  const grad= ok ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#EF4444,#DC2626)';
  const maxV= Math.max(thr/0.65, rv/0.88, 1);
  const fill= Math.min((rv/maxV)*100, 100);
  const pin = Math.min((thr/maxV)*100, 100);
  const m   = title.match(/^(\d+)\.\s*(.*)/);
  const num = m?m[1]:null; const name=m?m[2]:title;
  const clickable = parseFloat(numVal)!==0;

  return (
    <div onClick={clickable?()=>onInspect({title,ratio:rv,threshold:`≤ ${threshold}%`,formula,numLabel,numVal,denLabel,denVal}):undefined}
      className={clickable?'hover-lift':''} style={{ background:'var(--bg)',borderRadius:14,padding:'16px 20px',marginBottom:12,border:`1px solid ${ok?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'}`,cursor:clickable?'pointer':'default',transition:'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',display:'grid',gridTemplateColumns:'180px 1fr 118px',gap:20,alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
      <div>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
          {num&&<span style={{ width:20,height:20,borderRadius:6,background:ok?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)',color:ok?'var(--halal)':'var(--non-halal)',fontSize:'0.68rem',fontWeight:900,display:'inline-flex',alignItems:'center',justifyContent:'center' }}>{num}</span>}
          <span style={{ fontWeight:800,color:'var(--text-dark)',fontSize:'0.9rem', letterSpacing:'-0.3px' }}>{name}</span>
          {clickable&&<span style={{ fontSize:'0.56rem',padding:'2px 6px',borderRadius:100,background:'var(--bg-section)',color:'var(--text-muted)',fontWeight:800,border:'1px solid var(--border)' }}>↗</span>}
        </div>
        <div style={{ fontSize:'0.7rem',color:'var(--text-muted)',lineHeight:1.4, fontWeight:500 }}>{subtitle}</div>
      </div>
      <div style={{ position:'relative',height:10,background:'rgba(0,0,0,0.06)',borderRadius:100,overflow:'visible' }}>
        <div style={{ position:'absolute',top:0,left:0,height:'100%',width:`${fill}%`,background:grad,borderRadius:100,boxShadow:ok?'0 0 10px rgba(16,185,129,0.3)':'0 0 10px rgba(239,68,68,0.3)',transition:'width 0.9s cubic-bezier(0.4,0,0.2,1)' }}/>
        <div style={{ position:'absolute',top:-5,bottom:-5,left:`${pin}%`,width:3,background:'var(--non-halal)',borderRadius:2,boxShadow:'0 0 6px rgba(239,68,68,0.5)' }}/>
        <div style={{ position:'absolute',top:16,left:`${pin}%`,transform:'translateX(-50%)' }}>
          <span style={{ fontSize:'0.6rem',fontWeight:800,color:'var(--non-halal)',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',padding:'2px 6px',borderRadius:6,whiteSpace:'nowrap' }}>{threshold}% limit</span>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:'1.35rem',fontWeight:900,color:col,letterSpacing:'-0.5px',fontVariantNumeric:'tabular-nums',lineHeight:1.1 }}>{rv.toFixed(2)}%</div>
        <div style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:'0.65rem',fontWeight:800,color:col,marginTop:6,padding:'3px 8px',borderRadius:100,background:ok?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)',border:ok?'1px solid rgba(16,185,129,0.2)':'1px solid rgba(239,68,68,0.2)' }}>
          {ok?'✓':'✕'} {diff}pp {ok?'headroom':'excess'}
        </div>
      </div>
    </div>
  );
};

/* ─── Data chip ─────────────────────────────────────────── */
const DataChip = ({ label, value, color, bg, border }) => (
  <div className="hover-lift" style={{ background:bg||'var(--bg)',borderRadius:14,padding:'16px 20px',border:`1px solid ${border||'var(--border)'}`, transition:'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
    <div style={{ fontSize:'0.65rem',fontWeight:800,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:8 }}>{label}</div>
    <div style={{ fontSize:'1.15rem',fontWeight:900,color:color||'var(--text-dark)',letterSpacing:'-0.3px',fontVariantNumeric:'tabular-nums' }}>{value}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const AaoifiScreening = () => {
  const { symbol } = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const chatEndRef = useRef(null);
  
  const isInlineSearch = location.state?.inlineSearch;
  
  /* ── Search State ── */
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  /* ── Queries ── */
  const { data:res, isLoading:queryLoading, error:queryError, isFetching } = useQuery({
    queryKey:['aaoifi',symbol],
    queryFn: ()=>fetchAaoifiScreening(symbol),
    staleTime:5*60*1000,
    placeholderData: keepPreviousData,
    refetchInterval:(q)=>q.state.data?.status==='processing'?10000:false,
  });
  const { data:stockRes } = useQuery({
    queryKey:['stock',symbol],
    queryFn: ()=>fetchStockDetails(symbol),
    staleTime:5*60*1000,
    enabled: !!symbol,
  });
  const { data: allStocksRes } = useQuery({
    queryKey: ['marketData', 'v2'],
    queryFn: async () => {
      const r = await fetchNgxStocks();
      return Array.isArray(r) ? r : (r?.data || []);
    },
    staleTime: 5 * 60 * 1000,
  });
  const allStocks = Array.isArray(allStocksRes) ? allStocksRes : [];

  /* ── UI state ── */
  const [modalData,       setModalData]       = useState(null);
  const [showOverride,    setShowOverride]     = useState(false);
  const [overrideData,    setOverrideData]     = useState({ total_debt:'',cash:'',interest_income:'',total_assets:'',market_cap:'',total_revenue:'',evidence_links:[''] });
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError,   setOverrideError]   = useState('');
  const [stepIndex,       setStepIndex]       = useState(0);
  const [messages,        setMessages]        = useState(null);
  const [chatInput,       setChatInput]       = useState('');
  const [chatLoading,     setChatLoading]     = useState(false);
  const [showCopilot,     setShowCopilot]     = useState(false); // mobile toggle
  const [purShares,       setPurShares]       = useState('');
  const [purDividend,     setPurDividend]     = useState('');
  const [showNewsAll,     setShowNewsAll]     = useState(false);

  useEffect(()=>{ if(!queryLoading)return; const t=setInterval(()=>setStepIndex(p=>p<LOADING_STEPS.length-1?p+1:p),340); return()=>clearInterval(t); },[queryLoading]);
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  const report  = res?.data;
  const stock   = stockRes?.data;
  const error   = queryError 
    ? (queryError.response?.status === 404 
        ? `Stock ticker "${symbol}" was not found. Please verify the symbol and try again.` 
        : (queryError.response?.data?.message || queryError.message || 'Error')) 
    : null;

  /* Init chat */
  useEffect(()=>{
    if(!report||messages!==null)return;
    setMessages([{ role:'assistant', text:`I'm Irshad AI. Ask me anything about ${report.company_name||symbol} — the verdict rationale, what each ratio means, how purification is calculated, or how it compares to its sector.` }]);
  },[report]);

  const openOverride = () => {
    const fd=report?.financial_data_used||{};
    let ev=report?.evidence_link||[]; if(typeof ev==='string'){try{ev=JSON.parse(ev);}catch{ev=[ev];}} if(!Array.isArray(ev)||!ev.length)ev=[''];
    setOverrideData({ total_debt:fd.total_debt||'',cash:fd.cash_and_equivalents||fd.cash||'',interest_income:fd.interest_income||'',total_assets:fd.total_assets||'',market_cap:fd.market_cap||'',total_revenue:fd.total_revenue||'',evidence_links:ev });
    setShowOverride(true);
  };
  const submitOverride = async (e) => {
    e.preventDefault(); setOverrideLoading(true); setOverrideError('');
    try { await updateAaoifiData(symbol,overrideData); setShowOverride(false); window.location.reload(); }
    catch(err){ setOverrideError(err.response?.data?.message||'Failed'); }
    finally { setOverrideLoading(false); }
  };
  const sendChat = async (q) => {
    const question=(q||chatInput).trim(); if(!question||chatLoading)return;
    setChatInput(''); setMessages(prev=>[...prev,{role:'user',text:question}]); setChatLoading(true);
    try { const r=await chatAboutStock(symbol,question); setMessages(prev=>[...prev,{role:'assistant',text:r.data?.answer||'No answer returned.'}]); }
    catch { setMessages(prev=>[...prev,{role:'assistant',text:'Sorry, I could not process your question. Please try again.'}]); }
    finally { setChatLoading(false); }
  };

  /* ── Loading ── */
  if(queryLoading) return (
    <div style={{ maxWidth:720,margin:'0 auto',padding:'80px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'65vh' }}>
      <div style={{ position:'relative',width:90,height:90,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:32 }}>
        <div style={{ position:'absolute',inset:-12,background:'var(--primary)',opacity:0.06,borderRadius:'50%',animation:'ping 2s cubic-bezier(0,0,0.2,1) infinite' }}/>
        <div style={{ position:'absolute',inset:0,border:'2.5px solid var(--border)',borderRadius:'50%' }}/>
        <div style={{ position:'absolute',inset:0,border:'2.5px solid var(--primary)',borderRadius:'50%',borderTopColor:'transparent',animation:'spin 1.1s cubic-bezier(0.5,0,0.5,1) infinite' }}/>
        <ShieldCheck size={36} color="var(--primary)"/>
      </div>
      <h2 style={{ fontSize:'1.35rem',fontWeight:900,color:'var(--text-dark)',marginBottom:14,letterSpacing:'-0.4px' }}>Institutional AAOIFI Analysis</h2>
      <div style={{ height:30,overflow:'hidden',marginBottom:28 }}>
        <p key={stepIndex} className="animate-fade-in" style={{ color:'var(--text-muted)',fontSize:'0.9rem',fontWeight:500,margin:0 }}>{LOADING_STEPS[stepIndex]}</p>
      </div>
      <div style={{ display:'flex',gap:6 }}>
        {LOADING_STEPS.map((_,i)=>(<div key={i} style={{ width:i===stepIndex?22:7,height:7,borderRadius:100,background:i<=stepIndex?'var(--primary)':'var(--border)',transition:'all 0.3s' }}/>))}
      </div>
    </div>
  );

  /* ── Error ── */
  if(error) return (
    <div style={{ maxWidth:520,margin:'80px auto',padding:48,textAlign:'center',background:'var(--bg-section)',borderRadius:28,border:'1px solid var(--border)' }}>
      <div style={{ width:72,height:72,margin:'0 auto 20px',background:'var(--non-halal-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}><AlertTriangle size={36} color="var(--non-halal)"/></div>
      <h2 style={{ fontSize:'1.4rem',fontWeight:900,marginBottom:10,color:'var(--text-dark)' }}>Screening Error</h2>
      <p style={{ color:'var(--text-muted)',fontSize:'0.88rem',lineHeight:1.6,marginBottom:28 }}>{error}</p>
      <Link to="/portfolio#market" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 22px',background:'var(--bg)',color:'var(--text-dark)',fontWeight:700,textDecoration:'none',borderRadius:100,border:'1px solid var(--border)' }}><ArrowLeft size={16}/> Back to Screener</Link>
    </div>
  );

  if(!report) return null;

  /* ── Derived ── */
  const finalStatus    = report.final_status||'doubtful';
  const isNonHalal     = finalStatus==='non-halal';
  const businessFailed = report.business_status==='fail';
  const fd             = report.financial_data_used||{};
  const totalAssets    = parseFloat(fd.total_assets)||0;
  const marketCap      = parseFloat(report.market_cap||fd.market_cap)||0;
  const totalDebt      = parseFloat(fd.total_debt)||0;
  const cashAndSec     = (parseFloat(fd.cash)||0)+(parseFloat(fd.interest_bearing_securities)||0);
  const totalRevenue   = parseFloat(fd.total_revenue)||0;
  const interestIncome = parseFloat(fd.interest_income)||0;
  const debtRatio      = marketCap>0?(totalDebt/marketCap)*100:null;
  const cashRatio      = marketCap>0?(cashAndSec/marketCap)*100:null;
  const hasPurification= finalStatus==='halal'&&!!report.stage1?.purification_required;
  const purPct         = (parseFloat(report.stage1?.haram_revenue_percent)||0).toFixed(2);
  const stage1Status   = report.stage1?.status||(businessFailed?'non-halal':'halal');
  const showFinancials = (finalStatus==='halal'||report.business_status==='pass')&&(debtRatio!==null||report.impermissible_income_ratio!=null||cashRatio!==null);
  const latestPrice    = parseFloat(stock?.latest_price||report.latest_price)||0;
  const priceChangePct = parseFloat(stock?.price_change_pct)||0;
  const newsItems      = Array.isArray(stock?.news) ? stock.news : [];

  let cleanStatusReason = formatAppJustification(report.status_reason,isNonHalal);
  if(isNonHalal&&!businessFailed){ const ind=(report.industry||'its sector').toLowerCase(); cleanStatusReason=`Although the company passes the Shariah business activity screening because its core operations in ${ind} are permissible, it fails the required quantitative financial benchmarks.`; }
  const cleanStage1Reason = formatAppJustification(report.stage1?.reason||report.business_reasoning,isNonHalal);

  const SC = {
    halal:       { color:'var(--halal)',     icon:hasPurification?Droplets:CheckCircle, bg:'linear-gradient(135deg,rgba(16,185,129,0.09),rgba(16,185,129,0.03))',  border:'rgba(16,185,129,0.28)',  label:'HALAL',     tag:'Shariah Compliant'    },
    'non-halal': { color:'var(--non-halal)', icon:XCircle,                              bg:'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.03))',    border:'rgba(239,68,68,0.28)',   label:'NON-HALAL', tag:'Shariah Non-Compliant'  },
    doubtful:    { color:'#D97706',          icon:AlertTriangle,                        bg:'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03))',   border:'rgba(245,158,11,0.28)', label:'DOUBTFUL',  tag:'Requires Further Review'  },
  };
  const sc=SC[finalStatus]||SC.doubtful; const StatusIcon=sc.icon;

  /* Purification calculator */
  const purCalcResult = (() => {
    const divPerShare = parseFloat(purDividend)||0;
    const shares      = parseFloat(purShares)||0;
    const pp          = parseFloat(purPct)/100;
    if(!divPerShare||!shares||!pp) return null;
    const totalDiv  = divPerShare * shares;
    const purAmount = totalDiv * pp;
    return { totalDiv, purAmount, purPct };
  })();

  const suggestedQuestions = [
    `Why is ${symbol} classified as ${finalStatus}?`,
    `What pushed the debt ratio for ${symbol}?`,
    `How do I calculate purification for ${symbol}?`,
    `What are the key Shariah risks for ${symbol}?`,
  ];


  /* ╔═══════════════════════════════════════════════════════╗
     ║                      RENDER                          ║
     ╚═══════════════════════════════════════════════════════╝ */
  return (
    <div style={{ width:'100%',padding:'20px 20px 80px',display:'flex',gap:22,alignItems:'flex-start' }}>

      {/* ═══════════ LEFT MAIN CONTENT ═══════════ */}
      <div style={{ flex:1,minWidth:0 }}>

        {/* ── Top action bar ── */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' }}>
          <Link to="/portfolio#market" className="hover-lift" style={{ display:'flex',alignItems:'center',justifyContent:'center',width:36,height:36,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'50%',color:'var(--text-dark)',textDecoration:'none',transition:'all 0.2s',boxShadow:'var(--shadow-sm)' }}>
            <ArrowLeft size={18}/>
          </Link>
          <div style={{ display:'flex',gap:10 }}>
            {isSearchOpen ? (
              <div style={{ position:'relative' }}>
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if(searchQuery.trim()) { 
                      navigate(`/market/${searchQuery.trim().toUpperCase()}/aaoifi`, { state: { inlineSearch: true } }); 
                      setIsSearchOpen(false); 
                      setSearchQuery('');
                    } 
                  }}
                  style={{ display:'flex',alignItems:'center',background:'var(--bg)',border:'1px solid var(--primary)',borderRadius:12,padding:'4px 12px',boxShadow:'0 0 0 3px rgba(91,41,113,0.1)', transition:'all 0.2s' }}
                >
                  <Search size={15} color="var(--primary)"/>
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Search stock..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border:'none',background:'transparent',outline:'none',padding:'4px 8px',fontSize:'0.8rem',width:'160px',color:'var(--text-dark)' }}
                  />
                  <X size={15} color="var(--text-muted)" style={{ cursor:'pointer' }} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}/>
                </form>
                
                {searchQuery.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', right:0, marginTop:8, width:260, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'var(--shadow-md)', zIndex:100, overflow:'hidden' }}>
                    {allStocks.filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(s => (
                      <div 
                        key={s.symbol}
                        onClick={() => {
                          navigate(`/market/${s.symbol}/aaoifi`, { state: { inlineSearch: true } }); 
                          setIsSearchOpen(false); 
                          setSearchQuery('');
                        }}
                        style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column' }}
                        className="hover-bg"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-section)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg)'}
                      >
                        <span style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--primary)' }}>{s.symbol}</span>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{s.name}</span>
                      </div>
                    ))}
                    {allStocks.filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div style={{ padding:'12px', textAlign:'center', color:'var(--text-muted)', fontSize:'0.8rem' }}>No matches found</div>
                    )}
                  </div>
                )}
              </div>
            ) : (isFetching && isInlineSearch) ? (
              <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 16px',background:'var(--bg)',border:'1px solid var(--primary)',borderRadius:12,fontWeight:700,color:'var(--primary)',fontSize:'0.8rem',boxShadow:'0 0 0 3px rgba(91,41,113,0.1)' }}>
                <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid var(--primary)', borderTopColor:'transparent', animation:'spin 1s linear infinite' }}/>
                Screening {symbol}...
              </div>
            ) : (
              <button className="hover-lift" onClick={() => setIsSearchOpen(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:12,cursor:'pointer',fontWeight:700,color:'var(--text-dark)',fontSize:'0.8rem',boxShadow:'var(--shadow-sm)' }}>
                <Search size={15}/> Screener
              </button>
            )}
            <button className="hover-lift" onClick={()=>{ alert("Alert preferences opened"); }} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:12,cursor:'pointer',fontWeight:700,color:'var(--text-dark)',fontSize:'0.8rem',boxShadow:'var(--shadow-sm)' }}>
              <Bell size={15}/> Set Alert
            </button>
            {user?.role==='admin'&&(<button className="hover-lift" onClick={openOverride} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--primary)',border:'none',borderRadius:12,cursor:'pointer',fontWeight:800,color:'#fff',fontSize:'0.8rem',transition:'all 0.25s',boxShadow:'0 4px 12px rgba(91,41,113,0.3)' }}>
              <ShieldCheck size={15}/> Edit Data
            </button>)}
            <button className="hover-lift" onClick={()=>window.print()} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:12,cursor:'pointer',fontWeight:700,color:'var(--text-dark)',fontSize:'0.8rem',boxShadow:'var(--shadow-sm)' }}>
              <Download size={15}/> Export
            </button>
          </div>
        </div>

        {/* ── Company header ── */}
        <div style={{ background:'linear-gradient(145deg, var(--bg) 0%, rgba(91,41,113,0.04) 100%)',border:'1px solid rgba(91,41,113,0.1)',borderRadius:16,padding:'16px 20px',marginBottom:20,boxShadow:'0 4px 16px rgba(91,41,113,0.04), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap' }}>
            <div style={{ display:'flex',alignItems:'center',gap:14 }}>
              <div style={{ position:'relative', padding: '2px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <CompanyLogo symbol={symbol} logoUrl={stock?.logo_url} size={42} radius={10}/>
                <div style={{ position:'absolute',bottom:-2,right:-2,width:14,height:14,borderRadius:'50%',background:finalStatus==='halal'?'var(--halal)':finalStatus==='non-halal'?'var(--non-halal)':'#D97706',border:'2px solid #fff',boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}/>
              </div>
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                  <h1 style={{ margin:0,fontSize:'1.15rem',fontWeight:900,color:'var(--text-dark)',letterSpacing:'-0.3px' }}>{report.company_name||symbol}</h1>
                </div>
                {(stock?.sector || report.sector) && (
                  <p style={{ margin:'2px 0 0',fontSize:'0.65rem',color:'var(--text-muted)',fontWeight:600 }}>
                    {stock?.sector || report.sector} 
                    {stock?.industry && <span style={{ opacity: 0.4, margin: '0 6px' }}>•</span>}
                    {stock?.industry}
                  </p>
                )}
              </div>
            </div>
            
            {/* Embedded Stats Container */}
            <div style={{ display:'flex',gap:20,flexWrap:'wrap',alignItems:'center', background:'rgba(255,255,255,0.6)', padding:'10px 16px', borderRadius:12, border:'1px solid rgba(91,41,113,0.06)', backdropFilter:'blur(10px)', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
              {latestPrice>0&&(<div style={{ textAlign:'left', paddingRight:20, borderRight:'1px solid rgba(91,41,113,0.08)' }}>
                <div style={{ fontSize:'0.6rem',fontWeight:800,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4 }}>Last Price</div>
                <div style={{ fontSize:'1.25rem',fontWeight:900,color:'var(--text-dark)',letterSpacing:'-0.5px',fontVariantNumeric:'tabular-nums',lineHeight:1 }}>
                  ₦{latestPrice.toLocaleString('en-US', {maximumFractionDigits: 2})}
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:4,marginTop:6 }}>
                  <span style={{ fontSize:'0.7rem',fontWeight:800,color: priceChangePct >= 0 ? 'var(--halal)' : 'var(--non-halal)' }}>
                    {priceChangePct >= 0 ? '▲' : '▼'} {Math.abs(priceChangePct).toFixed(2)}%
                  </span>
                  <span style={{ fontSize:'0.65rem',fontWeight:600,color:'var(--text-muted)' }}>today</span>
                </div>
              </div>)}
              {marketCap>0&&(<div style={{ textAlign:'left', paddingRight:report.sector?20:0, borderRight:report.sector?'1px solid rgba(91,41,113,0.08)':'none' }}>
                <div style={{ fontSize:'0.6rem',fontWeight:800,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4 }}>Market Cap</div>
                <div style={{ fontSize:'1rem',fontWeight:900,color:'var(--text-dark)',letterSpacing:'-0.3px',fontVariantNumeric:'tabular-nums' }}>{fmt(marketCap)}</div>
              </div>)}
              {report.sector&&(<div style={{ textAlign:'left' }}>
                <div style={{ fontSize:'0.6rem',fontWeight:800,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4 }}>Sector</div>
                <div style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 8px',borderRadius:100,background:'var(--bg)',border:'1px solid rgba(91,41,113,0.1)',fontSize:'0.7rem',fontWeight:800,color:'var(--primary)' }}>{report.sector}</div>
              </div>)}
            </div>
          </div>
        </div>

        {/* ══ VERDICT CARD ══ */}
        <div className="hover-lift" style={{ borderRadius:24,background:`linear-gradient(135deg, ${sc.color}35 0%, ${sc.color}15 100%)`,border:`1px solid ${sc.color}`,marginBottom:24,position:'relative',overflow:'hidden', boxShadow:`0 16px 40px -10px ${sc.color}25, 0 8px 24px -5px ${sc.color}15, inset 0 2px 4px rgba(255,255,255,1)` }}>
          
          <div style={{ position:'absolute', inset: 0, backgroundImage: `radial-gradient(${sc.color}15 1px, transparent 1px)`, backgroundSize: '24px 24px', opacity: 0.6, pointerEvents: 'none' }} />
          
          <div style={{ position:'absolute', left:'10%', top:'-30%', width:'300px', height:'300px', background: `radial-gradient(circle, ${sc.color}15 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents:'none' }} />

          <div style={{ position:'absolute', right:'-5%', top:'-30%', opacity:0.03, transform:'rotate(-10deg) scale(1.1)', pointerEvents:'none', mixBlendMode:'multiply' }}>
            <StatusIcon size={280} color={sc.color} />
          </div>

          <div style={{ display:'flex',gap:0,flexWrap:'wrap', position:'relative', zIndex:1 }}>
            <div style={{ flex:'1 1 280px',padding:'24px 32px',borderRight:`1px solid ${sc.color}15`,display:'flex',flexDirection:'column',justifyContent:'center',gap:12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize:'0.7rem',fontWeight:900,textTransform:'uppercase',letterSpacing:'2px',color:sc.color, background: `linear-gradient(90deg, ${sc.color}15 0%, ${sc.color}05 100%)`, padding: '6px 12px', borderRadius: 100, width: 'fit-content', border: `1px solid ${sc.color}20` }}>
                <Activity size={12} strokeWidth={2.5}/> AAOIFI Compliance Verdict
              </div>
              
              <div style={{ display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap',marginTop:4 }}>
                <div style={{ marginTop:4, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', borderRadius: 16, padding: 10, boxShadow: `0 8px 24px ${sc.color}30, inset 0 2px 0 #fff`, border: `1px solid ${sc.color}20` }}>
                  <StatusIcon size={38} color={sc.color} strokeWidth={2.5}/>
                </div>
                <div>
                  <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                    <h2 style={{ fontFamily:'"Georgia", "Times New Roman", serif',fontSize:'clamp(2rem,4vw,2.8rem)',fontWeight:900,color:sc.color,margin:0,letterSpacing:'-1px',lineHeight:1, textShadow: `0 4px 16px ${sc.color}30` }}>{sc.label}</h2>
                    {hasPurification&&(<span style={{ fontSize:'0.75rem',fontWeight:900,color:'#D97706',display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',border:'1px solid rgba(245,158,11,0.3)',padding:'6px 14px',borderRadius:100, boxShadow: '0 4px 16px rgba(245,158,11,0.2)' }}><Droplets size={14} color="#D97706" fill="rgba(245,158,11,0.2)"/> With Purification ({purPct}%)</span>)}
                  </div>
                  <div style={{ fontSize:'0.9rem',fontWeight:800,color:'var(--text-dark)',marginTop:8, opacity:0.8, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color={sc.color} /> {sc.tag}
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.85)', borderRadius: 16, border: '1px solid #fff', marginTop: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.04), inset 0 2px 4px rgba(255,255,255,1)', backdropFilter: 'blur(20px)' }}>
                <p style={{ color:'var(--text-dark)',fontSize:'0.9rem',lineHeight:1.6,margin:0, fontWeight:600 }}>{cleanStatusReason||'Screened in accordance with AAOIFI Shariah Standard No. 21.'}</p>
              </div>
              
              {(report.reporting_period||report.reporting_year)&&(<div style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'6px 16px',background:'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',borderRadius:100,fontSize:'0.7rem',color:'var(--text-muted)',fontWeight:800,border:`1px solid ${sc.color}20`,width:'fit-content',marginTop:4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}><Calendar size={12} color={sc.color}/> {report.reporting_period} {report.reporting_year?`(${report.reporting_year})`:''}</div>)}
            </div>
            
            {hasPurification&&(<div style={{ flex:'0 0 280px',padding:'24px 32px',display:'flex',flexDirection:'column',justifyContent:'center',gap:16,background:'linear-gradient(135deg, rgba(245,158,11,0.02) 0%, rgba(245,158,11,0.08) 100%)' }}>
              <div>
                <div style={{ fontSize:'0.7rem',fontWeight:900,textTransform:'uppercase',letterSpacing:'1.5px',color:'#D97706',marginBottom:8, display:'flex', alignItems:'center', gap: 6 }}><Droplets size={14} strokeWidth={2.5}/> Purification Needed</div>
                <div style={{ fontSize:'1rem',color:'var(--text-dark)',fontWeight:800,lineHeight:1.4 }}>Donate <strong style={{ color:'#D97706', fontSize:'1.3rem', padding: '0 2px' }}>{purPct}%</strong> of dividend income to charity</div>
              </div>
              <Link to="/portfolio" className="hover-lift" style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,padding:'12px 20px',borderRadius:16,background:'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)',border:'1px solid rgba(245,158,11,0.3)',color:'#D97706',fontSize:'0.85rem',fontWeight:900,textDecoration:'none',marginTop:8, transition:'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 8px 24px rgba(245,158,11,0.15), inset 0 2px 4px #fff' }}>Purify in Portfolio <ChevronRight size={16}/></Link>
            </div>)}
            
            {isNonHalal&&(<div style={{ flex:'0 0 280px',padding:'24px 32px',display:'flex',flexDirection:'column',justifyContent:'center',gap:16,background:'linear-gradient(135deg, rgba(239,68,68,0.02) 0%, rgba(239,68,68,0.08) 100%)' }}>
              <div style={{ fontSize:'0.7rem',fontWeight:900,textTransform:'uppercase',letterSpacing:'1.5px',color:'var(--non-halal)', display:'flex', alignItems:'center', gap:6 }}><AlertTriangle size={14} strokeWidth={2.5}/> Screening Result</div>
              <div style={{ display:'flex',alignItems:'center',gap:14, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)', padding: '16px', borderRadius: 16, boxShadow: '0 8px 24px rgba(239,68,68,0.15), inset 0 2px 4px #fff', border: '1px solid rgba(239,68,68,0.2)' }}>
                <XCircle size={36} color="var(--non-halal)" strokeWidth={2.5}/>
                <div><div style={{ fontSize:'1.1rem',fontWeight:900,color:'var(--non-halal)' }}>EXCLUDED</div><div style={{ fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:700 }}>Not suitable for investment</div></div>
              </div>
            </div>)}
          </div>
        </div>


        {/* ══ STAGE 1: BUSINESS ACTIVITY ══ */}
        <Section>
          <SectionHead icon={Building2} title="Business Activity Screening" subtitle="Stage 1 · Qualitative analysis of core revenue streams"
            iconColor="var(--primary)" iconBg="rgba(6,78,59,0.08)" iconBorder="rgba(6,78,59,0.18)"
            accent={stage1Status==='halal'?'linear-gradient(90deg,#10B981,rgba(16,185,129,0.1),transparent)':stage1Status==='doubtful'?'linear-gradient(90deg,#D97706,rgba(245,158,11,0.1),transparent)':'linear-gradient(90deg,#EF4444,rgba(239,68,68,0.1),transparent)'}
            right={<div style={{ display:'flex',alignItems:'center',gap:10 }}>
              {(report.reporting_period||report.reporting_year)&&<div style={{ fontSize:'0.67rem',color:'var(--text-muted)',fontWeight:600,display:'flex',alignItems:'center',gap:4 }}><Calendar size={10}/> {report.reporting_period||''} {report.reporting_year?`(${report.reporting_year})`:''}</div>}
              <StatusBadge status={stage1Status}/>
            </div>}/>
          <div style={{ padding:'24px' }}>

            {stage1Status==='non-halal' && report.stage1?.haram_revenue_percent > 0.05 && (<div style={{ background:'rgba(239,68,68,0.04)',padding:'14px 18px',borderRadius:12,border:'1px solid rgba(239,68,68,0.18)',borderLeft:'3px solid #EF4444',display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',marginBottom:14 }}>
              <div style={{ flex:'1 1 220px' }}><div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:4 }}><AlertTriangle size={14} color="#EF4444"/><span style={{ fontWeight:800,color:'#EF4444',fontSize:'0.84rem' }}>Prohibited Activities Detected</span></div>
              <p style={{ margin:0,color:'var(--text-muted)',fontSize:'0.79rem',lineHeight:1.6 }}>Non-compliant revenue (<strong style={{ color:'#EF4444' }}>{pct(report.stage1?.haram_revenue_percent)}</strong>) exceeds the 5% AAOIFI tolerance.</p></div>
              <div style={{ background:'var(--bg)',borderRadius:10,padding:'8px 16px',border:'1px solid rgba(239,68,68,0.18)',textAlign:'center' }}>
                <div style={{ fontSize:'0.57rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:1 }}>Impure Ratio</div>
                <div style={{ fontSize:'1.2rem',fontWeight:900,color:'#EF4444' }}>{pct(report.stage1?.haram_revenue_percent)}</div>
              </div>
            </div>)}
            <div style={{ display:'flex',alignItems:'center',gap:6,fontWeight:800,color:'var(--text-dark)',fontSize:'0.82rem',marginBottom:10 }}><Brain size={14} color="var(--primary)"/> Screening Reasoning</div>
            <div className="ai-markdown" style={{ fontSize:'0.86rem',lineHeight:1.78,color:'var(--text-dark)',padding:'18px 24px',background:'var(--bg)',borderRadius:16,border:'1px solid var(--border)',borderLeft:'4px solid var(--primary)',boxShadow:'var(--shadow-sm)' }}>
              {cleanStage1Reason||'No reasoning provided.'}
            </div>
          </div>
        </Section>

        {/* ══ STAGE 2: FINANCIAL RATIOS ══ */}
        {showFinancials&&(<Section>
          <SectionHead icon={BarChart3} title="Quantitative Financial Ratios" subtitle="Stage 2 · The three AAOIFI financial screening thresholds"
            iconColor="#7C3AED" iconBg="rgba(139,92,246,0.08)" iconBorder="rgba(139,92,246,0.18)"
            accent="linear-gradient(90deg,#7C3AED,rgba(139,92,246,0.1),transparent)"
            right={<div style={{ display:'flex',alignItems:'center',gap:6,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:9,padding:'5px 10px' }}>
              <Sliders size={11} color="var(--primary)"/>
              <span style={{ color:'var(--text-muted)',fontSize:'0.7rem',fontWeight:700 }}>Denominator: Market Cap</span>
            </div>}/>
          <div style={{ padding:'24px' }}>
            <div style={{ marginBottom:28 }}>
              <RatioBar title="1. Debt ratio"     subtitle="Total Debt / Market Cap × 100"               ratio={debtRatio}                        threshold={30} numLabel="Total Debt"        numVal={totalDebt}    denLabel="Market Cap"    denVal={marketCap}     formula="Total Debt / Market Cap × 100"          onInspect={setModalData}/>
              {symbol !== 'JAIZBANK' && (
                <RatioBar title="2. Cash ratio"     subtitle="(Cash + Securities) / Market Cap × 100"      ratio={cashRatio}                        threshold={30} numLabel="Cash & Securities" numVal={cashAndSec}   denLabel="Market Cap"    denVal={marketCap}     formula="(Cash + Sec.) / Market Cap × 100"       onInspect={setModalData}/>
              )}
              <RatioBar title={symbol === 'JAIZBANK' ? '2. Impure revenue' : '3. Impure revenue'} subtitle="Impure Income / Total Revenue × 100"         ratio={report.impermissible_income_ratio} threshold={5}  numLabel="Impure Income"    numVal={interestIncome} denLabel="Total Revenue" denVal={totalRevenue}  formula="Impure Income / Total Revenue × 100"    onInspect={setModalData}/>
            </div>
            <div style={{ padding:'16px 20px',background:'var(--primary-50)',border:'1px dashed var(--primary-100)',borderRadius:16,display:'flex',alignItems:'flex-start',gap:12, boxShadow:'var(--shadow-sm)' }}>
              <Info size={16} color="var(--primary)" style={{ flexShrink:0,marginTop:2 }}/>
              <div style={{ fontSize:'0.8rem',color:'var(--text-muted)',lineHeight:1.5, fontWeight:500 }}><strong style={{ color:'var(--text-dark)', fontWeight:800 }}>AAOIFI strict thresholds apply:</strong> Even at 30.01% the debt ratio fails. Click any bar to see the full calculation breakdown.</div>
            </div>
          </div>
        </Section>)}



        {/* ══ NEWS & DISCLOSURES ══ */}
        {newsItems.length>0&&(<Section>
          <SectionHead icon={Newspaper} title="News & Disclosures" subtitle="Sources reviewed during the AAOIFI screening process"
            iconColor="#2563EB" iconBg="rgba(37,99,235,0.08)" iconBorder="rgba(37,99,235,0.18)"
            accent="linear-gradient(90deg,#2563EB,rgba(37,99,235,0.1),transparent)"
            right={newsItems.length>3&&(<button onClick={()=>setShowNewsAll(p=>!p)} style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 10px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:100,cursor:'pointer',fontSize:'0.69rem',fontWeight:700,color:'var(--text-muted)' }}>
              {showNewsAll?<ChevronUp size={12}/>:<ChevronDown size={12}/>} {showNewsAll?'Show less':`+${newsItems.length-3} more`}
            </button>)}/>
          <div style={{ padding:'24px',display:'flex',flexDirection:'column',gap:10 }}>
            {(showNewsAll?newsItems:newsItems.slice(0,3)).map((item,i)=>{
              const url   = item.url||item.link||item;
              const title = item.title||item.name||(typeof item==='string'?item:'Source '+(i+1));
              const desc  = item.description||item.summary||item.snippet||item.excerpt||null;
              const date  = item.date||item.published_at||item.publishedAt||null;
              return (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover-lift"
                  style={{ display:'flex',alignItems:'flex-start',gap:16,padding:'18px 20px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:16,textDecoration:'none',transition:'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ width:42,height:42,borderRadius:12,background:'rgba(37,99,235,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#2563EB' }}><Newspaper size={18} strokeWidth={2}/></div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:800,color:'var(--text-dark)',fontSize:'0.9rem',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-0.3px' }}>{title}</div>
                    {desc&&<div style={{ fontSize:'0.75rem',color:'var(--text-muted)',lineHeight:1.4,fontWeight:500,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{desc}</div>}
                    {date&&<div style={{ fontSize:'0.65rem',color:'var(--text-muted)',marginTop:6,display:'flex',alignItems:'center',gap:4,fontWeight:700 }}><Clock size={11}/>{fmtDate(date)}</div>}
                  </div>
                  <ExternalLink size={14} color="var(--text-muted)" style={{ flexShrink:0,marginTop:2 }}/>
                </a>
              );
            })}
          </div>
        </Section>)}





      </div> {/* end left column */}

      {/* ═══════════ RIGHT: METRICS & AI COPILOT ═══════════ */}
      <div style={{ width:308,flexShrink:0,position:'sticky',top:20,marginTop:52,maxHeight:'calc(100vh - 40px)',display:'flex',flexDirection:'column',gap:16 }}>
        
        {/* PRICE DATA WIDGET */}
        <div style={{ borderRadius:24,border:'1px solid rgba(91,41,113,0.08)',background:'var(--bg)',padding:'28px 32px',boxShadow:'0 12px 40px rgba(91,41,113,0.04)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:28 }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'14px', background:'var(--primary-50)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)', boxShadow:'0 4px 12px rgba(91,41,113,0.1)' }}>
              <BarChart2 size={20} strokeWidth={2.5} />
            </div>
            <div style={{ fontSize:'0.9rem',fontWeight:900,letterSpacing:'1px',color:'var(--text-dark)' }}>PRICE DATA</div>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
            {[
              { label: 'Open', value: stock?.open_price ? fmtRaw(stock.open_price) : '—' },
              { label: 'Previous Close', value: stock?.previous_close ? fmtRaw(stock.previous_close) : '—' },
              { label: 'Day High', value: stock?.day_high ? fmtRaw(stock.day_high) : '—' },
              { label: 'Day Low', value: stock?.day_low ? fmtRaw(stock.day_low) : '—' },
              { label: '52W High', value: stock?.fifty_two_week_high ? fmtRaw(stock.fifty_two_week_high) : '—' },
              { label: '52W Low', value: stock?.fifty_two_week_low ? fmtRaw(stock.fifty_two_week_low) : '—', noBorder: true }
            ].map((item, idx) => (
              <div key={idx} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:item.noBorder?'none':'1px solid rgba(91,41,113,0.06)',paddingBottom:item.noBorder?0:14 }}>
                <span style={{ fontSize:'0.85rem',color:'var(--text-muted)', fontWeight:600 }}>{item.label}</span>
                <span style={{ fontSize:'0.95rem',fontWeight:800,color:'var(--text-dark)',letterSpacing:'-0.3px',fontVariantNumeric:'tabular-nums' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MARKET DATA WIDGET */}
        <div style={{ borderRadius:24,border:'1px solid rgba(91,41,113,0.08)',background:'var(--bg)',padding:'28px 32px',boxShadow:'0 12px 40px rgba(91,41,113,0.04)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:28 }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'14px', background:'var(--primary-50)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)', boxShadow:'0 4px 12px rgba(91,41,113,0.1)' }}>
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div style={{ fontSize:'0.9rem',fontWeight:900,letterSpacing:'1px',color:'var(--text-dark)' }}>MARKET DATA</div>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
            {[
              { label: 'Market Cap', value: stock?.market_cap ? fmt(stock.market_cap) : '—' },
              { label: 'Shares Out.', value: stock?.shares_outstanding ? fmtCount(stock.shares_outstanding) : '—' },
              { label: 'Volume Today', value: stock?.volume ? fmtCount(stock.volume) : '—' },
              { label: 'P/E Ratio', value: stock?.pe_ratio ? stock.pe_ratio : '—' },
              { label: 'EPS', value: stock?.eps ? stock.eps : '—' },
              { label: 'Last Div.', sub: stock?.last_paid_dividend?.pay_date && new Date(stock.last_paid_dividend.pay_date).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}), value: stock?.last_paid_dividend ? `₦${Number(stock.last_paid_dividend.amount).toFixed(2)}` : '—' },
              { label: 'Next Div.', sub: stock?.upcoming_dividend?.pay_date && new Date(stock.upcoming_dividend.pay_date).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}), value: stock?.upcoming_dividend ? `₦${Number(stock.upcoming_dividend.amount).toFixed(2)}` : '—' },
              { label: 'Div. Yield', value: stock?.div_yield ? `${stock.div_yield}%` : '—', noBorder: true }
            ].map((item, idx) => (
              <div key={idx} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:item.noBorder?'none':'1px solid rgba(91,41,113,0.06)',paddingBottom:item.noBorder?0:14 }}>
                <div>
                  <div style={{ fontSize:'0.85rem',color:'var(--text-muted)', fontWeight:600 }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize:'0.65rem',color:'var(--primary)',marginTop:4, fontWeight:700 }}>{item.sub}</div>}
                </div>
                <span style={{ fontSize:'0.95rem',fontWeight:800,color:'var(--text-dark)',letterSpacing:'-0.3px',fontVariantNumeric:'tabular-nums' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        </div>


      {/* ══ CALCULATION MODAL ══ */}
      {modalData&&createPortal(
        <div style={{ position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.6)',backdropFilter:'blur(14px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100000,padding:24 }} onClick={()=>setModalData(null)}>
          <div className="animate-fade-in" style={{ background:'var(--bg)',borderRadius:22,width:'100%',maxWidth:460,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,0.25),0 0 0 1px var(--border)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:'18px 22px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg-section)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:'rgba(196,152,82,0.12)',border:'1px solid rgba(196,152,82,0.25)',display:'flex',alignItems:'center',justifyContent:'center' }}><Calculator size={16} color="#C49852"/></div>
                <div><h3 style={{ margin:0,fontSize:'0.96rem',fontWeight:800,color:'var(--text-dark)' }}>Calculation Breakdown</h3><p style={{ margin:0,fontSize:'0.64rem',color:'var(--text-muted)',fontWeight:600 }}>AAOIFI Shariah Standard No. 21</p></div>
              </div>
              <button onClick={()=>setModalData(null)} style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-muted)' }}><X size={16}/></button>
            </div>
            <div style={{ padding:'22px 26px' }}>
              <div style={{ textAlign:'center',marginBottom:18 }}>
                <div style={{ fontWeight:800,fontSize:'1.05rem',color:'var(--text-dark)',letterSpacing:'-0.3px',marginBottom:5 }}>{modalData.title}</div>
                <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 12px',background:'rgba(196,152,82,0.08)',border:'1px solid rgba(196,152,82,0.22)',borderRadius:100,color:'#C49852',fontSize:'0.69rem',fontWeight:700 }}>Max Limit: <strong>{modalData.threshold}</strong></span>
              </div>
              <div style={{ background:'var(--bg-section)',borderRadius:16,padding:'16px 20px',border:'1px solid var(--border)',marginBottom:16 }}>
                <div style={{ fontSize:'0.59rem',color:'var(--text-muted)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.7px',marginBottom:12,textAlign:'center' }}>Mathematical Formulation</div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:14,flexWrap:'wrap' }}>
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',minWidth:140 }}>
                    <div style={{ textAlign:'center',paddingBottom:5 }}><div style={{ fontSize:'0.63rem',color:'var(--text-muted)',fontWeight:600 }}>{modalData.numLabel}</div><div style={{ fontSize:'0.9rem',fontWeight:800,color:'var(--text-dark)',fontVariantNumeric:'tabular-nums' }}>₦{(parseFloat(modalData.numVal)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
                    <div style={{ width:'100%',height:2,background:'var(--border)',borderRadius:1 }}/>
                    <div style={{ textAlign:'center',paddingTop:5 }}><div style={{ fontSize:'0.63rem',color:'var(--text-muted)',fontWeight:600 }}>{modalData.denLabel}</div><div style={{ fontSize:'0.9rem',fontWeight:800,color:'var(--text-dark)',fontVariantNumeric:'tabular-nums' }}>₦{(parseFloat(modalData.denVal)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
                  </div>
                  <div style={{ fontSize:'0.95rem',fontWeight:800,color:'var(--text-muted)' }}>× 100 =</div>
                  <div style={{ fontSize:'1.5rem',fontWeight:900,color:modalData.ratio<=parseFloat(modalData.threshold)?'var(--halal)':'var(--non-halal)',fontVariantNumeric:'tabular-nums' }}>{modalData.ratio.toFixed(2)}%</div>
                </div>
              </div>
              {(()=>{ const thr=parseFloat(modalData.threshold);const ok=modalData.ratio<=thr;const delta=Math.abs(thr-modalData.ratio).toFixed(2); return (
                <div style={{ background:ok?'rgba(16,185,129,0.07)':'rgba(239,68,68,0.07)',padding:'18px 22px',borderRadius:16,textAlign:'center',border:ok?'1px solid rgba(16,185,129,0.2)':'1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize:'0.65rem',fontWeight:800,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:7 }}>Screening Assessment</div>
                  <div style={{ fontSize:'2.5rem',fontWeight:950,color:ok?'var(--halal)':'var(--non-halal)',lineHeight:1,letterSpacing:'-1.5px',fontVariantNumeric:'tabular-nums' }}>{modalData.ratio.toFixed(2)}%</div>
                  <div style={{ marginTop:10 }}><span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 14px',borderRadius:100,fontSize:'0.69rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.5px',background:ok?'var(--halal-bg)':'var(--non-halal-bg)',color:ok?'var(--halal)':'var(--non-halal)',border:ok?'1px solid rgba(16,185,129,0.25)':'1px solid rgba(239,68,68,0.25)' }}>
                    {ok?`✓ Compliant · ${delta}pp Headroom`:`✕ Non-Compliant · ${delta}pp Excess`}
                  </span></div>
                </div>
              );})()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══ ADMIN OVERRIDE MODAL ══ */}
      {showOverride&&createPortal(
        <div style={{ position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100000,padding:24 }}>
          <div className="animate-fade-in" style={{ background:'var(--bg)',borderRadius:20,width:'100%',maxWidth:560,overflow:'hidden',boxShadow:'0 32px 64px rgba(0,0,0,0.2)',border:'1px solid var(--border)',maxHeight:'90vh',display:'flex',flexDirection:'column' }}>
            <div style={{ padding:'18px 22px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg-section)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                <div style={{ width:32,height:32,borderRadius:9,background:'rgba(6,78,59,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}><ShieldCheck size={15} color="var(--primary)"/></div>
                <div><h3 style={{ margin:0,fontSize:'0.96rem',fontWeight:800,color:'var(--text-dark)' }}>Admin Data Override</h3><p style={{ margin:0,fontSize:'0.63rem',color:'var(--text-muted)',fontWeight:600 }}>Changes will trigger a full re-calculation</p></div>
              </div>
              <button onClick={()=>setShowOverride(false)} style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'50%',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-muted)' }}><X size={15}/></button>
            </div>
            <form onSubmit={submitOverride} style={{ padding:'20px 22px',overflowY:'auto',display:'flex',flexDirection:'column',gap:14 }}>
              {overrideError&&<div style={{ background:'var(--non-halal-bg)',color:'var(--non-halal)',padding:'10px 14px',borderRadius:9,fontSize:'0.82rem' }}>{overrideError}</div>}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[['Total Assets','total_assets'],['Total Revenue','total_revenue'],['Market Cap','market_cap'],['Total Debt','total_debt'],['Cash & Equivalents','cash'],['Interest Income','interest_income']].map(([lbl,key])=>(
                  <div key={key}><label style={{ display:'block',fontSize:'0.67rem',fontWeight:700,color:'var(--text-muted)',marginBottom:5 }}>{lbl}</label>
                  <input required type="number" step="any" value={overrideData[key]} onChange={e=>setOverrideData({...overrideData,[key]:e.target.value})} style={{ width:'100%',padding:'9px 11px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-section)',fontSize:'0.84rem',outline:'none',boxSizing:'border-box' }}/></div>
                ))}
              </div>
              <div>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5 }}>
                  <label style={{ fontSize:'0.67rem',fontWeight:700,color:'var(--text-muted)' }}>Evidence / Reference Links</label>
                  <button type="button" onClick={()=>setOverrideData({...overrideData,evidence_links:[...overrideData.evidence_links,'']})} style={{ background:'none',border:'none',color:'var(--primary)',cursor:'pointer',fontSize:'0.7rem',fontWeight:800 }}>+ Add</button>
                </div>
                {overrideData.evidence_links.map((link,idx)=>(<div key={idx} style={{ display:'flex',gap:7,marginBottom:7 }}>
                  <input required type="url" placeholder="https://..." value={link} onChange={e=>{const l=[...overrideData.evidence_links];l[idx]=e.target.value;setOverrideData({...overrideData,evidence_links:l});}} style={{ flex:1,padding:'9px 11px',borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-section)',fontSize:'0.84rem',outline:'none' }}/>
                  {overrideData.evidence_links.length>1&&(<button type="button" onClick={()=>setOverrideData({...overrideData,evidence_links:overrideData.evidence_links.filter((_,i)=>i!==idx)})} style={{ padding:'0 10px',background:'var(--non-halal-bg)',color:'var(--non-halal)',border:'none',borderRadius:10,cursor:'pointer' }}><Trash2 size={13}/></button>)}
                </div>))}
              </div>
              <div style={{ display:'flex',gap:9,paddingTop:4 }}>
                <button type="button" onClick={()=>setShowOverride(false)} style={{ flex:1,padding:'11px',borderRadius:11,background:'var(--bg-section)',border:'1px solid var(--border)',color:'var(--text-muted)',fontWeight:700,cursor:'pointer' }}>Cancel</button>
                <button type="submit" disabled={overrideLoading} style={{ flex:2,padding:'11px',borderRadius:11,background:'var(--primary)',border:'none',color:'white',fontWeight:800,cursor:overrideLoading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                  {overrideLoading?<><div className="spinner" style={{ width:14,height:14,borderWidth:2,borderColor:'rgba(255,255,255,0.3)',borderTopColor:'white' }}/> Saving...</>:'Save & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AaoifiScreening;
