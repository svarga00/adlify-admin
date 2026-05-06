// js/api.js — Wrapper okolo Supabase queries
// Etapa C: prekladateľné polia sú JSONB {sk,cs,hu,en,de} — žiadny .eq('lang', ...)

window.API = {
  /**
   * Generic list query
   * @param {string} table - názov tabuľky
   * @param {object} opts - { orderBy, ascending, where }
   */
  async list(table, opts = {}) {
    const orderBy = opts.orderBy || 'sort_order';
    const ascending = opts.ascending !== false;

    let query = window.supabase.from(table).select('*');

    if (opts.where) {
      Object.entries(opts.where).forEach(([col, val]) => {
        query = query.eq(col, val);
      });
    }

    query = query.order(orderBy, { ascending, nullsFirst: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(table, id) {
    const { data, error } = await window.supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async insert(table, payload) {
    payload.updated_at = new Date().toISOString();
    const { data, error } = await window.supabase.from(table).insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(table, id, patch) {
    patch.updated_at = new Date().toISOString();
    const { data, error } = await window.supabase.from(table).update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async upsert(table, payload, opts = {}) {
    payload.updated_at = new Date().toISOString();
    const { data, error } = await window.supabase.from(table).upsert(payload, opts).select().single();
    if (error) throw error;
    return data;
  },

  async remove(table, id) {
    const { error } = await window.supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async toggle(table, id, field, currentValue) {
    return this.update(table, id, { [field]: !currentValue });
  },

  /**
   * Auto-translate cez Edge Function
   * @param {string|object} texts - string ALEBO {field_name: text}
   * @param {string} sourceLang - 'sk'
   * @param {string[]} targets - ['cs', 'hu', 'en', 'de']
   * @param {object} opts - { context, preserve_html }
   * @returns {Promise<object>} - { cs: ..., hu: ..., en: ..., de: ... }
   */
  async translate(texts, sourceLang = 'sk', targets = ['cs', 'hu', 'en', 'de'], opts = {}) {
    const { data, error } = await window.supabase.functions.invoke('auto-translate', {
      body: {
        source_lang: sourceLang,
        targets,
        texts,
        context: opts.context,
        preserve_html: opts.preserve_html,
      }
    });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || 'Translation failed');
    return data.translations || {};
  },

  /**
   * Upload obrázka do Supabase Storage (web-images bucket)
   * @param {File} file - File object z input[type=file]
   * @param {string} folder - subfolder, napr. 'clients', 'covers'
   * @returns {Promise<string>} - public URL
   */
  async uploadImage(file, folder = 'misc') {
    if (!file) throw new Error('No file provided');
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await window.supabase.storage
      .from('web-images')
      .upload(filename, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = window.supabase.storage.from('web-images').getPublicUrl(filename);
    return data.publicUrl;
  },

  /**
   * Get last build log
   */
  async getLastBuild() {
    const { data, error } = await window.supabase
      .from('web_build_log')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(1);
    if (error) return null;
    return data?.[0] || null;
  },

  /**
   * Trigger Netlify rebuild (cez Edge Function)
   */
  async triggerBuild(notes = null) {
    const { data: { user } } = await window.supabase.auth.getUser();
    const { data: log, error } = await window.supabase.from('web_build_log')
      .insert({ triggered_by: user?.id, status: 'pending', notes })
      .select()
      .single();
    if (error) throw error;

    const { data, error: fnErr } = await window.supabase.functions.invoke('trigger-web-build', {
      body: { build_log_id: log.id, notes }
    });
    if (fnErr) throw fnErr;
    return data;
  },
};

window.State = {
  activeLang: 'sk',
  buildPending: false,
  lastBuild: null,
};
