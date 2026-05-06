// js/api.js — Wrapper okolo Supabase queries

window.API = {
  /**
   * Generic list query for translatable tables
   * Returns rows for given lang, ordered by sort_order
   */
  async list(table, opts = {}) {
    const lang = opts.lang || State.activeLang;
    const orderBy = opts.orderBy || 'sort_order';
    const ascending = opts.ascending !== false;

    let query = window.supabase.from(table).select('*');

    // Most translatable tables have lang column
    if (opts.useLang !== false) {
      query = query.eq('lang', lang);
    }

    // Apply additional filters
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
   * Trigger Netlify rebuild (uses Edge Function)
   */
  async triggerBuild() {
    const { data: { user } } = await window.supabase.auth.getUser();
    const { data: log, error } = await window.supabase.from('web_build_log')
      .insert({ triggered_by: user?.id, status: 'pending' })
      .select()
      .single();
    if (error) throw error;

    const { data, error: fnErr } = await window.supabase.functions.invoke('trigger-web-build', {
      body: { build_log_id: log.id }
    });
    if (fnErr) throw fnErr;
    return log;
  },
};

// Global state
window.State = {
  activeLang: 'sk',
  buildPending: false,
  lastBuild: null,
};
