// js/i18n.js — Helpers pre multilang JSONB polia
// Konvencia: každé prekladateľné pole je objekt { sk, cs, hu, en, de }

window.I18N = {
  LANGS: ['sk', 'cs', 'hu', 'en', 'de'],
  LANG_NAMES: {
    sk: 'Slovenčina',
    cs: 'Čeština',
    hu: 'Magyar',
    en: 'English',
    de: 'Deutsch',
  },
  LANG_FLAGS: {
    sk: '🇸🇰',
    cs: '🇨🇿',
    hu: '🇭🇺',
    en: '🇬🇧',
    de: '🇩🇪',
  },
  SOURCE_LANG: 'sk',  // jazyk z ktorého prekladáme

  /**
   * Vráti hodnotu z lang JSONB pre aktuálny jazyk (s fallbackom na SK).
   * Ak field je obyčajný string (legacy), vráti ho.
   */
  t(field, lang = null) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (typeof field !== 'object') return String(field);

    const activeLang = lang || State.activeLang || 'sk';
    return field[activeLang] || field.sk || field.en || Object.values(field).find(v => v) || '';
  },

  /**
   * Vytvorí prázdny lang object {sk:'',cs:'',hu:'',en:'',de:''}
   */
  empty() {
    return Object.fromEntries(this.LANGS.map(l => [l, '']));
  },

  /**
   * Normalizuje hodnotu — ak je string, urobí z neho lang object {sk: string}
   */
  normalize(value) {
    if (value == null) return this.empty();
    if (typeof value === 'string') {
      const obj = this.empty();
      obj.sk = value;
      return obj;
    }
    if (typeof value === 'object') {
      // Doplň chýbajúce kľúče prázdnymi stringami
      const obj = this.empty();
      for (const lang of this.LANGS) {
        if (value[lang] != null) obj[lang] = value[lang];
      }
      return obj;
    }
    return this.empty();
  },

  /**
   * Renderuje multi-lang input field (jeden field, 5 jazykových verzií v tabs)
   * @param {string} fieldName - názov data atribútu pre form serializáciu
   * @param {object} value - aktuálna hodnota (lang JSONB)
   * @param {object} opts - { type: 'text'|'textarea', label, placeholder, rows }
   */
  renderField(fieldName, value, opts = {}) {
    const v = this.normalize(value);
    const type = opts.type || 'text';
    const label = opts.label || fieldName;
    const placeholder = opts.placeholder || '';
    const rows = opts.rows || 4;
    const required = opts.required ? 'required' : '';

    const tabs = this.LANGS.map((lang, i) => `
      <button type="button" data-lang-tab="${lang}"
        class="lang-pill px-2.5 py-1 text-xs font-semibold rounded-md transition ${i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
        ${this.LANG_FLAGS[lang]} ${lang.toUpperCase()}
      </button>
    `).join('');

    const inputs = this.LANGS.map((lang, i) => {
      if (type === 'textarea') {
        return `
          <textarea
            data-lang-input="${lang}"
            data-i18n-field="${fieldName}"
            ${i !== 0 ? 'class="hidden"' : ''}
            placeholder="${Utils.escape(placeholder)} (${this.LANG_NAMES[lang]})"
            rows="${rows}"
            ${i === 0 ? required : ''}
            style="width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; resize:vertical; font-family:inherit;"
          >${Utils.escape(v[lang] || '')}</textarea>`;
      }
      return `
        <input
          type="text"
          data-lang-input="${lang}"
          data-i18n-field="${fieldName}"
          value="${Utils.escape(v[lang] || '')}"
          ${i !== 0 ? 'class="hidden"' : ''}
          placeholder="${Utils.escape(placeholder)} (${this.LANG_NAMES[lang]})"
          ${i === 0 ? required : ''}
          style="width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px;"
        >`;
    }).join('');

    return `
      <div class="i18n-field-group" data-i18n-group="${fieldName}">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <label class="text-xs font-semibold text-gray-700 uppercase tracking-wider">${Utils.escape(label)}</label>
          <div class="flex items-center gap-1 flex-wrap">
            <div class="flex gap-1 flex-wrap">${tabs}</div>
            <button type="button" data-i18n-translate="${fieldName}"
              class="ml-1 px-2 py-1 text-xs font-semibold rounded-md bg-gradient-to-r from-brand-500 to-pink-500 text-white hover:opacity-90 transition whitespace-nowrap"
              title="Preložiť SK → ostatné jazyky cez Claude">
              ✨ Preložiť
            </button>
          </div>
        </div>
        <div class="i18n-inputs">${inputs}</div>
      </div>
    `;
  },

  /**
   * Aktivuje switching medzi lang tabs v rámci field group
   * Volá sa po renderovaní formulára.
   */
  bindFieldSwitchers(rootEl = document) {
    const groups = rootEl.querySelectorAll('[data-i18n-group]');
    groups.forEach(group => {
      const tabs = group.querySelectorAll('[data-lang-tab]');
      const inputs = group.querySelectorAll('[data-lang-input]');

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetLang = tab.dataset.langTab;
          tabs.forEach(t => {
            const isActive = t.dataset.langTab === targetLang;
            t.classList.toggle('bg-gray-900', isActive);
            t.classList.toggle('text-white', isActive);
            t.classList.toggle('bg-gray-100', !isActive);
            t.classList.toggle('text-gray-600', !isActive);
          });
          inputs.forEach(input => {
            input.classList.toggle('hidden', input.dataset.langInput !== targetLang);
          });
        });
      });

      // Translate button
      const translateBtn = group.querySelector('[data-i18n-translate]');
      if (translateBtn) {
        translateBtn.addEventListener('click', async () => {
          const fieldName = translateBtn.dataset.i18nTranslate;
          const skInput = group.querySelector('[data-lang-input="sk"]');
          if (!skInput) return;
          const skValue = skInput.value.trim();
          if (!skValue) {
            Utils.toast('Najprv napíš SK text', 'warning');
            return;
          }

          translateBtn.disabled = true;
          translateBtn.innerHTML = '⏳ Prekladám...';

          try {
            const isLong = skValue.length > 200 || /[#*\-]/.test(skValue);
            const result = await API.translate(skValue, 'sk', ['cs', 'hu', 'en', 'de'], {
              preserve_html: isLong,
            });

            for (const lang of ['cs', 'hu', 'en', 'de']) {
              const input = group.querySelector(`[data-lang-input="${lang}"]`);
              if (input && result[lang]) {
                input.value = result[lang];
              }
            }
            Utils.toast('✓ Preložené', 'success');
          } catch (err) {
            console.error('Translate error:', err);
            Utils.toast('Preklad zlyhal: ' + err.message, 'error');
          } finally {
            translateBtn.disabled = false;
            translateBtn.innerHTML = '✨ Preložiť';
          }
        });
      }
    });
  },

  /**
   * Vytiahne hodnotu z field group ako lang JSONB
   * @param {HTMLElement} groupEl - element s data-i18n-group
   * @returns {object} - {sk, cs, hu, en, de}
   */
  serializeField(groupEl) {
    const result = this.empty();
    const inputs = groupEl.querySelectorAll('[data-lang-input]');
    inputs.forEach(input => {
      result[input.dataset.langInput] = input.value;
    });
    return result;
  },

  /**
   * Serializuje celý form do objektu, kde lang fields sú JSONB.
   * @param {HTMLFormElement} form
   * @param {string[]} langFields - mená polí ktoré sú lang JSONB
   * @returns {object}
   */
  serializeForm(form, langFields = []) {
    const result = {};

    // Lang fields zo skupín
    const groups = form.querySelectorAll('[data-i18n-group]');
    groups.forEach(group => {
      const fieldName = group.dataset.i18nGroup;
      if (langFields.includes(fieldName) || langFields.length === 0) {
        result[fieldName] = this.serializeField(group);
      }
    });

    // Plain fields (input/textarea bez data-i18n-group parent)
    const formData = new FormData(form);
    formData.forEach((value, key) => {
      if (!result[key]) {  // neprepisuj lang fields
        // Skontroluj či je to checkbox / number
        const input = form.querySelector(`[name="${key}"]`);
        if (input?.type === 'checkbox') {
          result[key] = input.checked;
        } else if (input?.type === 'number') {
          result[key] = value === '' ? null : Number(value);
        } else {
          result[key] = value;
        }
      }
    });

    return result;
  },
};
