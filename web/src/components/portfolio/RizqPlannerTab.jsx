import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw, ArrowRight, Wifi, WifiOff, CheckCircle2,
  AlertTriangle, Sparkles, TrendingUp, ShieldCheck, Info
} from 'lucide-react';
import localforage from 'localforage';

const STORAGE_KEY = 'irshad_rizq_planner_v1';

const CATEGORIES = [
  {
    key: 'housing',
    label: 'Housing and utilities',
    subtitle: 'Rent, power, fuel, data',
    color: '#2563EB',
    defaultPct: 30,
    isEssential: true,
  },
  {
    key: 'food',
    label: 'Food and household',
    subtitle: 'Groceries, toiletries',
    color: '#F97316',
    defaultPct: 15,
    isEssential: true,
  },
  {
    key: 'transport',
    label: 'Transport',
    subtitle: 'Fuel, ride-hailing, upkeep',
    color: '#10B981',
    defaultPct: 10,
    isEssential: true,
  },
  {
    key: 'emergency',
    label: 'Emergency savings',
    subtitle: 'Until 6 months covered',
    color: '#EAB308',
    defaultPct: 10,
    isWealthBuilding: true,
  },
  {
    key: 'investments',
    label: 'Halal investments',
    subtitle: 'Stocks, sukuk, pension top-up',
    color: '#EC4899',
    defaultPct: 15,
    isWealthBuilding: true,
  },
  {
    key: 'sadaqa',
    label: 'Monthly Sadaqa',
    subtitle: 'Family support and Giving',
    color: '#15803D',
    defaultPct: 7,
  },
  {
    key: 'lifestyle',
    label: 'Personal and lifestyle',
    subtitle: 'Clothing, outings, learning',
    color: '#6366F1',
    defaultPct: 8,
  },
  {
    key: 'health',
    label: 'Health and takaful',
    subtitle: 'HMO, meds, cover',
    color: '#EF4444',
    defaultPct: 5,
    isEssential: true,
  },
];

const DEFAULT_ALLOCATIONS = CATEGORIES.reduce((acc, cat) => {
  acc[cat.key] = cat.defaultPct;
  return acc;
}, {});

const GUIDANCE_POINTS = [
  'Pay yourself first: move savings and investments out on payday, before you spend anything.',
  'Housing includes power, generator fuel and data. Paying rent yearly? Set aside 1/12 of it each month.',
  'Stop the emergency fund at six months of essential costs, then move its share into investments.',
  "Monthly Sadaqa: view requests from dependants and extended family as ways to earn Allah's pleasure, and increase barakah in your rizq.",
  'Zakat is due yearly on wealth held for a full year, not on monthly income.',
];

const DEFAULT_STATE = {
  income: 500000,
  allocations: { ...DEFAULT_ALLOCATIONS },
  annualReturnPct: 12,
  emergencySaved: 0,
};

function loadInitialStateSync() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    const mergedAlloc = { ...DEFAULT_ALLOCATIONS };
    CATEGORIES.forEach((c) => {
      const val = Number(parsed?.allocations?.[c.key]);
      if (!Number.isNaN(val) && val >= 0 && val <= 100) {
        mergedAlloc[c.key] = val;
      }
    });
    const income = Number(parsed?.income);
    const annualReturnPct = Number(parsed?.annualReturnPct);
    const emergencySaved = Number(parsed?.emergencySaved);
    return {
      income: !Number.isNaN(income) && income >= 0 ? income : DEFAULT_STATE.income,
      allocations: mergedAlloc,
      annualReturnPct: !Number.isNaN(annualReturnPct) && annualReturnPct >= 0 && annualReturnPct <= 40 ? annualReturnPct : 12,
      emergencySaved: !Number.isNaN(emergencySaved) && emergencySaved >= 0 ? emergencySaved : 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

const fmtNaira = (amount) => {
  const num = Number(amount || 0);
  return `₦${Math.round(num).toLocaleString('en-NG')}`;
};

export default function RizqPlannerTab({ standalone = false }) {
  const initial = useMemo(() => loadInitialStateSync(), []);
  const [income, setIncome] = useState(initial.income);
  const [incomeInput, setIncomeInput] = useState(() => initial.income.toLocaleString('en-NG'));
  const [allocations, setAllocations] = useState(initial.allocations);
  const [annualReturnPct, setAnnualReturnPct] = useState(initial.annualReturnPct);
  const [emergencySaved, setEmergencySaved] = useState(initial.emergencySaved);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [hydratedFromForage, setHydratedFromForage] = useState(false);

  // Track online/offline connectivity status cleanly
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Hydrate from IndexedDB/localforage if localStorage was cleared
  useEffect(() => {
    let mounted = true;
    if (!localStorage.getItem(STORAGE_KEY)) {
      localforage.getItem(STORAGE_KEY)
        .then((cached) => {
          if (!mounted || !cached || typeof cached !== 'object') return;
          if (typeof cached.income === 'number') {
            setIncome(cached.income);
            setIncomeInput(cached.income.toLocaleString('en-NG'));
          }
          if (cached.allocations && typeof cached.allocations === 'object') {
            setAllocations((prev) => ({ ...prev, ...cached.allocations }));
          }
          if (typeof cached.annualReturnPct === 'number') {
            setAnnualReturnPct(cached.annualReturnPct);
          }
          if (typeof cached.emergencySaved === 'number') {
            setEmergencySaved(cached.emergencySaved);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setHydratedFromForage(true);
        });
    } else {
      setHydratedFromForage(true);
    }
    return () => { mounted = false; };
  }, []);

  // Persist every adjustment offline to localStorage + localforage immediately
  useEffect(() => {
    if (!hydratedFromForage) return;
    const payload = {
      income,
      allocations,
      annualReturnPct,
      emergencySaved,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* quota full ignore */ }
    localforage.setItem(STORAGE_KEY, payload).catch(() => {});
  }, [income, allocations, annualReturnPct, emergencySaved, hydratedFromForage]);

  const handleIncomeChange = (raw) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      setIncome(0);
      setIncomeInput('');
      return;
    }
    const parsed = Math.min(1000000000, Number(cleaned));
    setIncome(parsed);
    setIncomeInput(parsed.toLocaleString('en-NG'));
  };

  const applyIncomePreset = (val) => {
    setIncome(val);
    setIncomeInput(val.toLocaleString('en-NG'));
  };

  const handlePctChange = (key, raw) => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    if (cleaned === '') {
      setAllocations((prev) => ({ ...prev, [key]: 0 }));
      return;
    }
    let val = parseFloat(cleaned);
    if (Number.isNaN(val)) val = 0;
    val = Math.max(0, Math.min(100, Math.round(val * 10) / 10));
    setAllocations((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    setAllocations({ ...DEFAULT_ALLOCATIONS });
  };

  const handleRollEmergencyToInvestments = () => {
    const em = Number(allocations.emergency || 0);
    if (em <= 0) return;
    setAllocations((prev) => ({
      ...prev,
      emergency: 0,
      investments: Math.round((Number(prev.investments || 0) + em) * 10) / 10,
    }));
  };

  const totalPct = useMemo(
    () => Math.round(CATEGORIES.reduce((sum, c) => sum + Number(allocations[c.key] || 0), 0) * 10) / 10,
    [allocations]
  );

  const plannedTotal = useMemo(
    () => (income * totalPct) / 100,
    [income, totalPct]
  );

  const wealthPct = useMemo(
    () => Math.round((Number(allocations.emergency || 0) + Number(allocations.investments || 0)) * 10) / 10,
    [allocations]
  );

  const wealthAmount = useMemo(
    () => (income * wealthPct) / 100,
    [income, wealthPct]
  );

  const isExact100 = Math.abs(totalPct - 100) < 0.05;
  const pctDiff = Math.round(Math.abs(100 - totalPct) * 10) / 10;

  // Offline 100% Halal Compounder Simulation
  const compoundingStats = useMemo(() => {
    const essentialMonthly = CATEGORIES
      .filter((c) => c.isEssential)
      .reduce((sum, c) => sum + (income * Number(allocations[c.key] || 0)) / 100, 0);
    const sixMonthTarget = essentialMonthly * 6;
    const monthlyEmergency = (income * Number(allocations.emergency || 0)) / 100;
    const monthlyInvestment = (income * Number(allocations.investments || 0)) / 100;
    const monthlyRate = (Number(annualReturnPct) || 0) / 100 / 12;

    const remainingTarget = Math.max(0, sixMonthTarget - Number(emergencySaved || 0));
    const monthsToEmergency =
      remainingTarget <= 0
        ? 0
        : monthlyEmergency > 0
          ? Math.ceil(remainingTarget / monthlyEmergency)
          : null;

    const projectMonths = (months) => {
      let emBalance = Number(emergencySaved || 0);
      let invBalance = 0;
      let totalContributed = 0;

      for (let m = 1; m <= months; m++) {
        invBalance *= 1 + monthlyRate;
        let emAdd = 0;
        let invAdd = monthlyInvestment;

        if (emBalance < sixMonthTarget && monthlyEmergency > 0) {
          emAdd = monthlyEmergency;
          emBalance += emAdd;
          if (emBalance > sixMonthTarget) {
            const overflow = emBalance - sixMonthTarget;
            emBalance = sixMonthTarget;
            invAdd += overflow;
          }
        } else if (monthlyEmergency > 0) {
          // Once 6 months of essentials are covered, roll Emergency share into Halal investments
          invAdd += monthlyEmergency;
        }

        invBalance += invAdd;
        totalContributed += invAdd;
      }

      return {
        investedValue: invBalance,
        contributed: totalContributed,
        gains: Math.max(0, invBalance - totalContributed),
        emergencyReserve: emBalance,
      };
    };

    return {
      essentialMonthly,
      sixMonthTarget,
      monthlyEmergency,
      monthlyInvestment,
      monthsToEmergency,
      horizons: [
        { label: '1 Year', ...projectMonths(12) },
        { label: '3 Years', ...projectMonths(36) },
        { label: '5 Years', ...projectMonths(60) },
        { label: '10 Years', ...projectMonths(120) },
      ],
    };
  }, [income, allocations, annualReturnPct, emergencySaved]);

  // SVG Donut Geometry (normalized to 100% or proportional if > 0)
  const donutSegments = useMemo(() => {
    const radius = 84;
    const circumference = 2 * Math.PI * radius;
    const denominator = totalPct > 100 ? totalPct : 100;
    const gap = totalPct > 0 ? 2.4 : 0;

    let cumulative = 0;
    const segments = CATEGORIES.map((cat) => {
      const pct = Number(allocations[cat.key] || 0);
      const fraction = pct / denominator;
      const rawLength = fraction * circumference;
      const dashLength = rawLength > gap ? rawLength - gap : rawLength;
      const offset = -cumulative;
      cumulative += rawLength;
      return {
        ...cat,
        pct,
        dashLength,
        offset,
        circumference,
      };
    });

    return { radius, circumference, segments };
  }, [allocations, totalPct]);

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: standalone ? '1060px' : '100%',
        margin: standalone ? '0 auto' : 0,
        padding: standalone ? '108px 20px 64px' : '0 0 40px',
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: '4px',
            }}
          >
            IRSHAD · MONTHLY BUDGET
          </div>
          <h1
            style={{
              margin: '0 0 6px',
              fontSize: 'clamp(1.65rem, 3vw, 2.25rem)',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text-dark)',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            Monthly Rizq Compounder Planner
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Enter your take-home pay, then adjust each share to fit your life.
          </p>
        </div>

        {/* Offline / Local Sync Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            background: isOnline ? 'var(--halal-bg)' : 'var(--doubtful-bg)',
            border: `1px solid ${isOnline ? 'var(--halal-border)' : 'var(--doubtful-border)'}`,
            color: isOnline ? 'var(--halal)' : 'var(--doubtful)',
            fontSize: '0.74rem',
            fontWeight: 800,
          }}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'Works Offline · Saved Locally' : 'Offline Mode · Saved Locally'}</span>
        </div>
      </div>

      {/* Main Planner Card */}
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '20px',
        }}
      >
        {/* Take-home Income Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '24px',
            marginBottom: '26px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label
              htmlFor="rizq-income-input"
              style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}
            >
              Monthly take-home income
            </label>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-section)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: '14px',
                padding: '10px 16px',
                minWidth: '210px',
              }}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>₦</span>
              <input
                id="rizq-income-input"
                type="text"
                inputMode="numeric"
                value={incomeInput}
                onChange={(e) => handleIncomeChange(e.target.value)}
                onBlur={() => {
                  if (incomeInput === '') {
                    setIncomeInput('0');
                  }
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--text-dark)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  width: '150px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[250000, 500000, 1000000, 2000000].map((preset) => {
              const active = income === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyIncomePreset(preset)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary-50)' : 'var(--bg-section)',
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {preset >= 1000000 ? `₦${preset / 1000000}M` : `₦${preset / 1000}K`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-column Body: Donut Chart + 8 Allocation Rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
            gap: '34px',
            alignItems: 'center',
          }}
        >
          {/* Left: Donut Chart & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            <div style={{ position: 'relative', width: '220px', height: '220px' }}>
              <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track background */}
                <circle
                  cx="110"
                  cy="110"
                  r={donutSegments.radius}
                  fill="none"
                  stroke="var(--bg-section)"
                  strokeWidth="34"
                />
                {donutSegments.segments.map((seg) => {
                  if (seg.pct <= 0) return null;
                  const isActive = hoveredKey === seg.key;
                  return (
                    <circle
                      key={seg.key}
                      cx="110"
                      cy="110"
                      r={donutSegments.radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={isActive ? '40' : '34'}
                      strokeDasharray={`${seg.dashLength} ${seg.circumference}`}
                      strokeDashoffset={seg.offset}
                      style={{
                        transition: 'stroke-dasharray 0.25s ease, stroke-dashoffset 0.25s ease, stroke-width 0.15s ease',
                        cursor: 'pointer',
                        opacity: hoveredKey && !isActive ? 0.65 : 1,
                      }}
                      onMouseEnter={() => setHoveredKey(seg.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Callout */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '2.15rem',
                    fontWeight: 800,
                    color: totalPct > 100 ? 'var(--non-compliant)' : 'var(--primary)',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    lineHeight: 1.05,
                  }}
                >
                  {totalPct}%
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                  allocated
                </span>
              </div>
            </div>

            {/* Status Pill */}
            <div
              style={{
                width: '100%',
                maxWidth: '280px',
                textAlign: 'center',
                padding: '9px 14px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: isExact100
                  ? 'var(--halal-bg)'
                  : totalPct > 100
                    ? 'var(--non-compliant-bg)'
                    : 'var(--doubtful-bg)',
                color: isExact100
                  ? 'var(--halal)'
                  : totalPct > 100
                    ? 'var(--non-compliant)'
                    : 'var(--doubtful)',
                border: `1px solid ${
                  isExact100
                    ? 'var(--halal-border)'
                    : totalPct > 100
                      ? 'var(--non-compliant-border)'
                      : 'var(--doubtful-border)'
                }`,
              }}
            >
              {isExact100 ? (
                <>
                  <CheckCircle2 size={14} /> All 100% allocated
                </>
              ) : totalPct > 100 ? (
                <>
                  <AlertTriangle size={14} /> {pctDiff}% over-allocated ({fmtNaira(plannedTotal - income)})
                </>
              ) : (
                <>
                  <Info size={14} /> {pctDiff}% unallocated ({fmtNaira(income - plannedTotal)} remaining)
                </>
              )}
            </div>
          </div>

          {/* Right: 8 Interactive Category Rows */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {CATEGORIES.map((cat) => {
                const pct = Number(allocations[cat.key] || 0);
                const amount = (income * pct) / 100;
                const isActive = hoveredKey === cat.key;
                return (
                  <div
                    key={cat.key}
                    onMouseEnter={() => setHoveredKey(cat.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '10px 8px',
                      borderBottom: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: isActive ? 'var(--bg-section)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '4px',
                          background: cat.color,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.25 }}>
                          {cat.label}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {cat.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Editable Percentage Box */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        background: 'var(--bg-section)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        aria-label={`${cat.label} percentage`}
                        value={pct}
                        onChange={(e) => handlePctChange(cat.key, e.target.value)}
                        style={{
                          width: '44px',
                          textAlign: 'right',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          color: 'var(--text-dark)',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>%</span>
                    </div>

                    {/* Computed Naira Value */}
                    <div
                      style={{
                        minWidth: '88px',
                        textAlign: 'right',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-dark)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {fmtNaira(amount)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Totals */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '14px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                Savings + halal investments:{' '}
                <strong style={{ color: 'var(--text-dark)' }}>
                  {wealthPct}% · {fmtNaira(wealthAmount)}
                </strong>
              </div>
              <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                Planned total:{' '}
                <strong style={{ color: isExact100 ? 'var(--primary)' : 'var(--text-dark)' }}>
                  {fmtNaira(plannedTotal)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 109, 100, 0.2)',
              }}
            >
              <RotateCcw size={15} /> Reset to suggested split
            </button>

            {Number(allocations.emergency || 0) > 0 && (
              <button
                type="button"
                onClick={handleRollEmergencyToInvestments}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-section)',
                  color: 'var(--text-dark)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={15} color="#EC4899" /> 6-mo Emergency Funded? Shift {allocations.emergency}% → Investments
              </button>
            )}
          </div>

          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Changes save automatically to this device
          </span>
        </div>
      </div>

      {/* How the suggested split works */}
      <div
        style={{
          background: 'var(--bg-section)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '22px 24px',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: '0.96rem',
            fontWeight: 800,
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={17} /> How the suggested split works
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: 'var(--text-body)',
            fontSize: '0.82rem',
            lineHeight: 1.55,
          }}
        >
          {GUIDANCE_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      {/* Offline Rizq Compounding Projection */}
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '18px',
          }}
        >
          <div>
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <TrendingUp size={18} color="var(--primary)" /> Rizq Compounding Horizon
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Automatically models your 6-month emergency milestone, then compounds all {wealthPct}% wealth contributions into Halal investments.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Current Emergency Saved
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>₦</span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={emergencySaved}
                  onChange={(e) => setEmergencySaved(Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: '105px', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-dark)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Expected Halal Return ({annualReturnPct}% p.a.)
              </label>
              <input
                type="range"
                min="4"
                max="24"
                step="1"
                value={annualReturnPct}
                onChange={(e) => setAnnualReturnPct(Number(e.target.value))}
                style={{ accentColor: 'var(--primary)', width: '140px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Emergency Milestone Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--bg-section)',
            border: '1px solid var(--border)',
            marginBottom: '16px',
            fontSize: '0.8rem',
          }}
        >
          <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>
            <strong>6-Month Essential Target:</strong> {fmtNaira(compoundingStats.sixMonthTarget)}{' '}
            <span style={{ color: 'var(--text-muted)' }}>({fmtNaira(compoundingStats.essentialMonthly)}/mo essentials)</span>
          </span>
          <span style={{ color: 'var(--primary)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {compoundingStats.monthsToEmergency === 0
              ? 'Emergency target met — 100% of wealth split goes to investments'
              : compoundingStats.monthsToEmergency === null
                ? 'Allocate % to Emergency savings to compute timeline'
                : `${compoundingStats.monthsToEmergency} months to fill at ${fmtNaira(compoundingStats.monthlyEmergency)}/mo`}
            <ArrowRight size={13} />
          </span>
        </div>

        {/* Projection Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
          }}
        >
          {compoundingStats.horizons.map((h) => (
            <div
              key={h.label}
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'var(--bg-section)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {h.label}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {fmtNaira(h.investedValue)}
              </div>
              <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Est. Halal growth: <strong style={{ color: 'var(--halal)' }}>+{fmtNaira(h.gains)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
