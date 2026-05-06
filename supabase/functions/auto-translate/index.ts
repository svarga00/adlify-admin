// Supabase Edge Function: auto-translate
// Berie text v zdrojovom jazyku a vráti preklady do požadovaných cieľových jazykov.
// Volanie z admin:
//   await supabase.functions.invoke('auto-translate', {
//     body: {
//       source_lang: 'sk',
//       targets: ['cs', 'hu', 'en', 'de'],
//       texts: { title: '...', body: '...' }   // alebo string
//     }
//   });
//
// Vráti:
//   { ok: true, translations: { cs: {...}, hu: {...}, en: {...}, de: {...} } }
//
// Required secrets:
//   - ANTHROPIC_API_KEY (už existuje pre generate-campaigns)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const LANG_NAMES: Record<string, string> = {
  sk: 'Slovak',
  cs: 'Czech',
  hu: 'Hungarian',
  en: 'English',
  de: 'German',
}

interface RequestBody {
  source_lang: string;          // napr. 'sk'
  targets: string[];            // napr. ['cs', 'hu', 'en', 'de']
  texts: Record<string, string> | string;  // jeden string ALEBO objekt {field_name: text}
  context?: string;             // voliteľný kontext pre prekladateľa (napr. "Marketing agency website")
  preserve_html?: boolean;      // ak true, neprekladaj HTML/markdown markup
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY secret')

    const body: RequestBody = await req.json()
    const {
      source_lang,
      targets,
      texts,
      context = 'Marketing agency website (Adlify) — Google Ads & Meta Ads services for SMBs in Central Europe.',
      preserve_html = false,
    } = body

    if (!source_lang || !targets || !Array.isArray(targets) || targets.length === 0) {
      throw new Error('Missing source_lang or targets')
    }
    if (!texts) {
      throw new Error('Missing texts to translate')
    }

    // Normalizácia: ak je texts string, urob z neho { _value: string }
    const isString = typeof texts === 'string'
    const textsObj: Record<string, string> = isString ? { _value: texts as string } : (texts as Record<string, string>)

    // Filter prázdnych textov
    const nonEmpty: Record<string, string> = {}
    for (const [k, v] of Object.entries(textsObj)) {
      if (v && typeof v === 'string' && v.trim().length > 0) {
        nonEmpty[k] = v
      }
    }

    if (Object.keys(nonEmpty).length === 0) {
      return new Response(
        JSON.stringify({ ok: true, translations: {} }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sourceName = LANG_NAMES[source_lang] || source_lang

    // Pre každý cieľový jazyk urobíme 1 paralelný API call
    const translations: Record<string, any> = {}

    await Promise.all(targets.map(async (target) => {
      if (target === source_lang) return  // skip

      const targetName = LANG_NAMES[target] || target

      const systemPrompt = `You are a professional translator. Translate texts from ${sourceName} to ${targetName}.

CONTEXT: ${context}

RULES:
- Preserve tone, register, and marketing voice
- Use formal/polite plural ("Vy" form in Slovak/Czech, "Sie" in German, etc.)
- Keep brand names untranslated: Adlify, Google Ads, Meta Ads, Facebook, Instagram, TikTok, YouTube, Performance Max, Klaviyo
- Keep technical terms in industry-standard form (CPA, ROAS, CTR, CPC, CPM, etc.)
- ${preserve_html ? 'PRESERVE all HTML tags, markdown formatting (**, ##, -, etc.), and inline code. Translate only the text content.' : 'Plain text — no HTML/markdown markup.'}
- Numbers, currency symbols (€), and percentages stay as-is
- Output valid JSON only, no preamble, no markdown fences`

      const userPrompt = `Translate this JSON object from ${sourceName} to ${targetName}. Return JSON with the SAME keys but translated values.

Input:
${JSON.stringify(nonEmpty, null, 2)}

Output (JSON only):`

      const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!apiResponse.ok) {
        const errText = await apiResponse.text()
        console.error(`[auto-translate] ${target} API error:`, errText)
        translations[target] = { _error: `API error: ${apiResponse.status}` }
        return
      }

      const data = await apiResponse.json()
      const responseText = data.content?.[0]?.text || ''

      // Parse JSON odpoveď (občas Claude pridá markdown fence aj keď sme zakázali)
      let parsed: any
      try {
        const cleaned = responseText.replace(/```json\s*|```\s*/g, '').trim()
        parsed = JSON.parse(cleaned)
      } catch (e) {
        console.error(`[auto-translate] ${target} JSON parse error:`, e, 'raw:', responseText)
        translations[target] = { _error: 'Invalid JSON response from translator' }
        return
      }

      // Ak vstup bol string, vráť len string
      if (isString && parsed._value) {
        translations[target] = parsed._value
      } else {
        translations[target] = parsed
      }
    }))

    return new Response(
      JSON.stringify({ ok: true, translations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[auto-translate] error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
