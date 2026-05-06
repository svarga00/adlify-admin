// js/pages/translations.js
// UI texty — kľúč × jazyk grid editor

window.Translations = {
  TABLE: 'web_translations',

  state: {
    items: [],
    filterCategory: '',
    filterSearch: '',
    showOnlyMissing: false,
  },

  async render() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="text-center py-20 text-gray-400">⏳ Načítavam preklady…</div>';

    // Fetch ALL translations across all languages (no lang filter)
    const { data, error } = await window.supabase
      .from(this.TABLE)
      .select('*')
      .order('key');
    if (error) {
      content.innerHTML = `<div class="bg-red-50 p-4 rounded text-red-600">${error.message}</div>`;
      return;
    }
    this.state.items = data || [];

    // Build pivot: key → { sk, cs, hu, en, de, category, description }
    const pivot = {};
    for (const row of this.state.items) {
      if (!pivot[row.key]) {
        pivot[row.key] = { key: row.key, category: row.category || '', description: row.description || '' };
      }
      pivot[row.key][row.lang] = row.value;
      if (row.category) pivot[row.key].category = row.category;
      if (row.description) pivot[row.key].description = row.description;
    }
    this.state.pivot = pivot;

    // Get unique categories
    this.state.categories = [...new Set(Object.values(pivot).map(p => p.category).filter(Boolean))].sort();

    this.renderUI();
  },

  renderUI() {
    const content = document.getElementById('page-content');

    let entries = Object.values(this.state.pivot);

    // Filter by category
    if (this.state.filterCategory) {
      entries = entries.filter(e => e.category === this.state.filterCategory);
    }

    // Filter by search
    if (this.state.filterSearch) {
      const q = this.state.filterSearch.toLowerCase();
      entries = entries.filter(e =>
        e.key.toLowerCase().includes(q) ||
        Object.keys(e).some(k => typeof e[k] === 'string' && e[k].toLowerCase().includes(q))
      );
    }

    // Filter only missing in current lang
    if (this.state.showOnlyMissing) {
      entries = entries.filter(e => !e[State.activeLang]);
    }

    content.innerHTML = `
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">UI texty</h1>
            <p class="text-sm text-gray-500 mt-1">${this.state.items.length} prekladov v ${this.state.categories.length} kategóriách</p>
          </div>
          <button id="add-key-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Nový kľúč</span>
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center">
          <input id="search-input" type="text" placeholder="Hľadať…" value="${Utils.escape(this.state.filterSearch)}"
            class="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-500">
          <select id="category-select" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-500">
            <option value="">Všetky kategórie</option>
            ${this.state.categories.map(c => `<option value="${Utils.escape(c)}" ${c === this.state.filterCategory ? 'selected' : ''}>${Utils.escape(c)}</option>`).join('')}
          </select>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input id="missing-checkbox" type="checkbox" ${this.state.showOnlyMissing ? 'checked' : ''} class="w-4 h-4">
            <span>Iba chýbajúce v ${State.activeLang.toUpperCase()}</span>
          </label>
          <span class="text-xs text-gray-500 ml-auto">Zobrazené: ${entries.length}</span>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr class="text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th class="px-4 py-3 w-[200px]">Kľúč</th>
                  <th class="px-4 py-3">Hodnota (${State.activeLang.toUpperCase()})</th>
                  <th class="px-4 py-3 w-[80px]">Stav</th>
                  <th class="px-4 py-3 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                ${entries.length === 0 ? '<tr><td colspan="4" class="text-center py-12 text-gray-400">Žiadne preklady k zobrazeniu</td></tr>' : entries.map(e => this.gridRow(e)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Bind filters
    document.getElementById('search-input').addEventListener('input', Utils.debounce(e => {
      this.state.filterSearch = e.target.value;
      this.renderUI();
    }, 200));

    document.getElementById('category-select').addEventListener('change', e => {
      this.state.filterCategory = e.target.value;
      this.renderUI();
    });

    document.getElementById('missing-checkbox').addEventListener('change', e => {
      this.state.showOnlyMissing = e.target.checked;
      this.renderUI();
    });

    document.getElementById('add-key-btn').addEventListener('click', () => this.openEditor(null));

    document.querySelectorAll('[data-trans-key]').forEach(el => {
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        const key = el.getAttribute('data-trans-key');
        this.openEditor(this.state.pivot[key]);
      });
      el.querySelector('.inline-edit')?.addEventListener('blur', async (e) => {
        const key = el.getAttribute('data-trans-key');
        const newVal = e.target.value;
        const oldVal = this.state.pivot[key]?.[State.activeLang] || '';
        if (newVal === oldVal) return;
        await this.saveSingle(key, State.activeLang, newVal);
      });
    });
  },

  gridRow(e) {
    const langs = ['sk','cs','hu','en','de'];
    const filledCount = langs.filter(l => e[l]).length;
    const value = e[State.activeLang] || '';
    const isMissing = !value;

    return `
      <tr data-trans-key="${Utils.escape(e.key)}" class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-4 py-2.5 font-mono text-xs text-gray-700">
          <div class="font-semibold">${Utils.escape(e.key)}</div>
          <div class="text-gray-400 truncate max-w-[200px]" title="${Utils.escape(e.description || '')}">${Utils.escape(e.category || '')}</div>
        </td>
        <td class="px-4 py-2.5">
          <input class="inline-edit w-full px-3 py-2 border ${isMissing ? 'border-amber-300 bg-amber-50' : 'border-transparent'} hover:border-gray-300 focus:border-brand-500 focus:bg-white rounded-lg text-sm focus:outline-none transition"
            value="${Utils.escape(value)}" placeholder="${isMissing ? '(chýba preklad)' : ''}">
        </td>
        <td class="px-4 py-2.5">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold ${filledCount === 5 ? 'text-emerald-600' : 'text-amber-600'}">
            ${filledCount}/5
          </span>
        </td>
        <td class="px-4 py-2.5">
          <button data-action="edit" title="Upraviť všetky jazyky" class="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-500 text-xs">✏️</button>
        </td>
      </tr>
    `;
  },

  async saveSingle(key, lang, value) {
    try {
      if (!value) {
        // Empty — delete the row in this lang
        await window.supabase.from(this.TABLE).delete().eq('key', key).eq('lang', lang);
      } else {
        await window.supabase.from(this.TABLE).upsert({
          key, lang, value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key,lang' });
      }
      // Update local state
      if (!this.state.pivot[key]) this.state.pivot[key] = { key };
      this.state.pivot[key][lang] = value;
      Utils.toast('Uložené', 'success', 1500);
      State.buildPending = true;
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || { key: '', category: '', description: '' };

    const langInput = (lang) => `
      <div>
        <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">${LANG_LABELS[lang]} (${lang.toUpperCase()})</label>
        <textarea name="value_${lang}" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-500 resize-y">${Utils.escape(data[lang] || '')}</textarea>
      </div>
    `;

    const formHtml = `
      <form id="t-form" class="space-y-4" onsubmit="return false;">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kľúč *</label>
            <input type="text" name="key" required value="${Utils.escape(data.key || '')}" placeholder="napr. nav.home"
              ${item ? 'readonly' : ''}
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono ${item ? 'bg-gray-50' : ''}">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kategória</label>
            <input type="text" name="category" value="${Utils.escape(data.category || '')}" placeholder="nav, hero, cta"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Popis (kde sa toto používa)</label>
          <input type="text" name="description" value="${Utils.escape(data.description || '')}" placeholder="napr. Hlavné CTA v hero sekcii"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
        </div>

        <div class="space-y-3 bg-gray-50 p-4 rounded-xl">
          <div class="text-xs font-bold text-gray-700 uppercase">Preklady</div>
          ${langInput('sk')}
          ${langInput('cs')}
          ${langInput('hu')}
          ${langInput('en')}
          ${langInput('de')}
        </div>
      </form>
    `;

    const footer = `
      ${item ? '<button id="del-btn" class="mr-auto px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">Zmazať vo všetkých jazykoch</button>' : ''}
      <button id="cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Zrušiť</button>
      <button id="save-btn" class="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg">${isNew ? 'Vytvoriť' : 'Uložiť všetky'}</button>
    `;

    const drawer = Utils.drawer(isNew ? 'Nový kľúč' : `Upraviť: ${data.key}`, formHtml, { footer });
    drawer.footer.querySelector('#cancel-btn').addEventListener('click', drawer.close);

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const form = drawer.body.querySelector('#t-form');
      const fd = new FormData(form);
      const key = fd.get('key');
      const category = fd.get('category') || null;
      const description = fd.get('description') || null;

      try {
        // For each language, upsert or delete
        for (const lang of ['sk','cs','hu','en','de']) {
          const value = fd.get(`value_${lang}`);
          if (value) {
            await window.supabase.from(this.TABLE).upsert({
              key, lang, value, category, description,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key,lang' });
          } else if (item) {
            // Empty — delete this lang version (only if editing existing)
            await window.supabase.from(this.TABLE).delete().eq('key', key).eq('lang', lang);
          }
        }
        Utils.toast('Uložené', 'success');
        State.buildPending = true;
        drawer.close();
        Router.render();
      } catch (err) {
        Utils.toast('Chyba: ' + err.message, 'error');
      }
    });

    if (item) {
      drawer.footer.querySelector('#del-btn').addEventListener('click', async () => {
        if (!await Utils.confirm(`Zmazať kľúč "${item.key}" vo všetkých 5 jazykoch?`, { danger: true, confirmLabel: 'Zmazať všetky' })) return;
        await window.supabase.from(this.TABLE).delete().eq('key', item.key);
        Utils.toast('Zmazané', 'success');
        State.buildPending = true;
        drawer.close();
        Router.render();
      });
    }
  },
};
