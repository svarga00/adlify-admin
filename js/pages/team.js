// js/pages/team.js — Tím (web_team)
// Etapa D: členovia tímu na /kontakt stránke

window.Team = {
  TABLE: 'web_team',

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Tím</h1>
            <p class="text-sm text-gray-500 mt-1">${items.length} ${items.length === 1 ? 'člen' : 'členov'}</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať člena</span>
          </button>
        </div>

        <div class="space-y-2">
          ${items.length === 0 ? this.empty() : items.map(i => this.row(i)).join('')}
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

  empty() {
    return `<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center">
      <div class="text-3xl mb-2">👤</div>
      <p class="text-sm text-gray-500">Zatiaľ žiadny členovia tímu.</p>
    </div>`;
  },

  row(item) {
    const pub = item.is_published !== false;
    const role = I18N.t(item.role, 'sk');

    const photo = item.photo_url
      ? `<img src="${Utils.escape(item.photo_url)}" alt="" class="w-12 h-12 rounded-full object-cover bg-gray-100 border border-gray-200 flex-shrink-0">`
      : `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 text-white font-bold flex items-center justify-center flex-shrink-0">${Utils.escape(item.initials || '?')}</div>`;

    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-start gap-4">
        ${photo}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-gray-900 text-sm">${Utils.escape(item.name) || '<em class="text-gray-400">Bez mena</em>'}</span>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}">
              ${pub ? 'Live' : 'Skryté'}
            </span>
          </div>
          <div class="text-xs text-gray-500 mb-1">${Utils.escape(role)}</div>
          <div class="text-xs text-gray-400 font-mono">${Utils.escape(item.email || '')}</div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button data-action="toggle" class="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900" title="${pub ? 'Skryť' : 'Zverejniť'}">${pub ? '👁' : '🚫'}</button>
          <button data-action="edit" class="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg">Upraviť</button>
          <button data-action="delete" class="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg">🗑</button>
        </div>
      </div>
    `;
  },

  async openEditor(item) {
    const isNew = !item;
    const data = item || {
      name: '',
      initials: '',
      email: '',
      phone: '',
      photo_url: '',
      role: {},
      bio: {},
      is_published: true,
      sort_order: 0,
    };

    Modal.open(`${isNew ? 'Pridať' : 'Upraviť'} člena tímu`, `
      <form id="team-form" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Meno *</label>
            <input type="text" name="name" value="${Utils.escape(data.name)}" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Iniciály *</label>
            <input type="text" name="initials" value="${Utils.escape(data.initials)}" required maxlength="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900" />
          </div>
        </div>

        ${I18N.renderField('role', data.role, { label: 'Pozícia / role' })}

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">E-mail</label>
            <input type="email" name="email" value="${Utils.escape(data.email || '')}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Telefón</label>
            <input type="tel" name="phone" value="${Utils.escape(data.phone || '')}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Foto URL (voliteľné)</label>
          <input type="url" name="photo_url" value="${Utils.escape(data.photo_url || '')}"
            placeholder="https://..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900" />
          ${ImageUploader ? `<button type="button" id="upload-photo" class="mt-2 text-xs text-blue-600 hover:underline">📤 Nahrať obrázok</button>` : ''}
        </div>

        ${I18N.renderField('bio', data.bio, { label: 'Bio (voliteľné)', type: 'textarea', rows: 3 })}

        <div class="grid grid-cols-2 gap-3">
          <label class="flex items-center gap-2">
            <input type="checkbox" name="is_published" ${data.is_published !== false ? 'checked' : ''} />
            <span class="text-sm">Zverejnené</span>
          </label>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Poradie (sort)</label>
            <input type="number" name="sort_order" value="${data.sort_order || 0}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t">
          <button type="button" id="cancel" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Zrušiť</button>
          <button type="submit" class="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg">
            ${isNew ? 'Vytvoriť' : 'Uložiť'}
          </button>
        </div>
      </form>
    `);

    document.getElementById('cancel').addEventListener('click', () => Modal.close());

    // Image uploader
    if (window.ImageUploader) {
      document.getElementById('upload-photo')?.addEventListener('click', async () => {
        const url = await ImageUploader.pick();
        if (url) {
          document.querySelector('[name="photo_url"]').value = url;
        }
      });
    }

    document.getElementById('team-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        name:         fd.get('name'),
        initials:     fd.get('initials'),
        email:        fd.get('email') || null,
        phone:        fd.get('phone') || null,
        photo_url:    fd.get('photo_url') || null,
        role:         I18N.collectField('role'),
        bio:          I18N.collectField('bio'),
        is_published: fd.get('is_published') === 'on',
        sort_order:   parseInt(fd.get('sort_order') || '0', 10),
      };

      try {
        if (isNew) {
          await API.create(this.TABLE, payload);
          Utils.toast('Člen tímu pridaný', 'success');
        } else {
          await API.update(this.TABLE, item.id, payload);
          Utils.toast('Uložené', 'success');
        }
        State.buildPending = true;
        Modal.close();
        this.render();
      } catch (err) {
        Utils.toast('Chyba: ' + (err.message || err), 'error');
      }
    });
  },

  async toggleVisibility(item) {
    try {
      await API.update(this.TABLE, item.id, { is_published: !item.is_published });
      State.buildPending = true;
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + (err.message || err), 'error');
    }
  },

  async remove(item) {
    if (!confirm(`Vymazať "${item.name}"? Túto akciu nemožno vrátiť.`)) return;
    try {
      await API.remove(this.TABLE, item.id);
      Utils.toast('Vymazané', 'success');
      State.buildPending = true;
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + (err.message || err), 'error');
    }
  },
};
