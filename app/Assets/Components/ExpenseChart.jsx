import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#5e60f0', '#ff3d6b', '#05d896', '#2fb8f0', '#ffa726', 
  '#ab47bc', '#29b6f6', '#26a69a', '#ec407a', '#fdd835'
];

export default function ExpenseChart({ transactions }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Group expenses by category
    const expensesByCategory = {};
    
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const category = tx.category || 'Uncategorized';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(tx.amount);
      }
    });

    // Convert to chart format
    const data = Object.entries(expensesByCategory)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);

    setChartData(data);
  }, [transactions]);

  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalExpenses) * 100).toFixed(1);
      return (
        <div className="bg-panel border border-rim rounded-lg p-2.5 shadow-xl">
          <p className="text-[12px] font-semibold text-fg1">{data.name}</p>
          <p className="text-[12px] text-accent font-mono">
            €{data.value.toFixed(2)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-panel border border-rim rounded-2xl p-6 anim-fade-up" style={{ animationDelay: '320ms' }}>
        <h2 className="font-display text-[14.5px] font-bold tracking-tight mb-1">Expense Distribution</h2>
        <p className="text-[11.5px] text-white mb-6">Where your money goes</p>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30 mb-3">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <p className="text-[13px] text-fg2">No expenses yet</p>
          <p className="text-[11px] text-fg3 mt-1">Add expenses to see the breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-panel border border-rim rounded-2xl anim-fade-up" style={{ animationDelay: '320ms' }}>
      <div className="px-6 pt-5 pb-1">
        <h2 className="font-display text-[14.5px] font-bold tracking-tight">Expense Distribution</h2>
        <p className="text-[11.5px] text-white mt-0.5">Where your money goes</p>
      </div>
      
      <div className="flex flex-col items-center" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with percentages */}
      <div className="px-6 pb-5 grid grid-cols-2 gap-3">
        {chartData.map((item, index) => {
          const percentage = ((item.value / totalExpenses) * 100).toFixed(1);
          return (
            <div key={item.name} className="flex items-start gap-2.5">
              <span 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" 
                style={{ background: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-fg1 truncate">{item.name}</p>
                <p className="text-[10px] text-fg3">
                  €{item.value.toFixed(2)} • {percentage}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
