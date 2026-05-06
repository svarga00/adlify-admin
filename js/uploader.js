// js/uploader.js — Reusable image uploader pre admin formuláre
// Použitie:
//   <div data-image-upload data-folder="blog-covers" data-name="cover_image_url" data-current="https://..."></div>
// Po renderi formulára volaj:
//   Uploader.bind(rootEl);
// Pri serialize použiť input[name="cover_image_url"] ktorý sa automaticky aktualizuje.

window.Uploader = {
  /**
   * Renderuje image uploader UI. Vráti HTML string ktorý vložíš do form template.
   * @param {string} name - názov form field (napr. 'cover_image_url')
   * @param {string} folder - subfolder v Storage (napr. 'blog-covers', 'testimonial-logos')
   * @param {string} currentUrl - aktuálna URL (alebo null)
   * @param {object} opts - { label, hint }
   */
  render(name, folder, currentUrl = '', opts = {}) {
    const label = opts.label || 'Obrázok';
    const hint = opts.hint || 'PNG / JPG / WebP / SVG, max 10 MB. Pretiahni súbor alebo klikni na upload.';

    return `
      <div class="image-uploader" data-image-upload data-folder="${Utils.escape(folder)}" data-name="${Utils.escape(name)}">
        <label class="block text-xs font-semibold text-gray-700 uppercase mb-2">${Utils.escape(label)}</label>

        <input type="hidden" name="${Utils.escape(name)}" value="${Utils.escape(currentUrl)}">

        <div class="upload-zone border-2 border-dashed border-gray-300 rounded-xl p-4 transition hover:border-brand-400 hover:bg-brand-50/30">
          <div class="upload-preview ${currentUrl ? '' : 'hidden'} mb-3">
            <img src="${Utils.escape(currentUrl)}" alt="" class="max-h-32 rounded-lg border border-gray-200 bg-white object-contain">
            <button type="button" data-remove class="mt-2 text-xs font-semibold text-red-600 hover:text-red-700">Odstrániť</button>
          </div>

          <div class="upload-actions ${currentUrl ? 'hidden' : ''} flex flex-col items-center justify-center py-4 gap-2">
            <div class="text-sm text-gray-600 text-center">${Utils.escape(hint)}</div>
            <div class="flex items-center gap-2">
              <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg transition">
                <span>📎</span><span>Vybrať súbor</span>
                <input type="file" accept="image/*" class="hidden" data-file-input>
              </label>
              <span class="text-xs text-gray-400">alebo</span>
              <button type="button" data-url-toggle class="text-sm font-semibold text-brand-600 hover:text-brand-700">
                vložiť URL
              </button>
            </div>
            <div class="upload-url hidden w-full mt-2">
              <div class="flex gap-2">
                <input type="url" placeholder="https://..." data-url-input
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <button type="button" data-url-confirm class="px-3 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg">Použiť</button>
              </div>
            </div>
          </div>

          <div class="upload-status hidden text-sm text-gray-600 text-center py-2"></div>
        </div>
      </div>
    `;
  },

  /**
   * Bind upload handlers — volaj po renderingu formulára
   */
  bind(rootEl = document) {
    const uploaders = rootEl.querySelectorAll('[data-image-upload]');
    uploaders.forEach(el => this._bindOne(el));
  },

  _bindOne(el) {
    const folder = el.dataset.folder;
    const hiddenInput = el.querySelector('input[type="hidden"]');
    const preview = el.querySelector('.upload-preview');
    const previewImg = preview.querySelector('img');
    const actions = el.querySelector('.upload-actions');
    const fileInput = el.querySelector('[data-file-input]');
    const urlToggle = el.querySelector('[data-url-toggle]');
    const urlSection = el.querySelector('.upload-url');
    const urlInput = el.querySelector('[data-url-input]');
    const urlConfirm = el.querySelector('[data-url-confirm]');
    const removeBtn = el.querySelector('[data-remove]');
    const status = el.querySelector('.upload-status');
    const zone = el.querySelector('.upload-zone');

    const setUrl = (url) => {
      hiddenInput.value = url;
      previewImg.src = url;
      preview.classList.remove('hidden');
      actions.classList.add('hidden');
      status.classList.add('hidden');
    };

    const reset = () => {
      hiddenInput.value = '';
      previewImg.src = '';
      preview.classList.add('hidden');
      actions.classList.remove('hidden');
      urlSection.classList.add('hidden');
      urlInput.value = '';
    };

    const showStatus = (text, type = 'info') => {
      status.classList.remove('hidden');
      status.textContent = text;
      status.classList.toggle('text-red-600', type === 'error');
      status.classList.toggle('text-emerald-600', type === 'success');
    };

    const uploadFile = async (file) => {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        Utils.toast('Súbor je väčší ako 10 MB', 'error');
        return;
      }
      showStatus(`Nahrávam ${file.name}...`);
      try {
        const url = await API.uploadImage(file, folder);
        setUrl(url);
        Utils.toast('✓ Obrázok nahratý', 'success');
      } catch (err) {
        console.error('Upload error:', err);
        showStatus('Upload zlyhal: ' + err.message, 'error');
        Utils.toast('Upload zlyhal: ' + err.message, 'error');
      }
    };

    // File input change
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      fileInput.value = '';  // reset aby fungoval re-upload
    });

    // Drag & drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('border-brand-500', 'bg-brand-50');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('border-brand-500', 'bg-brand-50');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('border-brand-500', 'bg-brand-50');
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) uploadFile(file);
    });

    // URL input toggle
    urlToggle?.addEventListener('click', () => {
      urlSection.classList.toggle('hidden');
      if (!urlSection.classList.contains('hidden')) urlInput.focus();
    });

    urlConfirm?.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) return;
      if (!/^https?:\/\//.test(url)) {
        Utils.toast('URL musí začínať http:// alebo https://', 'warning');
        return;
      }
      setUrl(url);
    });

    urlInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        urlConfirm.click();
      }
    });

    // Remove button
    removeBtn?.addEventListener('click', () => {
      if (!confirm('Odstrániť obrázok? (V Storage zostane, môžeš ho použiť znovu cez URL.)')) return;
      reset();
    });
  },
};
