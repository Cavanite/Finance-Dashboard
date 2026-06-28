import { useState, useEffect, useRef } from 'react';

/* ── helpers ──────────────────────────────────── */
const LS_GOALS = 'ff_savings_goals';
const BLUE     = '#2fb8f0';

const fmt = (v) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0);

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function daysLeft(deadline) {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

function getGoals() {
    try { return JSON.parse(localStorage.getItem(LS_GOALS) || '[]'); }
    catch { return []; }
}
function saveGoals(g) { localStorage.setItem(LS_GOALS, JSON.stringify(g)); }

const GOAL_COLORS = [
    { value: '#2fb8f0', label: 'Sky'    },
    { value: '#05d896', label: 'Green'  },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#f5b800', label: 'Amber'  },
    { value: '#ff3d6b', label: 'Rose'   },
    { value: '#f97316', label: 'Orange' },
];

/* ── shared input styles ──────────────────────── */
const iStyle = { background: '#060812', border: '1px solid #222840', color: '#eceef8' };
const iCls   = 'w-full px-3 py-2.5 rounded-md text-fg1 font-sans text-[13.5px] outline-none transition-colors duration-150 placeholder:text-fg3';
const bFocus = (e) => { e.target.style.borderColor = BLUE;      e.target.style.boxShadow = '0 0 0 3px rgba(47,184,240,0.12)'; };
const blurO  = (e) => { e.target.style.borderColor = '#222840'; e.target.style.boxShadow = ''; };

/* ── icons ────────────────────────────────────── */
function PlusIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function TrashIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function CheckIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function TargetIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function EditIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function SpinDot()    { return <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent flex-shrink-0" style={{ animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />; }

/* ─────────────────────────────────────────────── */
/*  GOAL CARD                                      */
/* ─────────────────────────────────────────────── */
function GoalCard({ goal, onAddTo, onDelete, onEdit }) {
    const pct       = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
    const done      = pct >= 100;
    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
    const days      = daysLeft(goal.deadline);
    const [hov, setHov] = useState(false);

return (
    <div
        className="bg-panel border border-rim rounded-2xl p-5 relative overflow-hidden transition-all duration-300 cursor-default flex flex-col gap-0"
            style={{
            borderColor: hov ? '#222840' : '#181d30',
            transform:   hov ? 'translateY(-2px)' : 'translateY(0)',
            boxShadow:   hov ? `0 12px 36px ${goal.color}20` : 'none',
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
    >
      {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: goal.color }} />
      {/* Glow orb */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none transition-opacity duration-500"
            style={{ background: `${goal.color}18`, filter: 'blur(20px)', opacity: hov ? 0.7 : 0 }} />

      {/* Header */}
        <div className="flex items-start justify-between mb-3 relative">
        <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: goal.color, boxShadow: `0 0 7px ${goal.color}80` }} />
            <h3 className="font-display text-[14px] font-bold tracking-tight truncate">{goal.name}</h3>
            {done && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(5,216,150,0.12)', color: '#05d896' }}>
                <CheckIcon /> Done!
            </span>
            )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button onClick={() => onEdit(goal)}
            className="w-6 h-6 rounded flex items-center justify-center text-fg3 hover:text-fg1 transition-colors cursor-pointer"
            style={{ background: 'transparent', border: 'none' }}>
            <EditIcon />
            </button>
            <button onClick={() => onDelete(goal.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-fg3 transition-colors cursor-pointer"
            style={{ background: 'transparent', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff3d6b'}
            onMouseLeave={e => e.currentTarget.style.color = ''}>
            <TrashIcon />
            </button>
        </div>
    </div>

      {/* Amounts */}
        <div className="flex items-end justify-between mb-3">
            <div>
                <p className="font-display text-[22px] font-extrabold tracking-tight leading-none" style={{ color: goal.color }}>
                {fmt(goal.savedAmount)}
                </p>
                <p className="text-[11.5px] text-fg3 mt-0.5">of {fmt(goal.targetAmount)}</p>
            </div>
            <div className="text-right">
                <p className="font-display text-[18px] font-bold tracking-tight text-fg2">{pct.toFixed(1)}%</p>
                {!done && <p className="text-[11px] text-fg3">{fmt(remaining)} left</p>}
            </div>
        </div>

      {/* Progress bar */}
        <div className="h-2.5 rounded-full mb-3 overflow-hidden" style={{ background: '#181d30' }}>
            <div
            className="h-full rounded-full transition-all duration-700"
            style={{
            width: `${pct.toFixed(1)}%`,
            background: done
                ? 'linear-gradient(90deg, #05d896, #05d89655)'
                : `linear-gradient(90deg, ${goal.color}, ${goal.color}55)`,
            }}
            />
        </div>

      {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
            <div className="text-[11.5px] text-fg3">
                {goal.deadline && days !== null && (
                days > 0  ? <><span className="font-medium text-fg2">{days}</span> days left · {fmtDate(goal.deadline)}</> :
                days === 0 ? <span style={{ color: '#f5b800' }}>Due today</span> :
                                <span style={{ color: '#ff3d6b' }}>Overdue · {fmtDate(goal.deadline)}</span>
            )}
        </div>
        {!done && (
            <button
                onClick={() => onAddTo(goal)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer border"
                style={{ background: `${goal.color}14`, color: goal.color, borderColor: `${goal.color}30` }}
                onMouseEnter={e => { e.currentTarget.style.background = `${goal.color}25`; e.currentTarget.style.boxShadow = `0 4px 12px ${goal.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${goal.color}14`; e.currentTarget.style.boxShadow = ''; }}>
                <PlusIcon /> Add savings
            </button>
            )}
        </div>
    </div>
);
}

/* ─────────────────────────────────────────────── */
/*  GOAL FORM (add + edit)                         */
/* ─────────────────────────────────────────────── */
function GoalForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || {
    name: '', targetAmount: '', savedAmount: '0', color: GOAL_COLORS[0].value, deadline: '',
  });
  const [err, setErr] = useState('');
  const setFld = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));

  const dynFocus = (e) => { e.target.style.borderColor = f.color; e.target.style.boxShadow = `0 0 0 3px ${f.color}20`; };

  function submit(e) {
    e.preventDefault();
    if (!f.name.trim())                                 { setErr('Give this goal a name.'); return; }
    if (!f.targetAmount || Number(f.targetAmount) <= 0) { setErr('Enter a valid target amount.'); return; }
    setErr('');
    onSave({
      name:         f.name.trim(),
      targetAmount: Number(f.targetAmount),
      savedAmount:  Number(f.savedAmount) || 0,
      color:        f.color,
      deadline:     f.deadline || null,
    });
  }

  return (
    <form onSubmit={submit} className="px-6 py-5 border-b border-rim" style={{ background: 'rgba(47,184,240,0.02)' }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-fg3 mb-3">
        {initial ? 'Edit goal' : 'New savings goal'}
      </p>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Goal name</label>
          <input type="text" value={f.name} onChange={setFld('name')}
            placeholder="Emergency Fund…" className={iCls} style={iStyle}
            onFocus={dynFocus} onBlur={blurO} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Target (€)</label>
          <input type="number" step="0.01" min="1" value={f.targetAmount} onChange={setFld('targetAmount')}
            placeholder="5000.00" className={iCls} style={iStyle}
            onFocus={dynFocus} onBlur={blurO} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Already saved (€)</label>
          <input type="number" step="0.01" min="0" value={f.savedAmount} onChange={setFld('savedAmount')}
            placeholder="0.00" className={iCls} style={iStyle}
            onFocus={dynFocus} onBlur={blurO} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Deadline (optional)</label>
          <input type="date" value={f.deadline || ''} onChange={setFld('deadline')}
            className={iCls} style={{ ...iStyle, colorScheme: 'dark' }}
            onFocus={dynFocus} onBlur={blurO} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg2">Color</label>
          <div className="flex gap-2.5 items-center" style={{ height: 42 }}>
            {GOAL_COLORS.map(({ value, label }) => (
              <button key={value} type="button" title={label}
                onClick={() => setF(p => ({ ...p, color: value }))}
                className="w-7 h-7 rounded-full transition-all duration-150 cursor-pointer flex-shrink-0"
                style={{
                  background: value,
                  transform:  f.color === value ? 'scale(1.3)'  : 'scale(1)',
                  boxShadow:  f.color === value ? `0 0 0 2px #07090f, 0 0 0 4px ${value}` : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {err && <p className="mt-3 text-[12px] font-medium px-3 py-2 rounded-md" style={{ background: 'rgba(255,61,107,0.1)', color: '#ff3d6b' }}>{err}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-md text-fg2 hover:text-fg1 text-[13px] font-medium transition-colors cursor-pointer border border-rim2"
          style={{ background: 'transparent' }}>Cancel</button>
        <button type="submit"
          className="px-5 py-2 rounded-md text-[13px] font-bold text-white transition-all cursor-pointer"
          style={{ background: f.color }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.boxShadow = `0 4px 14px ${f.color}50`; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.boxShadow = ''; }}>
          {initial ? 'Save changes' : 'Create goal'}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────── */
/*  GOALS SECTION                                  */
/* ─────────────────────────────────────────────── */
function GoalsSection({ onQuickAdd }) {
  const [goals,    setGoals]    = useState(getGoals);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  function addGoal(fields) {
    const next = [...goals, { id: Date.now().toString(), ...fields }];
    setGoals(next); saveGoals(next); setShowForm(false);
  }
  function updateGoal(id, fields) {
    const next = goals.map(g => g.id === id ? { ...g, ...fields } : g);
    setGoals(next); saveGoals(next); setEditing(null);
  }
  function deleteGoal(id) {
    const next = goals.filter(g => g.id !== id);
    setGoals(next); saveGoals(next);
  }
  function handleGoalDeposit(goal, amount) {
    const next = goals.map(g =>
      g.id === goal.id ? { ...g, savedAmount: g.savedAmount + Number(amount) } : g
    );
    setGoals(next); saveGoals(next);
  }

  return (
    <div className="mb-6">
      <div className="bg-panel border border-rim rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rim">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(47,184,240,0.12)', color: BLUE }}>
              <TargetIcon />
            </div>
            <div>
              <h2 className="font-display text-[14.5px] font-bold tracking-tight">Savings Goals</h2>
              <p className="text-[11.5px] text-fg3">Track progress toward your financial targets</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(f => !f); setEditing(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-all duration-150 cursor-pointer border"
            style={{ background: showForm ? 'rgba(47,184,240,0.18)' : 'rgba(47,184,240,0.1)', color: BLUE, borderColor: 'rgba(47,184,240,0.22)' }}>
            {showForm ? '× Cancel' : <><PlusIcon /> New goal</>}
          </button>
        </div>

        {showForm && !editing && (
          <GoalForm onSave={addGoal} onCancel={() => setShowForm(false)} />
        )}
        {editing && (
          <GoalForm initial={editing} onSave={(f) => updateGoal(editing.id, f)} onCancel={() => setEditing(null)} />
        )}

        {goals.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-fg3">
            <div className="opacity-20 mb-1" style={{ color: BLUE }}><TargetIcon /></div>
            <p className="text-[13px] font-semibold text-fg2">No goals yet</p>
            <p className="text-[12px]">Click "New goal" to set your first savings target.</p>
          </div>
        ) : goals.length > 0 && (
          <div className="grid gap-4 p-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={deleteGoal}
                onEdit={(g) => { setEditing(g); setShowForm(false); }}
                onAddTo={(g) => onQuickAdd(g, (amt) => handleGoalDeposit(g, amt))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  MAIN PAGE                                      */
/* ─────────────────────────────────────────────── */
export default function SavingsPage({ onMutate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [deleting,     setDeleting]     = useState(null);
  const [quickGoal,    setQuickGoal]    = useState(null);
  const depositCallbackRef              = useRef(null);
  const formRef                         = useRef(null);

  const [form, setForm] = useState({
    amount: '', category: '', description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetch('/api/transactions').then(r => r.json());
      setTransactions((Array.isArray(data) ? data : []).filter(t => t.type === 'savings'));
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAdd(goal, onDeposit) {
    setQuickGoal(goal);
    depositCallbackRef.current = onDeposit;
    setForm(p => ({ ...p, category: goal.name, description: `Savings for ${goal.name}` }));
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) { setError('Enter a valid positive amount.'); return; }
    if (!form.date) { setError('Please select a date.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:      amt,
          category:    form.category  || null,
          description: form.description || null,
          date:        form.date,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const newTx = await res.json();
      setTransactions(prev => [newTx, ...prev]);
      depositCallbackRef.current?.(amt);
      depositCallbackRef.current = null;
      setQuickGoal(null);
      setForm(p => ({ ...p, amount: '', category: '', description: '' }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      onMutate?.();
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      setTransactions(prev => prev.filter(t => t.id !== id));
      onMutate?.();
    } finally {
      setDeleting(null);
    }
  }

  const total     = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).reduce((s, t) => s + Number(t.amount), 0);
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="anim-fade-up">

      {/* ── SUMMARY BANNER ──────────────────────── */}
      <div className="rounded-2xl p-6 mb-6 relative overflow-hidden border"
           style={{ background: 'rgba(47,184,240,0.06)', borderColor: 'rgba(47,184,240,0.2)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
             style={{ background: 'rgba(47,184,240,0.08)', filter: 'blur(32px)' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: BLUE }}>Total Savings</p>
            <p className="font-display text-[42px] font-extrabold tracking-tight leading-none" style={{ color: BLUE }}>{fmt(total)}</p>
            <p className="text-[12px] text-fg3 mt-2">{transactions.length} {transactions.length === 1 ? 'entry' : 'entries'} recorded</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-fg3 mb-1">This month</p>
            <p className="font-display text-[22px] font-bold tracking-tight" style={{ color: BLUE }}>{fmt(thisMonth)}</p>
          </div>
        </div>
      </div>

      {/* ── GOALS ───────────────────────────────── */}
      <GoalsSection onQuickAdd={handleQuickAdd} />

      {/* ── ADD FORM + HISTORY ──────────────────── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: '380px 1fr' }}>

        {/* Form */}
        <div ref={formRef}>
          <div className="bg-panel border rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(47,184,240,0.2)' }}>
            <div className="px-6 py-4 border-b flex items-center gap-3"
                 style={{ borderColor: 'rgba(47,184,240,0.15)', background: 'rgba(47,184,240,0.04)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(47,184,240,0.14)', color: BLUE }}>
                <PlusIcon />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-[14.5px] font-bold tracking-tight truncate">
                  {quickGoal ? `Save toward: ${quickGoal.name}` : 'Add Savings'}
                </h2>
                <p className="text-[11.5px] text-fg3">
                  {quickGoal ? 'Updates your goal progress automatically' : 'Record a new savings entry'}
                </p>
              </div>
              {quickGoal && (
                <button onClick={() => { setQuickGoal(null); depositCallbackRef.current = null; setForm(p => ({ ...p, category: '', description: '' })); }}
                  className="text-fg3 hover:text-fg1 text-[20px] leading-none transition-colors cursor-pointer"
                  style={{ background: 'transparent', border: 'none' }}>×</button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Amount (€)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[15px] font-bold pointer-events-none" style={{ color: BLUE }}>€</span>
                  <input type="number" step="0.01" min="0.01" value={form.amount} onChange={setF('amount')}
                    placeholder="0.00" className={iCls}
                    style={{ ...iStyle, paddingLeft: '1.75rem', fontSize: 17, fontFamily: 'DM Mono, monospace', fontWeight: 600 }}
                    onFocus={bFocus} onBlur={blurO} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Category / Goal</label>
                <input type="text" value={form.category} onChange={setF('category')}
                  placeholder="Emergency Fund, Vacation…" className={iCls} style={iStyle}
                  onFocus={bFocus} onBlur={blurO} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Description</label>
                <input type="text" value={form.description} onChange={setF('description')}
                  placeholder="Optional note…" className={iCls} style={iStyle}
                  onFocus={bFocus} onBlur={blurO} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Date</label>
                <input type="date" value={form.date} onChange={setF('date')}
                  className={iCls} style={{ ...iStyle, colorScheme: 'dark' }}
                  onFocus={bFocus} onBlur={blurO} />
              </div>
              {error   && <p className="text-[12px] font-medium px-3 py-2 rounded-md" style={{ background: 'rgba(255,61,107,0.1)', color: '#ff3d6b' }}>{error}</p>}
              {success && (
                <p className="text-[12px] font-medium px-3 py-2 rounded-md flex items-center gap-2" style={{ background: 'rgba(47,184,240,0.1)', color: BLUE }}>
                  <CheckIcon /> Savings entry saved!
                </p>
              )}
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-md font-bold text-[13.5px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                style={{ background: BLUE, color: '#07090f' }}
                onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = '#28a8d8'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(47,184,240,0.35)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.boxShadow = ''; }}>
                {submitting ? <><SpinDot /> Saving…</> : <><PlusIcon /> Add Savings Entry</>}
              </button>
            </form>
          </div>
        </div>

        {/* History table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[15px] font-bold tracking-tight">Savings History</h2>
            <span className="text-[11.5px] text-fg3 font-mono">{sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="bg-panel border border-rim rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-16">
                {[0, 200, 400].map((d, i) => (
                  <span key={i} className="w-2 h-2 rounded-full" style={{ background: BLUE, animation: `blink 1.2s ${d}ms ease-in-out infinite` }} />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-fg3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-20 mb-2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <p className="text-[13px] font-semibold" style={{ color: '#7b82a2' }}>No savings entries yet</p>
                <p className="text-[12px]">Use the form or click "Add savings" on a goal card above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
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
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(47,184,240,0.025)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td className="px-5 py-3.5 font-mono text-[11.5px] text-fg3 whitespace-nowrap">{fmtDate(tx.date)}</td>
                        <td className="px-5 py-3.5 text-[13px] font-medium text-fg1 max-w-[200px]">
                          <span className="block truncate">{tx.description || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {tx.category
                            ? <span className="inline-block px-2.5 py-0.5 rounded-md text-[11.5px] font-medium" style={{ background: 'rgba(47,184,240,0.1)', color: BLUE }}>{tx.category}</span>
                            : <span className="text-fg3">—</span>}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-[14px] whitespace-nowrap" style={{ color: BLUE }}>{fmt(tx.amount)}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => handleDelete(tx.id)} disabled={deleting === tx.id}
                            className="w-7 h-7 rounded-md border border-rim2 flex items-center justify-center text-fg3 transition-all duration-150 cursor-pointer disabled:opacity-50"
                            style={{ background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,61,107,0.1)'; e.currentTarget.style.color = '#ff3d6b'; e.currentTarget.style.borderColor = '#ff3d6b'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}>
                            {deleting === tx.id
                              ? <span className="w-3 h-3 rounded-full border border-fg3 border-t-transparent" style={{ animation: 'spin 0.7s linear infinite' }} />
                              : <TrashIcon />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
