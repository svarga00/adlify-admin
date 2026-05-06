// js/router.js — Jednoduchý hash-based router

window.Router = {
  routes: {
    '':              { module: 'Dashboard',     title: 'Dashboard',          icon: '📊' },
    'dashboard':     { module: 'Dashboard',     title: 'Dashboard',          icon: '📊' },
    'testimonials':  { module: 'Testimonials',  title: 'Testimoniály',       icon: '💬' },
    'cases':         { module: 'Cases',         title: 'Prípadové štúdie',   icon: '📊' },
    'blog':          { module: 'Blog',          title: 'Blog',               icon: '📝' },
    'services':      { module: 'Services',      title: 'Služby',             icon: '⚙️' },
    'faq':           { module: 'Faq',           title: 'FAQ',                icon: '❓' },
    'pricing':       { module: 'Pricing',       title: 'Cenník',             icon: '💰' },
    'translations':  { module: 'Translations',  title: 'UI texty',           icon: '🌍' },
    'pages':         { module: 'PagesContent',  title: 'Sekcie stránok',     icon: '📄' },
    'navigation':    { module: 'Navigation',    title: 'Navigácia',          icon: '🧭' },
    'clients':       { module: 'Clients',       title: 'Klienti (ticker)',   icon: '👥' },
    'settings':      { module: 'Settings',      title: 'Nastavenia',         icon: '🔧' },
  },

  init() {
    window.addEventListener('hashchange', () => this.render());
    this.render();
  },

  navigate(route) {
    location.hash = route;
  },

  current() {
    return location.hash.replace(/^#\/?/, '') || 'dashboard';
  },

  async render() {
    const route = this.current();
    const config = this.routes[route];

    // Update title
    document.getElementById('page-title').textContent = config?.title || 'Neznámy';

    // Update sidebar active state
    document.querySelectorAll('#sidebar-nav a').forEach(a => {
      const r = a.getAttribute('data-route');
      if (r === route || (r === 'dashboard' && route === '')) {
        a.classList.add('bg-gray-100', 'text-gray-900', 'font-semibold');
        a.classList.remove('text-gray-600');
      } else {
        a.classList.remove('bg-gray-100', 'text-gray-900', 'font-semibold');
        a.classList.add('text-gray-600');
      }
    });

    // Render module
    const content = document.getElementById('page-content');
    if (!config || !window[config.module]) {
      content.innerHTML = `<div class="text-center py-20">
        <div class="text-4xl mb-2">🤷</div>
        <p class="text-gray-500">Stránka nenájdená: <code>${route}</code></p>
      </div>`;
      return;
    }

    content.innerHTML = `<div class="text-center py-20 text-gray-400"><div class="text-2xl mb-2">⏳</div><p class="text-sm">Načítavam…</p></div>`;
    try {
      await window[config.module].render();
    } catch (err) {
      console.error(err);
      content.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        <strong>Chyba pri načítaní:</strong><br>${Utils.escape(err.message || err)}
      </div>`;
    }
  },
};
