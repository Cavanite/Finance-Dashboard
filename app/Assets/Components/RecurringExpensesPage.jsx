import { useState, useEffect } from 'react';

const fmt = (v) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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

function AddRecurringModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/recurring-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onSuccess();
      } else {
        alert('Failed to add recurring expense');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding recurring expense');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-panel border border-rim rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="font-display text-[18px] font-bold tracking-tight mb-4">Add Recurring Expense</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-fg2 uppercase tracking-wide mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2.5 bg-base border border-rim rounded-lg text-fg1 text-[13px] focus:outline-none focus:border-accent transition-colors"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-fg2 uppercase tracking-wide mb-2">Category</label>
            <input
              type="text"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 bg-base border border-rim rounded-lg text-fg1 text-[13px] focus:outline-none focus:border-accent transition-colors"
              placeholder="e.g. Utilities, Rent"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-fg2 uppercase tracking-wide mb-2">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-base border border-rim rounded-lg text-fg1 text-[13px] focus:outline-none focus:border-accent transition-colors"
              placeholder="Optional notes"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-fg2 uppercase tracking-wide mb-2">Frequency</label>
            <select
              required
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="w-full px-3 py-2.5 bg-base border border-rim rounded-lg text-fg1 text-[13px] focus:outline-none focus:border-accent transition-colors"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-fg2 uppercase tracking-wide mb-2">Start Date</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-base border border-rim rounded-lg text-fg1 text-[13px] focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-fg2 uppercase tracking-wide mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-base border border-rim rounded-lg text-fg1 text-[13px] focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-[13px] text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0"
              style={{ background: '#5e60f0' }}
            >
              Add Recurring Expense
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-[13px] text-fg2 border border-rim transition-colors hover:text-fg1 hover:border-rim2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RecurringExpensesPage({ onMutate }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const res = await fetch('/api/recurring-expenses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` },
      });
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this recurring expense?')) return;
    try {
      const res = await fetch(`/api/recurring-expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` },
      });
      if (res.ok) {
        setExpenses(expenses.filter(e => e.id !== id));
        onMutate?.();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGenerate(id) {
    try {
      const res = await fetch(`/api/recurring-expenses/${id}/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` },
      });
      if (res.ok) {
        alert('Transaction generated!');
        fetchExpenses();
        onMutate?.();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error generating transaction');
    }
  }

  if (loading) return <Loader />;

  return (
    <div>
      {/* Header with button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight">Recurring Expenses</h1>
          <p className="text-[13px] text-fg3 mt-1">Set up expenses that repeat automatically</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-[13px] text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0"
          style={{ background: '#5e60f0' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Recurring
        </button>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="bg-panel border border-rim rounded-2xl p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto opacity-20 mb-4">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <p className="text-[14px] font-semibold text-fg2 mb-2">No recurring expenses yet</p>
          <p className="text-[12px] text-fg3">Create your first recurring expense to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="bg-panel border border-rim rounded-xl p-4 flex items-center justify-between transition-all duration-150 hover:border-rim2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-[14px] text-fg1">{expense.description || expense.category}</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase" style={{ background: 'rgba(94,96,240,0.2)', color: '#5e60f0' }}>
                    {expense.frequency}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-fg3">
                  <span>Category: <strong className="text-fg2">{expense.category}</strong></span>
                  <span>From: <strong className="text-fg2">{fmtDate(expense.start_date)}</strong></span>
                  {expense.end_date && <span>Until: <strong className="text-fg2">{fmtDate(expense.end_date)}</strong></span>}
                  {expense.last_generated && <span>Last: <strong className="text-fg2">{fmtDate(expense.last_generated)}</strong></span>}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-[14px] text-fg1 whitespace-nowrap">{fmt(expense.amount)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerate(expense.id)}
                    className="px-3 py-2 rounded-lg font-medium text-[12px] text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0"
                    style={{ background: '#05d896' }}
                    title="Generate transaction now"
                  >
                    Generate
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="px-3 py-2 rounded-lg font-medium text-[12px] text-fg2 border border-rim transition-colors hover:text-fg1 hover:border-rim2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddRecurringModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchExpenses();
            onMutate?.();
          }}
        />
      )}
    </div>
  );
}
