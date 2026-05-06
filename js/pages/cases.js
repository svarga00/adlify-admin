// js/pages/cases.js — Prípadové štúdie (web_case_studies)
// Etapa C: JSONB lang fields + auto-translate + cover gradient + KPI builder

window.Cases = {
  TABLE: 'web_case_studies',

  async render() {
    const items = await API.list(this.TABLE);
    const content = document.getElementById('page-content');

    content.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Prípadové štúdie</h1>
            <p class="text-sm text-gray-500 mt-1">${items.length} ${items.length === 1 ? 'prípadovka' : 'prípadoviek'}</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition">
            <span>+</span><span>Pridať prípadovku</span>
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
      <div class="text-3xl mb-2">📊</div>
      <p class="text-sm text-gray-500">Zatiaľ žiadne prípadové štúdie. Pridaj prvú.</p>
    </div>`;
  },

  row(item) {
    const pub = item.published !== false;
    const gradient = item.cover_gradient || 'linear-gradient(135deg, #F16434, #E85D9C)';
    const name = I18N.t(item.name, 'sk');
    const tag = I18N.t(item.tag, 'sk');
    const summary = I18N.t(item.summary, 'sk');

    return `
      <div data-id="${item.id}" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition flex items-center gap-4">
        <div class="w-14 h-14 rounded-lg flex-shrink-0" style="background: ${Utils.escape(gradient)}"></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-gray-900 text-sm">${Utils.escape(name) || '<em class="text-gray-400">Bez názvu</em>'}</span>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${pub ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
              ${pub ? 'Live' : 'Skryté'}
            </span>
          </div>
          <div class="text-xs text-gray-500">${Utils.escape(tag)} · /pripadove-studie/${Utils.escape(item.slug || '')}</div>
          <div class="text-xs text-gray-600 mt-1 truncate">${Utils.escape(summary)}</div>
        </div>
        <div class="flex items-center gap-2">
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
      tag: I18N.empty(),
      name: I18N.empty(),
      category: 'e-commerce',
      summary: I18N.empty(),
      metric_a_label: I18N.empty(),
      metric_a_value: I18N.empty(),
      metric_b_label: I18N.empty(),
      metric_b_value: I18N.empty(),
      cover_gradient: 'linear-gradient(135deg, #F16434, #E85D9C)',
      hero_subtitle: I18N.empty(),
      industry: I18N.empty(),
      duration: I18N.empty(),
      budget: I18N.empty(),
      services_used: [],
      challenge: I18N.empty(),
      approach: I18N.empty(),
      results: I18N.empty(),
      testimonial: I18N.empty(),
      testimonial_by: I18N.empty(),
      kpis: [],
      published: true,
      sort_order: 0,
    };

    const drawer = Utils.openDrawer(`${isNew ? 'Pridať' : 'Upraviť'} prípadovku`);
    drawer.body.innerHTML = `
      <form id="case-form" class="space-y-5">

        <!-- ZÁKLADNÉ -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-4">
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Základné</div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Slug (URL)</label>
            <input type="text" name="slug" required value="${Utils.escape(data.slug)}"
              placeholder="zlatka"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
            <p class="text-xs text-gray-500 mt-1">Bude na URL: /pripadove-studie/<span class="font-mono">slug</span></p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Kategória</label>
              <select name="category" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                ${['e-commerce', 'dtc', 'local', 'b2c', 'b2b'].map(c =>
                  `<option value="${c}" ${data.category === c ? 'selected' : ''}>${c}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Poradie</label>
              <input type="number" name="sort_order" value="${data.sort_order || 0}"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
            </div>
          </div>

          ${I18N.renderField('tag', data.tag, { label: 'TAG (E-COMMERCE · ŠPERKY)', required: true })}
          ${I18N.renderField('name', data.name, { label: 'Názov klienta (Zlatka.sk)', required: true })}
          ${I18N.renderField('summary', data.summary, { label: 'Krátke zhrnutie pre kartu', type: 'textarea', rows: 2, required: true })}
        </div>

        <!-- METRIKY (karta) -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-4">
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Karta — 2 hlavné metriky</div>
          <div class="grid grid-cols-2 gap-3">
            <div>${I18N.renderField('metric_a_label', data.metric_a_label, { label: 'Metrika A — popis' })}</div>
            <div>${I18N.renderField('metric_a_value', data.metric_a_value, { label: 'Metrika A — hodnota (+284%)' })}</div>
            <div>${I18N.renderField('metric_b_label', data.metric_b_label, { label: 'Metrika B — popis' })}</div>
            <div>${I18N.renderField('metric_b_value', data.metric_b_value, { label: 'Metrika B — hodnota (6.2×)' })}</div>
          </div>
        </div>

        <!-- VIZUÁL -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-4">
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Vizuál (cover)</div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Cover gradient (CSS)</label>
            <input type="text" name="cover_gradient" value="${Utils.escape(data.cover_gradient)}"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
            <div class="mt-2 h-16 rounded-lg" id="gradient-preview" style="background: ${Utils.escape(data.cover_gradient)}"></div>
          </div>
        </div>

        <!-- DETAIL — meta -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-4">
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Detail stránka — meta</div>
          ${I18N.renderField('hero_subtitle', data.hero_subtitle, { label: 'Hero subtitle (pod názvom)', type: 'textarea', rows: 2 })}
          <div class="grid grid-cols-3 gap-3">
            <div>${I18N.renderField('industry', data.industry, { label: 'Odvetvie' })}</div>
            <div>${I18N.renderField('duration', data.duration, { label: 'Trvanie' })}</div>
            <div>${I18N.renderField('budget', data.budget, { label: 'Reklamný budget' })}</div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Použité služby (oddelené čiarkou)</label>
            <input type="text" name="services_used_csv" value="${Utils.escape((data.services_used || []).join(', '))}"
              placeholder="Google Ads, Meta Ads, Klaviyo email"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
        </div>

        <!-- OBSAH (3 sekcie) -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-4">
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Obsah</div>
          ${I18N.renderField('challenge', data.challenge, { label: '01 — Výzva (markdown OK)', type: 'textarea', rows: 6 })}
          ${I18N.renderField('approach', data.approach, { label: '02 — Prístup', type: 'textarea', rows: 6 })}
          ${I18N.renderField('results', data.results, { label: '03 — Výsledky', type: 'textarea', rows: 6 })}
        </div>

        <!-- TESTIMONIAL -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-4">
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Testimonial</div>
          ${I18N.renderField('testimonial', data.testimonial, { label: 'Citát od klienta', type: 'textarea', rows: 3 })}
          ${I18N.renderField('testimonial_by', data.testimonial_by, { label: 'Autor (Lucia K., zakladateľka Zlatka.sk)' })}
        </div>

        <!-- KPI GRID -->
        <div class="bg-gray-50 rounded-xl p-4 space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">KPI Grid (4 metriky pred/po)</div>
            <button type="button" id="kpi-add" class="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Pridať KPI</button>
          </div>
          <div id="kpi-list" class="space-y-2"></div>
        </div>

        <!-- PUBLIKÁCIA -->
        <div class="bg-gray-50 rounded-xl p-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="published" ${data.published !== false ? 'checked' : ''} class="w-4 h-4">
            <span class="text-sm font-semibold text-gray-900">Zverejniť na webe</span>
          </label>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button type="submit" class="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition">
            ${isNew ? 'Pridať' : 'Uložiť zmeny'}
          </button>
          <button type="button" data-close class="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
            Zrušiť
          </button>
        </div>
      </form>
    `;

    // Bind i18n switchers + translate buttons
    I18N.bindFieldSwitchers(drawer.body);

    // Live gradient preview
    const gradientInput = drawer.body.querySelector('[name="cover_gradient"]');
    const gradientPreview = drawer.body.querySelector('#gradient-preview');
    gradientInput?.addEventListener('input', () => {
      gradientPreview.style.background = gradientInput.value;
    });

    // KPI grid
    const kpiList = drawer.body.querySelector('#kpi-list');
    const renderKPIs = (kpis) => {
      kpiList.innerHTML = (kpis || []).map((k, i) => `
        <div class="grid grid-cols-12 gap-2 items-center" data-kpi-row="${i}">
          <input type="text" placeholder="Label (Tržby)" value="${Utils.escape(k.label || '')}" data-kpi-field="label"
            class="col-span-3 px-2 py-1.5 border border-gray-300 rounded text-sm">
          <input type="text" placeholder="Pred" value="${Utils.escape(k.before || '')}" data-kpi-field="before"
            class="col-span-3 px-2 py-1.5 border border-gray-300 rounded text-sm">
          <input type="text" placeholder="Po" value="${Utils.escape(k.after || '')}" data-kpi-field="after"
            class="col-span-3 px-2 py-1.5 border border-gray-300 rounded text-sm">
          <input type="text" placeholder="Delta" value="${Utils.escape(k.delta || '')}" data-kpi-field="delta"
            class="col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm">
          <button type="button" data-kpi-remove="${i}" class="col-span-1 text-red-500 hover:bg-red-50 rounded">🗑</button>
        </div>
      `).join('');

      kpiList.querySelectorAll('[data-kpi-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.kpiRemove);
          const current = this.collectKPIs(kpiList);
          current.splice(idx, 1);
          renderKPIs(current);
        });
      });
    };
    renderKPIs(data.kpis || []);

    drawer.body.querySelector('#kpi-add').addEventListener('click', () => {
      const current = this.collectKPIs(kpiList);
      current.push({ label: '', before: '', after: '', delta: '' });
      renderKPIs(current);
    });

    // Submit
    drawer.body.querySelector('#case-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });
  },

  collectKPIs(kpiList) {
    const rows = kpiList.querySelectorAll('[data-kpi-row]');
    return Array.from(rows).map(row => {
      return {
        label:  row.querySelector('[data-kpi-field="label"]').value,
        before: row.querySelector('[data-kpi-field="before"]').value,
        after:  row.querySelector('[data-kpi-field="after"]').value,
        delta:  row.querySelector('[data-kpi-field="delta"]').value,
      };
    }).filter(k => k.label || k.after);
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#case-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const langFields = [
        'tag','name','summary','metric_a_label','metric_a_value','metric_b_label','metric_b_value',
        'hero_subtitle','industry','duration','budget','challenge','approach','results',
        'testimonial','testimonial_by'
      ];
      const payload = I18N.serializeForm(form, langFields);

      // services_used: split CSV
      const csv = form.querySelector('[name="services_used_csv"]').value;
      payload.services_used = csv.split(',').map(s => s.trim()).filter(Boolean);
      delete payload.services_used_csv;

      // KPIs
      payload.kpis = this.collectKPIs(drawer.body.querySelector('#kpi-list'));

      // Validácia
      if (!payload.slug?.trim()) throw new Error('Slug je povinný');
      if (!I18N.t(payload.name, 'sk')?.trim()) throw new Error('Názov (SK) je povinný');

      if (item) {
        await API.update(this.TABLE, item.id, payload);
      } else {
        await API.insert(this.TABLE, payload);
      }

      Utils.toast('✓ Uložené', 'success');
      Utils.closeDrawer();
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

  async remove(item) {
    if (!confirm(`Zmazať prípadovku "${I18N.t(item.name, 'sk')}"?`)) return;
    try {
      await API.remove(this.TABLE, item.id);
      Utils.toast('✓ Zmazané', 'success');
      this.render();
    } catch (err) {
      Utils.toast('Chyba: ' + err.message, 'error');
    }
  },
};
