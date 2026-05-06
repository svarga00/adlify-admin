// js/pages/navigation.js
// Header + footer linky

window.Navigation = {
  TABLE: 'web_navigation',

  LOCATIONS: [
    { key: 'header',           label: 'Header navigácia' },
    { key: 'footer_nav',       label: 'Footer — Navigácia' },
    { key: 'footer_company',   label: 'Footer — Firma' },
    { key: 'footer_resources', label: 'Footer — Zdroje' },
  ],

  state: {
    activeLocation: 'header',
  },

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Navigácia</h1>
          <p class="text-sm text-gray-500 mt-1">Linky v hlavičke a päte. Aktívny jazyk: <span class="font-mono uppercase font-semibold">${State.activeLang}</span></p>
        </div>

        <!-- Location tabs -->
        <div class="flex gap-1 mb-6 border-b border-gray-200">
          ${this.LOCATIONS.map(l => `
            <button data-loc="${l.key}" class="nav-tab px-4 py-2 text-sm font-semibold border-b-2 ${l.key === this.state.activeLocation ? 'border-brand-500 text-gray-900' : 'border-transparent text-gray-500'}">${l.label}</button>
          `).join('')}
        </div>

        <div id="nav-content"></div>
      </div>
    `;

    document.querySelectorAll('.nav-tab').forEach(b => {
      b.addEventListener('click', () => {
        this.state.activeLocation = b.getAttribute('data-loc');
        Router.render();
      });
    });

    await this.renderLocation();
  },

  async renderLocation() {
    const container = document.getElementById('nav-content');
    container.innerHTML = '<div class="text-center py-8 text-gray-400">⏳ Načítavam…</div>';

    const { data, error } = await window.supabase.from(this.TABLE)
      .select('*')
      .eq('location', this.state.activeLocation)
      .eq('lang', State.activeLang)
      .maybeSingle();

    if (error) {
      container.innerHTML = `<div class="bg-red-50 p-4 rounded text-red-600">${error.message}</div>`;
      return;
    }

    const items = data?.items || [];
    this.currentRecord = data;

    container.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-2xl p-4">
        <div class="space-y-2 mb-4" id="items-list">
          ${items.length === 0 ? '<p class="text-sm text-gray-500 text-center py-6">Žiadne linky. Pridajte prvý.</p>' : items.map((item, i) => this.itemRow(item, i)).join('')}
        </div>

        <button id="add-item" class="w-full py-3 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl text-sm text-gray-500 hover:text-gray-700">
          + Pridať link
        </button>

        <div class="mt-4 flex justify-end">
          <button id="save-nav" class="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg">Uložiť navigáciu</button>
        </div>
      </div>
    `;

    this.bindItems();
    document.getElementById('add-item').addEventListener('click', () => this.addItem());
    document.getElementById('save-nav').addEventListener('click', () => this.save());
  },

  itemRow(item, idx) {
    return `
      <div class="nav-item grid grid-cols-12 gap-2 items-center" data-idx="${idx}">
        <div class="col-span-1 text-gray-400 text-xs text-center">${idx + 1}.</div>
        <div class="col-span-5">
          <input class="item-label w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value="${Utils.escape(item.label || '')}" placeholder="Názov linku">
        </div>
        <div class="col-span-5">
          <input class="item-url w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" value="${Utils.escape(item.url || '')}" placeholder="/cesta">
        </div>
        <div class="col-span-1 text-right">
          <button class="del-item w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-500 text-xs">🗑️</button>
        </div>
      </div>
    `;
  },

  bindItems() {
    document.querySelectorAll('.del-item').forEach(b => {
      b.addEventListener('click', () => b.closest('.nav-item').remove());
    });
  },

  addItem() {
    const list = document.getElementById('items-list');
    if (list.querySelector('p')) list.innerHTML = ''; // remove empty state
    const idx = list.querySelectorAll('.nav-item').length;
    const wrap = document.createElement('div');
    wrap.innerHTML = this.itemRow({ label: '', url: '' }, idx);
    list.appendChild(wrap.firstElementChild);
    this.bindItems();
  },

  async save() {
    const items = Array.from(document.querySelectorAll('.nav-item')).map((row, i) => ({
      label: row.querySelector('.item-label').value.trim(),
      url:   row.querySelector('.item-url').value.trim(),
      sort_order: (i + 1) * 10,
    })).filter(i => i.label && i.url);

    try {
      await window.supabase.from(this.TABLE).upsert({
        location: this.state.activeLocation,
        lang: State.activeLang,
        items,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'location,lang' });
      Utils.toast('Uložené ✓', 'success');
      State.buildPending = true;
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },
};
