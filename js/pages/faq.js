// js/pages/faq.js

window.Faq = {
  TABLE: 'web_faq',

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    // Group by category
    const grouped = {};
    items.forEach(i => {
      const cat = i.category || 'Iné';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(i);
    });

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">FAQ</h1>
            <p class="text-sm text-gray-500 mt-1">Často kladené otázky. Aktívny jazyk: <span class="font-mono uppercase font-semibold">${State.activeLang}</span></p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať otázku</span>
          </button>
        </div>

        ${items.length === 0 ? this.empty() : Object.entries(grouped).map(([cat, list]) => `
          <div class="mb-6">
            <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">${Utils.escape(cat)}</h2>
            <div class="space-y-2">
              ${list.map(i => this.row(i)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('add-btn').addEventListener('click', () => this.openEditor(null));

    document.querySelectorAll('[data-id]').forEach(el => {
      const id = el.getAttribute('data-id');
      const item = items.find(i => i.id === id);
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openEditor(item));
      el.querySelector('[data-action="toggle"]')?.addEventListener('click', () => this.toggle(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.remove(item));
    });
  },

  empty() {
    return `<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center">
      <div class="text-3xl mb-2">❓</div>
      <p class="text-sm text-gray-500">V jazyku <strong>${State.activeLang.toUpperCase()}</strong> zatiaľ žiadne otázky.</p>
    </div>`;
  },

  row(item) {
    const pub = item.is_published !== false;
    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-center gap-4">
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-gray-900 text-sm mb-1">${Utils.escape(item.question)}</div>
          <div class="text-xs text-gray-500 line-clamp-1">${Utils.escape(Utils.truncate(item.answer, 120))}</div>
        </div>
        <span class="text-[10px] font-bold uppercase px-2 py-1 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
          ${pub ? 'Live' : 'Skryté'}
        </span>
        <div class="flex gap-1">
          <button data-action="toggle" title="${pub ? 'Skryť' : 'Zverejniť'}" class="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">${pub ? '👁️' : '🚫'}</button>
          <button data-action="edit" title="Upraviť" class="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">✏️</button>
          <button data-action="delete" title="Zmazať" class="w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-500">🗑️</button>
        </div>
      </div>`;
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || { is_published: true, sort_order: 0 };

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Otázka *</label>
          <input type="text" name="question" required value="${Utils.escape(data.question || '')}"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Odpoveď *</label>
          <textarea name="answer" rows="5" required
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-y">${Utils.escape(data.answer || '')}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kategória</label>
            <input type="text" name="category" value="${Utils.escape(data.category || '')}" placeholder="napr. Spolupráca, Cenník"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Poradie</label>
            <input type="number" name="sort_order" value="${data.sort_order || 0}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kľúč (key)</label>
          <input type="text" name="faq_key" required value="${Utils.escape(data.faq_key || '')}" placeholder="napr. min_kontrakt"
            ${item ? 'readonly' : ''}
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 font-mono ${item ? 'bg-gray-50' : ''}">
          <p class="text-[11px] text-gray-500 mt-1">Spája všetky jazykové verzie. Nemení sa po vytvorení.</p>
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_published" ${data.is_published !== false ? 'checked' : ''} class="w-4 h-4">
          <span class="text-sm text-gray-700">Zverejnené</span>
        </label>
      </form>
    `;

    const footer = `
      ${item ? '<button id="del-btn" class="mr-auto px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">Zmazať</button>' : ''}
      <button id="cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Zrušiť</button>
      <button id="save-btn" class="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg">${isNew ? 'Pridať' : 'Uložiť'}</button>
    `;

    const drawer = Utils.drawer(isNew ? 'Nová otázka' : 'Upraviť otázku', formHtml, { footer });

    drawer.footer.querySelector('#cancel-btn').addEventListener('click', drawer.close);

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const form = drawer.body.querySelector('#t-form');
      const payload = Utils.formData(form);
      payload.lang = State.activeLang;

      try {
        if (item) await API.update(this.TABLE, item.id, payload);
        else await API.insert(this.TABLE, payload);
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
        if (!await Utils.confirm('Naozaj zmazať túto otázku?', { danger: true, confirmLabel: 'Zmazať' })) return;
        await API.remove(this.TABLE, item.id);
        Utils.toast('Zmazané', 'success');
        State.buildPending = true;
        drawer.close();
        Router.render();
      });
    }
  },

  async toggle(item) {
    await API.toggle(this.TABLE, item.id, 'is_published', item.is_published);
    State.buildPending = true;
    Router.render();
  },

  async remove(item) {
    if (!await Utils.confirm(`Zmazať otázku "${Utils.truncate(item.question, 50)}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    await API.remove(this.TABLE, item.id);
    Utils.toast('Zmazané', 'success');
    State.buildPending = true;
    Router.render();
  },
};
