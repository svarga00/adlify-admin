// js/pages/services.js (stub — naplníme vo Fáze 3)

window.Services = {
  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
          <div class="text-5xl mb-4">🚧</div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">Editor sa pripravuje</h1>
          <p class="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Tento editor bude pridaný v ďalšej fáze. Zatiaľ použite priamo Supabase Dashboard pre úpravy v tabuľkách.
          </p>
          <a href="#dashboard" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            ← Späť na Dashboard
          </a>
        </div>
      </div>
    `;
  },
};
