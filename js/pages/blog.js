// js/pages/blog.js — Blog posts (web_blog_posts)
// Etapa C: JSONB lang fields + cover image upload + markdown body + featured

window.Blog = {
  TABLE: 'web_blog_posts',

  async render() {
    const items = await this.fetchAll();
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Blog</h1>
            <p class="text-sm text-gray-500 mt-1">${items.length} ${items.length === 1 ? 'článok' : 'článkov'}</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať článok</span>
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
      el.querySelector('[data-action="featured"]')?.addEventListener('click', () => this.toggleFeatured(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.remove(item));
    });
  },

  async fetchAll() {
    const { data, error } = await window.supabase
      .from(this.TABLE)
      .select('*')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  empty() {
    return `<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center">
      <div class="text-3xl mb-2">📝</div>
      <p class="text-sm text-gray-500">Zatiaľ žiadne blog články.</p>
    </div>`;
  },

  row(item) {
    const pub = item.published !== false;
    const featured = item.is_featured === true;
    const gradient = item.cover_gradient || 'linear-gradient(135deg, #F16434, #E85D9C)';
    const title = I18N.t(item.title, 'sk');
    const category = I18N.t(item.category, 'sk');
    const excerpt = I18N.t(item.excerpt, 'sk');
    const date = item.published_at ? Utils.formatDate(item.published_at) : '—';

    const cover = item.cover_image_url
      ? `<div class="w-14 h-14 rounded-lg flex-shrink-0 bg-cover bg-center" style="background-image: url('${Utils.escape(item.cover_image_url)}')"></div>`
      : `<div class="w-14 h-14 rounded-lg flex-shrink-0" style="background: ${Utils.escape(gradient)}"></div>`;

    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-center gap-4">
        ${cover}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-gray-900 text-sm">${Utils.escape(title) || '<em class="text-gray-400">Bez názvu</em>'}</span>
            ${featured ? '<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">★ Featured</span>' : ''}
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}">
              ${pub ? 'Live' : 'Skryté'}
            </span>
          </div>
          <div class="text-xs text-gray-500">${Utils.escape(category)} · ${date} · ${item.read_time_min || 8} min · /${Utils.escape(item.slug || '')}</div>
          <div class="text-xs text-gray-600 mt-1 truncate">${Utils.escape(excerpt)}</div>
        </div>
        <div class="flex items-center gap-2">
          <button data-action="featured" class="px-2 py-1.5 text-xs ${featured ? 'text-amber-500' : 'text-gray-400'} hover:text-amber-600" title="${featured ? 'Odstrániť featured' : 'Označiť ako featured'}">★</button>
          <button data-action="toggle" class="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900" title="${pub ? 'Skryť' : 'Zverejniť'}">${pub ? '👁' : '🚫'}</button>
          <button data-action="edit" class="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg">Upraviť</button>
          <button data-action="delete" class="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg" title="Zmazať">🗑</button>
        </div>
      </div>
    `;
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || {
      slug: '',
      category: I18N.empty(),
      title: I18N.empty(),
      excerpt: I18N.empty(),
      body: I18N.empty(),
      author_name: I18N.empty(),
      author_role: I18N.empty(),
      author_initials: '',
      read_time_min: 8,
      cover_gradient: 'linear-gradient(135deg, #F16434, #E85D9C)',
      cover_image_url: '',
      is_featured: false,
      published: true,
      published_at: new Date().toISOString().slice(0, 10),
    };

    // Convert published_at na YYYY-MM-DD ak je full ISO
    const pubDate = data.published_at ? String(data.published_at).slice(0, 10) : '';

    const drawer = Utils.drawer(`${isNew ? 'Pridať' : 'Upraviť'} článok`, `<form id="blog-form" class="space-y-5">

      <!-- Translate-all banner -->
      <div class="bg-gradient-to-r from-brand-50 to-pink-50 border border-brand-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-900">Hromadný preklad</div>
          <div class="text-xs text-gray-600 mt-0.5">Preloží všetky SK polia naraz do CS / HU / EN / DE.</div>
        </div>
        <button type="button" id="translate-all-btn"
          class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50">
          <span>✨</span><span id="translate-all-label">Preložiť všetko</span>
        </button>
      </div>

      <!-- ZÁKLADNÉ -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Základné</div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Slug (URL)</label>
          <input type="text" name="slug" required value="${Utils.escape(data.slug)}"
            placeholder="performance-max-kedy-pomaha"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          <p class="text-xs text-gray-500 mt-1">Bude na URL: /blog/<span class="font-mono">slug</span></p>
        </div>

        ${I18N.renderField('category', data.category, { label: 'Kategória (Google Ads, Analytika, ...)', required: true })}
        ${I18N.renderField('title', data.title, { label: 'Názov článku', required: true })}
        ${I18N.renderField('excerpt', data.excerpt, { label: 'Krátky popis (1-2 vety pod nadpisom)', type: 'textarea', rows: 2, required: true })}

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Dátum publikovania</label>
            <input type="date" name="published_at" value="${Utils.escape(pubDate)}"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Čas čítania (min)</label>
            <input type="number" name="read_time_min" value="${data.read_time_min || 8}" min="1" max="60"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
        </div>
      </div>

      <!-- COVER -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Cover (obrázok alebo gradient)</div>

        ${Uploader.render('cover_image_url', 'blog-covers', data.cover_image_url, {
          label: 'Cover obrázok (voliteľné — ak chýba, použije sa gradient)',
          hint: 'PNG / JPG / WebP, ideálne 1600×900 px',
        })}

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Gradient (fallback ak nie je obrázok)</label>
          <input type="text" name="cover_gradient" value="${Utils.escape(data.cover_gradient)}"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
          <div class="mt-2 h-12 rounded-lg" id="gradient-preview" style="background: ${Utils.escape(data.cover_gradient)}"></div>
        </div>
      </div>

      <!-- AUTHOR -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Autor</div>
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2">${I18N.renderField('author_name', data.author_name, { label: 'Meno autora' })}</div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Iniciály (PN)</label>
            <input type="text" name="author_initials" value="${Utils.escape(data.author_initials || '')}" maxlength="4"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm uppercase font-mono text-center">
          </div>
        </div>
        ${I18N.renderField('author_role', data.author_role, { label: 'Pozícia (Senior PPC Specialist)' })}
      </div>

      <!-- BODY -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Obsah článku</div>
        <p class="text-xs text-gray-600">Markdown podporovaný: ## nadpisy, **tučné**, *kurzíva*, - bullety, [link](url), \`kód\`</p>
        ${I18N.renderField('body', data.body, { label: 'Telo článku (markdown)', type: 'textarea', rows: 14 })}
      </div>

      <!-- FLAGY -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-3">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_featured" ${data.is_featured ? 'checked' : ''} class="w-4 h-4">
          <div>
            <div class="text-sm font-semibold text-gray-900">★ Featured článok</div>
            <div class="text-xs text-gray-500">Zobrazí sa hore na /blog stránke ako hlavný</div>
          </div>
        </label>

        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="published" ${data.published !== false ? 'checked' : ''} class="w-4 h-4">
          <div>
            <div class="text-sm font-semibold text-gray-900">Zverejniť na webe</div>
          </div>
        </label>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button type="submit" class="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
          ${isNew ? 'Pridať' : 'Uložiť zmeny'}
        </button>
        <button type="button" data-close class="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
          Zrušiť
        </button>
      </div>
    </form>`);

    // Bind helpers
    I18N.bindFieldSwitchers(drawer.body);
    Uploader.bind(drawer.body);

    // Translate-all button
    this._bindTranslateAll(drawer.body);

    // Live gradient preview
    const gradientInput = drawer.body.querySelector('[name="cover_gradient"]');
    const gradientPreview = drawer.body.querySelector('#gradient-preview');
    gradientInput?.addEventListener('input', () => {
      gradientPreview.style.background = gradientInput.value;
    });

    // Submit
    drawer.body.querySelector('#blog-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });

    // Cancel
    drawer.body.querySelector('[data-close]')?.addEventListener('click', () => drawer.close());
  },

  /**
   * Translate-all helper (rovnaká logika ako v cases.js)
   */
  _bindTranslateAll(rootEl) {
    const btn = rootEl.querySelector('#translate-all-btn');
    const label = rootEl.querySelector('#translate-all-label');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const groups = rootEl.querySelectorAll('[data-i18n-group]');
      const skTexts = {};
      groups.forEach(group => {
        const fieldName = group.dataset.i18nGroup;
        const skInput = group.querySelector('[data-lang-input="sk"]');
        if (skInput && skInput.value.trim()) {
          skTexts[fieldName] = skInput.value;
        }
      });

      if (Object.keys(skTexts).length === 0) {
        Utils.toast('Žiadne SK polia na preklad', 'warning');
        return;
      }

      btn.disabled = true;
      label.textContent = `Prekladám ${Object.keys(skTexts).length} polí...`;

      try {
        const result = await API.translate(skTexts, 'sk', ['cs', 'hu', 'en', 'de'], { preserve_html: true });

        for (const [fieldName] of Object.entries(skTexts)) {
          const group = rootEl.querySelector(`[data-i18n-group="${fieldName}"]`);
          if (!group) continue;
          for (const lang of ['cs', 'hu', 'en', 'de']) {
            const translated = result[lang]?.[fieldName];
            if (!translated) continue;
            const input = group.querySelector(`[data-lang-input="${lang}"]`);
            if (input) input.value = translated;
          }
        }

        Utils.toast(`✓ Preložené ${Object.keys(skTexts).length} polí`, 'success');
      } catch (err) {
        console.error(err);
        Utils.toast('Preklad zlyhal: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        label.textContent = 'Preložiť všetko';
      }
    });
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#blog-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const langFields = ['category', 'title', 'excerpt', 'body', 'author_name', 'author_role'];
      const payload = I18N.serializeForm(form, langFields);

      // Validácia
      if (!payload.slug?.trim()) throw new Error('Slug je povinný');
      if (!I18N.t(payload.title, 'sk')?.trim()) throw new Error('Názov (SK) je povinný');

      // Convert date input → ISO timestamp
      if (payload.published_at) {
        payload.published_at = new Date(payload.published_at).toISOString();
      }

      // Author initials uppercase
      if (payload.author_initials) {
        payload.author_initials = payload.author_initials.toUpperCase();
      }

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
      await API.toggle(this.TABLE, item.id, 'published', item.published);
      Utils.toast(item.published ? 'Skryté' : 'Zverejnené', 'success');
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },

  async toggleFeatured(item) {
    try {
      await API.toggle(this.TABLE, item.id, 'is_featured', item.is_featured);
      Utils.toast(item.is_featured ? 'Featured zrušené' : '★ Označené ako featured', 'success');
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },

  async remove(item) {
    if (!confirm(`Zmazať článok "${I18N.t(item.title, 'sk')}"?`)) return;
    try {
      await API.remove(this.TABLE, item.id);
      Utils.toast('✓ Zmazané', 'success');
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },
};
