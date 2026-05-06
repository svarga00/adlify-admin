// js/pages/navigation.js — Navigácia (web_navigation) — header + footer linky

window.Navigation = {
  TABLE: 'web_navigation',

  LOCATIONS: [
    { value: 'header_main',   label: 'Header (hlavné menu)',     emoji: '🧭' },
    { value: 'footer_col_1',  label: 'Footer — stĺpec 1',        emoji: '⬇' },
    { value: 'footer_col_2',  label: 'Footer — stĺpec 2',        emoji: '⬇' },
    { value: 'footer_col_3',  label: 'Footer — stĺpec 3 (právne)', emoji: '⬇' },
  ],

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    // Group by location
    const grouped = {};
    this.LOCATIONS.forEach(l => grouped[l.value] = []);
    items.forEach(i => {
      const loc = i.location || 'header_main';
      if (!grouped[loc]) grouped[loc] = [];
      grouped[loc].push(i);
    });

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Navigácia</h1>
            <p class="text-sm text-gray-500 mt-1">Header menu a footer linky</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať odkaz</span>
          </button>
        </div>

        ${this.LOCATIONS.map(loc => {
          const list = grouped[loc.value] || [];
          return `
            <div class="mb-6">
              <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <span>${loc.emoji}</span><span>${loc.label}</span>
                <span class="text-xs font-normal text-gray-400">(${list.length})</span>
              </h2>
              <div class="space-y-2">
                ${list.length === 0 ? `<div class="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">Žiadne odkazy v tejto sekcii</div>` : list.map(i => this.row(i)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('add-btn').addEventListener('click', () => this.openEditor(null));
    items.forEach(item => {
      const el = document.querySelector(`[data-id="${item.id}"]`);
      if (!el) return;
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openEditor(item));
      el.querySelector('[data-action="toggle"]')?.addEventListener('click', () => this.toggleVisibility(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.remove(item));
    });
  },

  row(item) {
    const pub = item.is_published !== false;
    const label = I18N.t(item.label, 'sk');
    const isExternal = item.url?.startsWith('http');

    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-3 hover:border-gray-400 transition flex items-center gap-3">
        <div class="text-xs font-mono text-gray-400 w-6 text-center">${item.sort_order || 0}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-gray-900 text-sm">${Utils.escape(label) || '<em class="text-gray-400">Bez popisu</em>'}</span>
            ${isExternal ? '<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">↗ External</span>' : ''}
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}">
              ${pub ? 'Live' : 'Skryté'}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-0.5 font-mono truncate">${Utils.escape(item.url || '')}</div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button data-action="toggle" class="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900">${pub ? '👁' : '🚫'}</button>
          <button data-action="edit" class="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg">Upraviť</button>
          <button data-action="delete" class="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg">🗑</button>
        </div>
      </div>
    `;
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || {
      location: 'header_main',
      label: I18N.empty(),
      url: '',
      is_external: false,
      open_in_new_tab: false,
      sort_order: 0,
      is_published: true,
    };

    const drawer = Utils.drawer(`${isNew ? 'Pridať' : 'Upraviť'} odkaz`, `<form id="nav-form" class="space-y-5">

      <div class="bg-gradient-to-r from-brand-50 to-pink-50 border border-brand-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-900">Hromadný preklad</div>
          <div class="text-xs text-gray-600 mt-0.5">SK → CS / HU / EN / DE.</div>
        </div>
        <button type="button" id="translate-all-btn"
          class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50">
          <span>✨</span><span id="translate-all-label">Preložiť</span>
        </button>
      </div>

      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Umiestnenie</label>
          <select name="location" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
            ${this.LOCATIONS.map(l => `<option value="${l.value}" ${data.location === l.value ? 'selected' : ''}>${l.emoji} ${l.label}</option>`).join('')}
          </select>
        </div>

        ${I18N.renderField('label', data.label, { label: 'Text odkazu (Služby)', required: true })}

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">URL</label>
          <input type="text" name="url" required value="${Utils.escape(data.url || '')}"
            placeholder="/sluzby alebo https://..."
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
          <p class="text-xs text-gray-500 mt-1">Interná URL: /sluzby · Externá: https://example.com</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Poradie</label>
          <input type="number" name="sort_order" value="${data.sort_order || 0}"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
        </div>
      </div>

      <div class="bg-gray-50 rounded-xl p-4 space-y-3">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="open_in_new_tab" ${data.open_in_new_tab ? 'checked' : ''} class="w-4 h-4">
          <span class="text-sm font-semibold text-gray-900">Otvoriť v novom okne (target=_blank)</span>
        </label>
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_external" ${data.is_external ? 'checked' : ''} class="w-4 h-4">
          <span class="text-sm font-semibold text-gray-900">Externý odkaz (rel=noopener)</span>
        </label>
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_published" ${data.is_published !== false ? 'checked' : ''} class="w-4 h-4">
          <span class="text-sm font-semibold text-gray-900">Zobraziť na webe</span>
        </label>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button type="submit" class="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
          ${isNew ? 'Pridať' : 'Uložiť zmeny'}
        </button>
        <button type="button" data-close class="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">Zrušiť</button>
      </div>
    </form>`);

    I18N.bindFieldSwitchers(drawer.body);
    Blog._bindTranslateAll(drawer.body);

    drawer.body.querySelector('#nav-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });
    drawer.body.querySelector('[data-close]')?.addEventListener('click', () => drawer.close());
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#nav-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const payload = I18N.serializeForm(form, ['label']);
      if (!I18N.t(payload.label, 'sk')?.trim()) throw new Error('Text odkazu (SK) je povinný');
      if (!payload.url?.trim()) throw new Error('URL je povinná');

      // Auto-detect external
      if (payload.url.startsWith('http')) payload.is_external = true;

      if (item) await API.update(this.TABLE, item.id, payload);
      else      await API.insert(this.TABLE, payload);

      Utils.toast('✓ Uložené', 'success');
      drawer.close();
      this.render();
    } catch (err) {
      console.error(err);
      Utils.toast('Chyba: ' + err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = item ? 'Uložiť zmeny' : 'Pridať';
    }
  },

  async toggleVisibility(item) {
    try { await API.toggle(this.TABLE, item.id, 'is_published', item.is_published); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },

  async remove(item) {
    if (!confirm(`Zmazať odkaz "${I18N.t(item.label, 'sk')}"?`)) return;
    try { await API.remove(this.TABLE, item.id); Utils.toast('✓ Zmazané', 'success'); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },
};
