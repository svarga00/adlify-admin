// js/pages/dashboard.js

window.Dashboard = {
  async render() {
    const content = document.getElementById('page-content');

    // Fetch counts in parallel
    const [tCount, cCount, bCount, sCount, fCount, lastBuild, user] = await Promise.all([
      this.count('web_testimonials'),
      this.count('web_cases'),
      this.count('web_blog_posts'),
      this.count('web_services'),
      this.count('web_faq'),
      API.getLastBuild(),
      window.supabase.auth.getUser().then(r => r.data.user),
    ]);

    State.lastBuild = lastBuild;

    content.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <!-- Welcome -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Dobrý deň, ${Utils.escape(user?.email?.split('@')[0] || 'admin')} 👋</h1>
          <p class="text-sm text-gray-500 mt-1">Aktuálne pracujete v jazyku <strong class="font-mono uppercase">${State.activeLang}</strong>. Pre prepnutie použite prepínač hore.</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          ${this.statCard('Testimoniály', tCount, '💬', 'testimonials')}
          ${this.statCard('Prípadovky', cCount, '📊', 'cases')}
          ${this.statCard('Blog posty', bCount, '📝', 'blog')}
          ${this.statCard('Služby', sCount, '⚙️', 'services')}
          ${this.statCard('FAQ', fCount, '❓', 'faq')}
        </div>

        <!-- Build status -->
        <div class="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 class="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>🚀</span> <span>Posledný deploy</span>
          </h2>
          ${this.renderBuildStatus(lastBuild)}
        </div>

        <!-- Quick actions -->
        <div class="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Najčastejšie akcie</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${this.actionCard('💬 Pridať testimoniál', 'testimonials')}
            ${this.actionCard('📝 Nový blog post', 'blog')}
            ${this.actionCard('📊 Pridať prípadovku', 'cases')}
            ${this.actionCard('🌍 Upraviť UI texty', 'translations')}
            ${this.actionCard('💰 Upraviť cenník', 'pricing')}
            ${this.actionCard('🔧 Nastavenia', 'settings')}
          </div>
        </div>
      </div>
    `;
  },

  async count(table) {
    const { count } = await window.supabase.from(table)
      .select('*', { count: 'exact', head: true })
      .eq('lang', State.activeLang);
    return count || 0;
  },

  statCard(label, count, icon, route) {
    return `
      <a href="#${route}" class="block bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-400 hover:shadow-sm transition group">
        <div class="text-xl mb-2">${icon}</div>
        <div class="text-2xl font-bold text-gray-900">${count}</div>
        <div class="text-xs text-gray-500 mt-0.5">${label}</div>
      </a>`;
  },

  actionCard(label, route) {
    return `
      <a href="#${route}" class="block bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-700 hover:text-gray-900 transition">
        ${label}
      </a>`;
  },

  renderBuildStatus(b) {
    if (!b) {
      return `<p class="text-sm text-gray-500">Web ešte nebol publikovaný z admina. Klikni <strong>Publikovať</strong> hore aby sa zmeny prejavili na adlify.eu.</p>`;
    }
    const color = b.status === 'success' ? 'emerald' : (b.status === 'failed' ? 'red' : 'amber');
    const icon = b.status === 'success' ? '✅' : (b.status === 'failed' ? '❌' : '⏳');
    return `
      <div class="flex items-center gap-3 text-sm">
        <span class="text-xl">${icon}</span>
        <div>
          <div class="font-medium text-gray-900">${b.status === 'success' ? 'Úspešne publikované' : (b.status === 'failed' ? 'Deploy zlyhal' : 'Deploy beží')}</div>
          <div class="text-gray-500 text-xs mt-0.5">${Utils.formatDateTime(b.triggered_at)}</div>
          ${b.error_message ? `<div class="text-red-600 text-xs mt-1">${Utils.escape(b.error_message)}</div>` : ''}
        </div>
      </div>`;
  },
};
