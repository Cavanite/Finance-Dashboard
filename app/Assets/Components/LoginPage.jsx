import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) { setError('Enter your username and password.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed.'); return; }
      localStorage.setItem('ff_token', data.token);
      localStorage.setItem('ff_isAdmin', data.isAdmin ? 'true' : 'false');
      localStorage.setItem('ff_username', data.username);
      onLogin(data.isAdmin);
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#07090f' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(94,96,240,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm px-4" style={{ animation: 'fadeUp 0.4s ease both' }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #5e60f0, #8385f8)', boxShadow: '0 8px 28px rgba(94,96,240,0.4)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>
            </svg>
          </div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-fg1">
            Fin<span style={{ color: '#5e60f0' }}>flow</span>
          </h1>
          <p className="text-[13px] text-fg3 mt-1">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-6" style={{ background: '#0d1020', borderColor: '#181d30' }}>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: '#7b82a2' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Cavanite"
                autoComplete="username"
                className="w-full px-3.5 py-3 rounded-lg text-fg1 font-sans text-[14px] outline-none transition-all duration-150 placeholder:text-fg3"
                style={{ background: '#060812', border: '1px solid #222840' }}
                onFocus={e  => { e.target.style.borderColor = '#5e60f0'; e.target.style.boxShadow = '0 0 0 3px rgba(94,96,240,0.14)'; }}
                onBlur={e   => { e.target.style.borderColor = '#222840'; e.target.style.boxShadow = ''; }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: '#7b82a2' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-3.5 py-3 rounded-lg text-fg1 font-sans text-[14px] outline-none transition-all duration-150 placeholder:text-fg3"
                  style={{ background: '#060812', border: '1px solid #222840', paddingRight: '2.75rem' }}
                  onFocus={e  => { e.target.style.borderColor = '#5e60f0'; e.target.style.boxShadow = '0 0 0 3px rgba(94,96,240,0.14)'; }}
                  onBlur={e   => { e.target.style.borderColor = '#222840'; e.target.style.boxShadow = ''; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg3 hover:text-fg2 transition-colors cursor-pointer"
                  style={{ background: 'transparent', border: 'none', padding: 0 }}
                  tabIndex={-1}
                >
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[12.5px] px-3 py-2.5 rounded-lg font-medium" style={{ background: 'rgba(255,61,107,0.1)', color: '#ff3d6b' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-[14px] text-white transition-all duration-150 mt-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              style={{ background: '#5e60f0' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#7173f5'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(94,96,240,0.4)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = '#5e60f0'; e.currentTarget.style.boxShadow = ''; }}
            >
              {loading
                ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent" style={{ animation: 'spin 0.7s linear infinite' }} /> Signing in…</>
                : 'Sign in'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[11.5px] text-fg3 mt-5">
          Finflow · Personal Finance Dashboard
        </p>
      </div>
    </div>
  );
}
