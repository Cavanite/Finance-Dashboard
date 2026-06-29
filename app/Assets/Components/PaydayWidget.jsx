import { useState, useEffect } from 'react';

const fmt = (v) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PaydayWidget() {
  const [paydata, setPaydata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayday();
  }, []);

  async function fetchPayday() {
    try {
      const res = await fetch('/api/payday', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` },
      });
      if (res.ok) {
        setPaydata(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !paydata?.nextPayday) {
    return null;
  }

  const frequencyEmoji = {
    daily: '📅',
    'bi-weekly': '📆',
    weekly: '📆',
    monthly: '📅',
    unknown: '❓',
  };

  const getCountdownColor = (days) => {
    if (days <= 3) return '#05d896'; // Green - very soon
    if (days <= 7) return '#ffa726'; // Orange - within a week
    return '#2fb8f0'; // Blue - more time
  };

  return (
    <div className="bg-gradient-to-br from-panel to-panel border border-rim rounded-2xl p-6 overflow-hidden relative">
      {/* Accent gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-fg3 mb-1">
              {frequencyEmoji[paydata.frequency]} Next Payday
            </p>
            <p className="font-display text-[28px] font-extrabold tracking-tight text-fg1">
              {fmtDate(paydata.nextPayday)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[24px] font-bold" style={{ color: getCountdownColor(paydata.daysUntil) }}>
              {paydata.daysUntil}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-fg3">
              {paydata.daysUntil === 1 ? 'day' : 'days'} left
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Frequency Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-fg2">Frequency:</span>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold capitalize"
              style={{ background: 'rgba(94,96,240,0.2)', color: '#5e60f0' }}
            >
              {paydata.frequency} ({paydata.avgCycle} days)
            </span>
          </div>

          {/* Last Payday */}
          <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[12px] font-semibold text-fg2">Last Payday</span>
            <span className="font-mono text-[12px] text-fg1">{fmtDate(paydata.lastPayday)}</span>
          </div>

          {/* Average Income */}
          <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(5,216,150,0.1)' }}>
            <span className="text-[12px] font-semibold text-fg2">Average Per Paycheck</span>
            <span className="font-mono font-bold text-[12px]" style={{ color: '#05d896' }}>
              {paydata.recentIncomes.length > 0 ? fmt(paydata.recentIncomes[0].amount) : '—'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-rim">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase text-fg3">Time until payday</span>
            <span className="text-[10px] font-mono text-fg3">{Math.max(0, 100 - Math.round((paydata.daysUntil / paydata.avgCycle) * 100))}%</span>
          </div>
          <div className="h-1.5 bg-base rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(0, 100 - Math.round((paydata.daysUntil / paydata.avgCycle) * 100))}%`,
                background: `linear-gradient(90deg, ${getCountdownColor(paydata.daysUntil)}, ${getCountdownColor(paydata.daysUntil)}cc)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
