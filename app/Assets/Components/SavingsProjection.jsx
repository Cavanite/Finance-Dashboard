import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const fmt = (v) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(v) || 0);

export default function SavingsProjection() {
  const [currentSavings, setCurrentSavings] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(500);
  const [monthsToProject, setMonthsToProject] = useState(12);
  const [interestRate, setInterestRate] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch current savings from API on component mount
  useEffect(() => {
    async function fetchSavings() {
      try {
        const res = await fetch('/api/summary', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentSavings(Number(data.totalSavings) || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSavings();
  }, []);

  // Recalculate projection when inputs change
  useEffect(() => {
    const data = [];
    let balance = currentSavings;
    const monthlyRate = interestRate / 100 / 12;

    for (let month = 0; month <= monthsToProject; month++) {
      data.push({
        month,
        label: month === 0 ? 'Today' : `+${month}m`,
        balance: parseFloat(balance.toFixed(2)),
      });

      if (month < monthsToProject) {
        balance += monthlySavings;
        balance += balance * monthlyRate;
      }
    }

    setChartData(data);
  }, [currentSavings, monthlySavings, monthsToProject, interestRate]);

  const projectedSavings = chartData[chartData.length - 1]?.balance || 0;
  const totalAdded = monthlySavings * monthsToProject;
  const interestEarned = projectedSavings - currentSavings - totalAdded;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-panel border border-rim rounded-lg p-3 shadow-xl">
          <p className="text-[11px] font-semibold text-fg1 mb-1">{data.label}</p>
          <p className="text-[12px] text-accent font-mono">
            {fmt(data.balance)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-panel border border-rim rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-fg3 mb-2">Current Savings</p>
          <p className="font-display text-[20px] font-bold text-fg1">{fmt(currentSavings)}</p>
        </div>
        <div className="bg-panel border border-rim rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-fg3 mb-2">Monthly Savings</p>
          <p className="font-display text-[20px] font-bold text-accent">{fmt(monthlySavings)}</p>
        </div>
        <div className="bg-panel border border-rim rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-fg3 mb-2">Interest Earned</p>
          <p className="font-display text-[20px] font-bold" style={{ color: interestEarned > 0 ? '#05d896' : '#ff3d6b' }}>
            {fmt(interestEarned)}
          </p>
        </div>
        <div className="bg-panel border border-rim rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-fg3 mb-2">Projected Total</p>
          <p className="font-display text-[20px] font-bold text-2fb8f0" style={{ color: '#2fb8f0' }}>
            {fmt(projectedSavings)}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-panel border border-rim rounded-2xl p-6 space-y-6">
        {/* Monthly Savings Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[13px] font-semibold text-fg1">Monthly Savings</label>
            <span className="text-[14px] font-mono font-bold text-accent">{fmt(monthlySavings)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="5000"
            step="50"
            value={monthlySavings}
            onChange={(e) => setMonthlySavings(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-fg3 to-fg3"
            style={{
              background: `linear-gradient(to right, #5e60f0 0%, #5e60f0 ${(monthlySavings / 5000) * 100}%, #222840 ${(monthlySavings / 5000) * 100}%, #222840 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-fg3 mt-2">
            <span>€0</span>
            <span>€5000</span>
          </div>
        </div>

        {/* Months to Project Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[13px] font-semibold text-fg1">Time Horizon</label>
            <span className="text-[14px] font-mono font-bold text-fg2">{monthsToProject} months ({(monthsToProject / 12).toFixed(1)} years)</span>
          </div>
          <input
            type="range"
            min="1"
            max="120"
            step="1"
            value={monthsToProject}
            onChange={(e) => setMonthsToProject(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #2fb8f0 0%, #2fb8f0 ${(monthsToProject / 120) * 100}%, #222840 ${(monthsToProject / 120) * 100}%, #222840 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-fg3 mt-2">
            <span>1 month</span>
            <span>120 months (10 years)</span>
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[13px] font-semibold text-fg1">Annual Interest Rate</label>
            <span className="text-[14px] font-mono font-bold text-fg2">{interestRate.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #05d896 0%, #05d896 ${(interestRate / 10) * 100}%, #222840 ${(interestRate / 10) * 100}%, #222840 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-fg3 mt-2">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-panel border border-rim rounded-2xl p-6">
        <h2 className="font-display text-[14.5px] font-bold tracking-tight mb-4">Savings Growth Projection</h2>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222840" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                stroke="#222840"
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                stroke="#222840"
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#5e60f0', strokeWidth: 1 }} />
              <Legend
                wrapperStyle={{ color: '#ccc', fontSize: 12 }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#5e60f0"
                dot={false}
                strokeWidth={3}
                isAnimationActive={true}
                animationDuration={800}
                name="Total Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-panel border border-rim rounded-2xl p-6">
        <h2 className="font-display text-[14.5px] font-bold tracking-tight mb-4">Projection Breakdown</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(94,96,240,0.1)' }}>
            <span className="text-[12px] font-semibold text-fg2">Starting Balance</span>
            <span className="font-mono font-bold text-fg1">{fmt(currentSavings)}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(47,184,240,0.1)' }}>
            <span className="text-[12px] font-semibold text-fg2">Contributions</span>
            <span className="font-mono font-bold text-fg1">{fmt(totalAdded)}</span>
          </div>
          {interestEarned > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(5,216,150,0.1)' }}>
              <span className="text-[12px] font-semibold text-fg2">Interest Earned</span>
              <span className="font-mono font-bold text-fg1" style={{ color: '#05d896' }}>{fmt(interestEarned)}</span>
            </div>
          )}
          <div className="h-px bg-rim my-2" />
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(47,184,240,0.2)' }}>
            <span className="text-[13px] font-bold text-fg1">Projected Total</span>
            <span className="font-display font-bold text-[16px]" style={{ color: '#2fb8f0' }}>{fmt(projectedSavings)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
