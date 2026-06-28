import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const _fetch = window.fetch.bind(window);
window.fetch = function (url, opts = {}) {
  const token = localStorage.getItem('ff_token');
  if (token && typeof url === 'string' && url.startsWith('/api')) {
    opts = { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` } };
  }
  return _fetch(url, opts);
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
