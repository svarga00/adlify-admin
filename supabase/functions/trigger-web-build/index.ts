// Supabase Edge Function: trigger-web-build
// Pingne Netlify build hook a aktualizuje web_build_log
//
// Required secrets (Supabase Dashboard → Edge Functions → Manage secrets):
//   - NETLIFY_BUILD_HOOK_URL: napr. https://api.netlify.com/build_hooks/abc123def456
//
// Volanie z admin (cez supabase.functions.invoke):
//   await supabase.functions.invoke('trigger-web-build', { body: { build_log_id: 'uuid' } });

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const NETLIFY_BUILD_HOOK_URL = Deno.env.get('NETLIFY_BUILD_HOOK_URL')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!NETLIFY_BUILD_HOOK_URL) {
      throw new Error('Missing NETLIFY_BUILD_HOOK_URL secret. Pridaj v Supabase → Edge Functions → Secrets.')
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase env vars')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // build_log_id je voliteľný — admin si ho vytvorí pred volaním a my ho update-ujeme
    const { build_log_id, notes } = await req.json().catch(() => ({}))

    let logId = build_log_id

    // Ak nepríde existujúci log_id, vytvoríme nový
    if (!logId) {
      const { data: log, error } = await supabase
        .from('web_build_log')
        .insert({ status: 'pending', notes: notes || 'Triggered via Edge Function' })
        .select()
        .single()

      if (error) throw new Error(`Cannot create build log: ${error.message}`)
      logId = log.id
    }

    // Pingni Netlify build hook
    const hookResponse = await fetch(NETLIFY_BUILD_HOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger_title: notes || `Admin publish at ${new Date().toISOString()}`,
      }),
    })

    let responseBody: any = null
    try {
      responseBody = await hookResponse.json()
    } catch {
      responseBody = { status: hookResponse.status, ok: hookResponse.ok }
    }

    if (!hookResponse.ok) {
      // Update log s chybou
      await supabase
        .from('web_build_log')
        .update({
          status: 'failed',
          hook_response: responseBody,
          error_message: `Netlify hook returned ${hookResponse.status}`,
        })
        .eq('id', logId)

      throw new Error(`Netlify build hook failed: HTTP ${hookResponse.status}`)
    }

    // Update log: triggered (Netlify postaví ďalej v pozadí)
    await supabase
      .from('web_build_log')
      .update({
        status: 'triggered',
        hook_response: responseBody,
      })
      .eq('id', logId)

    // Update settings: last_published_at
    await supabase
      .from('web_settings')
      .update({ last_published_at: new Date().toISOString() })
      .eq('id', 'global')

    return new Response(
      JSON.stringify({ ok: true, build_log_id: logId, hook_response: responseBody }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[trigger-web-build] error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
