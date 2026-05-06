// js/pages/_stubs.js — Placeholdery pre moduly ktoré ešte nie sú prepísané pre Etapu C
// Tieto budú nahradené plne funkčnými modulmi v Claude Code (vid ETAPA_C_HANDOFF.md)

const STUB_MODULES = {
  Services:      { icon: '⚙️',  title: 'Služby',           table: 'web_services' },
  Pricing:       { icon: '💰', title: 'Cenník',           table: 'web_pricing' },
  Translations:  { icon: '🌍', title: 'UI texty',         table: 'web_translations' },
  PagesContent:  { icon: '📄', title: 'Sekcie stránok',   table: 'web_pages_content' },
  Navigation:    { icon: '🧭', title: 'Navigácia',        table: 'web_navigation' },
  Settings:      { icon: '🔧', title: 'Nastavenia',       table: 'web_settings' },
};

for (const [moduleName, config] of Object.entries(STUB_MODULES)) {
  window[moduleName] = {
    async render() {
      const content = document.getElementById('page-content');
      let count = '—';
      try {
        const { count: c } = await window.supabase
          .from(config.table)
          .select('*', { count: 'exact', head: true });
        count = c ?? 0;
      } catch (err) {
        console.warn(`Stub count(${config.table}):`, err.message);
      }

      content.innerHTML = `
        <div class="max-w-2xl mx-auto">
          <div class="text-center py-16">
            <div class="text-5xl mb-4">${config.icon}</div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">${config.title}</h1>
            <p class="text-sm text-gray-500 mb-6">Tabuľka má <strong>${count}</strong> záznamov</p>

            <div class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left">
              <div class="flex items-start gap-3">
                <span class="text-2xl">🚧</span>
                <div>
                  <h2 class="font-semibold text-amber-900 mb-2">Modul ešte nie je hotový</h2>
                  <p class="text-sm text-amber-800 leading-relaxed">
                    Plne funkčný admin pre <strong>${config.title}</strong> dorobíme v ďalšej fáze.
                    Dáta sú v Supabase tabuľke <code class="bg-amber-100 px-1.5 py-0.5 rounded text-xs">${config.table}</code>
                    a môžeš ich zatiaľ editovať priamo v Supabase Dashboard → Table Editor.
                  </p>
                  <p class="text-sm text-amber-800 mt-3">
                    Postup pre dorobenie je v <code class="bg-amber-100 px-1.5 py-0.5 rounded text-xs">ETAPA_C_HANDOFF.md</code>
                    podľa vzoru v <code class="bg-amber-100 px-1.5 py-0.5 rounded text-xs">js/pages/cases.js</code>.
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-6">
              <a href="#cases" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
                Vyskúšať Prípadové štúdie (funkčné) →
              </a>
            </div>
          </div>
        </div>
      `;
    }
  };
}
