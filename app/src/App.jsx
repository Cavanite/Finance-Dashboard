import React, { useEffect, useState } from 'react';
import Dashboard from '../Assets/Components/Dashboard';
import TransactionList from '../Assets/Components/TransactionList';
import IncomePage from '../Assets/Components/IncomePage';
import SavingsPage from '../Assets/Components/SavingsPage';
import RecurringExpensesPage from '../Assets/Components/RecurringExpensesPage';
import AdminPage from '../Assets/Components/AdminPage';
import AddTransactionModal from '../Assets/Components/AddTransactionModal';
import LoginPage from '../Assets/Components/LoginPage';
import '../styles.css';

const NAV = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'transactions', label: 'Transactions',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
      </svg>
    ),
  },
  {
    id: 'income', label: 'Income',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
  {
    id: 'expenses', label: 'Expenses',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
      </svg>
    ),
  },
  {
    id: 'recurring', label: 'Recurring',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
      </svg>
    ),
  },
  {
    id: 'savings', label: 'Savings',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 7c0-1.1-.9-2-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3"/><path d="M23 12h-6a2 2 0 000 4h6v-4z"/>
      </svg>
    ),
  },
];

const PAGE_TITLE = {
  dashboard:    'Dashboard',
  transactions: 'All Transactions',
  income:       'Income',
  expenses:     'Expenses',
  recurring:    'Recurring Expenses',
  savings:      'Savings',
};

export default function App() {
  const [isAuth,    setIsAuth]    = useState(() => !!localStorage.getItem('ff_token'));
  const [isAdmin,   setIsAdmin]   = useState(() => localStorage.getItem('ff_isAdmin') === 'true');
  const [view,      setView]      = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [tick,      setTick]      = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [view]);

  function handleLogout() {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_isAdmin');
    setIsAuth(false);
    setIsAdmin(false);
  }

  if (!isAuth) return <LoginPage onLogin={(adminStatus) => { setIsAuth(true); setIsAdmin(adminStatus); }} />;

  function renderView() {
    if (view === 'dashboard') return <Dashboard key={tick} />;
    if (view === 'income')    return <IncomePage key={tick} onMutate={refresh} />;
    if (view === 'recurring') return <RecurringExpensesPage key={tick} onMutate={refresh} />;
    if (view === 'admin')     return <AdminPage key={tick} onMutate={refresh} />;
    if (view === 'savings')   return <SavingsPage key={tick} onMutate={refresh} />;
    if (view === 'expenses')  return <TransactionList filter="expense" key={tick} onDelete={refresh} />;
    return                           <TransactionList filter="all"     key={tick} onDelete={refresh} />;
  }

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex h-screen overflow-hidden bg-base font-sans text-fg1">
      {mobileNavOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────── */}
      <aside
        className={[
          'w-[236px] flex-shrink-0 flex flex-col bg-side border-r border-rim fixed inset-y-0 left-0 z-40 md:static md:translate-x-0 transition-transform duration-200',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div
          className="absolute right-0 top-0 w-px h-full pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #5e60f0 45%, transparent)', opacity: 0.22 }}
        />

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-[22px] border-b border-rim">
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5e60f0, #8385f8)', boxShadow: '0 4px 14px rgba(94,96,240,0.4)' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>
            </svg>
          </div>
          <span className="font-display font-extrabold text-[15px] tracking-tight text-fg1">
            Fin<span className="text-accent">flow</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2.5 pt-3">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-fg3 px-2.5 pb-2">Menu</p>
          {NAV.map(({ id, label, icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className={[
                  'w-full flex items-center gap-2.5 px-2.5 py-2.5 mb-0.5 rounded-md border text-[13.5px] font-medium text-left transition-colors duration-150 cursor-pointer',
                  active
                    ? 'text-accent border-accent/20'
                    : 'text-fg2 border-transparent hover:text-fg1',
                ].join(' ')}
                style={{ background: active ? 'rgba(94,96,240,0.12)' : 'transparent' }}
              >
                {icon}
                {label}
              </button>
            );
          })}
          
          {/* Admin Button - Only for admin users */}
          {isAdmin && (
            <>
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-fg3 px-2.5 pb-2 pt-4 mt-4 border-t border-rim">Admin</p>
              <button
                onClick={() => setView('admin')}
                className={[
                  'w-full flex items-center gap-2.5 px-2.5 py-2.5 mb-0.5 rounded-md border text-[13.5px] font-medium text-left transition-colors duration-150 cursor-pointer',
                  view === 'admin'
                    ? 'text-accent border-accent/20'
                    : 'text-fg2 border-transparent hover:text-fg1',
                ].join(' ')}
                style={{ background: view === 'admin' ? 'rgba(94,96,240,0.12)' : 'transparent' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Admin Panel
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-rim">
          <p className="font-mono text-[10.5px] text-fg3 leading-relaxed">{dateStr}</p>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header
          className="flex items-center justify-between gap-2 px-4 md:px-8 border-b border-rim flex-shrink-0"
          style={{ height: 62, background: 'rgba(7,9,15,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden w-9 h-9 rounded-md border border-rim flex items-center justify-center text-fg2"
              aria-label="Open menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="min-w-0">
            <h1 className="font-display text-[16px] md:text-[18px] font-bold tracking-tight truncate">{PAGE_TITLE[view]}</h1>
            <p className="text-[11px] text-fg3 mt-px">Personal finance overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-md font-semibold text-[12px] md:text-[13.5px] text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0 cursor-pointer"
              style={{ background: '#5e60f0' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#7173f5'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(94,96,240,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#5e60f0'; e.currentTarget.style.boxShadow = ''; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md font-medium text-[13px] text-fg2 border border-rim transition-colors duration-150 hover:text-fg1 hover:border-rim2 cursor-pointer"
              style={{ background: 'transparent' }}
              title="Sign out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderView()}
        </main>
      </div>

      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { refresh(); setShowModal(false); }}
        />
      )}
    </div>
  );
}