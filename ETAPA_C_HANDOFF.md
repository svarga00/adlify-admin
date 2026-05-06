# Etapa C — Handoff pre Claude Code

> Pokračujeme v prepise admin pages. Základ je hotový, treba dorobiť ostatné moduly podľa vzoru `cases.js`.

---

## Kontext

**Adlify-admin** (`https://adlify-webadmin.netlify.app`) je separátny admin panel pre správu obsahu marketingového webu **adlify-web** (`https://adlify-web-staging.netlify.app`, neskôr `adlify.eu`).

**Stack:** Vanilla JS + Tailwind CDN + Supabase + TipTap (lazy load)
**Repo:** https://github.com/svarga00/adlify-admin

## Čo je už hotové (Etapa C)

✅ **DB migrácia** (`supabase/migrations/20260507_etapa_c_multilang.sql`):
- ALTER existujúcich `web_case_studies`, `web_blog_posts`, `web_services` z TEXT → JSONB
- 9 nových tabuliek: `web_testimonials`, `web_faq`, `web_pricing`, `web_clients`, `web_settings`, `web_navigation`, `web_pages_content`, `web_translations`, `web_build_log`
- Storage bucket `web-images` + policies
- RLS pre všetky tabuľky (anon read published, auth full access)

✅ **Seed** (`supabase/migrations/20260507_etapa_c_seed.sql`):
- 4 testimonials, 8 FAQ, 3 pricing plány, 6 clients, 19 navigation linkov, 3 pages_content, 19 translations

✅ **Edge Functions:**
- `trigger-web-build` — pingne Netlify build hook + log
- `auto-translate` — Claude API preklad SK → CS/HU/EN/DE

✅ **Frontend základ:**
- `js/api.js` — refactor s `translate()`, `uploadImage()`, `triggerBuild()`
- `js/i18n.js` — kompletný multilang field renderer + translate UI button
- `js/pages/cases.js` — **KOMPLETNÝ vzor** (CRUD + i18n + KPI builder + gradient preview)
- `index.html` — registrácia `i18n.js`, odstránenie globálneho lang switcher

## Čo treba dorobiť

### 1. Page moduly (priorita podľa dôležitosti)

Použi `js/pages/cases.js` ako **šablónu**. Každý page modul má rovnaký pattern: `render()`, `row()`, `openEditor()`, `save()`, `toggleVisibility()`, `remove()`.

**Lang fields** sa renderujú cez `I18N.renderField(name, value, opts)`. Po renderovaní volaj `I18N.bindFieldSwitchers(drawerEl)`. Pri save volaj `I18N.serializeForm(form, langFieldsArray)`.

#### `js/pages/blog.js` — `web_blog_posts`
- Lang fields: `category`, `title`, `excerpt`, `body`, `author_name`, `author_role`
- Plain fields: `slug`, `cover_gradient`, `cover_image_url`, `author_initials`, `is_featured`, `published`, `published_at`, `read_time_min`, `sort_order`
- `body` je markdown — použiť `<textarea>` (large rows=12) ALEBO neskôr TipTap (volá sa cez `js/tiptap.js`)
- Image upload pre `cover_image_url` cez `API.uploadImage(file, 'blog-covers')`

#### `js/pages/services.js` — `web_services`
- Lang fields: `title`, `short_desc`, `hero_lead`, `pricing_note`
- Plain fields: `slug`, `icon_svg` (textarea s SVG paths), `published`, `sort_order`
- **Komplexné JSONB polia** (per-lang interne):
  - `specs` — array `[{label: {sk,cs,...}, value: {sk,cs,...}}]` (4 položky štandardne)
  - `what_you_get` — array of lang JSONB strings — pole musí byť rastúce/zmenšiteľné
  - `process_steps` — array `[{title: lang_jsonb, desc: lang_jsonb}]`
  - `faq` — array `[{q: lang_jsonb, a: lang_jsonb}]`
- Pre tieto JSONB polia sprav samostatný "row builder" (ako `kpi-list` v `cases.js`)

#### `js/pages/testimonials.js` — `web_testimonials`
- Lang fields: `quote`, `author_name`, `author_role`
- Plain fields: `author_logo_url` (image upload!), `rating` (1-5), `is_published`, `sort_order`
- Image upload cez `API.uploadImage(file, 'testimonial-logos')`

#### `js/pages/faq.js` — `web_faq`
- Lang fields: `question`, `answer`
- Plain fields: `category` (select: 'general', 'pricing', 'process', 'technical'), `is_published`, `sort_order`
- Jednoduchý — používa len 2 lang fields

#### `js/pages/pricing.js` — `web_pricing`
- Lang fields: `name`, `tagline`, `cta_label`
- Plain fields: `slug`, `price_monthly` (number), `price_setup` (number), `is_popular` (bool), `is_published`, `sort_order`
- **Komplexné**: `features` JSONB array `[{label: lang_jsonb, included: bool}]` — row builder

#### `js/pages/clients.js` — `web_clients` (ticker s logmi)
- Lang fields: `industry`
- Plain fields: `name` (NIE prekladá sa — brand name), `logo_url` (image upload!), `website_url`, `is_published`, `sort_order`
- Jednoduchý CRUD

#### `js/pages/navigation.js` — `web_navigation`
- Lang fields: `label`
- Plain fields: `location` (select: 'header_main', 'footer_col_1', 'footer_col_2', 'footer_col_3'), `url`, `is_external` (bool), `open_in_new_tab` (bool), `sort_order`, `is_published`
- Group by `location` v render (header / footer columns)

#### `js/pages/settings.js` — `web_settings` (single row, id='global')
- **Špeciálny modul** — neexistuje list, len jeden formulár
- `render()` načíta `await API.get('web_settings', 'global')`
- `save()` volá `API.update('web_settings', 'global', payload)`
- Lang fields: `footer_tagline`, `footer_copyright`, `cookie_message`, `default_seo_title`, `default_seo_description`
- Plain fields: `contact_email`, `contact_phone`, `contact_address`, `company_name`, `company_ico`, `company_dic`, `company_iban`, `social_*`, `default_og_image_url`, `netlify_site_id`

#### `js/pages/pages_content.js` — `web_pages_content`
- **Najkomplikovanejší** — záznamy majú slobodný JSONB `content` (môže obsahovať ľubovoľné lang polia)
- Plain fields: `page_slug` (text), `section_key` (text), `sort_order`
- Pre `content` JSONB: dynamic field builder kde admin vie pridávať/odoberať pole-krát-jazykov
- Alternatíva: dropdown s pre-defined templates (homepage hero má fixné polia: eyebrow, title, title_accent, lead, cta_primary, cta_secondary)

#### `js/pages/translations.js` — `web_translations`
- Lang fields: `value` (1 lang field)
- Plain fields: `namespace` (text), `key` (text), `description` (text)
- Bulk edit cez tabuľku — riadky sú namespace+key, stĺpce sú jazyky
- Jednoduchší ako iné, lebo má len 1 lang field

#### `js/pages/dashboard.js` — REVISIT
- Aktuálne ukazuje statistiky z `web_testimonials` (Etapa A schémy)
- Treba prepísať na nové tabuľky: počet `web_case_studies`, `web_blog_posts`, `web_services`, `web_testimonials`
- Pridať: posledný build log z `web_build_log`, info kedy sa publikovalo (`web_settings.last_published_at`)

### 2. Adlify-web (Astro) update — REPO `svarga00/adlify-web`

**Aktuálne:** Astro fetchuje len SK content z `web_case_studies`, `web_blog_posts`, `web_services` ako TEXT polia.

**Po Etape C:** tieto polia sú teraz JSONB. Potrebné zmeny:

1. **`src/lib/content.ts`** — typy zmeniť tak že prekladateľné polia sú objects:
   ```ts
   export interface CaseStudy {
     name: { sk: string; cs?: string; hu?: string; en?: string; de?: string };
     // ... ostatné prekladateľné polia
   }
   ```

2. **`src/lib/i18n.ts`** (NOVÝ) — helper `getLocalized(field, lang)` rovnaký ako v admin `I18N.t()`

3. **5 jazykových routes:**
   - `/` (default sk)
   - `/cs/*`, `/hu/*`, `/en/*`, `/de/*`
   - V Astro toto cez `getStaticPaths` ktorý generuje per-lang
   - `astro.config.mjs` pridať i18n config

4. **Pridať fetchy pre nové tabuľky:**
   - `fetchAllTestimonials()` (homepage carousel)
   - `fetchAllFAQ()` (/faq stránka)
   - `fetchPricingPlans()` (/cennik)
   - `fetchAllClients()` (ticker)
   - `fetchSettings()` (footer, kontakty)
   - `fetchNavigation(location)` (header/footer linky)
   - `fetchPageContent(slug, section)` (homepage hero, manifest)
   - `fetchTranslations()` (UI texty)

5. **Hreflang + sitemap:**
   - V layout pridať `<link rel="alternate" hreflang="sk" href="https://adlify.eu/...">`, atď.
   - Sitemap rozšíriť o všetky lang variants (cez @astrojs/sitemap config)

### 3. Netlify Build Hook setup

V Netlify dashboard pre `adlify-web` site:
- Site settings → Build & deploy → Build hooks → Add build hook
- Name: "Admin trigger"
- Branch: main
- Skopíruj URL (formát: `https://api.netlify.com/build_hooks/abc123def456`)

V Supabase Edge Functions → trigger-web-build → Manage secrets:
- Pridať `NETLIFY_BUILD_HOOK_URL` = ten URL

## Konvencie ktoré treba dodržať

1. **Slovak v komentároch a UI texte** (množné číslo, nikdy "som z agentúry")
2. **Žiadne "AI", "AI-powered"** v UI textoch viditeľných adminovi/klientovi
3. **Modul pattern:** `window.NazovModulu = { TABLE, render(), row(), openEditor(), save(), ... }`
4. **Tailwind utility classes** — žiadny custom CSS okrem `css/app.css`
5. **Toast notifikácie** cez `Utils.toast(msg, 'success'|'error'|'warning')`
6. **Drawer** pre editor cez `Utils.openDrawer(title)` / `Utils.closeDrawer()`
7. **Confirm dialógy** zatiaľ cez native `confirm()` (môže sa prerobiť)

## Ako otestovať `cases.js`

1. Spusti migráciu + seed v Supabase Dashboard:
   - `supabase/migrations/20260507_etapa_c_multilang.sql`
   - `supabase/migrations/20260507_etapa_c_seed.sql`
2. Deploy `trigger-web-build` a `auto-translate` Edge Functions cez Supabase Dashboard
3. Pridaj secret `NETLIFY_BUILD_HOOK_URL` v Edge Functions secrets
4. Push admin repo zmeny
5. Otvor `adlify-webadmin.netlify.app` → prihlás sa → Prípadové štúdie
6. Test: pridaj novú prípadovku, klikni "✨ Preložiť" na nejakom poli, overi že sa preloží
7. Test: klikni "Publikovať" — má spustiť Netlify rebuild

## Otvorené otázky / TODO

- [ ] TipTap WYSIWYG integrácia pre `body` (blog) a `challenge/approach/results` (cases) — `js/tiptap.js` už existuje, len ho zapojiť do editorov
- [ ] Image uploader komponent — refaktorovať z inline kódu vo forms na reusable komponent
- [ ] Per-language preview — tlačidlo "Pozrieť ako vidí klient v CS" otvorí web v novom okne
- [ ] Astro multi-lang routing setup
- [ ] Build hook URL nastavenie
- [ ] Reálne testimonial logá nahrať
