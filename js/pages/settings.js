// js/pages/settings.js

window.Settings = {
  TABLE: 'web_settings',

  async render() {
    const content = document.getElementById('page-content');
    const { data, error } = await window.supabase.from(this.TABLE).select('*').order('category').order('key');
    if (error) {
      content.innerHTML = `<div class="bg-red-50 p-4 rounded text-red-600">${error.message}</div>`;
      return;
    }

    // Group by category
    const grouped = {};
    (data || []).forEach(s => {
      const cat = s.category || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });

    const CAT_LABELS = {
      contact: 'Kontakt',
      company: 'Firma',
      social:  'Sociálne siete',
      hero:    'Hero sekcia',
      email:   'E-mail',
      system:  'Systémové',
      general: 'Všeobecné',
    };

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Nastavenia</h1>
            <p class="text-sm text-gray-500 mt-1">Globálne nastavenia (kontakt, social, hero čísla). Nelokalizované.</p>
          </div>
          <button id="add-setting" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať nastavenie</span>
          </button>
        </div>

        ${Object.entries(grouped).map(([cat, items]) => `
          <div class="mb-6">
            <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">${Utils.escape(CAT_LABELS[cat] || cat)}</h2>
            <div class="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
              ${items.map(s => this.row(s)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('add-setting').addEventListener('click', () => this.openEditor(null));
    document.querySelectorAll('[data-setting-key]').forEach(el => {
      const key = el.getAttribute('data-setting-key');
      const item = (data || []).find(d => d.key === key);
      el.querySelector('[data-action="save"]')?.addEventListener('click', () => this.saveInline(item, el));
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openEditor(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.remove(item));
    });
  },

  row(item) {
    // Smart input: detect if it's a string, number, boolean, or JSON
    let displayValue = item.value;
    if (typeof item.value === 'string') displayValue = item.value;
    else if (typeof item.value === 'object') displayValue = JSON.stringify(item.value);
    else displayValue = String(item.value);

    return `
      <div data-setting-key="${Utils.escape(item.key)}" class="px-4 py-3 grid grid-cols-12 gap-3 items-center">
        <div class="col-span-4">
          <div class="font-mono text-xs font-semibold text-gray-900">${Utils.escape(item.key)}</div>
          ${item.description ? `<div class="text-xs text-gray-500 mt-0.5 line-clamp-1">${Utils.escape(item.description)}</div>` : ''}
        </div>
        <div class="col-span-6">
          <input class="setting-input w-full px-3 py-2 border border-gray-200 hover:border-gray-300 focus:border-brand-500 rounded-lg text-sm focus:outline-none" value='${Utils.escape(displayValue)}'>
        </div>
        <div class="col-span-2 flex justify-end gap-1">
          <button data-action="save" class="px-3 h-8 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold">Uložiť</button>
          <button data-action="edit" title="Detail" class="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 text-xs">✏️</button>
          <button data-action="delete" title="Zmazať" class="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-500 text-xs">🗑️</button>
        </div>
      </div>`;
  },

  async saveInline(item, el) {
    const input = el.querySelector('.setting-input');
    const newValueStr = input.value;
    let value;
    try {
      // Try parsing as JSON first (for numbers, booleans, objects)
      value = JSON.parse(newValueStr);
    } catch {
      // Fallback: keep as string (wrap in quotes for jsonb)
      value = newValueStr;
    }

    try {
      await window.supabase.from(this.TABLE)
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', item.key);
      Utils.toast('Uložené ✓', 'success', 1500);
      State.buildPending = true;
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || { key: '', value: '', description: '', category: 'general' };

    const valueStr = typeof data.value === 'string' ? data.value : JSON.stringify(data.value, null, 2);

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kľúč *</label>
          <input type="text" name="key" required value="${Utils.escape(data.key || '')}" ${item ? 'readonly' : ''}
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono ${item ? 'bg-gray-50' : ''}">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Hodnota *</label>
          <textarea name="value" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-500 resize-y">${Utils.escape(valueStr)}</textarea>
          <p class="text-[11px] text-gray-500 mt-1">Reťazec, číslo alebo JSON. Stringy sa automaticky obalia úvodzovkami.</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kategória</label>
            <select name="category" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500">
              <option value="general"  ${data.category === 'general' ? 'selected' : ''}>Všeobecné</option>
              <option value="contact"  ${data.category === 'contact' ? 'selected' : ''}>Kontakt</option>
              <option value="company"  ${data.category === 'company' ? 'selected' : ''}>Firma</option>
              <option value="social"   ${data.category === 'social' ? 'selected' : ''}>Sociálne siete</option>
              <option value="hero"     ${data.category === 'hero' ? 'selected' : ''}>Hero sekcia</option>
              <option value="email"    ${data.category === 'email' ? 'selected' : ''}>E-mail</option>
              <option value="system"   ${data.category === 'system' ? 'selected' : ''}>Systém</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Popis</label>
            <input type="text" name="description" value="${Utils.escape(data.description || '')}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
        </div>
      </form>
    `;

    const footer = `
      ${item ? '<button id="del-btn" class="mr-auto px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">Zmazať</button>' : ''}
      <button id="cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Zrušiť</button>
      <button id="save-btn" class="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg">${isNew ? 'Pridať' : 'Uložiť'}</button>
    `;

    const drawer = Utils.drawer(isNew ? 'Nové nastavenie' : 'Upraviť nastavenie', formHtml, { footer });
    drawer.footer.querySelector('#cancel-btn').addEventListener('click', drawer.close);

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const fd = new FormData(drawer.body.querySelector('#t-form'));
      const valueStr = fd.get('value');
      let value;
      try { value = JSON.parse(valueStr); }
      catch { value = valueStr; }

      const payload = {
        key: fd.get('key'),
        value,
        category: fd.get('category'),
        description: fd.get('description') || null,
        updated_at: new Date().toISOString(),
      };

      try {
        if (item) {
          await window.supabase.from(this.TABLE).update(payload).eq('key', item.key);
        } else {
          await window.supabase.from(this.TABLE).insert(payload);
        }
        Utils.toast('Uložené ✓', 'success');
        State.buildPending = true;
        drawer.close();
        Router.render();
      } catch (err) {
        Utils.toast('Chyba: ' + err.message, 'error');
      }
    });

    if (item) {
      drawer.footer.querySelector('#del-btn').addEventListener('click', async () => {
        if (!await Utils.confirm(`Zmazať nastavenie "${item.key}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
        await window.supabase.from(this.TABLE).delete().eq('key', item.key);
        Utils.toast('Zmazané', 'success');
        State.buildPending = true;
        drawer.close();
        Router.render();
      });
    }
  },

  async remove(item) {
    if (!await Utils.confirm(`Zmazať "${item.key}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    await window.supabase.from(this.TABLE).delete().eq('key', item.key);
    Utils.toast('Zmazané', 'success');
    State.buildPending = true;
    Router.render();
  },
};
