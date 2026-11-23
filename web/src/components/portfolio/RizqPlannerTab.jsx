import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw, ArrowRight, Wifi, WifiOff, CheckCircle2,
  AlertTriangle, Sparkles, TrendingUp, ShieldCheck, Info,
  Download, Copy, Printer, Check, Home, Calculator,
  Lock, Unlock, Minus, Plus, X
} from 'lucide-react';
import localforage from 'localforage';
import { toastSuccess, toastError, toastInfo } from '../../utils/toast';
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
  annualRent: 1200000,
  monthlyUtilities: 50000,
  checkedMonth: currentMonthKey(),
  checkedCategories: {},
  lockedCategories: {},
};

const round1 = (val) => Math.round(val * 10) / 10;

const TRIM_PRIORITY = ['lifestyle', 'transport', 'investments', 'emergency', 'food', 'housing', 'health', 'sadaqa'];

function sumAllocations(alloc) {
  return round1(CATEGORIES.reduce((s, c) => s + Number(alloc?.[c.key] || 0), 0));
}

function capAllocationsTo100(alloc) {
  const next = { ...alloc };
  const total = sumAllocations(next);
  if (total <= 100 || total <= 0) return next;
  let running = 0;
  CATEGORIES.forEach((cat, idx) => {
    if (idx === CATEGORIES.length - 1) {
      next[cat.key] = Math.max(0, round1(100 - running));
    } else {
      const scaled = round1((Number(next[cat.key] || 0) / total) * 100);
      next[cat.key] = scaled;
      running = round1(running + scaled);
    }
  });
  return next;
}

/**
 * Updates targetKey to desiredPct while guaranteeing total <= 100% and respecting locked categories.
 */
function rebalanceWithCap(baseAlloc, targetKey, desiredPct, lockedMap = {}, options = {}) {
  const { mode = 'priority', sourceKey = null } = options;
  const lockedOtherSum = round1(
    CATEGORIES.reduce((s, c) => s + (c.key !== targetKey && lockedMap[c.key] ? Number(baseAlloc[c.key] || 0) : 0), 0)
  );
  const maxAllowed = Math.max(0, round1(100 - lockedOtherSum));
  const clampedDesired = Math.max(0, round1(desiredPct));
  const finalTargetPct = Math.min(maxAllowed, clampedDesired);
  const cappedByLocks = clampedDesired > maxAllowed;

  const next = { ...baseAlloc, [targetKey]: finalTargetPct };
  const rawTotal = sumAllocations(next);

  if (rawTotal > 100) {
    let excess = round1(rawTotal - 100);
    const unlockedOthers = CATEGORIES.filter(
      (c) => c.key !== targetKey && !lockedMap[c.key] && Number(next[c.key] || 0) > 0
    );

    if (mode === 'proportional') {
      const unlockedSum = round1(unlockedOthers.reduce((s, c) => s + Number(next[c.key] || 0), 0));
      if (unlockedSum > 0) {
        unlockedOthers.forEach((c) => {
          if (excess <= 0) return;
          const avail = Number(next[c.key] || 0);
          const cut = Math.min(avail, excess, round1((avail / unlockedSum) * excess));
          next[c.key] = round1(avail - cut);
          excess = round1(excess - cut);
        });
      }
    }

    // Priority cascade (or mop up any rounding remainder from proportional split)
    const order = sourceKey
      ? [sourceKey, ...TRIM_PRIORITY.filter((k) => k !== sourceKey)]
      : TRIM_PRIORITY;

    for (const k of order) {
      if (excess <= 0) break;
      if (k === targetKey || lockedMap[k]) continue;
      const avail = Number(next[k] || 0);
      if (avail <= 0) continue;
      const cut = Math.min(avail, excess);
      next[k] = round1(avail - cut);
      excess = round1(excess - cut);
    }

    // Ironclad guard against 0.1 floating rounding pushing sum over 100
    let guardSum = sumAllocations(next);
    if (guardSum > 100) {
      let over = round1(guardSum - 100);
      const fallbackOrder = [...CATEGORIES]
        .filter((c) => c.key !== targetKey && !lockedMap[c.key])
        .sort((a, b) => Number(next[b.key] || 0) - Number(next[a.key] || 0));
      for (const c of fallbackOrder) {
        if (over <= 0) break;
        const avail = Number(next[c.key] || 0);
        const cut = Math.min(avail, over);
        next[c.key] = round1(avail - cut);
        over = round1(over - cut);
      }
      guardSum = sumAllocations(next);
      if (guardSum > 100) {
        next[targetKey] = Math.max(0, round1(next[targetKey] - (guardSum - 100)));
      }
    }
  }

  const trimmed = CATEGORIES
    .filter((c) => c.key !== targetKey)
    .map((c) => {
      const from = Number(baseAlloc[c.key] || 0);
      const to = Number(next[c.key] || 0);
      return { key: c.key, label: c.label, from, to, delta: round1(to - from) };
    })
    .filter((item) => Math.abs(item.delta) >= 0.05);

  return {
    allocations: next,
    maxAllowed,
    cappedByLocks,
    finalTargetPct: Number(next[targetKey] || 0),
    trimmed,
    remaining: Math.max(0, round1(100 - sumAllocations(next))),
  };
}

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
    const annualRent = Number(parsed?.annualRent);
    const monthlyUtilities = Number(parsed?.monthlyUtilities);
    const thisMonth = currentMonthKey();
    const sameMonth = parsed?.checkedMonth === thisMonth;
    return {
      income: !Number.isNaN(income) && income >= 0 ? income : DEFAULT_STATE.income,
      allocations: capAllocationsTo100(mergedAlloc),
      annualRent: !Number.isNaN(annualRent) && annualRent >= 0 ? annualRent : DEFAULT_STATE.annualRent,
      monthlyUtilities: !Number.isNaN(monthlyUtilities) && monthlyUtilities >= 0 ? monthlyUtilities : DEFAULT_STATE.monthlyUtilities,
      checkedMonth: thisMonth,
      checkedCategories: sameMonth && parsed?.checkedCategories && typeof parsed.checkedCategories === 'object'
        ? parsed.checkedCategories
        : {},
      lockedCategories: parsed?.lockedCategories && typeof parsed.lockedCategories === 'object'
        ? parsed.lockedCategories
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
  const [annualRent, setAnnualRent] = useState(initial.annualRent);
  const [monthlyUtilities, setMonthlyUtilities] = useState(initial.monthlyUtilities);
  const [showRentHelper, setShowRentHelper] = useState(false);
  const [checkedCategories, setCheckedCategories] = useState(initial.checkedCategories);
  const [lockedCategories, setLockedCategories] = useState(initial.lockedCategories);
  const [editingPct, setEditingPct] = useState(null); // { key, value }
  const [editingAmount, setEditingAmount] = useState(null); // { key, value }
  const [suggestion, setSuggestion] = useState(null); // { targetKey, fromPct, toPct, baseAlloc, currentAlloc, trimmed, remaining }
  const editSessionRef = useRef(null); // { key, baseAlloc }
  const lockNoticeRef = useRef(0);
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
            setAllocations((prev) => capAllocationsTo100({ ...prev, ...cached.allocations }));
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
          if (cached.lockedCategories && typeof cached.lockedCategories === 'object') {
            setLockedCategories(cached.lockedCategories);
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
      annualRent,
      monthlyUtilities,
      checkedMonth: currentMonthKey(),
      checkedCategories,
      lockedCategories,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* quota full ignore */ }
    localforage.setItem(STORAGE_KEY, payload).catch(() => {});
  }, [income, allocations, annualRent, monthlyUtilities, checkedCategories, lockedCategories, hydratedFromForage]);

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

  const buildSuggestionForChange = (baseAlloc, targetKey, res) => {
    const fromPct = Number(baseAlloc[targetKey] || 0);
    const toPct = Number(res.allocations[targetKey] || 0);
    if (Math.abs(toPct - fromPct) < 0.05 && res.trimmed.length === 0) return null;
    if (res.trimmed.length === 0 && res.remaining < 0.05) return null;
    return {
      targetKey,
      fromPct,
      toPct,
      baseAlloc,
      currentAlloc: res.allocations,
      trimmed: res.trimmed,
      remaining: res.remaining,
    };
  };

  const notifyLockCap = (label, maxAllowed) => {
    const now = Date.now();
    if (now - lockNoticeRef.current > 2000) {
      lockNoticeRef.current = now;
      toastInfo(`Capped ${label} at ${maxAllowed}% because other categories are locked.`);
    }
  };

  const handlePctFocus = (key, currentPct, e) => {
    editSessionRef.current = { key, baseAlloc: { ...allocations } };
    setEditingPct({ key, value: String(currentPct) });
    const target = e.currentTarget;
    requestAnimationFrame(() => target.select());
  };

  const handlePctChange = (key, raw) => {
    // Allow digits and at most one decimal dot while editing
    const digitsAndDots = raw.replace(/[^0-9.]/g, '');
    const firstDotIdx = digitsAndDots.indexOf('.');
    const sanitized = firstDotIdx === -1
      ? digitsAndDots
      : `${digitsAndDots.slice(0, firstDotIdx + 1)}${digitsAndDots.slice(firstDotIdx + 1).replace(/\./g, '')}`;

    const sessionBase = editSessionRef.current?.key === key
      ? editSessionRef.current.baseAlloc
      : allocations;

    if (sanitized === '' || sanitized === '.') {
      setEditingPct({ key, value: sanitized });
      const res = rebalanceWithCap(sessionBase, key, 0, lockedCategories);
      setAllocations(res.allocations);
      return;
    }

    let val = parseFloat(sanitized);
    if (Number.isNaN(val)) val = 0;
    const res = rebalanceWithCap(sessionBase, key, val, lockedCategories);

    if (res.cappedByLocks) {
      const catLabel = CATEGORIES.find((c) => c.key === key)?.label || 'category';
      notifyLockCap(catLabel, res.maxAllowed);
      setEditingPct({ key, value: String(res.finalTargetPct) });
    } else if (round1(val) > 100) {
      setEditingPct({ key, value: String(res.finalTargetPct) });
    } else {
      setEditingPct({ key, value: sanitized });
    }

    setAllocations(res.allocations);
  };

  const handlePctBlur = (key) => {
    const session = editSessionRef.current;
    editSessionRef.current = null;
    setEditingPct(null);
    if (session && session.key === key) {
      const next = buildSuggestionForChange(session.baseAlloc, key, {
        allocations,
        trimmed: CATEGORIES
          .filter((c) => c.key !== key)
          .map((c) => {
            const from = Number(session.baseAlloc[c.key] || 0);
            const to = Number(allocations[c.key] || 0);
            return { key: c.key, label: c.label, from, to, delta: round1(to - from) };
          })
          .filter((item) => Math.abs(item.delta) >= 0.05),
        remaining: Math.max(0, round1(100 - sumAllocations(allocations))),
      });
      if (next) setSuggestion(next);
    }
  };

  const handlePctCancel = (key, e) => {
    const session = editSessionRef.current;
    editSessionRef.current = null;
    setEditingPct(null);
    if (session && session.key === key) {
      setAllocations(session.baseAlloc);
    }
    e.currentTarget.blur();
  };

  const stepPct = (key, delta) => {
    setEditingPct(null);
    editSessionRef.current = null;
    const anchorBase = suggestion?.targetKey === key ? suggestion.baseAlloc : allocations;
    const desired = round1(Number(allocations[key] || 0) + delta);
    const res = rebalanceWithCap(anchorBase, key, desired, lockedCategories);
    if (res.cappedByLocks) {
      const catLabel = CATEGORIES.find((c) => c.key === key)?.label || 'category';
      notifyLockCap(catLabel, res.maxAllowed);
    }
    setAllocations(res.allocations);
    const nextSuggestion = buildSuggestionForChange(anchorBase, key, res);
    setSuggestion(nextSuggestion);
  };

  const startAmountEdit = (catKey, currentAmount) => {
    if (income <= 0) {
      toastInfo('Enter your monthly take-home income first to budget by Naira amount.');
      return;
    }
    editSessionRef.current = { key: catKey, baseAlloc: { ...allocations } };
    setEditingAmount({
      key: catKey,
      value: Math.round(currentAmount).toLocaleString('en-NG'),
    });
  };

  const handleAmountChange = (catKey, raw) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    const sessionBase = editSessionRef.current?.key === catKey
      ? editSessionRef.current.baseAlloc
      : allocations;

    if (cleaned === '') {
      setEditingAmount({ key: catKey, value: '' });
      const res = rebalanceWithCap(sessionBase, catKey, 0, lockedCategories);
      setAllocations(res.allocations);
      return;
    }

    const nairaVal = Math.min(income, Number(cleaned));
    const desiredPct = income > 0 ? round1((nairaVal / income) * 100) : 0;
    const res = rebalanceWithCap(sessionBase, catKey, desiredPct, lockedCategories);

    if (res.cappedByLocks) {
      const catLabel = CATEGORIES.find((c) => c.key === catKey)?.label || 'category';
      notifyLockCap(catLabel, res.maxAllowed);
      const cappedNaira = Math.round((income * res.finalTargetPct) / 100);
      setEditingAmount({ key: catKey, value: cappedNaira.toLocaleString('en-NG') });
    } else {
      setEditingAmount({ key: catKey, value: nairaVal.toLocaleString('en-NG') });
    }
    setAllocations(res.allocations);
  };

  const commitAmountEdit = (catKey) => {
    const session = editSessionRef.current;
    editSessionRef.current = null;
    setEditingAmount(null);
    if (session && session.key === catKey) {
      const next = buildSuggestionForChange(session.baseAlloc, catKey, {
        allocations,
        trimmed: CATEGORIES
          .filter((c) => c.key !== catKey)
          .map((c) => {
            const from = Number(session.baseAlloc[c.key] || 0);
            const to = Number(allocations[c.key] || 0);
            return { key: c.key, label: c.label, from, to, delta: round1(to - from) };
          })
          .filter((item) => Math.abs(item.delta) >= 0.05),
        remaining: Math.max(0, round1(100 - sumAllocations(allocations))),
      });
      if (next) setSuggestion(next);
    }
  };

  const cancelAmountEdit = (catKey) => {
    const session = editSessionRef.current;
    editSessionRef.current = null;
    setEditingAmount(null);
    if (session && session.key === catKey) {
      setAllocations(session.baseAlloc);
    }
  };

  const toggleLockCategory = (key) => {
    setLockedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applySuggestionVariant = (nextAlloc, feedback) => {
    setAllocations(capAllocationsTo100(nextAlloc));
    setSuggestion(null);
    if (feedback) toastSuccess(feedback);
  };

  const handleReset = () => {
    setEditingPct(null);
    setEditingAmount(null);
    setSuggestion(null);
    editSessionRef.current = null;
    setAllocations({ ...DEFAULT_ALLOCATIONS });
  };

  const handleRollEmergencyToInvestments = () => {
    const em = Number(allocations.emergency || 0);
    if (em <= 0) return;
    setAllocations((prev) => ({
      ...prev,
      emergency: 0,
      investments: round1(Number(prev.investments || 0) + em),
    }));
  };

  const handleAutoBalance = () => {
    const currentTotal = round1(CATEGORIES.reduce((sum, c) => sum + Number(allocations[c.key] || 0), 0));
    const delta = round1(100 - currentTotal);
    if (Math.abs(delta) < 0.05) return;

    const unlockedCats = CATEGORIES.filter((c) => !lockedCategories[c.key]);
    if (unlockedCats.length === 0) {
      toastError('All categories are locked. Unlock at least one category to auto-balance.');
      return;
    }
    setSuggestion(null);

    if (delta > 0) {
      if (!lockedCategories.investments) {
        const nextInv = round1(Number(allocations.investments || 0) + delta);
        setAllocations((prev) => ({ ...prev, investments: nextInv }));
        toastSuccess(`Added remaining ${delta}% to Halal investments.`);
        return;
      }
      // Distribute positive delta proportionally across unlocked categories (or evenly if all unlocked are 0)
      const unlockedSum = unlockedCats.reduce((s, c) => s + Number(allocations[c.key] || 0), 0);
      const nextAlloc = { ...allocations };
      let added = 0;
      unlockedCats.forEach((cat, idx) => {
        if (idx === unlockedCats.length - 1) {
          nextAlloc[cat.key] = Math.min(100, round1(Number(allocations[cat.key] || 0) + (delta - added)));
        } else {
          const share = unlockedSum > 0
            ? round1((Number(allocations[cat.key] || 0) / unlockedSum) * delta)
            : round1(delta / unlockedCats.length);
          nextAlloc[cat.key] = Math.min(100, round1(Number(allocations[cat.key] || 0) + share));
          added = round1(added + share);
        }
      });
      setAllocations(nextAlloc);
      toastSuccess(`Added ${delta}% across unlocked categories to reach 100%.`);
      return;
    }

    // Over-allocated (delta < 0): trim unlocked lifestyle first if it can absorb the excess
    const curLifestyle = Number(allocations.lifestyle || 0);
    if (!lockedCategories.lifestyle && curLifestyle + delta >= 0) {
      setAllocations((prev) => ({
        ...prev,
        lifestyle: round1(curLifestyle + delta),
      }));
      toastSuccess(`Adjusted Personal & lifestyle by ${delta}% to balance at 100%.`);
      return;
    }

    // Otherwise scale only unlocked categories to fill remaining room (100 - lockedSum)
    const lockedSum = round1(
      CATEGORIES.reduce((s, c) => s + (lockedCategories[c.key] ? Number(allocations[c.key] || 0) : 0), 0)
    );
    const targetUnlockedSum = round1(100 - lockedSum);
    if (targetUnlockedSum < 0) {
      toastError(`Locked categories already total ${lockedSum}%. Unlock one to balance to 100%.`);
      return;
    }

    const unlockedCurrentSum = unlockedCats.reduce((s, c) => s + Number(allocations[c.key] || 0), 0);
    if (unlockedCurrentSum <= 0) {
      toastError('Unlock a category with an allocation > 0% to trim excess.');
      return;
    }

    const nextAlloc = { ...allocations };
    let running = 0;
    unlockedCats.forEach((cat, idx) => {
      if (idx === unlockedCats.length - 1) {
        nextAlloc[cat.key] = Math.max(0, round1(targetUnlockedSum - running));
      } else {
        const val = round1((Number(allocations[cat.key] || 0) / unlockedCurrentSum) * targetUnlockedSum);
        nextAlloc[cat.key] = val;
        running = round1(running + val);
      }
    });
    setAllocations(nextAlloc);
    toastSuccess(
      lockedSum > 0
        ? 'Balanced unlocked shares to 100% (kept locked categories fixed).'
        : 'Normalized all shares proportionally to 100%.'
    );
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
    const baseAlloc = { ...allocations };
    const res = rebalanceWithCap(baseAlloc, 'housing', recommendedHousingPct, lockedCategories);
    setAllocations(res.allocations);
    const nextSuggestion = buildSuggestionForChange(baseAlloc, 'housing', res);
    setSuggestion(nextSuggestion);
    toastSuccess(`Housing share updated to ${res.finalTargetPct}% (${fmtNaira((income * res.finalTargetPct) / 100)}/mo).`);
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

  const suggestionPanel = useMemo(() => {
    if (!suggestion) return null;
    const targetCat = CATEGORIES.find((c) => c.key === suggestion.targetKey);
    if (!targetCat) return null;

    const actions = [];
    if (suggestion.trimmed.length > 0) {
      // User raised targetKey and total was capped at 100% by trimming other buckets.
      // Offer alternative ways to source that adjustment cleanly from baseAlloc.
      const propRes = rebalanceWithCap(
        suggestion.baseAlloc,
        suggestion.targetKey,
        suggestion.toPct,
        lockedCategories,
        { mode: 'proportional' }
      );
      const propDiffers = CATEGORIES.some(
        (c) => Math.abs(Number(propRes.allocations[c.key] || 0) - Number(allocations[c.key] || 0)) >= 0.1
      );
      if (propDiffers) {
        actions.push({
          id: 'proportional-trim',
          label: 'Split cut evenly across unlocked',
          nextAlloc: propRes.allocations,
          toast: 'Spread adjustment evenly across unlocked categories.',
        });
      }

      const currentSoleSource = suggestion.trimmed.length === 1 ? suggestion.trimmed[0].key : null;
      const singleCandidates = CATEGORIES.filter(
        (c) =>
          c.key !== suggestion.targetKey &&
          c.key !== currentSoleSource &&
          !lockedCategories[c.key] &&
          Number(suggestion.baseAlloc[c.key] || 0) > 0
      )
        .sort((a, b) => Number(suggestion.baseAlloc[b.key] || 0) - Number(suggestion.baseAlloc[a.key] || 0))
        .slice(0, 2);

      singleCandidates.forEach((cand) => {
        const res = rebalanceWithCap(
          suggestion.baseAlloc,
          suggestion.targetKey,
          suggestion.toPct,
          lockedCategories,
          { sourceKey: cand.key }
        );
        const fromVal = Number(suggestion.baseAlloc[cand.key] || 0);
        const toVal = Number(res.allocations[cand.key] || 0);
        if (toVal < fromVal) {
          actions.push({
            id: `source-${cand.key}`,
            label: `Take from ${cand.label.split(' ')[0]} (${fromVal}% → ${toVal}%)`,
            nextAlloc: res.allocations,
            toast: `Adjusted ${cand.label} (${fromVal}% → ${toVal}%) instead.`,
          });
        }
      });
    } else if (suggestion.remaining >= 0.05) {
      const rem = suggestion.remaining;
      const addTargets = [];
      if (suggestion.targetKey !== 'investments' && !lockedCategories.investments) {
        addTargets.push(CATEGORIES.find((c) => c.key === 'investments'));
      }
      if (suggestion.targetKey !== 'emergency' && !lockedCategories.emergency) {
        addTargets.push(CATEGORIES.find((c) => c.key === 'emergency'));
      }
      if (addTargets.length < 2) {
        CATEGORIES.filter(
          (c) =>
            c.key !== suggestion.targetKey &&
            !lockedCategories[c.key] &&
            !addTargets.some((t) => t?.key === c.key)
        )
          .slice(0, 2 - addTargets.length)
          .forEach((c) => addTargets.push(c));
      }

      addTargets.filter(Boolean).forEach((dest) => {
        const cur = Number(allocations[dest.key] || 0);
        const nextVal = Math.min(100, round1(cur + rem));
        const actualAdd = round1(nextVal - cur);
        if (actualAdd >= 0.05) {
          actions.push({
            id: `boost-${dest.key}`,
            label: `+${actualAdd}% → ${dest.label} (${cur}% → ${nextVal}%)`,
            nextAlloc: { ...allocations, [dest.key]: nextVal },
            toast: `Added +${actualAdd}% to ${dest.label}.`,
          });
        }
      });

      const unlockedOthers = CATEGORIES.filter(
        (c) => c.key !== suggestion.targetKey && !lockedCategories[c.key]
      );
      if (unlockedOthers.length >= 2) {
        const unlockedSum = unlockedOthers.reduce((s, c) => s + Number(allocations[c.key] || 0), 0);
        const spreadAlloc = { ...allocations };
        let distributed = 0;
        unlockedOthers.forEach((c, idx) => {
          const cur = Number(allocations[c.key] || 0);
          if (idx === unlockedOthers.length - 1) {
            spreadAlloc[c.key] = Math.min(100, round1(cur + (rem - distributed)));
          } else {
            const share = unlockedSum > 0 ? round1((cur / unlockedSum) * rem) : round1(rem / unlockedOthers.length);
            spreadAlloc[c.key] = Math.min(100, round1(cur + share));
            distributed = round1(distributed + share);
          }
        });
        actions.push({
          id: 'spread-freed',
          label: `Split +${rem}% across unlocked`,
          nextAlloc: capAllocationsTo100(spreadAlloc),
          toast: `Distributed +${rem}% across unlocked categories.`,
        });
      }
    }

    return {
      targetCat,
      trimmed: suggestion.trimmed,
      remaining: suggestion.remaining,
      fromPct: suggestion.fromPct,
      toPct: suggestion.toPct,
      baseAlloc: suggestion.baseAlloc,
      actions,
    };
  }, [suggestion, allocations, lockedCategories]);

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
          .rizq-pct-input,
          .rizq-income-input,
          .rizq-amount-input {
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .rizq-pct-input:focus,
          .rizq-income-input:focus,
          .rizq-amount-input:focus {
            box-shadow: none !important;
            border: none !important;
            outline: none !important;
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
          .rizq-stepper-btn {
            width: 24px;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0;
            border-radius: 7px;
            transition: background 0.12s ease, color 0.12s ease;
          }
          .rizq-stepper-btn:hover:not(:disabled) {
            background: var(--bg);
            color: var(--primary);
          }
          .rizq-stepper-btn:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }
          .rizq-lock-btn {
            width: 26px;
            height: 26px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            transition: all 0.15s ease;
          }
          .rizq-amount-btn {
            min-width: 102px;
            text-align: right;
            border: 1px dashed transparent;
            background: transparent;
            padding: 4px 6px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--text-dark);
            font-variant-numeric: tabular-nums;
            cursor: pointer;
            transition: background 0.15s ease, border-color 0.15s ease;
          }
          .rizq-amount-btn:hover {
            background: var(--bg-section);
            border-color: var(--border-strong);
          }
          .rizq-row {
            position: relative;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto auto;
            grid-template-areas: "check label lock controls";
            align-items: center;
            gap: 10px;
            padding: 10px 8px 12px;
          }
          .rizq-row-controls {
            grid-area: controls;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
          }
          @media (max-width: 640px) {
            .rizq-planner-card {
              padding: 18px 16px !important;
              border-radius: 20px !important;
            }
            .rizq-row {
              grid-template-columns: auto minmax(0, 1fr) auto;
              grid-template-areas:
                "check label lock"
                ". controls controls";
              gap: 8px 10px !important;
              padding: 12px 4px 13px !important;
            }
            .rizq-row-controls {
              justify-content: space-between;
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
                className="rizq-income-input"
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
            {suggestionPanel && (
              <div
                className="animate-fade-in no-print"
                style={{
                  background: suggestionPanel.trimmed.length > 0 ? 'var(--primary-50)' : 'var(--bg-section)',
                  border: `1px solid ${suggestionPanel.trimmed.length > 0 ? 'var(--primary)' : 'var(--border-strong)'}`,
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: suggestionPanel.actions.length > 0 ? '9px' : 0 }}>
                  <div style={{ fontSize: '0.77rem', lineHeight: 1.45, color: 'var(--text-dark)' }}>
                    {suggestionPanel.trimmed.length > 0 ? (
                      <>
                        <strong style={{ color: 'var(--primary)' }}>Capped at 100%:</strong>{' '}
                        Adjusted{' '}
                        <strong>
                          {suggestionPanel.trimmed.map((t) => `${t.label} (${t.from}% → ${t.to}%)`).join(', ')}
                        </strong>{' '}
                        when raising {suggestionPanel.targetCat.label} ({suggestionPanel.fromPct}% → {suggestionPanel.toPct}%).
                      </>
                    ) : (
                      <>
                        <strong style={{ color: 'var(--primary)' }}>
                          +{suggestionPanel.remaining}% ({fmtNaira((income * suggestionPanel.remaining) / 100)}) free:
                        </strong>{' '}
                        Lowered {suggestionPanel.targetCat.label} ({suggestionPanel.fromPct}% → {suggestionPanel.toPct}%). Adjust another bucket:
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => applySuggestionVariant(suggestionPanel.baseAlloc, 'Reverted last allocation change.')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '7px',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--bg)',
                        color: 'var(--text-dark)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestion(null)}
                      aria-label="Dismiss adjustment suggestion"
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {suggestionPanel.actions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {suggestionPanel.actions.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => applySuggestionVariant(act.nextAlloc, act.toast)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '999px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text-dark)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {CATEGORIES.map((cat) => {
                const pct = Number(allocations[cat.key] || 0);
                const amount = (income * pct) / 100;
                const isActive = hoveredKey === cat.key;
                const isMoved = Boolean(checkedCategories[cat.key]);
                const isLocked = Boolean(lockedCategories[cat.key]);
                const lockedOtherSum = round1(
                  CATEGORIES.reduce((s, c) => s + (c.key !== cat.key && lockedCategories[c.key] ? Number(allocations[c.key] || 0) : 0), 0)
                );
                const maxAllowedForRow = Math.max(0, round1(100 - lockedOtherSum));
                const pctInputValue = editingPct?.key === cat.key ? editingPct.value : String(pct);
                const isEditingAmt = editingAmount?.key === cat.key;
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
                        gridArea: 'check',
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

                    <div style={{ gridArea: 'label', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
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

                    {/* Lock Toggle for Auto-Balance */}
                    <button
                      type="button"
                      className="rizq-lock-btn no-print"
                      onClick={() => toggleLockCategory(cat.key)}
                      aria-label={isLocked ? `Unlock ${cat.label}` : `Lock ${cat.label} during auto-balance`}
                      title={isLocked ? 'Locked during auto-balance (click to unlock)' : 'Pin this bucket so auto-balance keeps it fixed'}
                      style={{
                        gridArea: 'lock',
                        border: `1px solid ${isLocked ? 'var(--gold-border)' : 'transparent'}`,
                        background: isLocked ? 'var(--gold-50)' : 'transparent',
                        color: isLocked ? '#92400e' : 'var(--text-light)',
                      }}
                    >
                      {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>

                    {/* Percentage Stepper + Click-to-Edit Naira Amount */}
                    <div className="rizq-row-controls">
                      <div
                        className="rizq-input-wrap"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '4px 6px',
                          borderRadius: '10px',
                          background: 'var(--bg-section)',
                          border: '1px solid var(--border)',
                          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        <button
                          type="button"
                          className="rizq-stepper-btn no-print"
                          onClick={(e) => stepPct(cat.key, e.shiftKey ? -5 : -1)}
                          disabled={pct <= 0}
                          aria-label={`Decrease ${cat.label} percentage`}
                          title="Decrease by 1% (Shift+click for 5%)"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          className="rizq-pct-input"
                          type="text"
                          inputMode="decimal"
                          aria-label={`${cat.label} percentage`}
                          value={pctInputValue}
                          onFocus={(e) => handlePctFocus(cat.key, pct, e)}
                          onChange={(e) => handlePctChange(cat.key, e.target.value)}
                          onBlur={() => handlePctBlur(cat.key)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              handlePctCancel(cat.key, e);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              stepPct(cat.key, e.shiftKey ? 5 : 1);
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              stepPct(cat.key, e.shiftKey ? -5 : -1);
                            }
                          }}
                          style={{
                            width: '44px',
                            minWidth: '44px',
                            textAlign: 'right',
                            color: 'var(--text-dark)',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, paddingRight: '2px' }}>%</span>
                        <button
                          type="button"
                          className="rizq-stepper-btn no-print"
                          onClick={(e) => stepPct(cat.key, e.shiftKey ? 5 : 1)}
                          disabled={pct >= maxAllowedForRow}
                          aria-label={`Increase ${cat.label} percentage`}
                          title={pct >= maxAllowedForRow && maxAllowedForRow < 100
                            ? `Max ${maxAllowedForRow}% while other categories are locked`
                            : 'Increase by 1% (Shift+click for 5%)'}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Computed or Direct-Editable Naira Value */}
                      {isEditingAmt ? (
                        <div
                          className="rizq-input-wrap"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            minWidth: '102px',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            background: 'var(--bg-section)',
                            border: '1px solid var(--primary)',
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>₦</span>
                          <input
                            autoFocus
                            className="rizq-amount-input"
                            type="text"
                            inputMode="numeric"
                            aria-label={`${cat.label} monthly Naira amount`}
                            value={editingAmount.value}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => handleAmountChange(cat.key, e.target.value)}
                            onBlur={() => commitAmountEdit(cat.key)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                commitAmountEdit(cat.key);
                              } else if (e.key === 'Escape') {
                                cancelAmountEdit(cat.key);
                              }
                            }}
                            style={{
                              width: '78px',
                              textAlign: 'right',
                              color: 'var(--text-dark)',
                              fontSize: '0.84rem',
                              fontWeight: 800,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rizq-amount-btn"
                          onClick={() => startAmountEdit(cat.key, amount)}
                          title="Click to enter exact Naira amount"
                          aria-label={`${cat.label} amount ${fmtNaira(amount)}, click to edit`}
                        >
                          {fmtNaira(amount)}
                        </button>
                      )}
                    </div>

                    {/* Subtle Proportional Color Bar */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: '8px',
                        bottom: 0,
                        height: '2.5px',
                        width: `calc(${Math.min(100, pct)}% - 16px)`,
                        minWidth: pct > 0 ? '4px' : 0,
                        background: cat.color,
                        opacity: isMoved ? 0.35 : 0.72,
                        borderRadius: '999px',
                        transition: 'width 0.2s ease, opacity 0.2s ease',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Footer Totals + Always-Visible Balance Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {!isExact100 ? (
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="no-print"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: `1px solid ${totalPct > 100 ? 'var(--non-compliant-border)' : 'var(--doubtful-border)'}`,
                      background: totalPct > 100 ? 'var(--non-compliant-bg)' : 'var(--doubtful-bg)',
                      color: totalPct > 100 ? 'var(--non-compliant)' : 'var(--doubtful)',
                    }}
                    title="Click to auto-balance unlocked categories to 100%"
                  >
                    {totalPct > 100
                      ? `${totalPct}% (${pctDiff}% over) · Balance`
                      : `${totalPct}% (${pctDiff}% left) · Balance`}
                  </button>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      fontSize: '0.71rem',
                      fontWeight: 800,
                      background: 'var(--halal-bg)',
                      color: 'var(--halal)',
                      border: '1px solid var(--halal-border)',
                    }}
                  >
                    <CheckCircle2 size={12} /> 100%
                  </span>
                )}
                <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                  Planned total:{' '}
                  <strong style={{ color: isExact100 ? 'var(--primary)' : totalPct > 100 ? 'var(--non-compliant)' : 'var(--text-dark)' }}>
                    {fmtNaira(plannedTotal)}
                  </strong>
                </div>
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
    </div>
  );
}
