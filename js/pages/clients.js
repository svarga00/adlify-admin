// js/pages/clients.js — Klienti (web_clients) - ticker partnerov

window.Clients = {
  TABLE: 'web_clients',

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Klienti (ticker)</h1>
            <p class="text-sm text-gray-500 mt-1">${items.length} klientov v ticker pase na webe</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať klienta</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${items.length === 0 ? `<div class="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div class="text-3xl mb-2">👥</div>
            <p class="text-sm text-gray-500">Zatiaľ žiadni klienti.</p>
          </div>` : items.map(i => this.row(i)).join('')}
        </div>
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
    const industry = I18N.t(item.industry, 'sk');

    const logo = item.logo_url
      ? `<img src="${Utils.escape(item.logo_url)}" alt="" class="w-16 h-16 rounded-lg object-contain bg-white border border-gray-200">`
      : `<div class="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 text-white font-bold flex items-center justify-center text-lg">${Utils.escape((item.name || '?')[0].toUpperCase())}</div>`;

    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-center gap-4">
        ${logo}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-gray-900 text-sm">${Utils.escape(item.name) || '<em class="text-gray-400">Bez mena</em>'}</span>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}">
              ${pub ? 'Live' : 'Skryté'}
            </span>
          </div>
          <div class="text-xs text-gray-500">${Utils.escape(industry)}</div>
          ${item.website_url ? `<div class="text-xs text-brand-600 mt-1 truncate">🔗 ${Utils.escape(item.website_url)}</div>` : ''}
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
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
      name: '',
      industry: I18N.empty(),
      logo_url: '',
      website_url: '',
      is_published: true,
      sort_order: 0,
    };

    const drawer = Utils.drawer(`${isNew ? 'Pridať' : 'Upraviť'} klienta`, `<form id="client-form" class="space-y-5">

      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Názov firmy / brand</label>
          <input type="text" name="name" required value="${Utils.escape(data.name)}"
            placeholder="Zlatka.sk"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          <p class="text-xs text-gray-500 mt-1">Brand name — neprekladá sa</p>
        </div>

        ${I18N.renderField('industry', data.industry, { label: 'Odvetvie / popis (E-commerce / Šperky)' })}

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Web stránka (voliteľné)</label>
          <input type="url" name="website_url" value="${Utils.escape(data.website_url || '')}"
            placeholder="https://zlatka.sk"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
        </div>
      </div>

      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        ${Uploader.render('logo_url', 'client-logos', data.logo_url, {
          label: 'Logo klienta',
          hint: 'PNG / SVG, ideálne s priehľadným pozadím, ~300×120 px',
        })}
      </div>

      <div class="bg-gray-50 rounded-xl p-4 space-y-3">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Poradie v ticker</label>
          <input type="number" name="sort_order" value="${data.sort_order || 0}"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
        </div>

        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_published" ${data.is_published !== false ? 'checked' : ''} class="w-4 h-4">
          <span class="text-sm font-semibold text-gray-900">Zobraziť v ticker</span>
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
    Uploader.bind(drawer.body);

    drawer.body.querySelector('#client-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });
    drawer.body.querySelector('[data-close]')?.addEventListener('click', () => drawer.close());
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#client-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const payload = I18N.serializeForm(form, ['industry']);

      if (!payload.name?.trim()) throw new Error('Názov firmy je povinný');

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
    if (!confirm(`Zmazať klienta "${item.name}"?`)) return;
    try {
      await API.remove(this.TABLE, item.id);
      Utils.toast('✓ Zmazané', 'success');
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },
};
