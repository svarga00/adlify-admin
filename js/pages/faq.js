// js/pages/faq.js — FAQ (web_faq)

window.Faq = {
  TABLE: 'web_faq',

  CATEGORIES: [
    { value: 'general',   label: 'Všeobecné',  emoji: '💡' },
    { value: 'pricing',   label: 'Ceny',       emoji: '💰' },
    { value: 'process',   label: 'Proces',     emoji: '⚙️' },
    { value: 'technical', label: 'Technické',  emoji: '🔧' },
  ],

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    // Group by category
    const grouped = {};
    this.CATEGORIES.forEach(c => grouped[c.value] = []);
    items.forEach(i => {
      const cat = i.category || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(i);
    });

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">FAQ</h1>
            <p class="text-sm text-gray-500 mt-1">${items.length} ${items.length === 1 ? 'otázka' : 'otázok'}</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať otázku</span>
          </button>
        </div>

        ${items.length === 0 ? this.empty() : this.CATEGORIES.map(cat => {
          const list = grouped[cat.value] || [];
          if (!list.length) return '';
          return `
            <div class="mb-6">
              <h2 class="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <span>${cat.emoji}</span>
                <span>${cat.label}</span>
                <span class="text-xs font-normal text-gray-400">(${list.length})</span>
              </h2>
              <div class="space-y-2">
                ${list.map(i => this.row(i)).join('')}
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

  empty() {
    return `<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center">
      <div class="text-3xl mb-2">❓</div>
      <p class="text-sm text-gray-500">Zatiaľ žiadne FAQ.</p>
    </div>`;
  },

  row(item) {
    const pub = item.is_published !== false;
    const question = I18N.t(item.question, 'sk');
    const answer = I18N.t(item.answer, 'sk');
    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-gray-900 text-sm">${Utils.escape(question) || '<em class="text-gray-400">Bez otázky</em>'}</span>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}">
              ${pub ? 'Live' : 'Skryté'}
            </span>
          </div>
          <div class="text-xs text-gray-600 mt-1">${Utils.escape(Utils.truncate(answer, 120))}</div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button data-action="toggle" class="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900" title="${pub ? 'Skryť' : 'Zverejniť'}">${pub ? '👁' : '🚫'}</button>
          <button data-action="edit" class="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg">Upraviť</button>
          <button data-action="delete" class="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg">🗑</button>
        </div>
      </div>
    `;
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || {
      category: 'general',
      question: I18N.empty(),
      answer: I18N.empty(),
      is_published: true,
      sort_order: 0,
    };

    const drawer = Utils.drawer(`${isNew ? 'Pridať' : 'Upraviť'} otázku`, `<form id="faq-form" class="space-y-5">

      <div class="bg-gradient-to-r from-brand-50 to-pink-50 border border-brand-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-900">Hromadný preklad</div>
          <div class="text-xs text-gray-600 mt-0.5">SK → CS / HU / EN / DE.</div>
        </div>
        <button type="button" id="translate-all-btn"
          class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50">
          <span>✨</span><span id="translate-all-label">Preložiť všetko</span>
        </button>
      </div>

      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Kategória</label>
            <select name="category" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              ${this.CATEGORIES.map(c => `<option value="${c.value}" ${data.category === c.value ? 'selected' : ''}>${c.emoji} ${c.label}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Poradie</label>
            <input type="number" name="sort_order" value="${data.sort_order || 0}"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
        </div>

        ${I18N.renderField('question', data.question, { label: 'Otázka', required: true })}
        ${I18N.renderField('answer', data.answer, { label: 'Odpoveď', type: 'textarea', rows: 6, required: true })}
      </div>

      <div class="bg-gray-50 rounded-xl p-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_published" ${data.is_published !== false ? 'checked' : ''} class="w-4 h-4">
          <span class="text-sm font-semibold text-gray-900">Zverejniť na webe</span>
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

    drawer.body.querySelector('#faq-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });
    drawer.body.querySelector('[data-close]')?.addEventListener('click', () => drawer.close());
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#faq-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const payload = I18N.serializeForm(form, ['question', 'answer']);

      if (!I18N.t(payload.question, 'sk')?.trim()) throw new Error('Otázka (SK) je povinná');
      if (!I18N.t(payload.answer, 'sk')?.trim()) throw new Error('Odpoveď (SK) je povinná');

      if (item) {
        await API.update(this.TABLE, item.id, payload);
      } else {
        await API.insert(this.TABLE, payload);
      }

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
    try {
      await API.toggle(this.TABLE, item.id, 'is_published', item.is_published);
      Utils.toast(item.is_published ? 'Skryté' : 'Zverejnené', 'success');
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },

  async remove(item) {
    if (!confirm(`Zmazať otázku?`)) return;
    try {
      await API.remove(this.TABLE, item.id);
      Utils.toast('✓ Zmazané', 'success');
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },
};
