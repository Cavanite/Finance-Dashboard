import { useState, useEffect } from 'react';

const fmt = (v) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' }) : '—';

const TYPE_CFG = {
  income:  { color: '#05d896', bg: 'rgba(5,216,150,0.1)',  glow: 'rgba(5,216,150,0.2)' },
  expense: { color: '#ff3d6b', bg: 'rgba(255,61,107,0.1)', glow: 'rgba(255,61,107,0.2)' },
  savings: { color: '#2fb8f0', bg: 'rgba(47,184,240,0.1)', glow: 'rgba(47,184,240,0.2)' },
};

function Loader() {
  return (
    <div className="flex items-center justify-center gap-2 p-20">
      {[0, 200, 400].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-accent"
          style={{ animation: `blink 1.2s ${delay}ms ease-in-out infinite` }}
        />
      ))}
    </div>
  );
}

function StatCard({ type, value, delay }) {
  const cfg = TYPE_CFG[type];
  const labels  = { income: 'Total Income',    expense: 'Total Expenses', savings: 'Total Savings' };
  const subtext = { income: 'All-time earnings', expense: 'All-time spending', savings: 'All-time saved' };
  const [hovered, setHovered] = useState(false);

  const Icon = {
    income: () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    expense: () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
      </svg>
    ),
    savings: () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
    ),
  }[type];

  return (
    <div
      className="relative bg-panel rounded-2xl border border-rim overflow-hidden anim-fade-up transition-all duration-300 cursor-default"
      style={{
        animationDelay: `${delay}ms`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        borderColor: hovered ? '#222840' : '#181d30',
        boxShadow: hovered ? `0 14px 40px ${cfg.glow}` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: cfg.color }} />

      {/* Glow orb */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full transition-opacity duration-500"
        style={{ background: cfg.bg, filter: 'blur(16px)', opacity: hovered ? 0.5 : 0 }}
      />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-fg2">{labels[type]}</p>
          <div
            className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <Icon />
          </div>
        </div>
        <p className="font-display text-[30px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: cfg.color }}>
          {fmt(value)}
        </p>
        <p className="text-[11.5px] text-white">{subtext[type]}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary,      setSummary]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/summary').then(r => r.json()).catch(() => ({})),
      fetch('/api/transactions').then(r => r.json()).catch(() => []),
    ]).then(([sum, txs]) => {
      setSummary(sum);
      setTransactions(Array.isArray(txs) ? txs : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loader />;

  const income  = Number(summary?.totalIncome)   || 0;
  const expense = Number(summary?.totalExpenses)  || 0;
  const savings = Number(summary?.totalSavings)   || 0;
  const maxVal  = Math.max(income, expense, savings, 1);

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const bars = [
    { key: 'income',  val: income,  color: '#05d896' },
    { key: 'expense', val: expense, color: '#ff3d6b' },
    { key: 'savings', val: savings, color: '#2fb8f0' },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard type="income"  value={income}  delay={0} />
        <StatCard type="expense" value={expense} delay={80} />
        <StatCard type="savings" value={savings} delay={160} />
      </div>

      {/* Bottom row */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '320px 1fr' }}>

        {/* Bar Chart */}
        <div className="bg-panel border border-rim rounded-2xl anim-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="px-6 pt-5">
            <h2 className="font-display text-[14.5px] font-bold tracking-tight">Overview</h2>
            <p className="text-[11.5px] text-white mt-0.5 mb-5">Breakdown by category</p>
          </div>
          <div className="px-6 pb-5 flex flex-col gap-5">
            {bars.map(({ key, val, color }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-14 text-right text-[11.5px] font-medium text-white capitalize flex-shrink-0">{key}</span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#181d30' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${((val / maxVal) * 100).toFixed(1)}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}55)`,
                    }}
                  />
                </div>
                <span className="w-24 font-mono text-[11.5px] text-white flex-shrink-0 text-right">{fmt(val)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 px-6 pb-5">
            {[['#05d896','Income'],['#ff3d6b','Expense'],['#2fb8f0','Savings']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5 text-[11px] text-white">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-panel border border-rim rounded-2xl overflow-hidden anim-fade-up" style={{ animationDelay: '260ms' }}>
          <div className="px-6 pt-5 pb-3 border-b border-rim">
            <h2 className="font-display text-[14.5px] font-bold tracking-tight">Recent Transactions</h2>
            <p className="text-[11.5px] text-white mt-0.5">Last 5 entries</p>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2 text-white">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-25 mb-2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <p className="text-[13px] text-white font-medium">No transactions yet</p>
              <p className="text-[11.5px] text-white">Add your first transaction above</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                  {['Date', 'Description', 'Category', 'Amount', 'Type'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white border-b border-rim">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => {
                  const cfg = TYPE_CFG[tx.type] || TYPE_CFG.income;
                  return (
                    <tr key={tx.id} className="border-b border-rim last:border-0" style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.018)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td className="px-5 py-3.5 font-mono text-[11.5px] text-fg3 whitespace-nowrap">{fmtDate(tx.date)}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-fg1 max-w-[140px]">
                        <span className="block truncate">{tx.description || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-fg2">{tx.category || '—'}</td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-[13px] whitespace-nowrap" style={{ color: cfg.color }}>
                        {fmt(tx.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {tx.type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
