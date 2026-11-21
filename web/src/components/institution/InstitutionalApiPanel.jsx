import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Key, Plus, Copy, Check, Trash2, ShieldCheck, ShieldAlert,
  Terminal, Loader2, AlertTriangle, ArrowRight
} from 'lucide-react';
import {
  fetchInstitutionApiKeys,
  createInstitutionApiKey,
  revokeInstitutionApiKey,
  runPreTradeGuardrailCheck,
} from '../../services/api';
import { toastError, toastSuccess } from '../../utils/toast';
import { formatNaira } from './institutionalFixtures';

const API_ORIGIN = 'https://irshad-backend-production.up.railway.app/api/v1';

export default function InstitutionalApiPanel({ isAuthenticatedInstitution }) {
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Pre-trade simulator
  const [checkSymbol, setCheckSymbol] = useState('');
  const [checkUnits, setCheckUnits] = useState('');
  const [checkingTrade, setCheckingTrade] = useState(false);
  const [tradeResult, setTradeResult] = useState(null);

  // Code snippet tab
  const [lang, setLang] = useState('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    if (!isAuthenticatedInstitution) return;
    setLoadingKeys(true);
    fetchInstitutionApiKeys()
      .then((res) => setKeys(res?.data || []))
      .catch(() => {})
      .finally(() => setLoadingKeys(false));
  }, [isAuthenticatedInstitution]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    const clean = keyName.trim();
    if (!clean) {
      toastError('Enter a name for this API key (e.g. Trading OMS).');
      return;
    }
    setCreating(true);
    try {
      const res = await createInstitutionApiKey({ name: clean });
      if (res?.data?.api_key) {
        setKeys((prev) => [res.data.api_key, ...prev]);
        setNewlyCreatedKey(res.data.plain_text_key);
        setKeyName('');
        setCopiedKey(false);
        toastSuccess('API key generated.');
      }
    } catch (err) {
      toastError(err?.response?.data?.message || 'Could not create API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeInstitutionApiKey(id);
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: false, revoked_at: new Date().toISOString() } : k)));
      toastSuccess('API key revoked.');
    } catch {
      toastError('Failed to revoke key.');
    }
  };

  const handleCopyPlainKey = async () => {
    if (!newlyCreatedKey) return;
    await navigator.clipboard.writeText(newlyCreatedKey);
    setCopiedKey(true);
    toastSuccess('API key copied to clipboard.');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handlePreTradeTest = async (e) => {
    e.preventDefault();
    const sym = checkSymbol.trim().toUpperCase();
    if (!sym) return;
    setCheckingTrade(true);
    try {
      const res = await runPreTradeGuardrailCheck(sym, Number(checkUnits) || 1000);
      setTradeResult(res?.data || null);
    } catch (err) {
      toastError(err?.response?.data?.message || `No NGX stock found for ${sym}`);
      setTradeResult(null);
    } finally {
      setCheckingTrade(false);
    }
  };

  const sampleKey = newlyCreatedKey || 'irsh_live_YOUR_INSTITUTION_API_KEY';

  const snippets = {
    curl: `# 1. Pre-Trade Shariah Guardrail Check
curl -X GET "${API_ORIGIN}/b2b/stocks/${checkSymbol.trim().toUpperCase() || 'DANGCEM'}/pre-trade-check?units=${Number(checkUnits) || 1000}" \\
  -H "X-Api-Key: ${sampleKey}"

# 2. Screen & Purify Full Portfolio Book
curl -X POST "${API_ORIGIN}/b2b/portfolio/screen" \\
  -H "X-Api-Key: ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"holdings":[{"symbol":"DANGCEM","shares":50000},{"symbol":"ZENITHBANK","shares":25000}]}'

# 3. Pull Live Factsheet & AAOIFI Audit JSON for Fund CMS
curl -X POST "${API_ORIGIN}/b2b/portfolio/factsheet-data" \\
  -H "X-Api-Key: ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"fund_name":"My Ethical Equity Fund","ticker":"MYETH","nav_per_unit":100,"closing_price":112,"holdings":[{"symbol":"DANGCEM","shares":50000}]}'`,
    js: `// Pre-Trade Guardrail Check in your Brokerage / OMS Backend
const res = await fetch(
  "${API_ORIGIN}/b2b/stocks/${checkSymbol.trim().toUpperCase() || 'DANGCEM'}/pre-trade-check?units=${Number(checkUnits) || 1000}",
  { headers: { "X-Api-Key": "${sampleKey}" } }
);
const { data } = await res.json();

if (!data.order_allowed) {
  // Block non-compliant buy order & suggest halal peers
  console.log("Blocked:", data.verdict, data.compliant_alternatives);
}`,
    python: `import requests

headers = {"X-Api-Key": "${sampleKey}"}
r = requests.get(
    "${API_ORIGIN}/b2b/stocks/${checkSymbol.trim().toUpperCase() || 'DANGCEM'}/pre-trade-check",
    params={"units": ${Number(checkUnits) || 1000}},
    headers=headers,
)
guardrail = r.json()["data"]
print(guardrail["guardrail_action"], guardrail["aaoifi_ratios"])`,
  };

  const handleCopySnippet = async () => {
    await navigator.clipboard.writeText(snippets[lang]);
    setCopiedSnippet(true);
    toastSuccess('Code snippet copied.');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Section 1: API Key Management */}
      <div style={{ background: 'var(--bg)', borderRadius: 18, padding: 22, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} color="var(--primary)" /> API Keys
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Connect your brokerage OMS, banking core, or wealth portal to Irshad&apos;s pre-trade guardrails and screening API.
            </p>
          </div>

          {isAuthenticatedInstitution && (
            <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key name (e.g. Trading OMS)"
                aria-label="API key name"
                style={{
                  padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-strong)',
                  background: 'var(--bg-section)', color: 'var(--text-dark)', fontSize: '0.8rem', minWidth: 210,
                }}
              />
              <button
                type="submit"
                disabled={creating}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 10, border: 'none',
                  background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                {creating ? <Loader2 size={14} /> : <Plus size={15} />} Generate API Key
              </button>
            </form>
          )}
        </div>

        {!isAuthenticatedInstitution && (
          <div style={{
            padding: 16, borderRadius: 12, background: 'var(--bg-section)', border: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Sign in with an Institutional account to generate and manage live API keys.
            </span>
            <Link to="/login" style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
              Sign In <ArrowRight size={13} style={{ verticalAlign: 'middle' }} />
            </Link>
          </div>
        )}

        {/* Copy-Once Newly Generated Key Banner */}
        {newlyCreatedKey && (
          <div style={{
            marginBottom: 16, padding: '14px 16px', borderRadius: 12,
            background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.35)',
          }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#065F46', marginBottom: 6 }}>
              Save this key now — for security, it won&apos;t be displayed again:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <code style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)',
                border: '1px solid var(--border-strong)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', wordBreak: 'break-all',
              }}>
                {newlyCreatedKey}
              </code>
              <button
                type="button"
                onClick={handleCopyPlainKey}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: '#065F46', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey ? 'Copied' : 'Copy Key'}
              </button>
            </div>
          </div>
        )}

        {isAuthenticatedInstitution && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Key Prefix</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Last Used</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingKeys ? (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading API keys...</td></tr>
                ) : keys.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No API keys created yet. Generate one above to connect your trading desk.</td></tr>
                ) : keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 8px', fontWeight: 700, color: 'var(--text-dark)' }}>{k.name}</td>
                    <td style={{ padding: '11px 8px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-body)' }}>{k.key_prefix}</td>
                    <td style={{ padding: '11px 8px', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                    </td>
                    <td style={{ padding: '11px 8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800,
                        background: k.is_active ? 'var(--halal-bg)' : 'var(--non-compliant-bg)',
                        color: k.is_active ? 'var(--halal)' : 'var(--non-compliant)',
                      }}>
                        {k.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 8px', textAlign: 'right' }}>
                      {k.is_active && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(k.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 8, border: '1px solid var(--non-compliant-border)',
                            background: 'var(--non-compliant-bg)', color: 'var(--non-compliant)',
                            fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={12} /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Pre-Trade Compliance Guardrail Tester + Code Snippets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {/* Live Pre-Trade Simulator */}
        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: 22, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={17} color="var(--primary)" /> Pre-Trade Guardrail Simulator
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Test how Irshad evaluates an incoming buy order before execution.
          </p>

          <form onSubmit={handlePreTradeTest} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <input
              type="text"
              value={checkSymbol}
              onChange={(e) => setCheckSymbol(e.target.value)}
              placeholder="Ticker (e.g. ZENITHBANK)"
              aria-label="Pre-trade ticker"
              style={{
                flex: '1 1 130px', padding: '9px 12px', borderRadius: 10,
                border: '1px solid var(--border-strong)', background: 'var(--bg-section)',
                color: 'var(--text-dark)', fontSize: '0.8rem', fontWeight: 700,
              }}
            />
            <input
              type="number"
              min={1}
              value={checkUnits}
              onChange={(e) => setCheckUnits(e.target.value)}
              placeholder="Units"
              aria-label="Order units"
              style={{
                width: 110, padding: '9px 12px', borderRadius: 10,
                border: '1px solid var(--border-strong)', background: 'var(--bg-section)',
                color: 'var(--text-dark)', fontSize: '0.8rem', fontWeight: 700,
              }}
            />
            <button
              type="submit"
              disabled={checkingTrade || !isAuthenticatedInstitution}
              style={{
                padding: '9px 14px', borderRadius: 10, border: 'none',
                background: '#111827', color: '#fff', fontWeight: 700, fontSize: '0.78rem',
                cursor: checkingTrade || !isAuthenticatedInstitution ? 'not-allowed' : 'pointer',
                opacity: !isAuthenticatedInstitution ? 0.55 : 1,
              }}
            >
              {checkingTrade ? 'Checking...' : 'Run Check'}
            </button>
          </form>

          {tradeResult && (
            <div style={{
              padding: 14, borderRadius: 12,
              background: tradeResult.order_allowed ? 'var(--halal-bg)' : 'var(--non-compliant-bg)',
              border: `1px solid ${tradeResult.order_allowed ? 'var(--halal-border)' : 'var(--non-compliant-border)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontWeight: 900, fontSize: '0.86rem',
                  color: tradeResult.order_allowed ? 'var(--halal)' : 'var(--non-compliant)',
                }}>
                  {tradeResult.order_allowed ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                  {tradeResult.guardrail_action} · {tradeResult.symbol} ({formatNaira(tradeResult.estimated_order_value)})
                </span>
                {tradeResult.near_threshold_warning && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <AlertTriangle size={11} /> Near Threshold
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-body)', marginBottom: 6 }}>
                Debt: <strong>{tradeResult.aaoifi_ratios?.debt_ratio ?? '—'}%</strong> · Cash: <strong>{tradeResult.aaoifi_ratios?.cash_ratio ?? '—'}%</strong> · Impure: <strong>{tradeResult.aaoifi_ratios?.impure_income_ratio ?? 0}%</strong>
              </div>
              {!tradeResult.order_allowed && tradeResult.compliant_alternatives?.length > 0 && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dark)' }}>
                  Compliant alternatives: <strong>{tradeResult.compliant_alternatives.map((a) => a.symbol).join(', ')}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ready-to-Use Code Snippets */}
        <div style={{ background: 'var(--bg)', borderRadius: 18, padding: 22, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={17} color="var(--primary)" /> Integration Snippets
            </h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {['curl', 'js', 'python'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  style={{
                    padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                    border: `1px solid ${lang === l ? 'var(--primary)' : 'var(--border)'}`,
                    background: lang === l ? 'var(--primary-50)' : 'var(--bg-section)',
                    color: lang === l ? 'var(--primary)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {l}
                </button>
              ))}
              <button
                type="button"
                onClick={handleCopySnippet}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-dark)',
                }}
              >
                {copiedSnippet ? <Check size={12} /> : <Copy size={12} />}
                {copiedSnippet ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <pre style={{
            margin: 0, padding: 14, borderRadius: 12,
            background: '#0F172A', color: '#E2E8F0',
            fontSize: '0.74rem', lineHeight: 1.55, overflowX: 'auto',
          }}>
            <code>{snippets[lang]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
