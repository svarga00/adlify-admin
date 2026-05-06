-- ============================================================
-- ETAPA C — Multilang admin schéma
-- ============================================================
-- Konvencia:
--   1) CREATE TABLE IF NOT EXISTS
--   2) ALTER TABLE ADD COLUMN IF NOT EXISTS / TYPE konverzie
--   3) Indexy / RLS / Policies
--   4) Triggers
--   5) Storage bucket
--
-- JSONB lang convention pre prekladateľné polia:
--   { "sk": "Slovenský text", "cs": "...", "hu": "...", "en": "...", "de": "..." }
-- ============================================================


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
-- Vytvorí JSONB s len SK kľúčom — pre ALTER TABLE konverziu z TEXT
CREATE OR REPLACE FUNCTION text_to_lang_jsonb(t TEXT) RETURNS JSONB AS $$
BEGIN
  IF t IS NULL OR t = '' THEN
    RETURN '{}'::jsonb;
  END IF;
  RETURN jsonb_build_object('sk', t);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger funkcia (znovapoužitá z Etapy B)
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 1) ALTER existujúcich Etapa B tabuliek: TEXT → JSONB
-- ============================================================
-- web_case_studies
ALTER TABLE web_case_studies
  ALTER COLUMN tag             TYPE JSONB USING text_to_lang_jsonb(tag),
  ALTER COLUMN name            TYPE JSONB USING text_to_lang_jsonb(name),
  ALTER COLUMN summary         TYPE JSONB USING text_to_lang_jsonb(summary),
  ALTER COLUMN metric_a_label  TYPE JSONB USING text_to_lang_jsonb(metric_a_label),
  ALTER COLUMN metric_a_value  TYPE JSONB USING text_to_lang_jsonb(metric_a_value),
  ALTER COLUMN metric_b_label  TYPE JSONB USING text_to_lang_jsonb(metric_b_label),
  ALTER COLUMN metric_b_value  TYPE JSONB USING text_to_lang_jsonb(metric_b_value),
  ALTER COLUMN hero_subtitle   TYPE JSONB USING text_to_lang_jsonb(hero_subtitle),
  ALTER COLUMN industry        TYPE JSONB USING text_to_lang_jsonb(industry),
  ALTER COLUMN duration        TYPE JSONB USING text_to_lang_jsonb(duration),
  ALTER COLUMN budget          TYPE JSONB USING text_to_lang_jsonb(budget),
  ALTER COLUMN challenge       TYPE JSONB USING text_to_lang_jsonb(challenge),
  ALTER COLUMN approach        TYPE JSONB USING text_to_lang_jsonb(approach),
  ALTER COLUMN results         TYPE JSONB USING text_to_lang_jsonb(results),
  ALTER COLUMN testimonial     TYPE JSONB USING text_to_lang_jsonb(testimonial),
  ALTER COLUMN testimonial_by  TYPE JSONB USING text_to_lang_jsonb(testimonial_by);
-- ponechať ako TEXT[]: services_used (technické názvy nie sú prekladateľné)
-- ponechať ako JSONB: kpis (už je štruktúrovaný)
-- ponechať ako TEXT: slug, category, cover_gradient, client_logo_url

-- web_blog_posts
ALTER TABLE web_blog_posts
  ALTER COLUMN category        TYPE JSONB USING text_to_lang_jsonb(category),
  ALTER COLUMN title           TYPE JSONB USING text_to_lang_jsonb(title),
  ALTER COLUMN excerpt         TYPE JSONB USING text_to_lang_jsonb(excerpt),
  ALTER COLUMN body            TYPE JSONB USING text_to_lang_jsonb(body),
  ALTER COLUMN author_name     TYPE JSONB USING text_to_lang_jsonb(author_name),
  ALTER COLUMN author_role     TYPE JSONB USING text_to_lang_jsonb(author_role);
-- ponechať ako TEXT: slug, cover_gradient, cover_image_url, author_initials

-- web_services
ALTER TABLE web_services
  ALTER COLUMN title           TYPE JSONB USING text_to_lang_jsonb(title),
  ALTER COLUMN short_desc      TYPE JSONB USING text_to_lang_jsonb(short_desc),
  ALTER COLUMN hero_lead       TYPE JSONB USING text_to_lang_jsonb(hero_lead),
  ALTER COLUMN pricing_note    TYPE JSONB USING text_to_lang_jsonb(pricing_note);
-- specs, what_you_get, process_steps, faq sú už JSONB/array — admin ich bude editovať per-lang interne


-- ============================================================
-- 2) NOVÉ TABUĽKY
-- ============================================================

-- TESTIMONIALS — citáty na homepage
CREATE TABLE IF NOT EXISTS web_testimonials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Prekladateľné polia (JSONB lang)
  quote           JSONB NOT NULL DEFAULT '{}'::jsonb,        -- citát
  author_name     JSONB NOT NULL DEFAULT '{}'::jsonb,        -- meno autora (môže byť rovnaké, ale aj prekladané pre rôzne trhy)
  author_role     JSONB NOT NULL DEFAULT '{}'::jsonb,        -- pozícia/firma
  -- Statické polia
  author_logo_url TEXT,                                      -- logo firmy (Supabase Storage URL)
  rating          INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FAQ — otázky a odpovede
CREATE TABLE IF NOT EXISTS web_faq (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        TEXT NOT NULL DEFAULT 'general',           -- 'general', 'pricing', 'process', 'technical'
  question        JSONB NOT NULL DEFAULT '{}'::jsonb,
  answer          JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRICING — plány v cenníku
CREATE TABLE IF NOT EXISTS web_pricing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,                      -- 'starter', 'growth', 'scale'
  name            JSONB NOT NULL DEFAULT '{}'::jsonb,        -- "Starter" / "Growth" / "Scale"
  tagline         JSONB NOT NULL DEFAULT '{}'::jsonb,        -- "Pre začiatočníkov"
  price_monthly   INTEGER NOT NULL DEFAULT 0,                -- v EUR (bez DPH)
  price_setup     INTEGER NOT NULL DEFAULT 0,                -- jednorazový setup poplatok
  features        JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{ "label": {...}, "included": true }, ...]
  cta_label       JSONB NOT NULL DEFAULT '{}'::jsonb,        -- "Vybrať Starter"
  is_popular      BOOLEAN NOT NULL DEFAULT FALSE,            -- "Najpopulárnejšie" badge
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLIENTS — ticker partnerov / klientov (loga)
CREATE TABLE IF NOT EXISTS web_clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                             -- "Zlatka.sk" — neprekladá sa, ide o brand name
  industry        JSONB NOT NULL DEFAULT '{}'::jsonb,        -- "E-commerce" — opis sa prekladá
  logo_url        TEXT,                                      -- URL z Supabase Storage
  website_url     TEXT,                                      -- voliteľný link na ich web
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SETTINGS — globálne nastavenia (footer, kontakty, social)
-- Single-row pattern: vždy len 1 riadok s id='global'
CREATE TABLE IF NOT EXISTS web_settings (
  id              TEXT PRIMARY KEY DEFAULT 'global',
  -- Kontakty (statické)
  contact_email           TEXT,
  contact_phone           TEXT,
  contact_address         TEXT,
  -- Firma (statické — IČO/DIČ sa neprekladá)
  company_name            TEXT,
  company_ico             TEXT,
  company_dic             TEXT,
  company_iban            TEXT,
  -- Sociálne siete
  social_linkedin         TEXT,
  social_facebook         TEXT,
  social_instagram        TEXT,
  social_youtube          TEXT,
  -- Footer texty (prekladateľné)
  footer_tagline          JSONB NOT NULL DEFAULT '{}'::jsonb,
  footer_copyright        JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Cookie / GDPR (prekladateľné)
  cookie_message          JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- SEO defaults
  default_seo_title       JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_seo_description JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_og_image_url    TEXT,
  -- Build/deploy
  netlify_site_id         TEXT,
  last_published_at       TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NAVIGATION — header + footer linky
CREATE TABLE IF NOT EXISTS web_navigation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location        TEXT NOT NULL,                             -- 'header_main', 'header_secondary', 'footer_col_1', 'footer_col_2', 'footer_col_3'
  label           JSONB NOT NULL DEFAULT '{}'::jsonb,        -- "Služby"
  url             TEXT NOT NULL,                             -- "/sluzby" alebo "https://..."
  is_external     BOOLEAN NOT NULL DEFAULT FALSE,            -- target="_blank" + rel
  open_in_new_tab BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PAGES_CONTENT — sekcie statických stránok (homepage hero, manifest, atď.)
CREATE TABLE IF NOT EXISTS web_pages_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug       TEXT NOT NULL,                             -- 'homepage', 'about', 'how_it_works'
  section_key     TEXT NOT NULL,                             -- 'hero', 'manifest', 'calculator_intro', 'process'
  -- Prekladateľné polia (slobodná štruktúra cez JSONB)
  content         JSONB NOT NULL DEFAULT '{}'::jsonb,        -- { "title": {...}, "subtitle": {...}, "cta": {...} }
  sort_order      INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page_slug, section_key)
);

-- TRANSLATIONS — UI texty (button labels, error messages, ...)
CREATE TABLE IF NOT EXISTS web_translations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace       TEXT NOT NULL,                             -- 'common', 'forms', 'errors', 'buttons'
  key             TEXT NOT NULL,                             -- 'submit', 'cancel', 'required_field'
  value           JSONB NOT NULL DEFAULT '{}'::jsonb,        -- prekladaný text
  description     TEXT,                                      -- ku čomu sa to používa (pre prekladateľa)
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(namespace, key)
);

-- BUILD LOG — audit trail rebuild trigger-ov
CREATE TABLE IF NOT EXISTS web_build_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by    UUID REFERENCES auth.users(id),
  triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'pending',           -- 'pending', 'triggered', 'success', 'failed'
  hook_response   JSONB,
  error_message   TEXT,
  notes           TEXT
);


-- ============================================================
-- 3) INDEXY
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_web_testimonials_published   ON web_testimonials(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_web_faq_published            ON web_faq(is_published, category, sort_order);
CREATE INDEX IF NOT EXISTS idx_web_pricing_published        ON web_pricing(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_web_clients_published        ON web_clients(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_web_navigation_location      ON web_navigation(location, sort_order);
CREATE INDEX IF NOT EXISTS idx_web_pages_content_slug       ON web_pages_content(page_slug, sort_order);
CREATE INDEX IF NOT EXISTS idx_web_translations_ns_key      ON web_translations(namespace, key);
CREATE INDEX IF NOT EXISTS idx_web_build_log_triggered_at   ON web_build_log(triggered_at DESC);


-- ============================================================
-- 4) TRIGGERS — auto-update updated_at
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at ON web_testimonials;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON web_testimonials
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON web_faq;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON web_faq
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON web_pricing;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON web_pricing
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON web_clients;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON web_clients
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON web_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON web_settings
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON web_navigation;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON web_navigation
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON web_pages_content;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON web_pages_content
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON web_translations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON web_translations
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();


-- ============================================================
-- 5) RLS — policies
-- ============================================================
-- Anonymný (web build) — read-only pre published záznamy
-- Authenticated (admin) — full access

ALTER TABLE web_testimonials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_faq            ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_pricing        ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_navigation     ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_pages_content  ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_translations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_build_log      ENABLE ROW LEVEL SECURITY;

-- Anon SELECT (read-only)
DROP POLICY IF EXISTS "anon_read_testimonials" ON web_testimonials;
CREATE POLICY "anon_read_testimonials" ON web_testimonials
  FOR SELECT TO anon USING (is_published = TRUE);

DROP POLICY IF EXISTS "anon_read_faq" ON web_faq;
CREATE POLICY "anon_read_faq" ON web_faq
  FOR SELECT TO anon USING (is_published = TRUE);

DROP POLICY IF EXISTS "anon_read_pricing" ON web_pricing;
CREATE POLICY "anon_read_pricing" ON web_pricing
  FOR SELECT TO anon USING (is_published = TRUE);

DROP POLICY IF EXISTS "anon_read_clients" ON web_clients;
CREATE POLICY "anon_read_clients" ON web_clients
  FOR SELECT TO anon USING (is_published = TRUE);

DROP POLICY IF EXISTS "anon_read_settings" ON web_settings;
CREATE POLICY "anon_read_settings" ON web_settings
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "anon_read_navigation" ON web_navigation;
CREATE POLICY "anon_read_navigation" ON web_navigation
  FOR SELECT TO anon USING (is_published = TRUE);

DROP POLICY IF EXISTS "anon_read_pages_content" ON web_pages_content;
CREATE POLICY "anon_read_pages_content" ON web_pages_content
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "anon_read_translations" ON web_translations;
CREATE POLICY "anon_read_translations" ON web_translations
  FOR SELECT TO anon USING (TRUE);

-- Authenticated FULL — admin
DROP POLICY IF EXISTS "auth_full_testimonials" ON web_testimonials;
CREATE POLICY "auth_full_testimonials" ON web_testimonials
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_full_faq" ON web_faq;
CREATE POLICY "auth_full_faq" ON web_faq
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_full_pricing" ON web_pricing;
CREATE POLICY "auth_full_pricing" ON web_pricing
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_full_clients" ON web_clients;
CREATE POLICY "auth_full_clients" ON web_clients
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_full_settings" ON web_settings;
CREATE POLICY "auth_full_settings" ON web_settings
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_full_navigation" ON web_navigation;
CREATE POLICY "auth_full_navigation" ON web_navigation
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_full_pages_content" ON web_pages_content;
CREATE POLICY "auth_full_pages_content" ON web_pages_content
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_full_translations" ON web_translations;
CREATE POLICY "auth_full_translations" ON web_translations
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_full_build_log" ON web_build_log;
CREATE POLICY "auth_full_build_log" ON web_build_log
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);


-- ============================================================
-- 6) STORAGE BUCKET pre web-images
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'web-images',
  'web-images',
  TRUE,
  10485760,  -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public            = EXCLUDED.public,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS
DROP POLICY IF EXISTS "anon_read_web_images" ON storage.objects;
CREATE POLICY "anon_read_web_images" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'web-images');

DROP POLICY IF EXISTS "auth_upload_web_images" ON storage.objects;
CREATE POLICY "auth_upload_web_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'web-images');

DROP POLICY IF EXISTS "auth_update_web_images" ON storage.objects;
CREATE POLICY "auth_update_web_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'web-images')
  WITH CHECK (bucket_id = 'web-images');

DROP POLICY IF EXISTS "auth_delete_web_images" ON storage.objects;
CREATE POLICY "auth_delete_web_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'web-images');


-- ============================================================
-- 7) DEFAULT settings row
-- ============================================================
INSERT INTO web_settings (id, contact_email, footer_copyright, footer_tagline)
VALUES (
  'global',
  'info@adlify.eu',
  '{"sk": "© 2026 Adlify. Všetky práva vyhradené.", "cs": "© 2026 Adlify. Všechna práva vyhrazena.", "hu": "© 2026 Adlify. Minden jog fenntartva.", "en": "© 2026 Adlify. All rights reserved.", "de": "© 2026 Adlify. Alle Rechte vorbehalten."}'::jsonb,
  '{"sk": "Marketingová agentúra pre malé a stredné firmy.", "cs": "Marketingová agentura pro malé a střední firmy.", "hu": "Marketingügynökség kis- és középvállalkozások számára.", "en": "Marketing agency for small and medium businesses.", "de": "Marketingagentur für kleine und mittlere Unternehmen."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
