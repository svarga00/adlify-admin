// js/pages/pricing.js
// Cenník — 3 plány, jednorazové projekty, porovnávacia tabuľka

window.Pricing = {
  async render() {
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Cenník</h1>
          <p class="text-sm text-gray-500 mt-1">3 plány, jednorazové projekty a porovnávacia tabuľka. Aktívny jazyk: <span class="font-mono uppercase font-semibold">${State.activeLang}</span></p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 mb-6 border-b border-gray-200">
          <button data-tab="plans"    class="pricing-tab px-4 py-2 text-sm font-semibold border-b-2 border-transparent">Plány (3)</button>
          <button data-tab="extras"   class="pricing-tab px-4 py-2 text-sm font-semibold border-b-2 border-transparent">Jednorazové</button>
          <button data-tab="features" class="pricing-tab px-4 py-2 text-sm font-semibold border-b-2 border-transparent">Porovnávacia tabuľka</button>
        </div>

        <div id="pricing-content"></div>
      </div>
    `;

    document.querySelectorAll('.pricing-tab').forEach(btn => {
      btn.addEventListener('click', () => this.showTab(btn.getAttribute('data-tab')));
    });

    // Default tab
    this.showTab('plans');
  },

  showTab(tab) {
    document.querySelectorAll('.pricing-tab').forEach(b => {
      const active = b.getAttribute('data-tab') === tab;
      b.classList.toggle('border-brand-500', active);
      b.classList.toggle('text-gray-900', active);
      b.classList.toggle('text-gray-500', !active);
    });

    if (tab === 'plans')    this.renderPlans();
    if (tab === 'extras')   this.renderExtras();
    if (tab === 'features') this.renderFeatures();
  },

  // ============ PLÁNY ============
  async renderPlans() {
    const container = document.getElementById('pricing-content');
    container.innerHTML = '<div class="text-center py-12 text-gray-400">⏳ Načítavam…</div>';

    const items = await API.list('web_pricing_plans');

    container.innerHTML = `
      <div class="flex justify-end mb-4">
        <button id="add-plan" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
          <span>+</span><span>Pridať plán</span>
        </button>
      </div>
      <div class="space-y-2">
        ${items.length === 0 ? '<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-500">Zatiaľ žiadne plány v tomto jazyku.</div>' : items.map(p => this.planRow(p)).join('')}
      </div>
    `;

    document.getElementById('add-plan').addEventListener('click', () => this.openPlanEditor(null));
    document.querySelectorAll('[data-plan-id]').forEach(el => {
      const id = el.getAttribute('data-plan-id');
      const item = items.find(i => i.id === id);
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openPlanEditor(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.removePlan(item));
    });
  },

  planRow(item) {
    return `
      <div data-plan-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 flex items-center gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <div class="font-bold text-gray-900">${Utils.escape(item.name)}</div>
            ${item.badge ? `<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-700">${Utils.escape(item.badge)}</span>` : ''}
          </div>
          <div class="text-sm text-gray-500 mt-0.5">${Utils.escape(item.tagline || '')}</div>
          <div class="text-xs text-gray-600 mt-1"><strong>€${item.price_monthly}</strong>/mes · <strong>€${item.price_yearly}</strong>/rok · ${(item.features || []).length} features</div>
        </div>
        <div class="flex gap-1">
          <button data-action="edit" class="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">✏️</button>
          <button data-action="delete" class="w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-500">🗑️</button>
        </div>
      </div>`;
  },

  openPlanEditor(item) {
    const isNew = !item;
    const data = item || { is_published: true, sort_order: 0, currency: 'EUR', features: [] };

    const featuresList = (data.features || []).map((f, i) => `
      <div class="feature-row flex gap-2 mb-2">
        <input type="text" value="${Utils.escape(f)}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <button type="button" class="del-feat w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-500">🗑️</button>
      </div>
    `).join('');

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Plan key *</label>
            <input type="text" name="plan_key" required value="${Utils.escape(data.plan_key || '')}" placeholder="starter / growth / scale"
              ${item ? 'readonly' : ''}
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono ${item ? 'bg-gray-50' : ''}">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Názov *</label>
            <input type="text" name="name" required value="${Utils.escape(data.name || '')}" placeholder="Starter"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Tagline</label>
          <input type="text" name="tagline" value="${Utils.escape(data.tagline || '')}" placeholder="Pre živnostníkov a malé e-shopy"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Mesačne (€)</label>
            <input type="number" step="0.01" name="price_monthly" value="${data.price_monthly || ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Ročne (€)</label>
            <input type="number" step="0.01" name="price_yearly" value="${data.price_yearly || ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Mena</label>
            <input type="text" name="currency" value="${Utils.escape(data.currency || 'EUR')}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Badge (voliteľne)</label>
          <input type="text" name="badge" value="${Utils.escape(data.badge || '')}" placeholder="NAJPOPULÁRNEJŠIE"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Features (zoznam)</label>
          <div id="features-list">${featuresList}</div>
          <button type="button" id="add-feature" class="mt-2 text-sm text-brand-500 hover:text-brand-700 font-medium">+ Pridať feature</button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">CTA tlačidlo</label>
            <input type="text" name="cta_label" value="${Utils.escape(data.cta_label || '')}" placeholder="Vybrať Starter"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">CTA URL</label>
            <input type="text" name="cta_url" value="${Utils.escape(data.cta_url || '')}" placeholder="/kontakt"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
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

    const drawer = Utils.drawer(isNew ? 'Nový plán' : 'Upraviť plán', formHtml, { footer });

    // Features add/remove
    const addFeat = () => {
      const list = drawer.body.querySelector('#features-list');
      const row = document.createElement('div');
      row.className = 'feature-row flex gap-2 mb-2';
      row.innerHTML = `
        <input type="text" placeholder="napr. 1 reklamná platforma" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
        <button type="button" class="del-feat w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-500">🗑️</button>
      `;
      row.querySelector('.del-feat').addEventListener('click', () => row.remove());
      list.appendChild(row);
      row.querySelector('input').focus();
    };
    drawer.body.querySelector('#add-feature').addEventListener('click', addFeat);
    drawer.body.querySelectorAll('.del-feat').forEach(b => b.addEventListener('click', e => e.target.closest('.feature-row').remove()));

    drawer.footer.querySelector('#cancel-btn').addEventListener('click', drawer.close);

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const payload = Utils.formData(drawer.body.querySelector('#t-form'));
      payload.lang = State.activeLang;
      // Collect features
      payload.features = Array.from(drawer.body.querySelectorAll('.feature-row input')).map(i => i.value.trim()).filter(Boolean);

      try {
        if (item) await API.update('web_pricing_plans', item.id, payload);
        else await API.insert('web_pricing_plans', payload);
        Utils.toast('Uložené ✓', 'success');
        State.buildPending = true;
        drawer.close();
        this.renderPlans();
      } catch (err) {
        Utils.toast('Chyba: ' + err.message, 'error');
      }
    });

    if (item) {
      drawer.footer.querySelector('#del-btn').addEventListener('click', async () => {
        if (!await Utils.confirm('Zmazať tento plán?', { danger: true, confirmLabel: 'Zmazať' })) return;
        await API.remove('web_pricing_plans', item.id);
        Utils.toast('Zmazané', 'success');
        State.buildPending = true;
        drawer.close();
        this.renderPlans();
      });
    }
  },

  async removePlan(item) {
    if (!await Utils.confirm(`Zmazať plán "${item.name}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    await API.remove('web_pricing_plans', item.id);
    Utils.toast('Zmazané', 'success');
    State.buildPending = true;
    this.renderPlans();
  },

  // ============ EXTRAS (jednorazové) ============
  async renderExtras() {
    const container = document.getElementById('pricing-content');
    container.innerHTML = '<div class="text-center py-12 text-gray-400">⏳ Načítavam…</div>';
    const items = await API.list('web_pricing_extras');

    container.innerHTML = `
      <div class="flex justify-end mb-4">
        <button id="add-extra" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
          <span>+</span><span>Pridať</span>
        </button>
      </div>
      <div class="space-y-2">
        ${items.length === 0 ? '<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-500">Zatiaľ žiadne jednorazové projekty.</div>' : items.map(e => this.extraRow(e)).join('')}
      </div>
    `;

    document.getElementById('add-extra').addEventListener('click', () => this.openExtraEditor(null));
    document.querySelectorAll('[data-extra-id]').forEach(el => {
      const id = el.getAttribute('data-extra-id');
      const item = items.find(i => i.id === id);
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openExtraEditor(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.removeExtra(item));
    });
  },

  extraRow(item) {
    return `
      <div data-extra-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        <div class="flex-1">
          <div class="font-semibold text-gray-900 text-sm">${Utils.escape(item.name)}</div>
          <div class="text-xs text-gray-500 line-clamp-1">${Utils.escape(Utils.truncate(item.description, 100))}</div>
        </div>
        <div class="text-lg font-bold text-gray-900">€${item.price}</div>
        <div class="flex gap-1">
          <button data-action="edit" class="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500">✏️</button>
          <button data-action="delete" class="w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-500">🗑️</button>
        </div>
      </div>`;
  },

  openExtraEditor(item) {
    const isNew = !item;
    const data = item || { is_published: true, sort_order: 0, currency: 'EUR' };

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kľúč *</label>
          <input type="text" name="extra_key" required value="${Utils.escape(data.extra_key || '')}" ${item ? 'readonly' : ''}
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono ${item ? 'bg-gray-50' : ''}">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Názov *</label>
          <input type="text" name="name" required value="${Utils.escape(data.name || '')}"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Popis</label>
          <textarea name="description" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-y">${Utils.escape(data.description || '')}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Cena (€)</label>
            <input type="number" step="0.01" name="price" value="${data.price || ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">CTA tlačidlo</label>
            <input type="text" name="cta_label" value="${Utils.escape(data.cta_label || 'Objednať')}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
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

    const drawer = Utils.drawer(isNew ? 'Nový jednorazový projekt' : 'Upraviť', formHtml, { footer });
    drawer.footer.querySelector('#cancel-btn').addEventListener('click', drawer.close);

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const payload = Utils.formData(drawer.body.querySelector('#t-form'));
      payload.lang = State.activeLang;
      try {
        if (item) await API.update('web_pricing_extras', item.id, payload);
        else await API.insert('web_pricing_extras', payload);
        Utils.toast('Uložené ✓', 'success');
        State.buildPending = true;
        drawer.close();
        this.renderExtras();
      } catch (err) {
        Utils.toast('Chyba: ' + err.message, 'error');
      }
    });

    if (item) {
      drawer.footer.querySelector('#del-btn').addEventListener('click', async () => {
        if (!await Utils.confirm('Zmazať?', { danger: true, confirmLabel: 'Zmazať' })) return;
        await API.remove('web_pricing_extras', item.id);
        Utils.toast('Zmazané', 'success');
        State.buildPending = true;
        drawer.close();
        this.renderExtras();
      });
    }
  },

  async removeExtra(item) {
    if (!await Utils.confirm(`Zmazať "${item.name}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    await API.remove('web_pricing_extras', item.id);
    Utils.toast('Zmazané', 'success');
    State.buildPending = true;
    this.renderExtras();
  },

  // ============ FEATURES (porovnávacia tabuľka) ============
  async renderFeatures() {
    const container = document.getElementById('pricing-content');
    container.innerHTML = '<div class="text-center py-12 text-gray-400">⏳ Načítavam…</div>';

    const items = await API.list('web_pricing_features');

    // Group by category
    const grouped = {};
    items.forEach(i => {
      const cat = i.category || 'Iné';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(i);
    });

    container.innerHTML = `
      <div class="flex justify-end mb-4">
        <button id="add-feature-row" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
          <span>+</span><span>Pridať riadok</span>
        </button>
      </div>

      ${items.length === 0 ? `<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-500">Zatiaľ žiadne riadky porovnania.</div>` : `
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div class="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase">
            <div class="col-span-5">Funkcia</div>
            <div class="col-span-2 text-center">Starter</div>
            <div class="col-span-2 text-center">Growth</div>
            <div class="col-span-2 text-center">Scale</div>
            <div class="col-span-1"></div>
          </div>
          ${Object.entries(grouped).map(([cat, list]) => `
            <div>
              <div class="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-700 border-b border-gray-200">${Utils.escape(cat)}</div>
              ${list.map(f => `
                <div data-feature-id="${f.id}" class="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 items-center hover:bg-gray-50">
                  <div class="col-span-5 text-sm text-gray-900">${Utils.escape(f.label)}</div>
                  <div class="col-span-2 text-center text-sm text-gray-700">${Utils.escape(f.starter_value || '—')}</div>
                  <div class="col-span-2 text-center text-sm text-gray-700">${Utils.escape(f.growth_value || '—')}</div>
                  <div class="col-span-2 text-center text-sm text-gray-700">${Utils.escape(f.scale_value || '—')}</div>
                  <div class="col-span-1 flex justify-end gap-1">
                    <button data-action="edit" class="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-500 text-xs">✏️</button>
                    <button data-action="delete" class="w-8 h-8 rounded-lg hover:bg-red-100 hover:text-red-600 text-gray-500 text-xs">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `}
    `;

    document.getElementById('add-feature-row').addEventListener('click', () => this.openFeatureEditor(null));
    document.querySelectorAll('[data-feature-id]').forEach(el => {
      const id = el.getAttribute('data-feature-id');
      const item = items.find(i => i.id === id);
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openFeatureEditor(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.removeFeature(item));
    });
  },

  openFeatureEditor(item) {
    const isNew = !item;
    const data = item || { sort_order: 0 };

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Feature key *</label>
            <input type="text" name="feature_key" required value="${Utils.escape(data.feature_key || '')}" placeholder="google_ads"
              ${item ? 'readonly' : ''}
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono ${item ? 'bg-gray-50' : ''}">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kategória</label>
            <input type="text" name="category" value="${Utils.escape(data.category || '')}" placeholder="Kanály / Tracking / Reporting"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Popis funkcie *</label>
          <input type="text" name="label" required value="${Utils.escape(data.label || '')}" placeholder="napr. Google Ads"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Starter</label>
            <input type="text" name="starter_value" value="${Utils.escape(data.starter_value || '')}" placeholder="✓ / —"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Growth</label>
            <input type="text" name="growth_value" value="${Utils.escape(data.growth_value || '')}" placeholder="✓ / voliteľne"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Scale</label>
            <input type="text" name="scale_value" value="${Utils.escape(data.scale_value || '')}" placeholder="✓"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
        </div>

        <p class="text-xs text-gray-500">Tip: <code>✓</code> pre dostupné, <code>—</code> pre nedostupné, <code>voliteľne</code> alebo konkrétny text (napr. "48 hod")</p>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Poradie</label>
          <input type="number" name="sort_order" value="${data.sort_order || 0}"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
        </div>
      </form>
    `;

    const footer = `
      ${item ? '<button id="del-btn" class="mr-auto px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">Zmazať</button>' : ''}
      <button id="cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Zrušiť</button>
      <button id="save-btn" class="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg">${isNew ? 'Pridať' : 'Uložiť'}</button>
    `;

    const drawer = Utils.drawer(isNew ? 'Nový riadok porovnania' : 'Upraviť', formHtml, { footer });
    drawer.footer.querySelector('#cancel-btn').addEventListener('click', drawer.close);

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const payload = Utils.formData(drawer.body.querySelector('#t-form'));
      payload.lang = State.activeLang;
      try {
        if (item) await API.update('web_pricing_features', item.id, payload);
        else await API.insert('web_pricing_features', payload);
        Utils.toast('Uložené ✓', 'success');
        State.buildPending = true;
        drawer.close();
        this.renderFeatures();
      } catch (err) {
        Utils.toast('Chyba: ' + err.message, 'error');
      }
    });

    if (item) {
      drawer.footer.querySelector('#del-btn').addEventListener('click', async () => {
        if (!await Utils.confirm('Zmazať tento riadok?', { danger: true, confirmLabel: 'Zmazať' })) return;
        await API.remove('web_pricing_features', item.id);
        State.buildPending = true;
        drawer.close();
        this.renderFeatures();
      });
    }
  },

  async removeFeature(item) {
    if (!await Utils.confirm(`Zmazať "${item.label}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    await API.remove('web_pricing_features', item.id);
    Utils.toast('Zmazané', 'success');
    State.buildPending = true;
    this.renderFeatures();
  },
};
