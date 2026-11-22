import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw, ArrowRight, Wifi, WifiOff, CheckCircle2,
  AlertTriangle, Sparkles, TrendingUp, ShieldCheck, Info,
  Download, Copy, Printer, Check, Home, Calculator
} from 'lucide-react';
import localforage from 'localforage';
import { toastSuccess } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';

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

const currentMonthKey = () => new Date().toISOString().slice(0, 7);

const DEFAULT_STATE = {
  income: 500000,
  allocations: { ...DEFAULT_ALLOCATIONS },
  annualReturnPct: 12,
  emergencySaved: 0,
  annualRent: 1200000,
  monthlyUtilities: 50000,
  checkedMonth: currentMonthKey(),
  checkedCategories: {},
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
    const annualRent = Number(parsed?.annualRent);
    const monthlyUtilities = Number(parsed?.monthlyUtilities);
    const thisMonth = currentMonthKey();
    const sameMonth = parsed?.checkedMonth === thisMonth;
    return {
      income: !Number.isNaN(income) && income >= 0 ? income : DEFAULT_STATE.income,
      allocations: mergedAlloc,
      annualReturnPct: !Number.isNaN(annualReturnPct) && annualReturnPct >= 0 && annualReturnPct <= 40 ? annualReturnPct : 12,
      emergencySaved: !Number.isNaN(emergencySaved) && emergencySaved >= 0 ? emergencySaved : 0,
      annualRent: !Number.isNaN(annualRent) && annualRent >= 0 ? annualRent : DEFAULT_STATE.annualRent,
      monthlyUtilities: !Number.isNaN(monthlyUtilities) && monthlyUtilities >= 0 ? monthlyUtilities : DEFAULT_STATE.monthlyUtilities,
      checkedMonth: thisMonth,
      checkedCategories: sameMonth && parsed?.checkedCategories && typeof parsed.checkedCategories === 'object'
        ? parsed.checkedCategories
        : {},
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
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user || null;
  const initial = useMemo(() => loadInitialStateSync(), []);
  const [income, setIncome] = useState(initial.income);
  const [incomeInput, setIncomeInput] = useState(() => initial.income.toLocaleString('en-NG'));
  const [allocations, setAllocations] = useState(initial.allocations);
  const [annualReturnPct, setAnnualReturnPct] = useState(initial.annualReturnPct);
  const [emergencySaved, setEmergencySaved] = useState(initial.emergencySaved);
  const [annualRent, setAnnualRent] = useState(initial.annualRent);
  const [monthlyUtilities, setMonthlyUtilities] = useState(initial.monthlyUtilities);
  const [showRentHelper, setShowRentHelper] = useState(false);
  const [checkedCategories, setCheckedCategories] = useState(initial.checkedCategories);
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
          if (typeof cached.annualRent === 'number') {
            setAnnualRent(cached.annualRent);
          }
          if (typeof cached.monthlyUtilities === 'number') {
            setMonthlyUtilities(cached.monthlyUtilities);
          }
          if (cached.checkedMonth === currentMonthKey() && cached.checkedCategories && typeof cached.checkedCategories === 'object') {
            setCheckedCategories(cached.checkedCategories);
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
      annualRent,
      monthlyUtilities,
      checkedMonth: currentMonthKey(),
      checkedCategories,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* quota full ignore */ }
    localforage.setItem(STORAGE_KEY, payload).catch(() => {});
  }, [income, allocations, annualReturnPct, emergencySaved, annualRent, monthlyUtilities, checkedCategories, hydratedFromForage]);

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

  const handleAutoBalance = () => {
    const currentTotal = CATEGORIES.reduce((sum, c) => sum + Number(allocations[c.key] || 0), 0);
    const delta = Math.round((100 - currentTotal) * 10) / 10;
    if (Math.abs(delta) < 0.05) return;

    if (delta > 0) {
      const nextInv = Math.round((Number(allocations.investments || 0) + delta) * 10) / 10;
      setAllocations((prev) => ({ ...prev, investments: nextInv }));
      toastSuccess(`Added remaining ${delta}% to Halal investments.`);
      return;
    }

    const curLifestyle = Number(allocations.lifestyle || 0);
    if (curLifestyle + delta >= 0) {
      setAllocations((prev) => ({
        ...prev,
        lifestyle: Math.round((curLifestyle + delta) * 10) / 10,
      }));
      toastSuccess(`Adjusted Personal & lifestyle by ${delta}% to balance at 100%.`);
      return;
    }

    if (currentTotal > 0) {
      const normalized = {};
      let sum = 0;
      CATEGORIES.forEach((cat, idx) => {
        if (idx === CATEGORIES.length - 1) {
          normalized[cat.key] = Math.max(0, Math.round((100 - sum) * 10) / 10);
        } else {
          const val = Math.round(((Number(allocations[cat.key] || 0) / currentTotal) * 100) * 10) / 10;
          normalized[cat.key] = val;
          sum += val;
        }
      });
      setAllocations(normalized);
      toastSuccess('Normalized all shares proportionally to 100%.');
    }
  };

  const togglePaydayEnvelope = (key) => {
    setCheckedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const monthlyHousingNeed = useMemo(
    () => (Number(annualRent || 0) / 12) + Number(monthlyUtilities || 0),
    [annualRent, monthlyUtilities]
  );

  const recommendedHousingPct = useMemo(() => {
    if (income <= 0) return 0;
    return Math.min(100, Math.round((monthlyHousingNeed / income) * 1000) / 10);
  }, [income, monthlyHousingNeed]);

  const applyHousingFromRent = () => {
    if (income <= 0) return;
    setAllocations((prev) => ({ ...prev, housing: recommendedHousingPct }));
    toastSuccess(`Housing share updated to ${recommendedHousingPct}% (${fmtNaira(monthlyHousingNeed)}/mo).`);
  };

  const movedPaydayStats = useMemo(() => {
    let count = 0;
    let amount = 0;
    CATEGORIES.forEach((c) => {
      if (checkedCategories[c.key]) {
        count++;
        amount += (income * Number(allocations[c.key] || 0)) / 100;
      }
    });
    return { count, amount };
  }, [checkedCategories, allocations, income]);

  const handleExportCsv = () => {
    const rows = [
      ['Category', 'Details', 'Share (%)', 'Monthly Amount (NGN)', 'Payday Moved'],
      ...CATEGORIES.map((c) => {
        const pct = Number(allocations[c.key] || 0);
        const amt = Math.round((income * pct) / 100);
        return [c.label, c.subtitle, pct, amt, checkedCategories[c.key] ? 'Yes' : 'No'];
      }),
      ['TOTAL', 'Planned Monthly Allocation', totalPct, Math.round(plannedTotal), `${movedPaydayStats.count}/${CATEGORIES.length}`],
    ];
    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `irshad-rizq-budget-${currentMonthKey()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toastSuccess('Budget CSV exported offline.');
  };

  const handleCopySummary = async () => {
    const lines = [
      `Irshad Monthly Rizq Compounder (${currentMonthKey()})`,
      `Monthly Take-Home Income: ${fmtNaira(income)}`,
      '',
      ...CATEGORIES.map((c) => {
        const pct = Number(allocations[c.key] || 0);
        const amt = (income * pct) / 100;
        const doneMark = checkedCategories[c.key] ? '[x]' : '[ ]';
        return `${doneMark} ${c.label}: ${pct}% (${fmtNaira(amt)})`;
      }),
      '',
      `Savings + Halal Investments: ${wealthPct}% (${fmtNaira(wealthAmount)})`,
      `Planned Total: ${totalPct}% (${fmtNaira(plannedTotal)})`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      toastSuccess('Payday allocation plan copied to clipboard.');
    } catch {
      toastSuccess('Use Export CSV or Print to save your plan offline.');
    }
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
        className="rizq-planner-card"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '20px',
        }}
      >
        <style>{`
          .rizq-pct-input::-webkit-outer-spin-button,
          .rizq-pct-input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .rizq-pct-input {
            -moz-appearance: textfield;
          }
          .rizq-input-wrap:focus-within {
            border-color: var(--primary) !important;
            box-shadow: 0 0 0 3px rgba(69, 165, 138, 0.14);
          }
          .rizq-btn-lift {
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .rizq-btn-lift:hover {
            transform: translateY(-1px);
          }
          .rizq-row {
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            align-items: center;
            gap: 12px;
            padding: 10px 8px;
          }
          @media (max-width: 600px) {
            .rizq-planner-card {
              padding: 18px 16px !important;
              border-radius: 20px !important;
            }
            .rizq-row {
              gap: 8px !important;
              padding: 10px 4px !important;
            }
          }
        `}</style>
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
              className="rizq-input-wrap"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-section)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: '14px',
                padding: '10px 16px',
                minWidth: '210px',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
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
            <button
              type="button"
              onClick={() => setShowRentHelper((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '999px',
                border: `1px solid ${showRentHelper ? 'var(--primary)' : 'var(--border)'}`,
                background: showRentHelper ? 'var(--primary-50)' : 'var(--bg-section)',
                color: showRentHelper ? 'var(--primary)' : 'var(--text-dark)',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Home size={13} /> Yearly Rent 1/12
            </button>
          </div>
        </div>

        {/* Optional Yearly Rent 1/12 Sinking Fund Helper */}
        {showRentHelper && (
          <div
            className="animate-fade-in no-print"
            style={{
              background: 'var(--bg-section)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '22px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Annual Rent (₦/yr)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={annualRent}
                  onChange={(e) => setAnnualRent(Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: '130px', padding: '7px 10px', borderRadius: '9px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.82rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Power, Fuel &amp; Data (₦/mo)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={monthlyUtilities}
                  onChange={(e) => setMonthlyUtilities(Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: '130px', padding: '7px 10px', borderRadius: '9px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.82rem' }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Monthly housing reserve:{' '}
                <strong style={{ color: 'var(--text-dark)' }}>
                  {fmtNaira(monthlyHousingNeed)}
                </strong>{' '}
                ({recommendedHousingPct}% of income)
              </div>
            </div>
            <button
              type="button"
              onClick={applyHousingFromRent}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.76rem',
                cursor: 'pointer',
              }}
            >
              Apply {recommendedHousingPct}% to Housing
            </button>
          </div>
        )}

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
              {(() => {
                const hoveredCat = hoveredKey ? CATEGORIES.find((c) => c.key === hoveredKey) : null;
                const hoveredPct = hoveredCat ? Number(allocations[hoveredCat.key] || 0) : 0;
                const hoveredAmt = (income * hoveredPct) / 100;
                return (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '26px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    {hoveredCat ? (
                      <>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            color: hoveredCat.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            lineHeight: 1.2,
                            maxWidth: '124px',
                          }}
                        >
                          {hoveredCat.label}
                        </span>
                        <span
                          style={{
                            fontSize: '1.55rem',
                            fontWeight: 800,
                            color: 'var(--text-dark)',
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            lineHeight: 1.15,
                            marginTop: '2px',
                          }}
                        >
                          {hoveredPct}%
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {fmtNaira(hoveredAmt)}
                        </span>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Status Pill */}
            <div
              style={{
                width: '100%',
                maxWidth: '285px',
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

            {!isExact100 && (
              <button
                type="button"
                onClick={handleAutoBalance}
                className="rizq-btn-lift no-print"
                style={{
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: '1px solid var(--primary)',
                  background: 'var(--primary-50)',
                  color: 'var(--primary)',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {totalPct < 100
                  ? `Send ${pctDiff}% → Halal investments (100%)`
                  : 'Auto-balance shares to 100%'}
              </button>
            )}
          </div>

          {/* Right: 8 Interactive Category Rows */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {CATEGORIES.map((cat) => {
                const pct = Number(allocations[cat.key] || 0);
                const amount = (income * pct) / 100;
                const isActive = hoveredKey === cat.key;
                const isMoved = Boolean(checkedCategories[cat.key]);
                return (
                  <div
                    key={cat.key}
                    className="rizq-row"
                    onMouseEnter={() => setHoveredKey(cat.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: isActive ? 'var(--bg-section)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => togglePaydayEnvelope(cat.key)}
                      aria-label={`Mark ${cat.label} moved for payday`}
                      title={isMoved ? 'Marked moved this month' : 'Check off once moved on payday'}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: `1.5px solid ${isMoved ? 'var(--primary)' : 'var(--border-strong)'}`,
                        background: isMoved ? 'var(--primary)' : 'transparent',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      {isMoved && <Check size={12} strokeWidth={3} />}
                    </button>

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
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isMoved ? 'var(--text-muted)' : 'var(--text-dark)', textDecoration: isMoved ? 'line-through' : 'none', lineHeight: 1.25 }}>
                          {cat.label}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {cat.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Editable Percentage Box */}
                    <div
                      className="rizq-input-wrap"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        background: 'var(--bg-section)',
                        border: '1px solid var(--border)',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <input
                        className="rizq-pct-input"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        aria-label={`${cat.label} percentage`}
                        value={pct}
                        onChange={(e) => handlePctChange(cat.key, e.target.value)}
                        style={{
                          width: '38px',
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

            {/* Payday Progress Strip */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--bg-section)',
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>
                  <strong style={{ color: 'var(--text-dark)' }}>Payday checklist ({currentMonthKey()}):</strong>{' '}
                  {movedPaydayStats.count}/{CATEGORIES.length} moved · {fmtNaira(movedPaydayStats.amount)}
                </span>
                {movedPaydayStats.count > 0 && (
                  <button
                    type="button"
                    onClick={() => setCheckedCategories({})}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear checks
                  </button>
                )}
              </div>
              <div style={{ width: '100%', height: '5px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(movedPaydayStats.count / CATEGORIES.length) * 100}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: 'var(--primary)',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div
          className="no-print"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopySummary}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 13px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'var(--bg-section)',
                color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer',
              }}
            >
              <Copy size={13} /> Copy Plan
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 13px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'var(--bg-section)',
                color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer',
              }}
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 13px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'var(--bg-section)',
                color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer',
              }}
            >
              <Printer size={13} /> Print
            </button>
          </div>
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

        <div className="no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => navigate(user ? '/portfolio#zakat' : '/register')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <Calculator size={14} /> {user ? 'Calculate Annual Zakat' : 'Sign Up for Zakat Calculator'} <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => navigate(user ? '/portfolio#baskets' : '/pricing')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            <TrendingUp size={14} /> {user ? 'Invest Monthly Share in Baskets' : 'Explore Halal Portfolios'} <ArrowRight size={13} />
          </button>
        </div>
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
