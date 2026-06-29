import { useState, useEffect } from 'react';
import AddTransactionModal from './AddTransactionModal';

/* ── helpers ──────────────────────────────────── */
const LS_KEY = 'ff_recurring_income';

const fmt = (v) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getTemplates() {
  const key = `${LS_KEY}:${localStorage.getItem('ff_username') || 'default'}`;
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}
function saveTemplates(tpls) {
  const key = `${LS_KEY}:${localStorage.getItem('ff_username') || 'default'}`;
  localStorage.setItem(key, JSON.stringify(tpls));
}

// Returns 'posted' | 'due' | 'upcoming'
function getStatus(tpl) {
  const now  = new Date();
  const ym   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (tpl.lastPosted?.startsWith(ym)) return 'posted';
  if (now.getDate() >= Number(tpl.dayOfMonth)) return 'due';
  return 'upcoming';
}

const CATS = ['Salary', 'Freelance', 'Investment', 'Dividend', 'Rental', 'Bonus', 'Side Project', 'Other'];

/* ── shared style helpers ─────────────────────── */
const iStyle = { background: '#060812', border: '1px solid #222840', color: '#eceef8' };
const iCls   = 'w-full px-3 py-2.5 rounded-md text-fg1 font-sans text-[13.5px] outline-none transition-colors duration-150 placeholder:text-fg3';

const gFocus  = (e) => { e.target.style.borderColor = '#05d896'; e.target.style.boxShadow = '0 0 0 3px rgba(5,216,150,0.12)'; };
const aFocus  = (e) => { e.target.style.borderColor = '#5e60f0'; e.target.style.boxShadow = '0 0 0 3px rgba(94,96,240,0.12)'; };
const blurOut = (e) => { e.target.style.borderColor = '#222840'; e.target.style.boxShadow = ''; };

/* ── icons ────────────────────────────────────── */
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function RepeatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 014-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 01-4 4H3"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function SpinnerDot() {
  return (
    <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent"
          style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
  );
}

/* ─────────────────────────────────────────────── */
/*  RECURRING SECTION                              */
/* ─────────────────────────────────────────────── */
function RecurringSection({ onNewTransaction, onMutate }) {
  const [templates, setTemplates] = useState(getTemplates);
  const [showForm,  setShowForm]  = useState(false);
  const [posting,   setPosting]   = useState(null);
  const [justPosted, setJustPosted] = useState(null);
  const [tplError,  setTplError]  = useState('');
  const authHeaders = { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` };

  const [form, setForm] = useState({
    label: '', amount: '', category: 'Salary',
    description: '', dayOfMonth: '25', time: '09:00',
  });
  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  function handleSave(e) {
    e.preventDefault();
    if (!form.label.trim())                                           { setTplError('Give this entry a name.'); return; }
    if (!form.amount || Number(form.amount) <= 0)                     { setTplError('Enter a valid amount.'); return; }
    const day = Number(form.dayOfMonth);
    if (!day || day < 1 || day > 28)                                  { setTplError('Day must be between 1 and 28.'); return; }
    setTplError('');

    const tpl = {
      id:          Date.now().toString(),
      label:       form.label.trim(),
      amount:      Number(form.amount),
      category:    form.category,
      description: form.description,
      dayOfMonth:  day,
      time:        form.time,
      lastPosted:  null,
    };
    const next = [...templates, tpl];
    setTemplates(next);
    saveTemplates(next);
    setForm({ label: '', amount: '', category: 'Salary', description: '', dayOfMonth: '25', time: '09:00' });
    setShowForm(false);
  }

  function removeTemplate(id) {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    saveTemplates(next);
  }

  async function postNow(tpl) {
    setPosting(tpl.id);
    try {
      const now   = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const day   = Math.min(tpl.dayOfMonth, daysInMonth);
      const date  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          amount:      tpl.amount,
          type:        'income',
          category:    tpl.category,
          description: tpl.description || tpl.label,
          date,
        }),
      });
      if (!res.ok) throw new Error();
      const newTx = await res.json();

      const next = templates.map(t => t.id === tpl.id ? { ...t, lastPosted: date } : t);
      setTemplates(next);
      saveTemplates(next);

      setJustPosted(tpl.id);
      setTimeout(() => setJustPosted(null), 3000);

      onNewTransaction?.(newTx);
      onMutate?.();
    } catch {
      alert('Failed to post. Please try again.');
    } finally {
      setPosting(null);
    }
  }

  const dueCount = templates.filter(t => getStatus(t) === 'due').length;

  return (
    <div className="mb-6">
      {/* Due alert */}
      {dueCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border"
          style={{ background: 'rgba(245,184,0,0.07)', borderColor: 'rgba(245,184,0,0.22)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5b800" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <p className="text-[13px] font-semibold" style={{ color: '#f5b800' }}>
            {dueCount === 1
              ? `1 recurring entry is due — post it to the database below`
              : `${dueCount} recurring entries are due this month`}
          </p>
        </div>
      )}

      <div className="bg-panel border border-rim rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-rim">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(94,96,240,0.12)', color: '#5e60f0' }}>
              <RepeatIcon />
            </div>
            <div>
              <h2 className="font-display text-[14.5px] font-bold tracking-tight">Recurring Income</h2>
              <p className="text-[11.5px] text-fg3">Monthly entries — post to database when due</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(f => !f); setTplError(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all duration-150 cursor-pointer border"
            style={{ background: showForm ? 'rgba(94,96,240,0.18)' : 'rgba(94,96,240,0.1)', color: '#5e60f0', borderColor: 'rgba(94,96,240,0.22)' }}
          >
            {showForm ? '× Cancel' : <><PlusIcon /> Add</>}
          </button>
        </div>

        {/* ── inline add form ────────────────────── */}
        {showForm && (
          <form onSubmit={handleSave} className="px-6 py-5 border-b border-rim" style={{ background: 'rgba(94,96,240,0.025)' }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-fg3 mb-3">New recurring entry</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Name</label>
                <input type="text" value={form.label} onChange={setF('label')}
                  placeholder="Monthly Salary" className={iCls} style={iStyle}
                  onFocus={aFocus} onBlur={blurOut} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Amount (€)</label>
                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={setF('amount')}
                  placeholder="0.00" className={iCls} style={iStyle}
                  onFocus={aFocus} onBlur={blurOut} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Category</label>
                <input list="r-cats" type="text" value={form.category} onChange={setF('category')}
                  placeholder="Salary" className={iCls} style={iStyle}
                  onFocus={aFocus} onBlur={blurOut} />
                <datalist id="r-cats">{CATS.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Day of month</label>
                <input type="number" min="1" max="28" value={form.dayOfMonth} onChange={setF('dayOfMonth')}
                  placeholder="25" className={iCls} style={iStyle}
                  onFocus={aFocus} onBlur={blurOut} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Expected time</label>
                <input type="time" value={form.time} onChange={setF('time')}
                  className={iCls} style={{ ...iStyle, colorScheme: 'dark' }}
                  onFocus={aFocus} onBlur={blurOut} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Description</label>
                <input type="text" value={form.description} onChange={setF('description')}
                  placeholder="Optional note…" className={iCls} style={iStyle}
                  onFocus={aFocus} onBlur={blurOut} />
              </div>
            </div>
            {tplError && (
              <p className="mt-3 text-[12px] font-medium px-3 py-2 rounded-md" style={{ background: 'rgba(255,61,107,0.1)', color: '#ff3d6b' }}>
                {tplError}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-md text-fg2 hover:text-fg1 text-[13px] font-medium transition-colors cursor-pointer border border-rim2"
                style={{ background: 'transparent' }}>
                Cancel
              </button>
              <button type="submit"
                className="px-5 py-2 rounded-md text-[13px] font-bold text-white transition-all cursor-pointer"
                style={{ background: '#5e60f0' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7173f5'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(94,96,240,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#5e60f0'; e.currentTarget.style.boxShadow = ''; }}>
                Save Recurring Entry
              </button>
            </div>
          </form>
        )}

        {/* ── templates list ─────────────────────── */}
        {templates.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-fg3">
            <div className="opacity-20 mb-1"><RepeatIcon /></div>
            <p className="text-[13px] font-semibold text-fg2">No recurring entries</p>
            <p className="text-[12px]">Click "+ Add" to set up your monthly salary or other recurring income.</p>
          </div>
        ) : (
          <div>
            {templates.map((tpl, idx) => {
              const status     = getStatus(tpl);
              const days       = Number(tpl.dayOfMonth) - new Date().getDate();
              const isPosting  = posting    === tpl.id;
              const didPost    = justPosted === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4 border-b border-rim last:border-0"
                  style={{ transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  {/* Status dot */}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                    background: status === 'posted' ? '#05d896' : status === 'due' ? '#f5b800' : '#363d5a',
                    boxShadow: status === 'due' ? '0 0 6px rgba(245,184,0,0.6)' : 'none',
                  }} />

                  {/* Label + meta */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-fg1">{tpl.label}</span>
                      <span className="text-fg3 text-[11px]">·</span>
                      <span className="text-[11.5px] text-fg2">{tpl.category}</span>
                    </div>
                    <p className="text-[11.5px] text-fg3 mt-0.5">
                      Every month on the <span className="text-fg2 font-medium">{ordinal(tpl.dayOfMonth)}</span>
                      {tpl.time && <> at <span className="font-mono text-fg2">{tpl.time}</span></>}
                      {tpl.lastPosted && <> · last posted <span className="font-mono">{fmtDate(tpl.lastPosted)}</span></>}
                    </p>
                  </div>

                  {/* Amount */}
                  <p className="font-display text-[17px] font-extrabold tracking-tight flex-shrink-0 sm:self-auto self-start" style={{ color: '#05d896' }}>
                    {fmt(tpl.amount)}
                  </p>

                  {/* Status badge / action */}
                  <div className="flex-shrink-0 sm:self-auto self-start">
                    {(status === 'posted' || didPost) && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
                            style={{ background: 'rgba(5,216,150,0.1)', color: '#05d896' }}>
                        <CheckIcon /> Posted this month
                      </span>
                    )}
                    {status === 'upcoming' && !didPost && (
                      <span className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
                            style={{ background: 'rgba(54,61,90,0.45)', color: '#7b82a2' }}>
                        In {days} {days === 1 ? 'day' : 'days'}
                      </span>
                    )}
                    {status === 'due' && !didPost && (
                      <button
                        onClick={() => postNow(tpl)}
                        disabled={isPosting}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 border"
                        style={{ background: 'rgba(245,184,0,0.1)', color: '#f5b800', borderColor: 'rgba(245,184,0,0.25)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,184,0,0.2)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,184,0,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,184,0,0.1)'; e.currentTarget.style.boxShadow = ''; }}
                      >
                        {isPosting ? <SpinnerDot /> : <ClockIcon />}
                        {isPosting ? 'Posting…' : 'Post to database'}
                      </button>
                    )}
                  </div>

                  {/* Delete template */}
                  <button
                    onClick={() => removeTemplate(tpl.id)}
                    className="w-8 h-8 sm:w-7 sm:h-7 rounded-md border border-rim2 flex items-center justify-center text-fg3 transition-all duration-150 cursor-pointer flex-shrink-0 sm:self-auto self-end"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,61,107,0.1)'; e.currentTarget.style.color = '#ff3d6b'; e.currentTarget.style.borderColor = '#ff3d6b'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  MAIN PAGE                                      */
/* ─────────────────────────────────────────────── */
export default function IncomePage({ onMutate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [deleting,     setDeleting]     = useState(null);

  const [form, setForm] = useState({
    amount: '', category: '', description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const [editingTx,  setEditingTx]  = useState(null);
  const authHeaders = { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` };

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetch('/api/transactions', { headers: authHeaders }).then(r => r.json());
      setTransactions((Array.isArray(data) ? data : []).filter(t => t.type === 'income'));
    } finally {
      setLoading(false);
    }
  }

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) { setError('Enter a valid positive amount.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...form, amount: amt, type: 'income' }),
      });
      if (!res.ok) throw new Error();
      const newTx = await res.json();
      setTransactions(prev => [newTx, ...prev]);
      setForm(prev => ({ ...prev, amount: '', category: '', description: '' }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      onMutate?.();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers: authHeaders });
      setTransactions(prev => prev.filter(t => t.id !== id));
      onMutate?.();
    } finally {
      setDeleting(null);
    }
  }

  function handleNewRecurring(tx) {
    setTransactions(prev => [tx, ...prev]);
  }

  function handleEditSuccess() {
    setEditingTx(null);
    loadData();
    onMutate?.();
  }

  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).reduce((s, t) => s + Number(t.amount), 0);

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="anim-fade-up">

      {/* ── SUMMARY BANNER ──────────────────────── */}
      <div className="rounded-2xl p-6 mb-6 relative overflow-hidden border"
           style={{ background: 'rgba(5,216,150,0.06)', borderColor: 'rgba(5,216,150,0.2)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
             style={{ background: 'rgba(5,216,150,0.08)', filter: 'blur(32px)' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: '#05d896' }}>Income</p>
            <p className="font-display text-[42px] font-extrabold tracking-tight leading-none" style={{ color: '#05d896' }}>{fmt(thisMonth)}</p>
            <p className="text-[12px] text-fg3 mt-2">{transactions.length} {transactions.length === 1 ? 'entry' : 'entries'} recorded</p>
          </div>
        </div>
      </div>

      {/* ── RECURRING SECTION ───────────────────── */}
      <RecurringSection onNewTransaction={handleNewRecurring} onMutate={onMutate} />

      {/* ── BOTTOM: ADD FORM + HISTORY ──────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">

        {/* Add income form */}
        <div>
          <div className="bg-panel border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(5,216,150,0.2)' }}>
            <div className="px-6 py-4 border-b flex items-center gap-3"
                 style={{ borderColor: 'rgba(5,216,150,0.15)', background: 'rgba(5,216,150,0.04)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(5,216,150,0.14)', color: '#05d896' }}>
                <PlusIcon />
              </div>
              <div>
                <h2 className="font-display text-[14.5px] font-bold tracking-tight">Add Income</h2>
                <p className="text-[11.5px] text-fg3">Record a one-time income entry</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Amount (€)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[15px] font-bold pointer-events-none"
                        style={{ color: '#05d896' }}>€</span>
                  <input type="number" step="0.01" min="0.01" value={form.amount} onChange={setF('amount')}
                    placeholder="0.00" className={iCls}
                    style={{ ...iStyle, paddingLeft: '1.75rem', fontSize: 17, fontFamily: 'DM Mono, monospace', fontWeight: 600 }}
                    onFocus={gFocus} onBlur={blurOut} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Category</label>
                <input list="income-cats" type="text" value={form.category} onChange={setF('category')}
                  placeholder="Salary, Freelance…" className={iCls} style={iStyle}
                  onFocus={gFocus} onBlur={blurOut} />
                <datalist id="income-cats">{CATS.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Description</label>
                <input type="text" value={form.description} onChange={setF('description')}
                  placeholder="Optional note…" className={iCls} style={iStyle}
                  onFocus={gFocus} onBlur={blurOut} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Date</label>
                <input type="date" value={form.date} onChange={setF('date')}
                  className={iCls} style={{ ...iStyle, colorScheme: 'dark' }}
                  onFocus={gFocus} onBlur={blurOut} />
              </div>
              {error && <p className="text-[12px] font-medium px-3 py-2 rounded-md" style={{ background: 'rgba(255,61,107,0.1)', color: '#ff3d6b' }}>{error}</p>}
              {success && (
                <p className="text-[12px] font-medium px-3 py-2 rounded-md flex items-center gap-2" style={{ background: 'rgba(5,216,150,0.1)', color: '#05d896' }}>
                  <CheckIcon /> Income entry saved!
                </p>
              )}
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-md font-bold text-[13.5px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                style={{ background: '#05d896', color: '#07090f' }}
                onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = '#00c882'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(5,216,150,0.35)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#05d896'; e.currentTarget.style.boxShadow = ''; }}>
                {submitting ? <><SpinnerDot /> Saving…</> : <><PlusIcon /> Add Income Entry</>}
              </button>
            </form>
          </div>
        </div>

        {/* Income history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[15px] font-bold tracking-tight">Income History</h2>
            <span className="text-[11.5px] text-fg3 font-mono">{sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="bg-panel border border-rim rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-16">
                {[0, 200, 400].map((d, i) => (
                  <span key={i} className="w-2 h-2 rounded-full" style={{ background: '#05d896', animation: `blink 1.2s ${d}ms ease-in-out infinite` }} />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-fg3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-20 mb-2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
                <p className="text-[13px] font-semibold" style={{ color: '#7b82a2' }}>No income entries yet</p>
                <p className="text-[12px]">Use the form on the left or post a recurring entry above.</p>
              </div>
            ) : (
              <>
                <div className="sm:hidden p-3 space-y-2">
                  {sorted.map(tx => (
                    <div key={tx.id} className="rounded-xl border border-rim p-3 bg-base/30">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[11px] text-fg3">{fmtDate(tx.date)}</span>
                        <span className="font-mono font-bold text-[13px]" style={{ color: '#05d896' }}>{fmt(tx.amount)}</span>
                      </div>
                      <p className="text-[13px] font-semibold text-fg1 truncate">{tx.description || '—'}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {tx.category
                          ? <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ background: 'rgba(5,216,150,0.1)', color: '#05d896' }}>{tx.category}</span>
                          : <span className="text-fg3 text-[11px]">—</span>}
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingTx(tx)} className="w-8 h-8 rounded-md border border-rim2 flex items-center justify-center text-fg2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(tx.id)} disabled={deleting === tx.id}
                            className="w-8 h-8 rounded-md border border-rim2 flex items-center justify-center text-fg2 disabled:opacity-50">
                            {deleting === tx.id
                              ? <span className="w-3 h-3 rounded-full border border-fg3 border-t-transparent" style={{ animation: 'spin 0.7s linear infinite' }} />
                              : <TrashIcon />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[680px]">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                        {['Date', 'Description', 'Category', 'Amount', ''].map((h, i) => (
                          <th key={i} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-fg3 border-b border-rim whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(tx => (
                        <tr key={tx.id} className="border-b border-rim last:border-0"
                            style={{ transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,216,150,0.025)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td className="px-5 py-3.5 font-mono text-[11.5px] text-fg3 whitespace-nowrap">{fmtDate(tx.date)}</td>
                          <td className="px-5 py-3.5 text-[13px] font-medium text-fg1 max-w-[200px]">
                            <span className="block truncate">{tx.description || '—'}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            {tx.category
                              ? <span className="inline-block px-2.5 py-0.5 rounded-md text-[11.5px] font-medium" style={{ background: 'rgba(5,216,150,0.1)', color: '#05d896' }}>{tx.category}</span>
                              : <span className="text-fg3">—</span>}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-[14px] whitespace-nowrap" style={{ color: '#05d896' }}>{fmt(tx.amount)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingTx(tx)}
                                className="w-7 h-7 rounded-md border border-rim2 flex items-center justify-center text-fg3 transition-all duration-150 cursor-pointer"
                                style={{ background: 'transparent' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                </svg>
                              </button>
                              <button onClick={() => handleDelete(tx.id)} disabled={deleting === tx.id}
                                className="w-7 h-7 rounded-md border border-rim2 flex items-center justify-center text-fg3 transition-all duration-150 cursor-pointer disabled:opacity-50"
                                style={{ background: 'transparent' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,61,107,0.1)'; e.currentTarget.style.color = '#ff3d6b'; e.currentTarget.style.borderColor = '#ff3d6b'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}>
                                {deleting === tx.id
                                  ? <span className="w-3 h-3 rounded-full border border-fg3 border-t-transparent" style={{ animation: 'spin 0.7s linear infinite' }} />
                                  : <TrashIcon />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {editingTx && (
        <AddTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
