// js/pages/translations.js — UI texty (web_translations) bulk edit

window.Translations = {
  TABLE: 'web_translations',

  async render() {
    const items = await this.fetchAll();
    const content = document.getElementById('page-content');

    // Group by namespace
    const grouped = {};
    items.forEach(i => {
      const ns = i.namespace || 'common';
      if (!grouped[ns]) grouped[ns] = [];
      grouped[ns].push(i);
    });

    const namespaces = Object.keys(grouped).sort();

    content.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">UI texty</h1>
            <p class="text-sm text-gray-500 mt-1">${items.length} ${items.length === 1 ? 'preklad' : 'prekladov'} v ${namespaces.length} namespaces</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať</span>
          </button>
        </div>

        ${namespaces.length === 0 ? `<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div class="text-3xl mb-2">🌍</div>
          <p class="text-sm text-gray-500">Zatiaľ žiadne UI texty.</p>
        </div>` : namespaces.map(ns => `
          <div class="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <span class="text-sm font-bold text-gray-900">${Utils.escape(ns)}</span>
              <span class="text-xs text-gray-500">${grouped[ns].length} kľúčov</span>
            </div>
            <div class="divide-y divide-gray-100">
              ${grouped[ns].map(i => this.row(i)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('add-btn').addEventListener('click', () => this.openEditor(null));
    items.forEach(item => {
      const el = document.querySelector(`[data-id="${item.id}"]`);
      if (!el) return;
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openEditor(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.remove(item));
    });
  },

  async fetchAll() {
    const { data, error } = await window.supabase
      .from(this.TABLE)
      .select('*')
      .order('namespace', { ascending: true })
      .order('key', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  row(item) {
    const sk = I18N.t(item.value, 'sk');
    return `
      <div data-id="${item.id}" class="px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <code class="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">${Utils.escape(item.key)}</code>
            ${item.description ? `<span class="text-xs text-gray-400 truncate">${Utils.escape(item.description)}</span>` : ''}
          </div>
          <div class="text-sm text-gray-700 mt-1 truncate">${Utils.escape(sk) || '<em class="text-gray-400">prázdne</em>'}</div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button data-action="edit" class="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded">Upraviť</button>
          <button data-action="delete" class="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">🗑</button>
        </div>
      </div>
    `;
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || {
      namespace: 'common',
      key: '',
      value: I18N.empty(),
      description: '',
    };

    const drawer = Utils.drawer(`${isNew ? 'Pridať' : 'Upraviť'} UI text`, `<form id="trans-form" class="space-y-5">

      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Namespace</label>
            <input type="text" name="namespace" required value="${Utils.escape(data.namespace || 'common')}"
              placeholder="common"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
            <p class="text-xs text-gray-500 mt-1">napr. common, forms, errors, cta, buttons</p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Key</label>
            <input type="text" name="key" required value="${Utils.escape(data.key || '')}"
              placeholder="submit"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Popis (pre prekladateľa, nie zobrazený)</label>
          <input type="text" name="description" value="${Utils.escape(data.description || '')}"
            placeholder="Submit button label"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
        </div>

        ${I18N.renderField('value', data.value, { label: 'Preložený text', required: true })}
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button type="submit" class="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
          ${isNew ? 'Pridať' : 'Uložiť zmeny'}
        </button>
        <button type="button" data-close class="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">Zrušiť</button>
      </div>
    </form>`);

    I18N.bindFieldSwitchers(drawer.body);

    drawer.body.querySelector('#trans-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });
    drawer.body.querySelector('[data-close]')?.addEventListener('click', () => drawer.close());
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#trans-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const payload = I18N.serializeForm(form, ['value']);
      if (!payload.namespace?.trim()) throw new Error('Namespace je povinný');
      if (!payload.key?.trim()) throw new Error('Key je povinný');
      if (!I18N.t(payload.value, 'sk')?.trim()) throw new Error('Hodnota (SK) je povinná');

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

  async remove(item) {
    if (!confirm(`Zmazať preklad "${item.namespace}.${item.key}"?`)) return;
    try { await API.remove(this.TABLE, item.id); Utils.toast('✓ Zmazané', 'success'); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },
};
