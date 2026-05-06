// js/pages/services.js — Služby (web_services) - najkomplexnejší modul
// Komplexné JSONB polia: specs, what_you_get, process_steps, faq

window.Services = {
  TABLE: 'web_services',

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Služby</h1>
            <p class="text-sm text-gray-500 mt-1">${items.length} ${items.length === 1 ? 'služba' : 'služieb'}</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať službu</span>
          </button>
        </div>

        <div class="space-y-2">
          ${items.length === 0 ? `<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div class="text-3xl mb-2">⚙️</div>
            <p class="text-sm text-gray-500">Zatiaľ žiadne služby.</p>
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
    const pub = item.published !== false;
    const title = I18N.t(item.title, 'sk');
    const shortDesc = I18N.t(item.short_desc, 'sk');
    const wygCount = Array.isArray(item.what_you_get) ? item.what_you_get.length : 0;
    const stepsCount = Array.isArray(item.process_steps) ? item.process_steps.length : 0;
    const faqCount = Array.isArray(item.faq) ? item.faq.length : 0;

    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-start gap-4">
        <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 text-white flex items-center justify-center flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${item.icon_svg || '<circle cx="12" cy="12" r="10"></circle>'}</svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="font-semibold text-gray-900 text-sm">${Utils.escape(title) || '<em class="text-gray-400">Bez názvu</em>'}</span>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}">
              ${pub ? 'Live' : 'Skryté'}
            </span>
          </div>
          <div class="text-xs text-gray-500 mb-1">/${Utils.escape(item.slug || '')}</div>
          <div class="text-xs text-gray-600 truncate mb-2">${Utils.escape(shortDesc)}</div>
          <div class="flex items-center gap-3 text-[11px] text-gray-400">
            <span>📋 ${wygCount} bodov</span>
            <span>📊 ${stepsCount} krokov</span>
            <span>❓ ${faqCount} FAQ</span>
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
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
      slug: '',
      title: I18N.empty(),
      short_desc: I18N.empty(),
      icon_svg: '<circle cx="12" cy="12" r="10"></circle>',
      specs: [],
      hero_lead: I18N.empty(),
      what_you_get: [],
      process_steps: [],
      faq: [],
      pricing_note: I18N.empty(),
      published: true,
      sort_order: 0,
    };

    const drawer = Utils.drawer(`${isNew ? 'Pridať' : 'Upraviť'} službu`, `<form id="service-form" class="space-y-5">

      <div class="bg-gradient-to-r from-brand-50 to-pink-50 border border-brand-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-900">Hromadný preklad</div>
          <div class="text-xs text-gray-600 mt-0.5">Preložia sa všetky polia vrátane specs, what_you_get, process steps a FAQ.</div>
        </div>
        <button type="button" id="translate-all-btn"
          class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50">
          <span>✨</span><span id="translate-all-label">Preložiť všetko</span>
        </button>
      </div>

      <!-- Základné -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Základné</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Slug</label>
            <input type="text" name="slug" required value="${Utils.escape(data.slug)}"
              placeholder="google-ads"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Poradie</label>
            <input type="number" name="sort_order" value="${data.sort_order || 0}"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
        </div>

        ${I18N.renderField('title', data.title, { label: 'Názov služby (Google Ads)', required: true })}
        ${I18N.renderField('short_desc', data.short_desc, { label: 'Krátky popis (do accordion karty)', type: 'textarea', rows: 2 })}
        ${I18N.renderField('hero_lead', data.hero_lead, { label: 'Hero lead text (na detail stránke)', type: 'textarea', rows: 3 })}
        ${I18N.renderField('pricing_note', data.pricing_note, { label: 'Cenová poznámka (Súčasť každého plánu)' })}
      </div>

      <!-- Icon SVG -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Ikonka (SVG paths)</div>
        <p class="text-xs text-gray-500">Vlož len obsah SVG (paths/circles), bez tagu &lt;svg&gt;. Veľkosť 24×24, stroke="currentColor".</p>
        <textarea name="icon_svg" rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
          placeholder='<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>'>${Utils.escape(data.icon_svg || '')}</textarea>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500">Náhľad:</span>
          <div id="icon-preview" class="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 text-white flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${data.icon_svg || ''}</svg>
          </div>
        </div>
      </div>

      <!-- Specs (4 box) -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Specs (zhrnutie boxy)</div>
            <p class="text-xs text-gray-500 mt-1">Štandardne 4: Setup, Prvé výsledky, Reporting, Zahrnuté</p>
          </div>
          <button type="button" id="specs-add" class="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Pridať spec</button>
        </div>
        <div id="specs-list" class="space-y-2"></div>
      </div>

      <!-- What you get (bullet list) -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Čo získate (bullet list)</div>
          </div>
          <button type="button" id="wyg-add" class="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Pridať bod</button>
        </div>
        <div id="wyg-list" class="space-y-2"></div>
      </div>

      <!-- Process steps -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Proces (kroky)</div>
          </div>
          <button type="button" id="steps-add" class="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Pridať krok</button>
        </div>
        <div id="steps-list" class="space-y-2"></div>
      </div>

      <!-- FAQ -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">FAQ k službe</div>
          </div>
          <button type="button" id="faq-add" class="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Pridať otázku</button>
        </div>
        <div id="faq-list" class="space-y-2"></div>
      </div>

      <!-- Publish -->
      <div class="bg-gray-50 rounded-xl p-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="published" ${data.published !== false ? 'checked' : ''} class="w-4 h-4">
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

    // Live icon preview
    const iconInput = drawer.body.querySelector('[name="icon_svg"]');
    const iconPreview = drawer.body.querySelector('#icon-preview svg');
    iconInput?.addEventListener('input', () => { iconPreview.innerHTML = iconInput.value; });

    // Build all sub-lists
    this._buildSpecsList(drawer.body, data.specs || []);
    this._buildWYGList(drawer.body, data.what_you_get || []);
    this._buildStepsList(drawer.body, data.process_steps || []);
    this._buildFAQList(drawer.body, data.faq || []);

    // Translate-all
    this._bindTranslateAll(drawer.body);

    drawer.body.querySelector('#service-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });
    drawer.body.querySelector('[data-close]')?.addEventListener('click', () => drawer.close());
  },

  // ===========================================================
  // Sub-list builders — každý je array of {label/title/q: lang_jsonb, value/desc/a: lang_jsonb}
  // ===========================================================

  _buildSpecsList(rootEl, specs) {
    const list = rootEl.querySelector('#specs-list');
    const render = (specs) => {
      list.innerHTML = specs.map((s, i) => this._twoLangFieldRow(i, s.label, s.value, 'spec', { aLabel: 'Label (Setup)', bLabel: 'Hodnota (10 dní)' })).join('');
      this._bindRowHandlers(list, 'spec', () => {
        const cur = this._collectTwoLangRows(list, 'spec', 'label', 'value');
        return cur;
      }, render);
    };
    render(specs);
    rootEl.querySelector('#specs-add').addEventListener('click', () => {
      const cur = this._collectTwoLangRows(list, 'spec', 'label', 'value');
      cur.push({ label: I18N.empty(), value: I18N.empty() });
      render(cur);
    });
  },

  _buildWYGList(rootEl, items) {
    const list = rootEl.querySelector('#wyg-list');
    const render = (items) => {
      list.innerHTML = items.map((it, i) => this._oneLangFieldRow(i, it, 'wyg', 'Audit a stratégia kampaní...')).join('');
      this._bindRowHandlers(list, 'wyg', () => this._collectOneLangRows(list, 'wyg'), render);
    };
    render(items);
    rootEl.querySelector('#wyg-add').addEventListener('click', () => {
      const cur = this._collectOneLangRows(list, 'wyg');
      cur.push(I18N.empty());
      render(cur);
    });
  },

  _buildStepsList(rootEl, steps) {
    const list = rootEl.querySelector('#steps-list');
    const render = (steps) => {
      list.innerHTML = steps.map((s, i) => this._twoLangFieldRow(i, s.title, s.desc, 'step', { aLabel: 'Názov kroku', bLabel: 'Popis kroku', bIsTextarea: true })).join('');
      this._bindRowHandlers(list, 'step', () => this._collectTwoLangRows(list, 'step', 'title', 'desc'), render);
    };
    render(steps);
    rootEl.querySelector('#steps-add').addEventListener('click', () => {
      const cur = this._collectTwoLangRows(list, 'step', 'title', 'desc');
      cur.push({ title: I18N.empty(), desc: I18N.empty() });
      render(cur);
    });
  },

  _buildFAQList(rootEl, faq) {
    const list = rootEl.querySelector('#faq-list');
    const render = (faq) => {
      list.innerHTML = faq.map((f, i) => this._twoLangFieldRow(i, f.q, f.a, 'faq', { aLabel: 'Otázka', bLabel: 'Odpoveď', bIsTextarea: true })).join('');
      this._bindRowHandlers(list, 'faq', () => this._collectTwoLangRows(list, 'faq', 'q', 'a'), render);
    };
    render(faq);
    rootEl.querySelector('#faq-add').addEventListener('click', () => {
      const cur = this._collectTwoLangRows(list, 'faq', 'q', 'a');
      cur.push({ q: I18N.empty(), a: I18N.empty() });
      render(cur);
    });
  },

  // Render row pre dvojpoľovku (label+value, q+a, title+desc)
  _twoLangFieldRow(idx, fieldA, fieldB, prefix, opts) {
    const aObj = I18N.normalize(fieldA);
    const bObj = I18N.normalize(fieldB);
    return `
      <div class="bg-white border border-gray-200 rounded-lg p-3" data-${prefix}-row="${idx}">
        <div class="flex items-center justify-between mb-2 flex-wrap gap-1">
          <div class="flex gap-1 flex-wrap">
            ${I18N.LANGS.map((lang, li) => `
              <button type="button" data-${prefix}-tab="${lang}" data-${prefix}-row-tab="${idx}"
                class="px-2 py-1 text-xs font-semibold rounded transition ${li === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}">
                ${I18N.LANG_FLAGS[lang]} ${lang.toUpperCase()}
              </button>
            `).join('')}
          </div>
          <div class="flex items-center gap-1">
            <button type="button" data-${prefix}-translate="${idx}"
              class="px-2 py-1 text-xs font-semibold rounded bg-gradient-to-r from-brand-500 to-pink-500 text-white hover:opacity-90 transition">✨</button>
            <button type="button" data-${prefix}-remove="${idx}"
              class="w-7 h-7 text-red-500 hover:bg-red-50 rounded flex items-center justify-center">🗑</button>
          </div>
        </div>
        ${I18N.LANGS.map((lang, li) => `
          <div data-${prefix}-pane="${lang}" data-${prefix}-row-pane="${idx}" ${li !== 0 ? 'class="hidden"' : ''}>
            <input type="text" data-${prefix}-input-a="${lang}" data-${prefix}-row-input="${idx}"
              value="${Utils.escape(aObj[lang] || '')}"
              placeholder="${Utils.escape(opts.aLabel)} (${I18N.LANG_NAMES[lang]})"
              style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; margin-bottom:6px;">
            ${opts.bIsTextarea
              ? `<textarea data-${prefix}-input-b="${lang}" data-${prefix}-row-input="${idx}"
                  placeholder="${Utils.escape(opts.bLabel)} (${I18N.LANG_NAMES[lang]})"
                  rows="2"
                  style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; font-family:inherit;"
                >${Utils.escape(bObj[lang] || '')}</textarea>`
              : `<input type="text" data-${prefix}-input-b="${lang}" data-${prefix}-row-input="${idx}"
                  value="${Utils.escape(bObj[lang] || '')}"
                  placeholder="${Utils.escape(opts.bLabel)} (${I18N.LANG_NAMES[lang]})"
                  style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;">`}
          </div>
        `).join('')}
      </div>
    `;
  },

  // Render row pre 1-pole (what_you_get)
  _oneLangFieldRow(idx, value, prefix, placeholder) {
    const obj = I18N.normalize(value);
    return `
      <div class="bg-white border border-gray-200 rounded-lg p-3" data-${prefix}-row="${idx}">
        <div class="flex items-center justify-between mb-2 flex-wrap gap-1">
          <div class="flex gap-1 flex-wrap">
            ${I18N.LANGS.map((lang, li) => `
              <button type="button" data-${prefix}-tab="${lang}" data-${prefix}-row-tab="${idx}"
                class="px-2 py-1 text-xs font-semibold rounded transition ${li === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}">
                ${I18N.LANG_FLAGS[lang]} ${lang.toUpperCase()}
              </button>
            `).join('')}
          </div>
          <div class="flex items-center gap-1">
            <button type="button" data-${prefix}-translate="${idx}"
              class="px-2 py-1 text-xs font-semibold rounded bg-gradient-to-r from-brand-500 to-pink-500 text-white hover:opacity-90 transition">✨</button>
            <button type="button" data-${prefix}-remove="${idx}"
              class="w-7 h-7 text-red-500 hover:bg-red-50 rounded flex items-center justify-center">🗑</button>
          </div>
        </div>
        ${I18N.LANGS.map((lang, li) => `
          <input type="text" data-${prefix}-input="${lang}" data-${prefix}-row-input="${idx}"
            value="${Utils.escape(obj[lang] || '')}"
            placeholder="${placeholder} (${I18N.LANG_NAMES[lang]})"
            ${li !== 0 ? 'class="hidden"' : ''}
            style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;">
        `).join('')}
      </div>
    `;
  },

  _bindRowHandlers(listEl, prefix, getCurrent, rerender) {
    // Lang tabs
    listEl.querySelectorAll(`[data-${prefix}-row]`).forEach(row => {
      const tabs = row.querySelectorAll(`[data-${prefix}-tab]`);
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const lang = tab.dataset[`${prefix}Tab`];
          tabs.forEach(t => {
            const isActive = t.dataset[`${prefix}Tab`] === lang;
            t.classList.toggle('bg-gray-900', isActive);
            t.classList.toggle('text-white', isActive);
            t.classList.toggle('bg-gray-100', !isActive);
            t.classList.toggle('text-gray-600', !isActive);
          });
          // Toggle panes (twoLang) ALEBO inputy (oneLang)
          const panes = row.querySelectorAll(`[data-${prefix}-pane]`);
          if (panes.length) {
            panes.forEach(p => p.classList.toggle('hidden', p.dataset[`${prefix}Pane`] !== lang));
          } else {
            const inputs = row.querySelectorAll(`[data-${prefix}-input]`);
            inputs.forEach(i => i.classList.toggle('hidden', i.dataset[`${prefix}Input`] !== lang));
          }
        });
      });
    });

    // Per-row translate
    listEl.querySelectorAll(`[data-${prefix}-translate]`).forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = btn.dataset[`${prefix}Translate`];
        const row = listEl.querySelector(`[data-${prefix}-row="${idx}"]`);
        // Pozbieraj SK hodnoty z všetkých inputov v tomto rowe
        const skTexts = {};
        row.querySelectorAll(`[data-${prefix}-input], [data-${prefix}-input-a], [data-${prefix}-input-b]`).forEach(inp => {
          const lang = inp.dataset[`${prefix}Input`] || inp.dataset[`${prefix}InputA`] || inp.dataset[`${prefix}InputB`];
          const which = inp.dataset[`${prefix}Input`] ? '_v' : (inp.dataset[`${prefix}InputA`] ? '_a' : '_b');
          if (lang === 'sk' && inp.value.trim()) {
            skTexts[which] = inp.value;
          }
        });
        if (!Object.keys(skTexts).length) {
          Utils.toast('Najprv napíš SK text', 'warning');
          return;
        }
        btn.disabled = true;
        btn.textContent = '⏳';
        try {
          const result = await API.translate(skTexts, 'sk', ['cs', 'hu', 'en', 'de']);
          for (const lang of ['cs', 'hu', 'en', 'de']) {
            const out = result[lang] || {};
            if (out._v !== undefined) {
              const inp = row.querySelector(`[data-${prefix}-input="${lang}"]`);
              if (inp) inp.value = out._v;
            }
            if (out._a !== undefined) {
              const inp = row.querySelector(`[data-${prefix}-input-a="${lang}"]`);
              if (inp) inp.value = out._a;
            }
            if (out._b !== undefined) {
              const inp = row.querySelector(`[data-${prefix}-input-b="${lang}"]`);
              if (inp) inp.value = out._b;
            }
          }
        } catch (err) {
          Utils.toast('Chyba: ' + err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = '✨';
        }
      });
    });

    // Per-row remove
    listEl.querySelectorAll(`[data-${prefix}-remove]`).forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset[`${prefix}Remove`]);
        const cur = getCurrent();
        cur.splice(idx, 1);
        rerender(cur);
      });
    });
  },

  _collectOneLangRows(listEl, prefix) {
    const rows = listEl.querySelectorAll(`[data-${prefix}-row]`);
    return Array.from(rows).map(row => {
      const value = I18N.empty();
      I18N.LANGS.forEach(lang => {
        const inp = row.querySelector(`[data-${prefix}-input="${lang}"]`);
        value[lang] = inp?.value || '';
      });
      return value;
    }).filter(v => I18N.t(v, 'sk').trim());
  },

  _collectTwoLangRows(listEl, prefix, keyA, keyB) {
    const rows = listEl.querySelectorAll(`[data-${prefix}-row]`);
    return Array.from(rows).map(row => {
      const a = I18N.empty();
      const b = I18N.empty();
      I18N.LANGS.forEach(lang => {
        const inpA = row.querySelector(`[data-${prefix}-input-a="${lang}"]`);
        const inpB = row.querySelector(`[data-${prefix}-input-b="${lang}"]`);
        a[lang] = inpA?.value || '';
        b[lang] = inpB?.value || '';
      });
      return { [keyA]: a, [keyB]: b };
    }).filter(o => I18N.t(o[keyA], 'sk').trim() || I18N.t(o[keyB], 'sk').trim());
  },

  _bindTranslateAll(rootEl) {
    const btn = rootEl.querySelector('#translate-all-btn');
    const lbl = rootEl.querySelector('#translate-all-label');
    btn.addEventListener('click', async () => {
      // Top-level lang fields
      const groups = rootEl.querySelectorAll('[data-i18n-group]');
      const skTexts = {};
      groups.forEach(g => {
        const f = g.dataset.i18nGroup;
        const sk = g.querySelector('[data-lang-input="sk"]');
        if (sk?.value.trim()) skTexts[`top__${f}`] = sk.value;
      });

      // Sub-list inputs (specs, wyg, steps, faq)
      ['spec', 'wyg', 'step', 'faq'].forEach(prefix => {
        const list = rootEl.querySelector(`#${prefix === 'wyg' ? 'wyg' : prefix + 's'}-list`);
        if (!list) return;
        list.querySelectorAll(`[data-${prefix}-row]`).forEach(row => {
          const idx = row.dataset[`${prefix}Row`];
          row.querySelectorAll(`[data-${prefix}-input="sk"], [data-${prefix}-input-a="sk"], [data-${prefix}-input-b="sk"]`).forEach(inp => {
            if (!inp.value.trim()) return;
            const which = inp.dataset[`${prefix}Input`] ? 'v' : (inp.dataset[`${prefix}InputA`] ? 'a' : 'b');
            skTexts[`${prefix}__${idx}__${which}`] = inp.value;
          });
        });
      });

      if (!Object.keys(skTexts).length) {
        Utils.toast('Žiadne SK polia na preklad', 'warning');
        return;
      }

      btn.disabled = true;
      lbl.textContent = `Prekladám ${Object.keys(skTexts).length} polí...`;

      try {
        const result = await API.translate(skTexts, 'sk', ['cs', 'hu', 'en', 'de'], { preserve_html: true });

        for (const lang of ['cs', 'hu', 'en', 'de']) {
          const out = result[lang] || {};
          for (const key of Object.keys(out)) {
            const val = out[key];
            if (key.startsWith('top__')) {
              const fieldName = key.slice(5);
              const inp = rootEl.querySelector(`[data-i18n-group="${fieldName}"] [data-lang-input="${lang}"]`);
              if (inp) inp.value = val;
            } else {
              const [prefix, idx, which] = key.split('__');
              const list = rootEl.querySelector(`#${prefix === 'wyg' ? 'wyg' : prefix + 's'}-list`);
              if (!list) continue;
              const row = list.querySelector(`[data-${prefix}-row="${idx}"]`);
              if (!row) continue;
              const selector = which === 'v'
                ? `[data-${prefix}-input="${lang}"]`
                : `[data-${prefix}-input-${which}="${lang}"]`;
              const inp = row.querySelector(selector);
              if (inp) inp.value = val;
            }
          }
        }

        Utils.toast(`✓ Preložených ${Object.keys(skTexts).length} polí`, 'success');
      } catch (err) {
        console.error(err);
        Utils.toast('Chyba: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        lbl.textContent = 'Preložiť všetko';
      }
    });
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#service-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const langFields = ['title', 'short_desc', 'hero_lead', 'pricing_note'];
      const payload = I18N.serializeForm(form, langFields);

      payload.specs         = this._collectTwoLangRows(drawer.body.querySelector('#specs-list'), 'spec', 'label', 'value');
      payload.what_you_get  = this._collectOneLangRows(drawer.body.querySelector('#wyg-list'), 'wyg');
      payload.process_steps = this._collectTwoLangRows(drawer.body.querySelector('#steps-list'), 'step', 'title', 'desc');
      payload.faq           = this._collectTwoLangRows(drawer.body.querySelector('#faq-list'), 'faq', 'q', 'a');

      if (!payload.slug?.trim()) throw new Error('Slug je povinný');
      if (!I18N.t(payload.title, 'sk')?.trim()) throw new Error('Názov (SK) je povinný');

      if (item) await API.update(this.TABLE, item.id, payload);
      else      await API.insert(this.TABLE, payload);

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
    try { await API.toggle(this.TABLE, item.id, 'published', item.published); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },

  async remove(item) {
    if (!confirm(`Zmazať službu "${I18N.t(item.title, 'sk')}"?`)) return;
    try { await API.remove(this.TABLE, item.id); Utils.toast('✓ Zmazané', 'success'); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },
};
