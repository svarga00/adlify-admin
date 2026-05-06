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
        items: ['testimonials', 'cases', 'blog', 'services', 'faq', 'pricing', 'clients'],
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
    document.getElementById('publish-btn')?.addEventListener('click', async () => {
      if (!confirm('Spustiť rebuild webu? Zmeny sa prejavia za 1-3 minúty.')) return;
      const btn = document.getElementById('publish-btn');
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

  bindSidebarToggle() {
    const toggle = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

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
