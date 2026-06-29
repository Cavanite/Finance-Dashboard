import { useState, useEffect } from 'react';

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

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` },
      });
      if (res.ok) {
        setUsers(await res.json());
      } else if (res.status === 403) {
        setError('Admin access required');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!form.username || !form.password) {
        throw new Error('Username and password required');
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ff_token')}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setUsers([data, ...users]);
      setForm({ username: '', password: '' });
      setShowForm(false);
      setSuccess(`User "${data.username}" created successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, username) {
    if (!confirm(`Delete user "${username}"? This will deactivate their account.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ff_token')}` },
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, is_active: false } : u));
        setSuccess(`User "${username}" deactivated`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  }

  if (loading) return <Loader />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight">Admin Panel</h1>
          <p className="text-[13px] text-fg3 mt-1">Manage users and system settings</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-[13px] text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0"
          style={{ background: '#5e60f0' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {showForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-[12px] font-semibold flex items-center gap-2" style={{ background: 'rgba(255,61,107,0.1)', color: '#ff3d6b' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg text-[12px] font-semibold flex items-center gap-2" style={{ background: 'rgba(5,216,150,0.1)', color: '#05d896' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {success}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className="bg-panel border border-rim rounded-2xl p-6 mb-6">
          <h2 className="font-display text-[16px] font-bold tracking-tight mb-4">Create New User</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-fg2 uppercase tracking-wide mb-2">Username</label>
              <input
                type="text"
                required
                minLength="3"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2.5 bg-base border border-rim rounded-lg text-fg1 text-[13px] focus:outline-none focus:border-accent transition-colors"
                placeholder="e.g. john_doe"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-fg2 uppercase tracking-wide mb-2">Password</label>
              <input
                type="password"
                required
                minLength="6"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 bg-base border border-rim rounded-lg text-fg1 text-[13px] focus:outline-none focus:border-accent transition-colors"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-[13px] text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
                style={{ background: '#5e60f0' }}
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-[13px] text-fg2 border border-rim transition-colors hover:text-fg1 hover:border-rim2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-panel border border-rim rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-rim flex items-center justify-between">
          <h2 className="font-display text-[14.5px] font-bold tracking-tight">Users</h2>
          <span className="text-[12px] text-fg3 font-mono">{users.length} {users.length === 1 ? 'user' : 'users'}</span>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-20 mb-3">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <p className="text-[13px] font-semibold text-fg2 mb-1">No users created yet</p>
            <p className="text-[12px] text-fg3">Create your first user to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-fg2 border-b border-rim">Username</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-fg2 border-b border-rim">Created</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-fg2 border-b border-rim">Created By</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-fg2 border-b border-rim">Status</th>
                <th className="text-right px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-fg2 border-b border-rim">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-rim last:border-0 hover:bg-opacity-50 transition-colors" style={{ background: 'transparent' }}>
                  <td className="px-6 py-4 text-[13px] font-medium text-fg1">{user.username}</td>
                  <td className="px-6 py-4 text-[12px] text-fg3 font-mono">{fmtDate(user.created_at)}</td>
                  <td className="px-6 py-4 text-[12px] text-fg2">{user.created_by || 'System'}</td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={{
                        background: user.is_active ? 'rgba(5,216,150,0.1)' : 'rgba(255,61,107,0.1)',
                        color: user.is_active ? '#05d896' : '#ff3d6b',
                      }}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.is_active && (
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="px-3 py-1.5 rounded-md font-medium text-[12px] text-fg2 border border-rim transition-colors hover:text-fg1 hover:border-rim2"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
