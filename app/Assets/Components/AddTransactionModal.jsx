import { useState } from 'react';

const inputCls = [
  'w-full px-3 py-2.5 rounded-md text-fg1 font-sans text-[13.5px] outline-none',
  'transition-colors duration-150 placeholder:text-fg3',
].join(' ');

export default function AddTransactionModal({ onClose, onSuccess, transaction = null }) {
  const [form, setForm] = useState(
    transaction ? {
      amount:      transaction.amount,
      type:        transaction.type,
      category:    transaction.category || '',
      description: transaction.description || '',
      date:        transaction.date,
    } : {
      amount:      '',
      type:        'expense',
      category:    '',
      description: '',
      date:        new Date().toISOString().split('T')[0],
    }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const method = transaction ? 'PUT' : 'POST';
      const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) throw new Error('Server error');
      onSuccess();
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const sharedInputStyle = {
    background: '#060812',
    border: '1px solid #222840',
    color: '#eceef8',
  };

  const focusStyle = (e) => { e.target.style.borderColor = '#5e60f0'; e.target.style.boxShadow = '0 0 0 3px rgba(94,96,240,0.14)'; };
  const blurStyle  = (e) => { e.target.style.borderColor = '#222840'; e.target.style.boxShadow = ''; };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center anim-fade-in"
      style={{ background: 'rgba(4,6,12,0.88)', backdropFilter: 'blur(5px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-panel border border-rim3 rounded-2xl w-[460px] max-w-[calc(100vw-24px)] anim-slide-up"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="font-display text-[17px] font-extrabold tracking-tight">
              {transaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <p className="text-[12px] text-fg3 mt-0.5">
              {transaction ? 'Update this transaction' : 'Record an income, expense, or savings entry'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-rim2 flex items-center justify-center text-fg2 hover:text-fg1 text-[20px] leading-none transition-colors duration-150 cursor-pointer"
            style={{ background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = '#222840'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

          {/* Amount + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Amount (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={set('amount')}
                placeholder="0.00"
                className={inputCls}
                style={sharedInputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Type</label>
              <select
                value={form.type}
                onChange={set('type')}
                className={inputCls}
                style={{
                  ...sharedInputStyle,
                  appearance: 'none',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237b82a2' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 11px center',
                  paddingRight: 30,
                  cursor: 'pointer',
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={set('category')}
                placeholder="e.g. Salary, Food…"
                className={inputCls}
                style={sharedInputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={set('date')}
                className={inputCls}
                style={{ ...sharedInputStyle, colorScheme: 'dark' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.07em] text-fg2">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={set('description')}
              placeholder="Optional note…"
              className={inputCls}
              style={sharedInputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-[12px] font-medium px-3 py-2 rounded-md"
              style={{ background: 'rgba(255,61,107,0.1)', color: '#ff3d6b' }}
            >
              {error}
            </p>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-fg2 hover:text-fg1 text-[13.5px] font-medium transition-colors duration-150 cursor-pointer"
              style={{ background: 'transparent', border: '1px solid #222840' }}
              onMouseEnter={e => e.currentTarget.style.background = '#222840'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-md text-white text-[13.5px] font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ background: '#5e60f0', border: 'none' }}
              onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = '#7173f5'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(94,96,240,0.4)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = '#5e60f0'; e.currentTarget.style.boxShadow = ''; }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white" style={{ animation: 'spin 0.7s linear infinite' }} />
                  Saving…
                </span>
              ) : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
