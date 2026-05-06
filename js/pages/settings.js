// js/pages/settings.js — Globálne nastavenia (web_settings, single-row id='global')

window.Settings = {
  TABLE: 'web_settings',
  ID: 'global',

  async render() {
    const content = document.getElementById('page-content');
    let data;
    try {
      data = await API.get(this.TABLE, this.ID);
    } catch (err) {
      // Ak riadok neexistuje, vytvor ho
      data = {
        id: 'global',
        contact_email: 'info@adlify.eu',
        contact_phone: '',
        contact_address: '',
        company_name: '',
        company_ico: '',
        company_dic: '',
        company_iban: '',
        social_linkedin: '',
        social_facebook: '',
        social_instagram: '',
        social_youtube: '',
        footer_tagline: I18N.empty(),
        footer_copyright: I18N.empty(),
        cookie_message: I18N.empty(),
        default_seo_title: I18N.empty(),
        default_seo_description: I18N.empty(),
        default_og_image_url: '',
      };
    }

    content.innerHTML = `
      <div class="max-w-3xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Globálne nastavenia</h1>
          <p class="text-sm text-gray-500 mt-1">Kontakty, sociálne siete, footer, SEO defaults</p>
        </div>

        <form id="settings-form" class="space-y-5">

          <!-- Translate-all banner -->
          <div class="bg-gradient-to-r from-brand-50 to-pink-50 border border-brand-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-900">Hromadný preklad</div>
              <div class="text-xs text-gray-600 mt-0.5">Preložia sa všetky prekladateľné polia (footer, cookie, SEO).</div>
            </div>
            <button type="button" id="translate-all-btn"
              class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-pink-500 text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50">
              <span>✨</span><span id="translate-all-label">Preložiť všetko</span>
            </button>
          </div>

          <!-- Kontakty -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-4">
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">📞 Kontakty</div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">E-mail</label>
                <input type="email" name="contact_email" value="${Utils.escape(data.contact_email || '')}"
                  placeholder="info@adlify.eu"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Telefón</label>
                <input type="tel" name="contact_phone" value="${Utils.escape(data.contact_phone || '')}"
                  placeholder="+421 905 ..."
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Adresa (1 riadok)</label>
              <input type="text" name="contact_address" value="${Utils.escape(data.contact_address || '')}"
                placeholder="Záhradnícka 12, 821 08 Bratislava"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
            </div>
          </div>

          <!-- Firma -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-4">
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">🏢 Firma (právne údaje)</div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Názov firmy</label>
              <input type="text" name="company_name" value="${Utils.escape(data.company_name || '')}"
                placeholder="Adlify s.r.o."
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">IČO</label>
                <input type="text" name="company_ico" value="${Utils.escape(data.company_ico || '')}"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">DIČ</label>
                <input type="text" name="company_dic" value="${Utils.escape(data.company_dic || '')}"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">IBAN</label>
                <input type="text" name="company_iban" value="${Utils.escape(data.company_iban || '')}"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono">
              </div>
            </div>
          </div>

          <!-- Sociálne -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-4">
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">🌐 Sociálne siete</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">LinkedIn</label>
                <input type="url" name="social_linkedin" value="${Utils.escape(data.social_linkedin || '')}"
                  placeholder="https://linkedin.com/company/adlify"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Facebook</label>
                <input type="url" name="social_facebook" value="${Utils.escape(data.social_facebook || '')}"
                  placeholder="https://facebook.com/adlify"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">Instagram</label>
                <input type="url" name="social_instagram" value="${Utils.escape(data.social_instagram || '')}"
                  placeholder="https://instagram.com/adlify"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">YouTube</label>
                <input type="url" name="social_youtube" value="${Utils.escape(data.social_youtube || '')}"
                  placeholder="https://youtube.com/@adlify"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-4">
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">📄 Footer</div>
            ${I18N.renderField('footer_tagline', data.footer_tagline, { label: 'Footer tagline (krátky popis pod logom)', type: 'textarea', rows: 2 })}
            ${I18N.renderField('footer_copyright', data.footer_copyright, { label: 'Copyright text' })}
          </div>

          <!-- Cookie / GDPR -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-4">
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">🍪 Cookie banner</div>
            ${I18N.renderField('cookie_message', data.cookie_message, { label: 'Cookie consent text', type: 'textarea', rows: 3 })}
          </div>

          <!-- SEO defaults -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-4">
            <div class="text-xs font-bold uppercase tracking-wider text-gray-500">🔍 SEO defaults</div>
            <p class="text-xs text-gray-500">Použité ako fallback pre stránky bez vlastného SEO.</p>
            ${I18N.renderField('default_seo_title', data.default_seo_title, { label: 'Default page title' })}
            ${I18N.renderField('default_seo_description', data.default_seo_description, { label: 'Default meta description', type: 'textarea', rows: 2 })}

            ${Uploader.render('default_og_image_url', 'seo', data.default_og_image_url, {
              label: 'Default OG image (sociálne sharing)',
              hint: 'PNG / JPG, ideálne 1200×630 px',
            })}
          </div>

          <div class="flex items-center gap-3 pt-2 sticky bottom-0 bg-white -mx-4 md:-mx-6 px-4 md:px-6 py-3 border-t border-gray-200">
            <button type="submit" class="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl">
              Uložiť zmeny
            </button>
          </div>
        </form>
      </div>
    `;

    I18N.bindFieldSwitchers(content);
    Uploader.bind(content);
    Blog._bindTranslateAll(content);

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.save();
    });
  },

  async save() {
    const form = document.getElementById('settings-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';

    try {
      const langFields = ['footer_tagline', 'footer_copyright', 'cookie_message', 'default_seo_title', 'default_seo_description'];
      const payload = I18N.serializeForm(form, langFields);
      payload.id = this.ID;

      // upsert (lebo riadok môže neexistovať)
      await API.upsert(this.TABLE, payload, { onConflict: 'id' });

      Utils.toast('✓ Nastavenia uložené', 'success');
    } catch (err) {
      console.error(err);
      Utils.toast('Chyba: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Uložiť zmeny';
    }
  },
};
