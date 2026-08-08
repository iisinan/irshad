import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle,
  HelpCircle, ShieldCheck, ChevronRight, FileText, Download, Droplets,
  Calendar, TrendingUp, Calculator, ExternalLink, Activity,
  Building2, CreditCard, Coins, BarChart3, AlertCircle, X,
  Trash2, Sliders, Brain, Sparkles, Send, Plus, Star,
  BrainCircuit, BarChart2, Newspaper, Clock, RefreshCw,
  ChevronDown, ChevronUp, MessageSquare, DollarSign, Percent,
  Info, TrendingDown, Award, BookOpen, Zap, Bell
} from 'lucide-react';
import { fetchAaoifiScreening, fetchStockDetails, updateAaoifiData, chatAboutStock } from '../services/api';
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
  if (n >= 1e9)  return '₦' + (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '₦' + (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return '₦' + (n/1e3).toFixed(2) + 'K';
  return '₦' + n.toFixed(2);
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
      className={clickable?'hover-card':''} style={{ background:'var(--bg)',borderRadius:14,padding:'15px 20px',marginBottom:10,border:`1px solid ${ok?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'}`,cursor:clickable?'pointer':'default',transition:'all 0.22s',display:'grid',gridTemplateColumns:'175px 1fr 118px',gap:18,alignItems:'center' }}>
      <div>
        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
          {num&&<span style={{ width:18,height:18,borderRadius:5,background:ok?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)',color:ok?'var(--halal)':'var(--non-halal)',fontSize:'0.64rem',fontWeight:900,display:'inline-flex',alignItems:'center',justifyContent:'center' }}>{num}</span>}
          <span style={{ fontWeight:800,color:'var(--text-dark)',fontSize:'0.86rem' }}>{name}</span>
          {clickable&&<span style={{ fontSize:'0.56rem',padding:'1px 4px',borderRadius:100,background:'var(--bg-section)',color:'var(--text-muted)',fontWeight:700,border:'1px solid var(--border)' }}>↗</span>}
        </div>
        <div style={{ fontSize:'0.67rem',color:'var(--text-muted)',lineHeight:1.4 }}>{subtitle}</div>
      </div>
      <div style={{ position:'relative',height:9,background:'rgba(0,0,0,0.06)',borderRadius:100,overflow:'visible' }}>
        <div style={{ position:'absolute',top:0,left:0,height:'100%',width:`${fill}%`,background:grad,borderRadius:100,boxShadow:ok?'0 0 8px rgba(16,185,129,0.25)':'0 0 8px rgba(239,68,68,0.25)',transition:'width 0.9s cubic-bezier(0.4,0,0.2,1)' }}/>
        <div style={{ position:'absolute',top:-4,bottom:-4,left:`${pin}%`,width:2.5,background:'var(--non-halal)',borderRadius:2,boxShadow:'0 0 5px rgba(239,68,68,0.5)' }}/>
        <div style={{ position:'absolute',top:14,left:`${pin}%`,transform:'translateX(-50%)' }}>
          <span style={{ fontSize:'0.57rem',fontWeight:800,color:'var(--non-halal)',background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.18)',padding:'1px 4px',borderRadius:4,whiteSpace:'nowrap' }}>{threshold}% limit</span>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:'1.28rem',fontWeight:900,color:col,letterSpacing:'-0.5px',fontVariantNumeric:'tabular-nums',lineHeight:1.1 }}>{rv.toFixed(2)}%</div>
        <div style={{ display:'inline-flex',alignItems:'center',gap:2,fontSize:'0.6rem',fontWeight:800,color:col,marginTop:4,padding:'2px 6px',borderRadius:100,background:ok?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)',border:ok?'1px solid rgba(16,185,129,0.2)':'1px solid rgba(239,68,68,0.2)' }}>
          {ok?'✓':'✕'} {diff}pp {ok?'headroom':'excess'}
        </div>
      </div>
    </div>
  );
};

/* ─── Data chip ─────────────────────────────────────────── */
const DataChip = ({ label, value, color, bg, border }) => (
  <div style={{ background:bg||'var(--bg)',borderRadius:14,padding:'14px 18px',border:`1px solid ${border||'var(--border)'}` }}>
    <div style={{ fontSize:'0.62rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:'1.08rem',fontWeight:900,color:color||'var(--text-dark)',letterSpacing:'-0.3px',fontVariantNumeric:'tabular-nums' }}>{value}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const AaoifiScreening = () => {
  const { symbol } = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const chatEndRef = useRef(null);

  /* ── Queries ── */
  const { data:res, isLoading:queryLoading, error:queryError } = useQuery({
    queryKey:['aaoifi',symbol],
    queryFn: ()=>fetchAaoifiScreening(symbol),
    staleTime:5*60*1000,
    refetchInterval:(q)=>q.state.data?.status==='processing'?10000:false,
  });
  const { data:stockRes } = useQuery({
    queryKey:['stock',symbol],
    queryFn: ()=>fetchStockDetails(symbol),
    staleTime:5*60*1000,
    enabled: !!symbol,
  });

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
  const error   = queryError?(queryError.response?.data?.message||queryError.message||'Error'):null;

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
      <Link to="/portfolio" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 22px',background:'var(--bg)',color:'var(--text-dark)',fontWeight:700,textDecoration:'none',borderRadius:100,border:'1px solid var(--border)' }}><ArrowLeft size={16}/> Back to Screener</Link>
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
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,gap:12,flexWrap:'wrap' }}>
          <Link to="/portfolio" style={{ display:'flex',alignItems:'center',gap:7,padding:'7px 14px 7px 10px',background:'var(--bg-section)',border:'1px solid var(--border)',borderRadius:100,color:'var(--text-dark)',textDecoration:'none',fontWeight:700,fontSize:'0.8rem',transition:'all 0.18s' }}
            onMouseOver={e=>e.currentTarget.style.background='var(--border)'}
            onMouseOut={e=>e.currentTarget.style.background='var(--bg-section)'}>
            <ArrowLeft size={15}/> Screener
          </Link>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={()=>{ alert("Alert preferences opened"); }} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--bg-section)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',fontWeight:700,color:'var(--text-dark)',fontSize:'0.8rem' }}>
              <Bell size={14}/> Set Alert
            </button>
            {user?.role==='admin'&&(<button onClick={openOverride} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'linear-gradient(135deg,#065F46,#047857)',border:'none',borderRadius:10,cursor:'pointer',fontWeight:800,color:'#fff',fontSize:'0.8rem',transition:'all 0.2s',boxShadow:'0 4px 12px rgba(6,78,59,0.22)' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
              <ShieldCheck size={14}/> Edit Data
            </button>)}
            <button onClick={()=>window.print()} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'var(--bg-section)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',fontWeight:700,color:'var(--text-dark)',fontSize:'0.8rem' }}>
              <Download size={14}/> Export
            </button>
          </div>
        </div>

        {/* ── Company header ── */}
        <div style={{ background:'var(--bg-section)',border:'1px solid var(--border)',borderRadius:18,padding:'24px',marginBottom:16 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap' }}>
            <div style={{ display:'flex',alignItems:'center',gap:14 }}>
              <div style={{ position:'relative' }}>
                <CompanyLogo symbol={symbol} logoUrl={stock?.logo_url} size={46} radius={14}/>
                <div style={{ position:'absolute',bottom:-3,right:-3,width:14,height:14,borderRadius:'50%',background:finalStatus==='halal'?'var(--halal)':finalStatus==='non-halal'?'var(--non-halal)':'#D97706',border:'2.5px solid var(--bg-section)' }}/>
              </div>
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                  <h1 style={{ margin:0,fontSize:'1.2rem',fontWeight:900,color:'var(--text-dark)',letterSpacing:'-0.4px' }}>{report.company_name||symbol}</h1>
                </div>
                {(stock?.sector || report.sector) && (
                  <p style={{ margin:'3px 0 0',fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:500 }}>
                    {stock?.sector || report.sector} 
                    {stock?.industry && <span style={{ opacity: 0.6, margin: '0 4px' }}>•</span>}
                    {stock?.industry}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display:'flex',gap:28,flexWrap:'wrap',alignItems:'center' }}>
              {latestPrice>0&&(<div style={{ textAlign:'left', paddingRight:24, borderRight:'1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize:'0.65rem',fontWeight:800,color:'#9A9386',textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:6 }}>Last Price</div>
                <div style={{ fontSize:'1.7rem',fontWeight:900,color:'#112A46',letterSpacing:'-0.5px',fontVariantNumeric:'tabular-nums',lineHeight:1 }}>
                  ₦{latestPrice.toLocaleString('en-US', {maximumFractionDigits: 2})}
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:4,marginTop:8 }}>
                  <span style={{ fontSize:'0.75rem',fontWeight:800,color: priceChangePct >= 0 ? 'var(--halal)' : 'var(--non-halal)' }}>
                    {priceChangePct >= 0 ? '▲' : '▼'} {Math.abs(priceChangePct).toFixed(2)}%
                  </span>
                  <span style={{ fontSize:'0.75rem',fontWeight:500,color:'#9A9386' }}>today</span>
                </div>
              </div>)}
              {marketCap>0&&(<div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.6rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:2 }}>Market Cap</div>
                <div style={{ fontSize:'1.18rem',fontWeight:900,color:'var(--text-dark)',letterSpacing:'-0.4px',fontVariantNumeric:'tabular-nums' }}>{fmt(marketCap)}</div>
              </div>)}
              {report.sector&&(<div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.6rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4 }}>Sector</div>
                <div style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:100,background:'var(--bg)',border:'1px solid var(--border)',fontSize:'0.72rem',fontWeight:700,color:'var(--text-dark)' }}>{report.sector}</div>
              </div>)}
            </div>
          </div>
        </div>

        {/* ══ VERDICT CARD ══ */}
        <div style={{ borderRadius:18,background:sc.bg,border:`1px solid ${sc.border}`,marginBottom:16,position:'relative',overflow:'hidden' }}>
          <div style={{ display:'flex',gap:0,flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 280px',padding:'24px 28px',borderRight:`1px solid ${sc.border}`,display:'flex',flexDirection:'column',justifyContent:'center',gap:12 }}>
              <div style={{ fontSize:'0.65rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'1.5px',color:sc.color }}>AAOIFI Compliance Verdict</div>
              <div style={{ display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginTop:2 }}>
                <div style={{ marginTop:4 }}>
                  <StatusIcon size={32} color={sc.color} strokeWidth={2}/>
                </div>
                <div>
                  <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
                    <h2 style={{ fontFamily:'"Georgia", "Times New Roman", serif',fontSize:'clamp(2rem,4vw,2.4rem)',fontWeight:700,color:sc.color,margin:0,letterSpacing:'0px',lineHeight:1 }}>{sc.label}</h2>
                    {hasPurification&&(<span style={{ fontSize:'0.7rem',fontWeight:700,color:'#D97706',display:'inline-flex',alignItems:'center',gap:4,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',padding:'4px 10px',borderRadius:100 }}><Droplets size={12} color="#D97706"/> With Purification ({purPct}%)</span>)}
                  </div>
                  <div style={{ fontSize:'0.75rem',fontWeight:600,color:'var(--text-muted)',marginTop:6 }}>{sc.tag}</div>
                </div>
              </div>
              <p style={{ color:'var(--text-muted)',fontSize:'0.85rem',lineHeight:1.6,margin:'8px 0 0',maxWidth:520 }}>{cleanStatusReason||'Screened in accordance with AAOIFI Shariah Standard No. 21.'}</p>
              {(report.reporting_period||report.reporting_year)&&(<div style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',background:'rgba(0,0,0,0.04)',borderRadius:100,fontSize:'0.65rem',color:'var(--text-muted)',fontWeight:700,border:'1px solid var(--border)',width:'fit-content',marginTop:4 }}><Calendar size={10}/> {report.reporting_period} {report.reporting_year?`(${report.reporting_year})`:''}</div>)}
            </div>
            {hasPurification&&(<div style={{ flex:'0 0 240px',padding:'24px',display:'flex',flexDirection:'column',justifyContent:'center',gap:16,background:'rgba(245,158,11,0.02)' }}>
              <div>
                <div style={{ fontSize:'0.6rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'1px',color:'#D97706',marginBottom:6 }}>Purification</div>
                <div style={{ fontSize:'0.85rem',color:'var(--text-dark)',fontWeight:600,lineHeight:1.4 }}>Donate <strong style={{ color:'#D97706' }}>{purPct}%</strong> of dividend income to charity</div>
              </div>
              <Link to="/portfolio" style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',gap:5,padding:'10px 16px',borderRadius:12,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',color:'#D97706',fontSize:'0.8rem',fontWeight:700,textDecoration:'none',marginTop:4 }}>Purify in Portfolio <ChevronRight size={14}/></Link>
            </div>)}
            {isNonHalal&&(<div style={{ flex:'0 0 240px',padding:'24px',display:'flex',flexDirection:'column',justifyContent:'center',gap:12,background:'rgba(239,68,68,0.02)' }}>
              <div style={{ fontSize:'0.65rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'1.5px',color:'var(--non-halal)' }}>Screening Result</div>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}><XCircle size={32} color="var(--non-halal)" strokeWidth={2}/>
                <div><div style={{ fontSize:'1.1rem',fontWeight:900,color:'var(--non-halal)' }}>EXCLUDED</div><div style={{ fontSize:'0.7rem',color:'var(--text-muted)',fontWeight:600 }}>Not suitable for Islamic investment</div></div>
              </div>
              <div style={{ fontSize:'0.85rem',color:'var(--text-muted)',lineHeight:1.5 }}>{businessFailed?'Primary business activities violate Shariah principles.':'Financial ratios exceed AAOIFI thresholds.'}</div>
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
            {hasPurification&&finalStatus==='halal'&&(<div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'rgba(217,119,6,0.05)',border:'1px solid rgba(217,119,6,0.18)',borderRadius:12,marginBottom:14 }}>
              <div style={{ width:30,height:30,borderRadius:9,background:'rgba(217,119,6,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Droplets size={15} color="#D97706"/></div>
              <div style={{ flex:1,fontSize:'0.83rem',color:'var(--text-dark)',fontWeight:500 }}><strong style={{ color:'#D97706' }}>Purification required:</strong> Donate <strong style={{ color:'#D97706' }}>{purPct}%</strong> of dividend income to charity.</div>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:'1.2rem',fontWeight:900,color:'#D97706',lineHeight:1 }}>{purPct}%</div><div style={{ fontSize:'0.57rem',color:'var(--text-muted)',fontWeight:700,marginTop:1 }}>to purify</div></div>
            </div>)}
            {stage1Status==='non-halal'&&(<div style={{ background:'rgba(239,68,68,0.04)',padding:'14px 18px',borderRadius:12,border:'1px solid rgba(239,68,68,0.18)',borderLeft:'3px solid #EF4444',display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',marginBottom:14 }}>
              <div style={{ flex:'1 1 220px' }}><div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:4 }}><AlertTriangle size={14} color="#EF4444"/><span style={{ fontWeight:800,color:'#EF4444',fontSize:'0.84rem' }}>Prohibited Activities Detected</span></div>
              <p style={{ margin:0,color:'var(--text-muted)',fontSize:'0.79rem',lineHeight:1.6 }}>Non-compliant revenue (<strong style={{ color:'#EF4444' }}>{pct(report.stage1?.haram_revenue_percent)}</strong>) exceeds the 5% AAOIFI tolerance.</p></div>
              <div style={{ background:'var(--bg)',borderRadius:10,padding:'8px 16px',border:'1px solid rgba(239,68,68,0.18)',textAlign:'center' }}>
                <div style={{ fontSize:'0.57rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:1 }}>Impure Ratio</div>
                <div style={{ fontSize:'1.2rem',fontWeight:900,color:'#EF4444' }}>{pct(report.stage1?.haram_revenue_percent)}</div>
              </div>
            </div>)}
            <div style={{ display:'flex',alignItems:'center',gap:6,fontWeight:800,color:'var(--text-dark)',fontSize:'0.79rem',marginBottom:8 }}><Brain size={13} color="var(--primary)"/> Screening Reasoning</div>
            <div style={{ fontSize:'0.86rem',lineHeight:1.78,color:'var(--text-dark)',padding:'14px 18px',background:'var(--bg)',borderRadius:12,border:'1px solid var(--border)',borderLeft:'3px solid var(--primary)' }}>
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
            <div style={{ padding:'12px 16px',background:'rgba(124,58,237,0.04)',border:'1px solid rgba(124,58,237,0.15)',borderRadius:11,display:'flex',alignItems:'flex-start',gap:9 }}>
              <Info size={13} color="#7C3AED" style={{ flexShrink:0,marginTop:2 }}/>
              <div style={{ fontSize:'0.78rem',color:'var(--text-muted)',lineHeight:1.5 }}><strong style={{ color:'var(--text-dark)' }}>AAOIFI strict thresholds apply:</strong> Even at 30.01% the debt ratio fails. Click any bar to see the full calculation breakdown.</div>
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
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover-card"
                  style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'14px 16px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:14,textDecoration:'none',transition:'all 0.2s' }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:'rgba(37,99,235,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Newspaper size={15} color="#2563EB"/></div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,color:'var(--text-dark)',fontSize:'0.86rem',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{title}</div>
                    {desc&&<div style={{ fontSize:'0.73rem',color:'var(--text-muted)',lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{desc}</div>}
                    {date&&<div style={{ fontSize:'0.63rem',color:'var(--text-muted)',marginTop:5,display:'flex',alignItems:'center',gap:4,fontWeight:600 }}><Clock size={10}/>{fmtDate(date)}</div>}
                  </div>
                  <ExternalLink size={13} color="var(--text-muted)" style={{ flexShrink:0,marginTop:2 }}/>
                </a>
              );
            })}
          </div>
        </Section>)}





      </div> {/* end left column */}

      {/* ═══════════ RIGHT: METRICS & AI COPILOT ═══════════ */}
      <div style={{ width:308,flexShrink:0,position:'sticky',top:20,marginTop:52,maxHeight:'calc(100vh - 40px)',display:'flex',flexDirection:'column',gap:16 }}>
        
        {/* PRICE DATA WIDGET */}
        <div style={{ borderRadius:18,border:'1px solid var(--border)',background:'var(--bg-section)',padding:'24px',boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            <BarChart2 size={16} color="var(--text-muted)" />
            <div style={{ fontSize:'0.75rem',fontWeight:700,letterSpacing:'1px',color:'var(--text-muted)' }}>PRICE DATA</div>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Open</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.open ? `₦${stock.open.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Previous Close</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.previous_close ? `₦${stock.previous_close.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Day High</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.day_high ? `₦${stock.day_high.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Day Low</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.day_low ? `₦${stock.day_low.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>52W High</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.week_52_high ? `₦${stock.week_52_high.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>52W Low</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.week_52_low ? `₦${stock.week_52_low.toLocaleString(undefined,{minimumFractionDigits:2})}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* MARKET DATA WIDGET */}
        <div style={{ borderRadius:18,border:'1px solid var(--border)',background:'var(--bg-section)',padding:'24px',boxShadow:'0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            <TrendingUp size={16} color="var(--text-muted)" />
            <div style={{ fontSize:'0.75rem',fontWeight:700,letterSpacing:'1px',color:'var(--text-muted)' }}>MARKET DATA</div>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Market Cap</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.market_cap ? (stock.market_cap.toString().includes('T') || stock.market_cap.toString().includes('B') ? `₦${stock.market_cap}` : `₦${stock.market_cap}`) : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Shares Outstanding</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.shares_outstanding ? `₦${stock.shares_outstanding}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Volume Today</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.volume ? `₦${stock.volume}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>P/E Ratio</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.pe_ratio ? stock.pe_ratio : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>EPS</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.eps ? stock.eps : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <div>
                <div style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Last Dividend</div>
                {stock?.last_paid_dividend?.pay_date && <div style={{ fontSize:'0.65rem',color:'var(--text-muted)',marginTop:2 }}>{new Date(stock.last_paid_dividend.pay_date).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</div>}
              </div>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.last_paid_dividend ? `₦${Number(stock.last_paid_dividend.amount).toFixed(2)}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)',paddingBottom:8 }}>
              <div>
                <div style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Upcoming Dividend</div>
                {stock?.upcoming_dividend?.pay_date && <div style={{ fontSize:'0.65rem',color:'var(--text-muted)',marginTop:2 }}>{new Date(stock.upcoming_dividend.pay_date).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</div>}
              </div>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.upcoming_dividend ? `₦${Number(stock.upcoming_dividend.amount).toFixed(2)}` : '—'}
              </span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontSize:'0.85rem',color:'var(--text-muted)' }}>Dividend Yield</span>
              <span style={{ fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',fontFamily:'monospace' }}>
                {stock?.div_yield ? `${stock.div_yield}%` : '—'}
              </span>
            </div>
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
