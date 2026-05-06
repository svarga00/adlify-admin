// js/pages/pricing.js — Cenník (web_pricing) — 3 plány s features

window.Pricing = {
  TABLE: 'web_pricing',

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Cenník</h1>
            <p class="text-sm text-gray-500 mt-1">${items.length} ${items.length === 1 ? 'plán' : 'plánov'}</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať plán</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${items.length === 0 ? `<div class="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div class="text-3xl mb-2">💰</div>
            <p class="text-sm text-gray-500">Zatiaľ žiadne plány.</p>
          </div>` : items.map(i => this.card(i)).join('')}
        </div>
      </div>
    `;

    document.getElementById('add-btn').addEventListener('click', () => this.openEditor(null));
    items.forEach(item => {
      const el = document.querySelector(`[data-id="${item.id}"]`);
      if (!el) return;
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openEditor(item));
      el.querySelector('[data-action="toggle"]')?.addEventListener('click', () => this.toggleVisibility(item));
      el.querySelector('[data-action="popular"]')?.addEventListener('click', () => this.togglePopular(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.remove(item));
    });
  },

  card(item) {
    const pub = item.is_published !== false;
    const popular = item.is_popular === true;
    const name = I18N.t(item.name, 'sk');
    const tagline = I18N.t(item.tagline, 'sk');
    const features = Array.isArray(item.features) ? item.features : [];
    const featureCount = features.length;
    const includedCount = features.filter(f => f.included !== false).length;

    return `
      <div data-id="${item.id}" class="bg-white border ${popular ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200'} rounded-2xl p-5 relative">
        ${popular ? '<div class="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">★ Najpopulárnejšie</div>' : ''}

        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="text-xs font-mono text-gray-400 uppercase mb-1">/${Utils.escape(item.slug || '')}</div>
            <h3 class="text-xl font-bold text-gray-900">${Utils.escape(name) || '<em class="text-gray-400">Bez mena</em>'}</h3>
            <p class="text-xs text-gray-500 mt-1">${Utils.escape(tagline)}</p>
          </div>
          <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}">
            ${pub ? 'Live' : 'Skryté'}
          </span>
        </div>

        <div class="flex items-baseline gap-1 mb-3 pb-3 border-b border-gray-100">
          <span class="text-3xl font-bold text-gray-900">€${item.price_monthly}</span>
          <span class="text-sm text-gray-500">/mes</span>
          ${item.price_setup ? `<span class="text-xs text-gray-400 ml-2">+ €${item.price_setup} setup</span>` : ''}
        </div>

        <div class="text-xs text-gray-600 mb-4">
          ${includedCount} z ${featureCount} features zaradených
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button data-action="edit" class="flex-1 px-3 py-2 text-xs font-semibold bg-gray-900 hover:bg-black text-white rounded-lg">Upraviť</button>
          <button data-action="popular" class="px-2 py-2 text-xs ${popular ? 'text-amber-500 bg-amber-50' : 'text-gray-400 bg-gray-50'} hover:bg-amber-100 rounded-lg" title="${popular ? 'Odstrániť popular' : 'Označiť ako popular'}">★</button>
          <button data-action="toggle" class="px-2 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">${pub ? '👁' : '🚫'}</button>
          <button data-action="delete" class="px-2 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">🗑</button>
        </div>
      </div>
    `;
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || {
      slug: '',
      name: I18N.empty(),
      tagline: I18N.empty(),
      cta_label: I18N.empty(),
      price_monthly: 0,
      price_setup: 0,
      features: [],
      is_popular: false,
      is_published: true,
      sort_order: 0,
    };

    const drawer = Utils.drawer(`${isNew ? 'Pridať' : 'Upraviť'} plán`, `<form id="pricing-form" class="space-y-5">

      <!-- Translate-all -->
      <div class="bg-gradient-to-r from-brand-50 to-pink-50 border border-brand-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-900">Hromadný preklad</div>
          <div class="text-xs text-gray-600 mt-0.5">Preložia sa Name, Tagline, CTA a všetky features.</div>
        </div>
        <button type="button" id="translate-all-btn"
          class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50">
          <span>✨</span><span id="translate-all-label">Preložiť všetko</span>
        </button>
      </div>

      <!-- Základné -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Základné</div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Slug</label>
          <input type="text" name="slug" required value="${Utils.escape(data.slug)}"
            placeholder="growth"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
        </div>

        ${I18N.renderField('name', data.name, { label: 'Názov plánu (Growth)', required: true })}
        ${I18N.renderField('tagline', data.tagline, { label: 'Krátky podnadpis (Pre rastúce e-shopy)', type: 'textarea', rows: 2 })}
        ${I18N.renderField('cta_label', data.cta_label, { label: 'CTA tlačidlo (Vybrať Growth)' })}
      </div>

      <!-- Cena -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Cena</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Mesačne (€, bez DPH)</label>
            <input type="number" name="price_monthly" value="${data.price_monthly || 0}" min="0"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Setup (€, jednoraz.)</label>
            <input type="number" name="price_setup" value="${data.price_setup || 0}" min="0"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Poradie</label>
            <input type="number" name="sort_order" value="${data.sort_order || 0}"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
        </div>
      </div>

      <!-- Features list -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Features (zoznam)</div>
            <p class="text-xs text-gray-500 mt-1">Zaškrtnuté = je v pláne. Nezaškrtnuté = nie je v pláne (zobrazí sa preškrtnuté).</p>
          </div>
          <button type="button" id="features-add" class="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Pridať feature</button>
        </div>
        <div id="features-list" class="space-y-2"></div>
      </div>

      <!-- Flagy -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-3">
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_popular" ${data.is_popular ? 'checked' : ''} class="w-4 h-4">
          <div>
            <div class="text-sm font-semibold text-gray-900">★ Najpopulárnejší plán</div>
            <div class="text-xs text-gray-500">Iba jeden plán môže mať tento badge</div>
          </div>
        </label>
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_published" ${data.is_published !== false ? 'checked' : ''} class="w-4 h-4">
          <span class="text-sm font-semibold text-gray-900">Zverejniť</span>
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

    // Features list builder
    const featuresList = drawer.body.querySelector('#features-list');
    const renderFeatures = (features) => {
      featuresList.innerHTML = (features || []).map((f, i) => {
        const labelObj = I18N.normalize(f.label);
        return `
          <div class="bg-white border border-gray-200 rounded-lg p-3" data-feature-row="${i}">
            <div class="flex items-start gap-3">
              <label class="flex items-center cursor-pointer flex-shrink-0 mt-2">
                <input type="checkbox" data-feature-included ${f.included !== false ? 'checked' : ''} class="w-4 h-4">
              </label>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1 flex-wrap mb-2">
                  ${I18N.LANGS.map((lang, li) => `
                    <button type="button" data-feature-tab="${lang}" data-feature-row-tab="${i}"
                      class="lang-pill px-2 py-1 text-xs font-semibold rounded-md transition ${li === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}">
                      ${I18N.LANG_FLAGS[lang]} ${lang.toUpperCase()}
                    </button>
                  `).join('')}
                  <button type="button" data-feature-translate="${i}"
                    class="px-2 py-1 text-xs font-semibold rounded-md bg-gradient-to-r from-brand-500 to-pink-500 text-white hover:opacity-90 transition">
                    ✨
                  </button>
                </div>
                ${I18N.LANGS.map((lang, li) => `
                  <input type="text" data-feature-input="${lang}" data-feature-row-input="${i}"
                    value="${Utils.escape(labelObj[lang] || '')}"
                    placeholder="Feature label (${I18N.LANG_NAMES[lang]})"
                    ${li !== 0 ? 'class="hidden"' : ''}
                    style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;">
                `).join('')}
              </div>
              <button type="button" data-feature-remove="${i}" class="flex-shrink-0 w-7 h-7 text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center" title="Zmazať">🗑</button>
            </div>
          </div>
        `;
      }).join('');

      // Lang tab switcher
      featuresList.querySelectorAll('[data-feature-row]').forEach(row => {
        const idx = row.dataset.featureRow;
        const tabs = row.querySelectorAll('[data-feature-tab]');
        const inputs = row.querySelectorAll('[data-feature-input]');
        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            const lang = tab.dataset.featureTab;
            tabs.forEach(t => {
              const isActive = t.dataset.featureTab === lang;
              t.classList.toggle('bg-gray-900', isActive);
              t.classList.toggle('text-white', isActive);
              t.classList.toggle('bg-gray-100', !isActive);
              t.classList.toggle('text-gray-600', !isActive);
            });
            inputs.forEach(input => {
              input.classList.toggle('hidden', input.dataset.featureInput !== lang);
            });
          });
        });
      });

      // Per-feature translate
      featuresList.querySelectorAll('[data-feature-translate]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = btn.dataset.featureTranslate;
          const skInput = featuresList.querySelector(`[data-feature-input="sk"][data-feature-row-input="${idx}"]`);
          if (!skInput?.value.trim()) {
            Utils.toast('Najprv napíš SK text', 'warning');
            return;
          }
          btn.disabled = true;
          btn.textContent = '⏳';
          try {
            const result = await API.translate(skInput.value, 'sk', ['cs', 'hu', 'en', 'de']);
            for (const lang of ['cs', 'hu', 'en', 'de']) {
              const inp = featuresList.querySelector(`[data-feature-input="${lang}"][data-feature-row-input="${idx}"]`);
              if (inp && result[lang]) inp.value = result[lang];
            }
            Utils.toast('✓ Preložené', 'success');
          } catch (err) {
            Utils.toast('Chyba: ' + err.message, 'error');
          } finally {
            btn.disabled = false;
            btn.textContent = '✨';
          }
        });
      });

      // Remove
      featuresList.querySelectorAll('[data-feature-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.featureRemove);
          const current = this.collectFeatures(featuresList);
          current.splice(idx, 1);
          renderFeatures(current);
        });
      });
    };

    renderFeatures(data.features || []);
    drawer.body.querySelector('#features-add').addEventListener('click', () => {
      const current = this.collectFeatures(featuresList);
      current.push({ label: I18N.empty(), included: true });
      renderFeatures(current);
    });

    // Translate-all (vrátane features)
    drawer.body.querySelector('#translate-all-btn').addEventListener('click', async () => {
      const btn = drawer.body.querySelector('#translate-all-btn');
      const lbl = drawer.body.querySelector('#translate-all-label');

      // Top-level lang fields
      const groups = drawer.body.querySelectorAll('[data-i18n-group]');
      const skTexts = {};
      groups.forEach(g => {
        const f = g.dataset.i18nGroup;
        const sk = g.querySelector('[data-lang-input="sk"]');
        if (sk?.value.trim()) skTexts[`top__${f}`] = sk.value;
      });

      // Feature labels
      const featureRows = featuresList.querySelectorAll('[data-feature-row]');
      featureRows.forEach((row, i) => {
        const sk = row.querySelector('[data-feature-input="sk"]');
        if (sk?.value.trim()) skTexts[`feat__${i}`] = sk.value;
      });

      if (!Object.keys(skTexts).length) {
        Utils.toast('Žiadne SK polia na preklad', 'warning');
        return;
      }

      btn.disabled = true;
      lbl.textContent = `Prekladám ${Object.keys(skTexts).length} polí...`;

      try {
        const result = await API.translate(skTexts, 'sk', ['cs', 'hu', 'en', 'de']);

        for (const lang of ['cs', 'hu', 'en', 'de']) {
          const out = result[lang] || {};
          // Top-level
          for (const key of Object.keys(out)) {
            if (key.startsWith('top__')) {
              const fieldName = key.slice(5);
              const group = drawer.body.querySelector(`[data-i18n-group="${fieldName}"]`);
              const inp = group?.querySelector(`[data-lang-input="${lang}"]`);
              if (inp) inp.value = out[key];
            } else if (key.startsWith('feat__')) {
              const idx = key.slice(6);
              const inp = featuresList.querySelector(`[data-feature-input="${lang}"][data-feature-row-input="${idx}"]`);
              if (inp) inp.value = out[key];
            }
          }
        }

        Utils.toast(`✓ Preložených ${Object.keys(skTexts).length} polí`, 'success');
      } catch (err) {
        Utils.toast('Chyba: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        lbl.textContent = 'Preložiť všetko';
      }
    });

    drawer.body.querySelector('#pricing-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });
    drawer.body.querySelector('[data-close]')?.addEventListener('click', () => drawer.close());
  },

  collectFeatures(featuresList) {
    const rows = featuresList.querySelectorAll('[data-feature-row]');
    return Array.from(rows).map(row => {
      const included = row.querySelector('[data-feature-included]').checked;
      const label = I18N.empty();
      I18N.LANGS.forEach(lang => {
        const inp = row.querySelector(`[data-feature-input="${lang}"]`);
        label[lang] = inp?.value || '';
      });
      return { label, included };
    }).filter(f => I18N.t(f.label, 'sk').trim());
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#pricing-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const langFields = ['name', 'tagline', 'cta_label'];
      const payload = I18N.serializeForm(form, langFields);
      payload.features = this.collectFeatures(drawer.body.querySelector('#features-list'));

      if (!payload.slug?.trim()) throw new Error('Slug je povinný');
      if (!I18N.t(payload.name, 'sk')?.trim()) throw new Error('Názov (SK) je povinný');

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
    try { await API.toggle(this.TABLE, item.id, 'is_published', item.is_published); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },

  async togglePopular(item) {
    try { await API.toggle(this.TABLE, item.id, 'is_popular', item.is_popular); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },

  async remove(item) {
    if (!confirm(`Zmazať plán "${I18N.t(item.name, 'sk')}"?`)) return;
    try { await API.remove(this.TABLE, item.id); Utils.toast('✓ Zmazané', 'success'); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },
};
