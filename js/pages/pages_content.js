// js/pages/pages_content.js
// Sekcie stránok — Process steps + Marquee

window.PagesContent = {
  PROCESS_TABLE: 'web_process_steps',
  MARQUEE_TABLE: 'web_marquee',

  SECTIONS: [
    { key: 'process',  label: '4 procesné kroky', icon: '🔢' },
    { key: 'marquee',  label: 'Rolujúce slová',  icon: '🎢' },
  ],

  // State sa nastaví pri kazdom render() — preto NIE je default v inicializácii
  _activeSection: null,

  async render() {
    // RESET state pri každom načítaní stránky
    if (!this._activeSection) this._activeSection = 'process';

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Sekcie stránok</h1>
          <p class="text-sm text-gray-500 mt-1">Špecifický obsah pre sekcie webu. Aktívny jazyk: <span class="font-mono uppercase font-semibold">${State.activeLang}</span></p>
          <p class="text-xs text-gray-400 mt-2">💡 Hero čísla, manifest a calculator labels uprav cez <a href="#translations" class="text-brand-500 hover:underline">UI texty</a>. Cenník je v <a href="#pricing" class="text-brand-500 hover:underline">Cenník</a>.</p>
        </div>

        <div class="flex gap-1 mb-6 border-b border-gray-200">
          ${this.SECTIONS.map(s => `
            <button data-sec="${s.key}" class="sec-tab px-4 py-2 text-sm font-semibold border-b-2 ${s.key === this._activeSection ? 'border-brand-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}">
              <span class="mr-1">${s.icon}</span>${s.label}
            </button>
          `).join('')}
        </div>

        <div id="sec-content"></div>
      </div>
    `;

    // Bind tabs
    document.querySelectorAll('.sec-tab').forEach(b => {
      b.addEventListener('click', () => {
        this._activeSection = b.getAttribute('data-sec');
        // Update tab styles
        document.querySelectorAll('.sec-tab').forEach(other => {
          const active = other.getAttribute('data-sec') === this._activeSection;
          other.classList.toggle('border-brand-500', active);
          other.classList.toggle('text-gray-900', active);
          other.classList.toggle('border-transparent', !active);
          other.classList.toggle('text-gray-500', !active);
        });
        this.renderActiveSection();
      });
    });

    await this.renderActiveSection();
  },

  async renderActiveSection() {
    const container = document.getElementById('sec-content');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-8 text-gray-400">⏳ Načítavam…</div>';

    try {
      if (this._activeSection === 'process')  await this.renderProcess();
      else if (this._activeSection === 'marquee')  await this.renderMarquee();
    } catch (err) {
      console.error('[pages_content]', err);
      const c = document.getElementById('sec-content');
      if (c) c.innerHTML = `<div class="bg-red-50 p-4 rounded text-red-600 text-sm">${Utils.escape(err.message || String(err))}</div>`;
    }
  },

  // ============ PROCESS STEPS ============
  async renderProcess() {
    let items = [];
    try {
      items = await API.list(this.PROCESS_TABLE);
    } catch (err) {
      const c = document.getElementById('sec-content');
      if (c) c.innerHTML = `<div class="bg-red-50 p-4 rounded text-red-600 text-sm">${Utils.escape(err.message)}</div>`;
      return;
    }

    const container = document.getElementById('sec-content');
    if (!container) return;

    container.innerHTML = `
      <div class="flex justify-end mb-4">
        <button id="add-step" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
          <span>+</span><span>Pridať krok</span>
        </button>
      </div>

      <div class="space-y-2">
        ${items.length === 0 ? '<div class="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-500">V jazyku <strong>' + State.activeLang.toUpperCase() + '</strong> zatiaľ žiadne kroky.</div>' : items.map(s => this.stepRow(s)).join('')}
      </div>
    `;

    const addBtn = document.getElementById('add-step');
    if (addBtn) addBtn.addEventListener('click', () => this.openStepEditor(null));

    document.querySelectorAll('[data-step-id]').forEach(el => {
      const id = el.getAttribute('data-step-id');
      const item = items.find(i => i.id === id);
      const editBtn = el.querySelector('[data-action="edit"]');
      const deleteBtn = el.querySelector('[data-action="delete"]');
      if (editBtn) editBtn.addEventListener('click', () => this.openStepEditor(item));
      if (deleteBtn) deleteBtn.addEventListener('click', () => this.removeStep(item));
    });
  },

  stepRow(item) {
    return `
      <div data-step-id="${Utils.escape(item.id)}" class="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 text-white font-bold flex items-center justify-center text-sm">${Utils.escape(item.step_number || '?')}</div>
        <div class="flex-1">
          <div class="font-semibold text-gray-900">${Utils.escape(item.title || '')}</div>
          <div class="text-xs text-gray-500 line-clamp-1">${Utils.escape(item.description || '')}</div>
        </div>
        <div class="flex gap-1">
          <button data-action="edit" class="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500">✏️</button>
          <button data-action="delete" class="w-9 h-9 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-500">🗑️</button>
        </div>
      </div>`;
  },

  openStepEditor(item) {
    const isNew = !item;
    const data = item || { is_published: true, sort_order: 0 };

    const formHtml = `
      <form id="t-form" class="space-y-5" onsubmit="return false;">
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Step key *</label>
            <input type="text" name="step_key" required value="${Utils.escape(data.step_key || '')}" placeholder="audit" ${item ? 'readonly' : ''}
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono ${item ? 'bg-gray-50' : ''}">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Číslo *</label>
            <input type="text" name="step_number" required value="${Utils.escape(data.step_number || '')}" placeholder="01"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Poradie</label>
            <input type="number" name="sort_order" value="${data.sort_order || 0}"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Názov *</label>
          <input type="text" name="title" required value="${Utils.escape(data.title || '')}"
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm">
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Popis *</label>
          <textarea name="description" rows="3" required class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-y">${Utils.escape(data.description || '')}</textarea>
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

    const drawer = Utils.drawer(isNew ? 'Nový krok' : 'Upraviť krok', formHtml, { footer });
    drawer.footer.querySelector('#cancel-btn').addEventListener('click', drawer.close);

    drawer.footer.querySelector('#save-btn').addEventListener('click', async () => {
      const payload = Utils.formData(drawer.body.querySelector('#t-form'));
      payload.lang = State.activeLang;
      try {
        if (item) await API.update(this.PROCESS_TABLE, item.id, payload);
        else await API.insert(this.PROCESS_TABLE, payload);
        Utils.toast('Uložené ✓', 'success');
        State.buildPending = true;
        drawer.close();
        this.renderProcess();
      } catch (err) {
        Utils.toast('Chyba: ' + err.message, 'error');
      }
    });

    if (item) {
      drawer.footer.querySelector('#del-btn').addEventListener('click', async () => {
        if (!await Utils.confirm('Zmazať tento krok?', { danger: true, confirmLabel: 'Zmazať' })) return;
        await API.remove(this.PROCESS_TABLE, item.id);
        State.buildPending = true;
        drawer.close();
        this.renderProcess();
      });
    }
  },

  async removeStep(item) {
    if (!await Utils.confirm(`Zmazať krok "${item.title}"?`, { danger: true, confirmLabel: 'Zmazať' })) return;
    await API.remove(this.PROCESS_TABLE, item.id);
    Utils.toast('Zmazané', 'success');
    State.buildPending = true;
    this.renderProcess();
  },

  // ============ MARQUEE ============
  async renderMarquee() {
    let data = null;
    try {
      const res = await window.supabase.from(this.MARQUEE_TABLE)
        .select('*').eq('lang', State.activeLang).maybeSingle();
      if (res.error) throw res.error;
      data = res.data;
    } catch (err) {
      const c = document.getElementById('sec-content');
      if (c) c.innerHTML = `<div class="bg-red-50 p-4 rounded text-red-600 text-sm">${Utils.escape(err.message)}</div>`;
      return;
    }

    const container = document.getElementById('sec-content');
    if (!container) return;

    const words = (data && Array.isArray(data.words)) ? data.words : [];

    container.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-2xl p-6">
        ${!data ? `
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
            💡 Pre jazyk <strong>${State.activeLang.toUpperCase()}</strong> ešte nie sú definované rolujúce slová. Vyplňte a uložte.
          </div>
        ` : ''}
        <h2 class="font-semibold text-gray-900 mb-2">Rolujúce slová na webe</h2>
        <p class="text-xs text-gray-500 mb-4">Slová oddeľte čiarkami. Zobrazujú sa v marquee páse na hlavnej stránke (napr. "Merané výsledky · Bez záväzku · Transparentne").</p>

        <textarea id="marquee-input" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 resize-y" placeholder="Merané výsledky, Bez záväzku, Transparentne, Výkonnostne, Bez výhovoriek, Data driven">${Utils.escape(words.join(', '))}</textarea>

        <div class="mt-4 flex justify-between items-center">
          <span class="text-xs text-gray-500">${words.length} slov</span>
          <button id="save-marquee" class="px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg">Uložiť</button>
        </div>
      </div>
    `;

    const saveBtn = document.getElementById('save-marquee');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const inputEl = document.getElementById('marquee-input');
        if (!inputEl) return;
        const input = inputEl.value;
        const newWords = input.split(',').map(w => w.trim()).filter(Boolean);

        try {
          await window.supabase.from(this.MARQUEE_TABLE).upsert({
            lang: State.activeLang,
            words: newWords,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'lang' });
          Utils.toast('Uložené ✓', 'success');
          State.buildPending = true;
          this.renderMarquee();
        } catch (err) {
          Utils.toast('Chyba: ' + err.message, 'error');
        }
      });
    }
  },
};
