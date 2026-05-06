// js/pages/testimonials.js

window.Testimonials = {
  TABLE: 'web_testimonials',
  KEY_FIELD: 'testimonial_key',

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Testimoniály</h1>
            <p class="text-sm text-gray-500 mt-1">Hodnotenia klientov zobrazované na webe. Aktívny jazyk: <span class="font-mono uppercase font-semibold">${State.activeLang}</span></p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať</span>
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
      <div class="text-3xl mb-2">💬</div>
      <p class="text-sm text-gray-500">V jazyku <strong>${State.activeLang.toUpperCase()}</strong> zatiaľ žiadne testimoniály.</p>
    </div>`;
  },

  row(item) {
    const pub = item.is_published !== false;
    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          ${Utils.escape(item.author_initials || '??')}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-gray-900 text-sm">${Utils.escape(item.author_name)}</div>
          <div class="text-xs text-gray-500 mb-1">${Utils.escape(item.author_role || '')}</div>
          <div class="text-sm text-gray-600 line-clamp-1">"${Utils.escape(Utils.truncate(item.quote, 100))}"</div>
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
    const data = item || { is_published: true, sort_order: 0, lang: State.activeLang };

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Citát *</label>
          <textarea name="quote" rows="4" required
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-y"
            placeholder="Čo klient povedal...">${Utils.escape(data.quote || '')}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Meno *</label>
            <input type="text" name="author_name" required value="${Utils.escape(data.author_name || '')}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Iniciály</label>
            <input type="text" name="author_initials" maxlength="3" value="${Utils.escape(data.author_initials || '')}" placeholder="PN"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 uppercase">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Funkcia / firma</label>
          <input type="text" name="author_role" value="${Utils.escape(data.author_role || '')}" placeholder="Konateľka, Krajčírstvo Soja"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kľúč (key)</label>
            <input type="text" name="testimonial_key" required value="${Utils.escape(data.testimonial_key || '')}" placeholder="napr. peter_novy"
              ${item ? 'readonly' : ''}
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 font-mono ${item ? 'bg-gray-50' : ''}">
            <p class="text-[11px] text-gray-500 mt-1">Spája všetky jazykové verzie. Nemení sa po vytvorení.</p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Poradie</label>
            <input type="number" name="sort_order" value="${data.sort_order || 0}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          </div>
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_published" ${data.is_published !== false ? 'checked' : ''} class="w-4 h-4">
          <span class="text-sm text-gray-700">Zverejnené (zobraziť na webe)</span>
        </label>
      </form>
    `;

    const footer = `
      ${item ? '<button id="del-btn" class="mr-auto px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">Zmazať</button>' : ''}
      <button id="cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Zrušiť</button>
      <button id="save-btn" class="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg">${isNew ? 'Pridať' : 'Uložiť'}</button>
    `;

    const drawer = Utils.drawer(isNew ? 'Nový testimoniál' : 'Upraviť testimoniál', formHtml, { footer });

    drawer.footer.querySelector('#cancel-btn').addEventListener('click', drawer.close);

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const form = drawer.body.querySelector('#t-form');
      const payload = Utils.formData(form);
      payload.lang = State.activeLang;
      payload.author_initials = (payload.author_initials || '').toUpperCase();

      try {
        if (item) {
          await API.update(this.TABLE, item.id, payload);
        } else {
          await API.insert(this.TABLE, payload);
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
        if (!await Utils.confirm('Naozaj zmazať tento testimoniál?', { danger: true, confirmLabel: 'Zmazať' })) return;
        try {
          await API.remove(this.TABLE, item.id);
          Utils.toast('Zmazané', 'success');
          State.buildPending = true;
          drawer.close();
          Router.render();
        } catch (err) {
          Utils.toast('Chyba: ' + err.message, 'error');
        }
      });
    }
  },

  async toggle(item) {
    try {
      await API.toggle(this.TABLE, item.id, 'is_published', item.is_published);
      State.buildPending = true;
      Router.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },

  async remove(item) {
    if (!await Utils.confirm(`Zmazať testimoniál od "${item.author_name}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    try {
      await API.remove(this.TABLE, item.id);
      Utils.toast('Zmazané', 'success');
      State.buildPending = true;
      Router.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },
};
