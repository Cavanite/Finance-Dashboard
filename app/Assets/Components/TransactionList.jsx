import { useState, useEffect } from 'react';
import AddTransactionModal from './AddTransactionModal';

const fmt = (v) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TYPE_CFG = {
  income:  { color: '#05d896', bg: 'rgba(5,216,150,0.1)' },
  expense: { color: '#ff3d6b', bg: 'rgba(255,61,107,0.1)' },
  savings: { color: '#2fb8f0', bg: 'rgba(47,184,240,0.1)' },
};

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'income',  label: 'Income' },
  { id: 'expense', label: 'Expense' },
  { id: 'savings', label: 'Savings' },
];

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

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

export default function TransactionList({ filter = 'all', onDelete }) {
  const [txs,      setTxs]      = useState([]);
  const [active,   setActive]   = useState(filter);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [editingTx, setEditingTx] = useState(null);

  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then(data => { setTxs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      setTxs(prev => prev.filter(t => t.id !== id));
      onDelete?.();
    } finally {
      setDeleting(null);
    }
  }

  function handleEditSuccess() {
    setEditingTx(null);
    fetch('/api/transactions')
      .then(r => r.json())
      .then(data => setTxs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  const filtered = active === 'all' ? txs : txs.filter(t => t.type === active);
  const sorted   = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const titleMap = { all: 'All Transactions', income: 'Income', expense: 'Expense', savings: 'Savings' };

  return (
    <div className="anim-fade-up">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-[17px] font-bold tracking-tight">{titleMap[active]}</h2>
          <p className="text-[12px] text-fg3 mt-0.5">
            {loading ? 'Loading…' : `${sorted.length} ${sorted.length === 1 ? 'entry' : 'entries'}`}
          </p>
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-1 p-1 rounded-lg border border-rim"
          style={{ background: '#060812' }}
        >
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={[
                'px-4 py-1.5 rounded-md text-[12.5px] font-medium transition-colors duration-150 cursor-pointer',
                active === id ? 'text-fg1' : 'text-fg2 hover:text-fg1',
              ].join(' ')}
              style={active === id ? { background: '#0d1020', boxShadow: '0 1px 6px rgba(0,0,0,0.5)' } : { background: 'transparent' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-panel border border-rim rounded-2xl overflow-hidden">
        {loading ? (
          <Loader />
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-fg3">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-25 mb-2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <p className="text-[14px] text-fg2 font-semibold">No transactions found</p>
            <p className="text-[12.5px]">
              {active === 'all' ? 'Add your first transaction using the button above.' : `No ${active} entries yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                  {['Date', 'Description', 'Category', 'Amount', 'Type', ''].map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-fg3 border-b border-rim whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => {
                  const cfg = TYPE_CFG[tx.type] || TYPE_CFG.income;
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-rim last:border-0"
                      style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.018)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td className="px-6 py-3.5 font-mono text-[11.5px] text-fg3 whitespace-nowrap">
                        {fmtDate(tx.date)}
                      </td>
                      <td className="px-6 py-3.5 text-[13px] font-medium text-fg1 max-w-[200px]">
                        <span className="block truncate">{tx.description || '—'}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        {tx.category ? (
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-md text-[11.5px] text-fg2 font-medium"
                            style={{ background: 'rgba(34,40,64,0.5)' }}
                          >
                            {tx.category}
                          </span>
                        ) : (
                          <span className="text-fg3">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-semibold text-[13px] whitespace-nowrap" style={{ color: cfg.color }}>
                        {fmt(tx.amount)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingTx(tx)}
                            className="w-7 h-7 rounded-md border border-rim2 flex items-center justify-center text-fg3 transition-all duration-150 cursor-pointer"
                            style={{ background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(94,96,240,0.1)'; e.currentTarget.style.color = '#5e60f0'; e.currentTarget.style.borderColor = '#5e60f0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}
                            title="Edit transaction"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deleting === tx.id}
                            className="w-7 h-7 rounded-md border border-rim2 flex items-center justify-center text-fg3 transition-all duration-150 cursor-pointer disabled:opacity-50"
                            style={{ background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,61,107,0.1)'; e.currentTarget.style.color = '#ff3d6b'; e.currentTarget.style.borderColor = '#ff3d6b'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}
                            title="Delete transaction"
                          >
                            {deleting === tx.id ? (
                              <span
                                className="w-3 h-3 rounded-full border border-fg3 border-t-transparent"
                                style={{ animation: 'spin 0.7s linear infinite' }}
                              />
                            ) : (
                              <TrashIcon />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
