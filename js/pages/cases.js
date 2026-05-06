// js/pages/cases.js

window.Cases = {
  TABLE: 'web_cases',

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Prípadové štúdie</h1>
            <p class="text-sm text-gray-500 mt-1">Aktívny jazyk: <span class="font-mono uppercase font-semibold">${State.activeLang}</span></p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať prípadovku</span>
          </button>
        </div>

        <div class="space-y-2">
          ${items.length === 0 ? this.empty() : items.map(i => this.row(i)).join('')}
        </div>
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
      <div class="text-3xl mb-2">📊</div>
      <p class="text-sm text-gray-500">V jazyku <strong>${State.activeLang.toUpperCase()}</strong> zatiaľ žiadne prípadovky.</p>
    </div>`;
  },

  row(item) {
    const pub = item.is_published !== false;
    const gradient = item.hero_gradient || 'linear-gradient(135deg, #F16434, #E85D9C)';
    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg flex-shrink-0" style="background: ${Utils.escape(gradient)}"></div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-gray-900 text-sm">${Utils.escape(item.title)}</div>
          <div class="text-xs text-gray-500">${Utils.escape(item.category || '')} · /${Utils.escape(item.slug)}</div>
          <div class="text-xs text-gray-600 mt-1">
            ${item.kpi_1_label ? `<strong>${Utils.escape(item.kpi_1_label)}:</strong> ${Utils.escape(item.kpi_1_value || '')}` : ''}
            ${item.kpi_2_label ? ` · <strong>${Utils.escape(item.kpi_2_label)}:</strong> ${Utils.escape(item.kpi_2_value || '')}` : ''}
          </div>
        </div>
        <span class="text-[10px] font-bold uppercase px-2 py-1 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
          ${pub ? 'Live' : 'Skryté'}
        </span>
        <div class="flex gap-1">
          <button data-action="toggle" class="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">${pub ? '👁️' : '🚫'}</button>
          <button data-action="edit" class="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">✏️</button>
          <button data-action="delete" class="w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-500">🗑️</button>
        </div>
      </div>`;
  },

  async openEditor(item) {
    const isNew = !item;
    const data = item || { is_published: true, sort_order: 0, body_html: '' };

    const kpiRow = (n) => `
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">KPI ${n} — popis</label>
          <input type="text" name="kpi_${n}_label" value="${Utils.escape(data['kpi_' + n + '_label'] || '')}" placeholder="${n === 1 ? 'Tržby YoY' : 'ROAS'}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">KPI ${n} — hodnota</label>
          <input type="text" name="kpi_${n}_value" value="${Utils.escape(data['kpi_' + n + '_value'] || '')}" placeholder="${n === 1 ? '+284%' : '6.2×'}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-500">
        </div>
      </div>
    `;

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Slug *</label>
            <input type="text" name="slug" required value="${Utils.escape(data.slug || '')}" placeholder="zlatka-sk"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 font-mono">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Názov *</label>
            <input type="text" name="title" required value="${Utils.escape(data.title || '')}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kategória</label>
          <input type="text" name="category" value="${Utils.escape(data.category || '')}" placeholder="E-COMMERCE · ŠPERKY"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Hero gradient (CSS)</label>
          <input type="text" name="hero_gradient" value="${Utils.escape(data.hero_gradient || '')}" placeholder="linear-gradient(135deg, #F16434, #E85D9C)"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 font-mono">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Krátke zhrnutie</label>
          <textarea name="summary" rows="2" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 resize-y">${Utils.escape(data.summary || '')}</textarea>
        </div>

        <div class="space-y-3 bg-gray-50 p-4 rounded-xl">
          <div class="text-xs font-semibold text-gray-600 uppercase">KPI (3)</div>
          ${kpiRow(1)}
          ${kpiRow(2)}
          ${kpiRow(3)}
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Detailný obsah (pre /pripadove-studie/${Utils.escape(data.slug || 'slug')})</label>
          <div class="border border-gray-300 rounded-xl overflow-hidden">
            ${TipTap.toolbarHTML()}
            <div id="case-body" class="bg-white"></div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Poradie</label>
          <input type="number" name="sort_order" value="${data.sort_order || 0}"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
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

    const drawer = Utils.drawer(isNew ? 'Nová prípadovka' : 'Upraviť prípadovku', formHtml, { footer });

    // Init TipTap editor
    const bodyEl = drawer.body.querySelector('#case-body');
    const toolbarEl = drawer.body.querySelector('.tiptap-toolbar');
    let editor;
    try {
      bodyEl.innerHTML = '<div class="p-4 text-sm text-gray-400">Načítavam editor…</div>';
      editor = await TipTap.mount(bodyEl, data.body_html || '', { placeholder: 'Detailný popis prípadovky…' });
      bodyEl.querySelector('.p-4.text-sm.text-gray-400')?.remove();
      TipTap.bindToolbar(toolbarEl, editor);
    } catch (err) {
      bodyEl.innerHTML = `<div class="p-4 text-sm text-red-600">Chyba pri načítaní editora: ${err.message}</div>`;
    }

    drawer.footer.querySelector('#cancel-btn').addEventListener('click', () => {
      editor?.destroy();
      drawer.close();
    });

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const payload = Utils.formData(drawer.body.querySelector('#t-form'));
      payload.lang = State.activeLang;
      payload.body_html = editor?.getHTML() || '';

      try {
        if (item) await API.update(this.TABLE, item.id, payload);
        else await API.insert(this.TABLE, payload);
        Utils.toast('Uložené ✓', 'success');
        State.buildPending = true;
        editor?.destroy();
        drawer.close();
        Router.render();
      } catch (err) {
        Utils.toast('Chyba: ' + err.message, 'error');
      }
    });

    if (item) {
      drawer.footer.querySelector('#del-btn').addEventListener('click', async () => {
        if (!await Utils.confirm('Naozaj zmazať túto prípadovku?', { danger: true, confirmLabel: 'Zmazať' })) return;
        await API.remove(this.TABLE, item.id);
        Utils.toast('Zmazané', 'success');
        State.buildPending = true;
        editor?.destroy();
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
    if (!await Utils.confirm(`Zmazať prípadovku "${item.title}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    await API.remove(this.TABLE, item.id);
    Utils.toast('Zmazané', 'success');
    State.buildPending = true;
    Router.render();
  },
};
