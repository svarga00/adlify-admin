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

  // State sa drží mimo objektu (singleton-safe)
  _activeLocation: null,
  _currentRecord: null,

  async render() {
    if (!this._activeLocation) this._activeLocation = 'header';

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Navigácia</h1>
          <p class="text-sm text-gray-500 mt-1">Linky v hlavičke a päte. Aktívny jazyk: <span class="font-mono uppercase font-semibold">${State.activeLang}</span></p>
        </div>

        <div class="flex gap-1 mb-6 border-b border-gray-200">
          ${this.LOCATIONS.map(l => `
            <button data-loc="${l.key}" class="nav-tab px-4 py-2 text-sm font-semibold border-b-2 ${l.key === this._activeLocation ? 'border-brand-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}">${l.label}</button>
          `).join('')}
        </div>

        <div id="nav-content"></div>
      </div>
    `;

    // Bind tabs
    document.querySelectorAll('.nav-tab').forEach(b => {
      b.addEventListener('click', () => {
        this._activeLocation = b.getAttribute('data-loc');
        // Update tab styles inline
        document.querySelectorAll('.nav-tab').forEach(other => {
          const active = other.getAttribute('data-loc') === this._activeLocation;
          other.classList.toggle('border-brand-500', active);
          other.classList.toggle('text-gray-900', active);
          other.classList.toggle('border-transparent', !active);
          other.classList.toggle('text-gray-500', !active);
        });
        this.renderLocation();
      });
    });

    await this.renderLocation();
  },

  async renderLocation() {
    const container = document.getElementById('nav-content');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-8 text-gray-400">⏳ Načítavam…</div>';

    let data = null;
    try {
      const res = await window.supabase.from(this.TABLE)
        .select('*')
        .eq('location', this._activeLocation)
        .eq('lang', State.activeLang)
        .maybeSingle();

      if (res.error) {
        const c = document.getElementById('nav-content');
        if (c) c.innerHTML = `<div class="bg-red-50 p-4 rounded text-red-600 text-sm">${Utils.escape(res.error.message)}</div>`;
        return;
      }
      data = res.data;
    } catch (err) {
      const c = document.getElementById('nav-content');
      if (c) c.innerHTML = `<div class="bg-red-50 p-4 rounded text-red-600 text-sm">${Utils.escape(err.message)}</div>`;
      return;
    }

    // Re-fetch container (DOM môže byť čerstvejší po async fetch)
    const container2 = document.getElementById('nav-content');
    if (!container2) return;

    const items = (data && Array.isArray(data.items)) ? data.items : [];
    this._currentRecord = data;

    container2.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-2xl p-4">
        ${!data ? `
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
            💡 Pre jazyk <strong>${State.activeLang.toUpperCase()}</strong> a sekciu <strong>${this._activeLocation}</strong> ešte nie sú definované žiadne linky. Pridajte prvý a uložte.
          </div>
        ` : ''}

        <div class="space-y-2 mb-4" id="items-list">
          ${items.length === 0 ? '<p class="text-sm text-gray-500 text-center py-6 empty-msg">Žiadne linky. Pridajte prvý.</p>' : items.map((item, i) => this.itemRow(item, i)).join('')}
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

    const addBtn = document.getElementById('add-item');
    if (addBtn) addBtn.addEventListener('click', () => this.addItem());

    const saveBtn = document.getElementById('save-nav');
    if (saveBtn) saveBtn.addEventListener('click', () => this.save());
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
      b.addEventListener('click', () => {
        const row = b.closest('.nav-item');
        if (row) row.remove();
      });
    });
  },

  addItem() {
    const list = document.getElementById('items-list');
    if (!list) return;
    const emptyP = list.querySelector('.empty-msg');
    if (emptyP) emptyP.remove();
    const idx = list.querySelectorAll('.nav-item').length;
    const wrap = document.createElement('div');
    wrap.innerHTML = this.itemRow({ label: '', url: '' }, idx);
    const newRow = wrap.firstElementChild;
    if (newRow) {
      list.appendChild(newRow);
      this.bindItems();
    }
  },

  async save() {
    const items = Array.from(document.querySelectorAll('.nav-item')).map((row, i) => {
      const labelInput = row.querySelector('.item-label');
      const urlInput = row.querySelector('.item-url');
      return {
        label: labelInput ? labelInput.value.trim() : '',
        url:   urlInput ? urlInput.value.trim() : '',
        sort_order: (i + 1) * 10,
      };
    }).filter(i => i.label && i.url);

    try {
      await window.supabase.from(this.TABLE).upsert({
        location: this._activeLocation,
        lang: State.activeLang,
        items,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'location,lang' });
      Utils.toast('Uložené ✓', 'success');
      State.buildPending = true;
      // Reload to reflect saved state
      this.renderLocation();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },
};
