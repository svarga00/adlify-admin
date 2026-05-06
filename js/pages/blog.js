// js/pages/blog.js

window.Blog = {
  TABLE: 'web_blog_posts',

  async render() {
    const items = await API.list(this.TABLE, { orderBy: 'published_at', ascending: false });
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Blog</h1>
            <p class="text-sm text-gray-500 mt-1">Aktívny jazyk: <span class="font-mono uppercase font-semibold">${State.activeLang}</span></p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Nový post</span>
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
      <div class="text-3xl mb-2">📝</div>
      <p class="text-sm text-gray-500">V jazyku <strong>${State.activeLang.toUpperCase()}</strong> zatiaľ žiadne blog posty.</p>
    </div>`;
  },

  row(item) {
    const pub = item.is_published !== false;
    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-center gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            ${item.is_featured ? '<span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">★ Featured</span>' : ''}
            ${item.category ? `<span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">${Utils.escape(item.category)}</span>` : ''}
          </div>
          <div class="font-semibold text-gray-900 text-sm">${Utils.escape(item.title)}</div>
          <div class="text-xs text-gray-500 mt-0.5">/${Utils.escape(item.slug)} · ${Utils.formatDate(item.published_at)} · ${item.read_time_min || 5} min</div>
        </div>
        <span class="text-[10px] font-bold uppercase px-2 py-1 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
          ${pub ? 'Live' : 'Koncept'}
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
    const data = item || {
      is_published: false,
      is_featured: false,
      read_time_min: 5,
      author_name: 'Štefan',
      author_initials: 'ŠL',
      published_at: new Date().toISOString().substring(0, 10),
      body_html: '',
    };

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Slug *</label>
            <input type="text" name="slug" required value="${Utils.escape(data.slug || '')}" placeholder="ako-na-google-ads"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 font-mono">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kategória</label>
            <input type="text" name="category" value="${Utils.escape(data.category || '')}" placeholder="Google Ads"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Titulok *</label>
          <input type="text" name="title" required value="${Utils.escape(data.title || '')}"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Krátky popis (excerpt)</label>
          <textarea name="excerpt" rows="2" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 resize-y">${Utils.escape(data.excerpt || '')}</textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Cover image URL</label>
          <input type="url" name="cover_image" value="${Utils.escape(data.cover_image || '')}" placeholder="https://..."
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Obsah článku *</label>
          <div class="border border-gray-300 rounded-xl overflow-hidden">
            ${TipTap.toolbarHTML()}
            <div id="blog-body" class="bg-white"></div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Čas čítania (min)</label>
            <input type="number" name="read_time_min" value="${data.read_time_min || 5}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Autor — meno</label>
            <input type="text" name="author_name" value="${Utils.escape(data.author_name || 'Štefan')}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Iniciály</label>
            <input type="text" name="author_initials" value="${Utils.escape(data.author_initials || 'ŠL')}" maxlength="3"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Dátum publikácie</label>
          <input type="date" name="published_at" value="${data.published_at ? data.published_at.substring(0,10) : ''}"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_published" ${data.is_published ? 'checked' : ''} class="w-4 h-4">
            <span class="text-sm text-gray-700">Zverejnené (live na webe)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_featured" ${data.is_featured ? 'checked' : ''} class="w-4 h-4">
            <span class="text-sm text-gray-700">Featured (zobrazí sa hore na blog stránke)</span>
          </label>
        </div>
      </form>
    `;

    const footer = `
      ${item ? '<button id="del-btn" class="mr-auto px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">Zmazať</button>' : ''}
      <button id="cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Zrušiť</button>
      <button id="save-btn" class="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg">${isNew ? 'Vytvoriť' : 'Uložiť'}</button>
    `;

    const drawer = Utils.drawer(isNew ? 'Nový blog post' : 'Upraviť post', formHtml, { footer });

    // Init TipTap
    const bodyEl = drawer.body.querySelector('#blog-body');
    const toolbarEl = drawer.body.querySelector('.tiptap-toolbar');
    let editor;
    try {
      bodyEl.innerHTML = '<div class="p-4 text-sm text-gray-400">Načítavam editor…</div>';
      editor = await TipTap.mount(bodyEl, data.body_html || '', { placeholder: 'Začnite písať blog post…' });
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
      payload.author_initials = (payload.author_initials || '').toUpperCase();

      // Convert date input to ISO timestamp
      if (payload.published_at && !payload.published_at.includes('T')) {
        payload.published_at = new Date(payload.published_at).toISOString();
      }

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
        if (!await Utils.confirm('Naozaj zmazať tento blog post?', { danger: true, confirmLabel: 'Zmazať' })) return;
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
    if (!await Utils.confirm(`Zmazať blog post "${item.title}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    await API.remove(this.TABLE, item.id);
    Utils.toast('Zmazané', 'success');
    State.buildPending = true;
    Router.render();
  },
};
