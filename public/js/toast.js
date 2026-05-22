// public/js/toast.js — tiny toast helper
window.toast = function (msg, opts) {
  opts = opts || {};
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className =
    'pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm max-w-sm transition-opacity ' +
    (opts.type === 'error'
      ? 'border-red-500/50 bg-red-500/15 text-red-100'
      : opts.type === 'warning'
      ? 'border-orange-500/50 bg-orange-500/15 text-orange-100'
      : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100');
  el.style.backdropFilter = 'blur(8px)';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }, opts.duration || 3500);
};
