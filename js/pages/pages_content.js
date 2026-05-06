// js/pages/pages_content.js — Sekcie stránok (web_pages_content)
// Slobodný JSONB content — admin pridáva pole-krát-jazykov dynamicky

window.PagesContent = {
  TABLE: 'web_pages_content',

  PAGE_LABELS: {
    homepage: 'Domovská stránka',
    about: 'O nás',
    services: 'Služby',
    pricing: 'Cenník',
    contact: 'Kontakt',
    how_it_works: 'Ako to funguje',
    blog: 'Blog',
    case_studies: 'Prípadové štúdie',
    faq: 'FAQ',
    partners: 'Partneri',
  },

  async render() {
    const items = await this.fetchAll();
    const content = document.getElementById('page-content');

    // Group by page_slug
    const grouped = {};
    items.forEach(i => {
      const p = i.page_slug || 'misc';
      if (!grouped[p]) grouped[p] = [];
      grouped[p].push(i);
    });

    const pages = Object.keys(grouped).sort();

    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Sekcie stránok</h1>
            <p class="text-sm text-gray-500 mt-1">Hero, manifest a iné sekcie statických stránok</p>
          </div>
          <button id="add-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
            <span>+</span><span>Pridať sekciu</span>
          </button>
        </div>

        ${pages.length === 0 ? `<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div class="text-3xl mb-2">📄</div>
          <p class="text-sm text-gray-500">Zatiaľ žiadne sekcie.</p>
        </div>` : pages.map(page => `
          <div class="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span class="text-sm font-bold text-gray-900">${Utils.escape(this.PAGE_LABELS[page] || page)}</span>
              <span class="ml-2 text-xs text-gray-500 font-mono">/${Utils.escape(page)}</span>
            </div>
            <div class="divide-y divide-gray-100">
              ${grouped[page].map(i => this.row(i)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('add-btn').addEventListener('click', () => this.openEditor(null));
    items.forEach(item => {
      const el = document.querySelector(`[data-id="${item.id}"]`);
      if (!el) return;
      el.querySelector('[data-action="edit"]')?.addEventListener('click', () => this.openEditor(item));
      el.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.remove(item));
    });
  },

  async fetchAll() {
    const { data, error } = await window.supabase
      .from(this.TABLE)
      .select('*')
      .order('page_slug', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  row(item) {
    const fieldKeys = Object.keys(item.content || {});
    const preview = fieldKeys.length > 0
      ? fieldKeys.slice(0, 3).map(k => I18N.t(item.content[k], 'sk')).filter(Boolean).join(' · ')
      : 'Prázdne';

    return `
      <div data-id="${item.id}" class="px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3">
        <div class="text-xs font-mono text-gray-400 w-6 text-center">${item.sort_order || 0}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <code class="text-xs font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded">${Utils.escape(item.section_key)}</code>
            <span class="text-xs text-gray-400">${fieldKeys.length} polí</span>
          </div>
          <div class="text-sm text-gray-600 mt-1 truncate">${Utils.escape(Utils.truncate(preview, 100))}</div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button data-action="edit" class="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded">Upraviť</button>
          <button data-action="delete" class="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">🗑</button>
        </div>
      </div>
    `;
  },

  openEditor(item) {
    const isNew = !item;
    const data = item || {
      page_slug: 'homepage',
      section_key: '',
      content: {},
      sort_order: 0,
    };

    // Existujúce field keys v content
    const fieldKeys = Object.keys(data.content || {});

    const drawer = Utils.drawer(`${isNew ? 'Pridať' : 'Upraviť'} sekciu`, `<form id="page-form" class="space-y-5">

      <div class="bg-gradient-to-r from-brand-50 to-pink-50 border border-brand-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-900">Hromadný preklad</div>
          <div class="text-xs text-gray-600 mt-0.5">Preložia sa všetky polia v sekcii.</div>
        </div>
        <button type="button" id="translate-all-btn"
          class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50">
          <span>✨</span><span id="translate-all-label">Preložiť všetko</span>
        </button>
      </div>

      <!-- Identifikácia sekcie -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Stránka</label>
            <select name="page_slug" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              ${Object.entries(this.PAGE_LABELS).map(([slug, label]) =>
                `<option value="${slug}" ${data.page_slug === slug ? 'selected' : ''}>${label}</option>`
              ).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Section key</label>
            <input type="text" name="section_key" required value="${Utils.escape(data.section_key || '')}"
              placeholder="hero / manifest / cta_section"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Poradie</label>
            <input type="number" name="sort_order" value="${data.sort_order || 0}"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
          </div>
        </div>
      </div>

      <!-- Content fields builder -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">Obsahové polia</div>
            <p class="text-xs text-gray-500 mt-1">Slobodná štruktúra. Bežné polia: title, subtitle, lead, cta_label, body</p>
          </div>
          <button type="button" id="content-field-add" class="text-xs font-semibold text-brand-600 hover:text-brand-700">+ Pridať pole</button>
        </div>
        <div id="content-fields" class="space-y-3"></div>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button type="submit" class="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
          ${isNew ? 'Pridať' : 'Uložiť zmeny'}
        </button>
        <button type="button" data-close class="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">Zrušiť</button>
      </div>
    </form>`);

    const fieldsContainer = drawer.body.querySelector('#content-fields');
    const renderFields = (content) => {
      const keys = Object.keys(content);
      fieldsContainer.innerHTML = keys.map((key, idx) => {
        const value = I18N.normalize(content[key]);
        return `
          <div class="bg-white border border-gray-200 rounded-lg p-3" data-content-row="${idx}" data-content-key="${Utils.escape(key)}">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <input type="text" data-content-name value="${Utils.escape(key)}" placeholder="Názov poľa"
                class="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-xs font-mono font-semibold">
              <div class="flex gap-1 flex-wrap">
                ${I18N.LANGS.map((lang, li) => `
                  <button type="button" data-content-tab="${lang}" data-content-row-tab="${idx}"
                    class="px-2 py-1 text-xs font-semibold rounded transition ${li === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}">
                    ${I18N.LANG_FLAGS[lang]} ${lang.toUpperCase()}
                  </button>
                `).join('')}
                <button type="button" data-content-translate="${idx}"
                  class="px-2 py-1 text-xs font-semibold rounded bg-gradient-to-r from-brand-500 to-pink-500 text-white hover:opacity-90 transition">✨</button>
                <button type="button" data-content-remove="${idx}"
                  class="w-7 h-7 text-red-500 hover:bg-red-50 rounded flex items-center justify-center" title="Zmazať">🗑</button>
              </div>
            </div>
            ${I18N.LANGS.map((lang, li) => `
              <textarea data-content-input="${lang}" data-content-row-input="${idx}"
                ${li !== 0 ? 'class="hidden"' : ''}
                placeholder="${I18N.LANG_NAMES[lang]}"
                rows="2"
                style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; font-family:inherit;"
              >${Utils.escape(value[lang] || '')}</textarea>
            `).join('')}
          </div>
        `;
      }).join('');

      // Bindings
      fieldsContainer.querySelectorAll('[data-content-row]').forEach(row => {
        const idx = row.dataset.contentRow;
        const tabs = row.querySelectorAll('[data-content-tab]');
        const inputs = row.querySelectorAll('[data-content-input]');
        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            const lang = tab.dataset.contentTab;
            tabs.forEach(t => {
              const isActive = t.dataset.contentTab === lang;
              t.classList.toggle('bg-gray-900', isActive);
              t.classList.toggle('text-white', isActive);
              t.classList.toggle('bg-gray-100', !isActive);
              t.classList.toggle('text-gray-600', !isActive);
            });
            inputs.forEach(input => {
              input.classList.toggle('hidden', input.dataset.contentInput !== lang);
            });
          });
        });
      });

      // Per-field translate
      fieldsContainer.querySelectorAll('[data-content-translate]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = btn.dataset.contentTranslate;
          const skInput = fieldsContainer.querySelector(`[data-content-input="sk"][data-content-row-input="${idx}"]`);
          if (!skInput?.value.trim()) {
            Utils.toast('Najprv napíš SK text', 'warning');
            return;
          }
          btn.disabled = true;
          btn.textContent = '⏳';
          try {
            const result = await API.translate(skInput.value, 'sk', ['cs', 'hu', 'en', 'de']);
            for (const lang of ['cs', 'hu', 'en', 'de']) {
              const inp = fieldsContainer.querySelector(`[data-content-input="${lang}"][data-content-row-input="${idx}"]`);
              if (inp && result[lang]) inp.value = result[lang];
            }
          } catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
          finally { btn.disabled = false; btn.textContent = '✨'; }
        });
      });

      // Remove
      fieldsContainer.querySelectorAll('[data-content-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.contentRemove);
          const collected = this.collectContent(fieldsContainer);
          const keys = Object.keys(collected);
          delete collected[keys[idx]];
          renderFields(collected);
        });
      });
    };

    renderFields(data.content || {});

    drawer.body.querySelector('#content-field-add').addEventListener('click', () => {
      const collected = this.collectContent(fieldsContainer);
      const newKey = `field_${Object.keys(collected).length + 1}`;
      collected[newKey] = I18N.empty();
      renderFields(collected);
    });

    // Translate-all
    drawer.body.querySelector('#translate-all-btn').addEventListener('click', async () => {
      const btn = drawer.body.querySelector('#translate-all-btn');
      const lbl = drawer.body.querySelector('#translate-all-label');
      const rows = fieldsContainer.querySelectorAll('[data-content-row]');
      const skTexts = {};
      rows.forEach((row, i) => {
        const sk = row.querySelector('[data-content-input="sk"]');
        if (sk?.value.trim()) skTexts[i] = sk.value;
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
          for (const idx of Object.keys(out)) {
            const inp = fieldsContainer.querySelector(`[data-content-input="${lang}"][data-content-row-input="${idx}"]`);
            if (inp) inp.value = out[idx];
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

    drawer.body.querySelector('#page-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save(item, drawer);
    });
    drawer.body.querySelector('[data-close]')?.addEventListener('click', () => drawer.close());
  },

  collectContent(fieldsContainer) {
    const rows = fieldsContainer.querySelectorAll('[data-content-row]');
    const content = {};
    rows.forEach(row => {
      const nameInput = row.querySelector('[data-content-name]');
      const fieldName = nameInput?.value.trim();
      if (!fieldName) return;
      const value = I18N.empty();
      I18N.LANGS.forEach(lang => {
        const inp = row.querySelector(`[data-content-input="${lang}"]`);
        value[lang] = inp?.value || '';
      });
      content[fieldName] = value;
    });
    return content;
  },

  async save(item, drawer) {
    const form = drawer.body.querySelector('#page-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const fd = new FormData(form);
      const payload = {
        page_slug: fd.get('page_slug'),
        section_key: fd.get('section_key'),
        sort_order: Number(fd.get('sort_order') || 0),
        content: this.collectContent(drawer.body.querySelector('#content-fields')),
      };

      if (!payload.page_slug) throw new Error('Stránka je povinná');
      if (!payload.section_key?.trim()) throw new Error('Section key je povinný');

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

  async remove(item) {
    if (!confirm(`Zmazať sekciu "${item.section_key}"?`)) return;
    try { await API.remove(this.TABLE, item.id); Utils.toast('✓ Zmazané', 'success'); this.render(); }
    catch (err) { Utils.toast('Chyba: ' + err.message, 'error'); }
  },
};
