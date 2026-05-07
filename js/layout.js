// js/layout.js — Sidebar, jazykový switcher, publish tlačítko

window.Layout = {
  init() {
    this.renderSidebar();
    this.bindLangSwitcher();
    this.bindPublish();
    this.bindSidebarToggle();
    this.updateLangButtons();
  },

  renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    const groups = [
      {
        title: 'Prehľad',
        items: ['dashboard'],
      },
      {
        title: 'Obsah',
        items: ['testimonials', 'cases', 'blog', 'services', 'faq', 'pricing', 'clients', 'team'],
      },
      {
        title: 'Sekcie webu',
        items: ['pages', 'navigation', 'translations'],
      },
      {
        title: 'Systém',
        items: ['settings'],
      },
    ];

    nav.innerHTML = groups.map(group => `
      <div class="mb-4">
        <div class="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">${group.title}</div>
        ${group.items.map(key => {
          const r = Router.routes[key];
          if (!r) return '';
          return `
            <a href="#${key}" data-route="${key}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
              <span class="text-base">${r.icon}</span>
              <span>${r.title}</span>
            </a>`;
        }).join('')}
      </div>
    `).join('');
  },

  bindLangSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      // Idempotent: skip if already bound
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        State.activeLang = lang;
        localStorage.setItem('adlify_admin_lang', lang);
        this.updateLangButtons();
        // Re-render current page (most pages depend on lang)
        Router.render();
      });
    });

    // Restore from localStorage
    const saved = localStorage.getItem('adlify_admin_lang');
    if (saved && ['sk','cs','hu','en','de'].includes(saved)) {
      State.activeLang = saved;
    }
  },

  updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      if (lang === State.activeLang) {
        btn.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
        btn.classList.remove('text-gray-500');
      } else {
        btn.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
        btn.classList.add('text-gray-500');
      }
    });
  },

  bindPublish() {
    const btn = document.getElementById('publish-btn');
    if (!btn) return;
    // Idempotent: skip if already bound (Layout.init may be called multiple times,
    // e.g. on session refresh / onAuthStateChange — without this guard, every click
    // would trigger as many builds as there are bound listeners).
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', async () => {
      const confirmed = await Layout.confirmPublish();
      if (!confirmed) return;

      btn.disabled = true;
      btn.querySelector('span:last-child').textContent = 'Publikujem…';
      try {
        await API.triggerBuild();
        Utils.toast('Rebuild spustený. Zmeny budú online za 1-3 min.', 'success');
        State.buildPending = false;
      } catch (err) {
        Utils.toast('Chyba: ' + (err.message || err), 'error');
      } finally {
        btn.disabled = false;
        btn.querySelector('span:last-child').textContent = 'Publikovať';
      }
    });
  },

  /**
   * Pekný modal namiesto natívneho confirm().
   * Vráti Promise<boolean>.
   */
  confirmPublish() {
    return new Promise((resolve) => {
      // Vytvor backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm';
      backdrop.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-[90%] p-6 transform transition-all">
          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
              🚀
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Publikovať zmeny?</h3>
              <p class="text-sm text-gray-600">Spustí sa rebuild webu. Zmeny budú online za 1–3 minúty.</p>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button id="cp-cancel" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
              Zrušiť
            </button>
            <button id="cp-confirm" class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition">
              Áno, publikovať
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);

      const cleanup = (result) => {
        backdrop.remove();
        resolve(result);
      };

      backdrop.querySelector('#cp-cancel').addEventListener('click', () => cleanup(false));
      backdrop.querySelector('#cp-confirm').addEventListener('click', () => cleanup(true));
      // Click outside modal = cancel
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) cleanup(false);
      });
      // ESC = cancel
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          cleanup(false);
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  },

  bindSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    // Idempotent: bind to sidebar element itself
    if (sidebar.dataset.bound === '1') return;
    sidebar.dataset.bound = '1';

    const toggle = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');
    const backdrop = document.getElementById('sidebar-backdrop');

    const open = () => {
      sidebar.classList.remove('-translate-x-full');
      backdrop?.classList.remove('hidden');
    };
    const close = () => {
      sidebar.classList.add('-translate-x-full');
      backdrop?.classList.add('hidden');
    };

    toggle?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);

    // Auto-close po klike na sidebar link (na mobile)
    sidebar.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link && window.innerWidth < 768) close();
    });
  },
};
