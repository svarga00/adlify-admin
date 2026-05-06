// js/utils.js — Pomocné funkcie

window.Utils = {
  /**
   * Toast notifikácia
   */
  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: 'bg-emerald-600',
      error:   'bg-red-600',
      info:    'bg-gray-900',
      warning: 'bg-amber-600',
    };

    const el = document.createElement('div');
    el.className = `${colors[type] || colors.info} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in`;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  /**
   * Escape HTML
   */
  escape(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[m]);
  },

  /**
   * Truncate text
   */
  truncate(str, len = 90) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  },

  /**
   * Debounce
   */
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  /**
   * Format date for SK
   */
  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('sk-SK', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('sk-SK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Show modal/drawer with given HTML content
   * Returns a close() function and the drawer element
   */
  drawer(title, bodyHtml, opts = {}) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="drawer-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm z-50 opacity-0 transition-opacity"></div>
      <aside class="drawer-panel fixed top-0 right-0 h-full w-full max-w-2xl bg-white z-50 flex flex-col translate-x-full transition-transform duration-300 shadow-2xl">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">${this.escape(title)}</h2>
          <button class="drawer-close w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
        </div>
        <div class="drawer-body flex-1 overflow-y-auto p-6">
          ${bodyHtml}
        </div>
        ${opts.footer ? `<div class="drawer-footer px-6 py-4 border-t border-gray-200 flex justify-end gap-2">${opts.footer}</div>` : ''}
      </aside>
    `;
    document.body.appendChild(wrap);

    // Animate in
    requestAnimationFrame(() => {
      wrap.querySelector('.drawer-backdrop').style.opacity = '1';
      wrap.querySelector('.drawer-panel').classList.remove('translate-x-full');
    });

    const close = () => {
      wrap.querySelector('.drawer-backdrop').style.opacity = '0';
      wrap.querySelector('.drawer-panel').classList.add('translate-x-full');
      setTimeout(() => wrap.remove(), 300);
    };

    wrap.querySelector('.drawer-backdrop').addEventListener('click', close);
    wrap.querySelector('.drawer-close').addEventListener('click', close);

    return { close, el: wrap.querySelector('.drawer-panel'), body: wrap.querySelector('.drawer-body'), footer: wrap.querySelector('.drawer-footer') };
  },

  /**
   * Confirm dialog (replacement for ugly window.confirm)
   */
  async confirm(message, opts = {}) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <p class="text-sm text-gray-700 mb-6">${this.escape(message)}</p>
            <div class="flex justify-end gap-2">
              <button class="cancel-btn px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Zrušiť</button>
              <button class="confirm-btn px-4 py-2 text-sm font-semibold text-white ${opts.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-black'} rounded-lg">${this.escape(opts.confirmLabel || 'OK')}</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(wrap);
      wrap.querySelector('.confirm-btn').addEventListener('click', () => { wrap.remove(); resolve(true); });
      wrap.querySelector('.cancel-btn').addEventListener('click', () => { wrap.remove(); resolve(false); });
    });
  },

  /**
   * Form helpers — get FormData as plain object
   */
  formData(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
      // Handle checkboxes
      const input = form.querySelector(`[name="${key}"]`);
      if (input?.type === 'checkbox') {
        data[key] = input.checked;
      } else if (input?.type === 'number') {
        data[key] = value === '' ? null : Number(value);
      } else {
        data[key] = value === '' ? null : value;
      }
    });
    // Also pick up unchecked checkboxes (FormData doesn't include them)
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (!(cb.name in data)) data[cb.name] = cb.checked;
    });
    return data;
  },
};
