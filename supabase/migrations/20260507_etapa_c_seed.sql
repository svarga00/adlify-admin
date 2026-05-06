-- ============================================================
-- ETAPA C — Seed dáta (idempotent cez ON CONFLICT)
-- Spustiť PO migrácii 20260507_etapa_c_multilang.sql
-- ============================================================


-- ============================================================
-- TESTIMONIALS — 4 citáty z Etapa B case studies
-- ============================================================
INSERT INTO web_testimonials (id, quote, author_name, author_role, rating, sort_order)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '{"sk": "Adlify za prvý mesiac restartoval účty a do troch nás ROAS posunul z 2× na 4×. Dnes sme na 6.2× a riešime druhú vlnu rastu — expanziu do Česka. Najlepšie investičné rozhodnutie roku."}'::jsonb,
    '{"sk": "Lucia K."}'::jsonb,
    '{"sk": "Zakladateľka, Zlatka.sk", "cs": "Zakladatelka, Zlatka.sk", "hu": "Alapító, Zlatka.sk", "en": "Founder, Zlatka.sk", "de": "Gründerin, Zlatka.sk"}'::jsonb,
    5, 1
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '{"sk": "Mali sme pocit, že Meta Ads sú u nás nedotknutelné a bonsaje sa proste nedajú lepšie reklamovať. Adlify nám dokázal opak. CPA nižší o 42 % je pre nás ako roztrhnúť strop."}'::jsonb,
    '{"sk": "Tomáš H."}'::jsonb,
    '{"sk": "Founder, Bonsai Lab", "cs": "Founder, Bonsai Lab", "hu": "Founder, Bonsai Lab", "en": "Founder, Bonsai Lab", "de": "Founder, Bonsai Lab"}'::jsonb,
    5, 2
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '{"sk": "Pol roka tomu naspať som myslel, že môj e-shop je mŕtvy projekt. Adlify ma presvedčil, aby som dal ešte 90 dní. Teraz mám 4-násobok obratu."}'::jsonb,
    '{"sk": "Marek D."}'::jsonb,
    '{"sk": "Founder, NovaShop", "cs": "Founder, NovaShop", "hu": "Founder, NovaShop", "en": "Founder, NovaShop", "de": "Founder, NovaShop"}'::jsonb,
    5, 3
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '{"sk": "Adlify pochopil, že nepotrebujem viac leadov. Potrebujem lepšie. Dnes mám menej leadov, ale 7× viac biznisu z nich."}'::jsonb,
    '{"sk": "Rastislav K."}'::jsonb,
    '{"sk": "Founder, EkoDom", "cs": "Founder, EkoDom", "hu": "Founder, EkoDom", "en": "Founder, EkoDom", "de": "Founder, EkoDom"}'::jsonb,
    5, 4
  )
ON CONFLICT (id) DO UPDATE SET
  quote        = EXCLUDED.quote,
  author_name  = EXCLUDED.author_name,
  author_role  = EXCLUDED.author_role,
  sort_order   = EXCLUDED.sort_order;


-- ============================================================
-- FAQ — 8 položiek
-- ============================================================
INSERT INTO web_faq (id, category, question, answer, sort_order)
VALUES
  (
    'fa000001-0000-0000-0000-000000000001',
    'pricing',
    '{"sk": "Koľko stojí spolupráca s Adlify?"}'::jsonb,
    '{"sk": "Pracujeme v 3 plánoch: Starter (149€/mes), Growth (399€/mes) a Scale (799€/mes). V cene je správa Google a Meta Ads, reportingu a mesačná stratégia. Reklamný budget si platíte priamo platforme — vy ho ovládate."}'::jsonb,
    1
  ),
  (
    'fa000002-0000-0000-0000-000000000002',
    'pricing',
    '{"sk": "Účtujete províziu z reklamného budgetu?"}'::jsonb,
    '{"sk": "Nie. Fixný mesačný paušál bez ohľadu na to, koľko miniete na reklamu. To znamená — keď sa vám darí a chcete navýšiť budget, nezvyšuje sa vám cena za našu prácu."}'::jsonb,
    2
  ),
  (
    'fa000003-0000-0000-0000-000000000003',
    'process',
    '{"sk": "Ako dlho trvá kým uvidím prvé výsledky?"}'::jsonb,
    '{"sk": "Setup kampaní 7-14 dní (podľa plánu). Prvé optimalizácie po 2-4 týždňoch keď máme dosť dát. Stabilný ROAS typicky po 6-8 týždňoch."}'::jsonb,
    3
  ),
  (
    'fa000004-0000-0000-0000-000000000004',
    'process',
    '{"sk": "Aký je minimálny reklamný budget?"}'::jsonb,
    '{"sk": "Pre Google Ads odporúčame minimum 500-1000€/mes. Pre Meta Ads od 300€/mes. Nižšie hodnoty nedávajú algoritmom dostatok dát na učenie."}'::jsonb,
    4
  ),
  (
    'fa000005-0000-0000-0000-000000000005',
    'general',
    '{"sk": "Vlastním ja účty (Google Ads, Meta Business)?"}'::jsonb,
    '{"sk": "Áno, vždy. Účty sú na vašu firmu, my máme prístup ako agentúra. Pri ukončení spolupráce odoberieme svoj prístup a vy si ich plne ponecháte."}'::jsonb,
    5
  ),
  (
    'fa000006-0000-0000-0000-000000000006',
    'process',
    '{"sk": "Aký je spôsob výpovede zmluvy?"}'::jsonb,
    '{"sk": "Spolupráca je mesačná, výpoveď k poslednému dňu predošlého mesiaca. Bez sankcií, bez minimálnych dôb. Veríme v výsledky, nie v kontrakty."}'::jsonb,
    6
  ),
  (
    'fa000007-0000-0000-0000-000000000007',
    'technical',
    '{"sk": "Robíte aj kreatívu (grafiku, video)?"}'::jsonb,
    '{"sk": "Áno. V plánoch Growth a Scale je zahrnutých 12-24 kreatív mesačne (statické + krátke videá). Robíme na in-house designerom a copywriterom."}'::jsonb,
    7
  ),
  (
    'fa000008-0000-0000-0000-000000000008',
    'general',
    '{"sk": "S akými odvetviami pracujete?"}'::jsonb,
    '{"sk": "Špecializujeme sa na e-commerce (najmä fashion, kozmetiku, šperky), DTC značky, B2B SaaS a lokálne služby (kúrenie, stavebníctvo, gastronómia). Ale vieme efektívne pracovať aj v iných odvetviach."}'::jsonb,
    8
  )
ON CONFLICT (id) DO UPDATE SET
  category   = EXCLUDED.category,
  question   = EXCLUDED.question,
  answer     = EXCLUDED.answer,
  sort_order = EXCLUDED.sort_order;


-- ============================================================
-- PRICING — 3 plány
-- ============================================================
INSERT INTO web_pricing (slug, name, tagline, price_monthly, price_setup, features, cta_label, is_popular, sort_order)
VALUES
  (
    'starter',
    '{"sk": "Starter", "cs": "Starter", "hu": "Starter", "en": "Starter", "de": "Starter"}'::jsonb,
    '{"sk": "Pre overenie potenciálu", "cs": "Pro ověření potenciálu", "hu": "A potenciál ellenőrzéséhez", "en": "To validate potential", "de": "Um Potenzial zu validieren"}'::jsonb,
    149, 290,
    '[
      {"label": {"sk": "1 reklamná platforma (Google ALEBO Meta)"}, "included": true},
      {"label": {"sk": "Základné meranie konverzií"}, "included": true},
      {"label": {"sk": "Mesačný reporting"}, "included": true},
      {"label": {"sk": "1× mesačný call (30 min)"}, "included": true},
      {"label": {"sk": "Server-side tracking"}, "included": false},
      {"label": {"sk": "Kreatíva (statická + video)"}, "included": false}
    ]'::jsonb,
    '{"sk": "Vybrať Starter", "cs": "Vybrat Starter", "hu": "Starter választása", "en": "Choose Starter", "de": "Starter wählen"}'::jsonb,
    FALSE, 1
  ),
  (
    'growth',
    '{"sk": "Growth", "cs": "Growth", "hu": "Growth", "en": "Growth", "de": "Growth"}'::jsonb,
    '{"sk": "Pre rastúce e-shopy", "cs": "Pro rostoucí e-shopy", "hu": "Növekvő e-shopok számára", "en": "For growing e-commerce", "de": "Für wachsende E-Commerce"}'::jsonb,
    399, 590,
    '[
      {"label": {"sk": "Google + Meta Ads"}, "included": true},
      {"label": {"sk": "Server-side tracking + CAPI"}, "included": true},
      {"label": {"sk": "12 kreatív mesačne"}, "included": true},
      {"label": {"sk": "Týždenný reporting"}, "included": true},
      {"label": {"sk": "2× mesačný call (45 min)"}, "included": true},
      {"label": {"sk": "Email automation (Klaviyo)"}, "included": true}
    ]'::jsonb,
    '{"sk": "Vybrať Growth", "cs": "Vybrat Growth", "hu": "Growth választása", "en": "Choose Growth", "de": "Growth wählen"}'::jsonb,
    TRUE, 2
  ),
  (
    'scale',
    '{"sk": "Scale", "cs": "Scale", "hu": "Scale", "en": "Scale", "de": "Scale"}'::jsonb,
    '{"sk": "Pre etablovaných hráčov", "cs": "Pro zavedené hráče", "hu": "Megalapozott szereplőknek", "en": "For established players", "de": "Für etablierte Akteure"}'::jsonb,
    799, 990,
    '[
      {"label": {"sk": "Google + Meta + TikTok Ads"}, "included": true},
      {"label": {"sk": "SEO content (4 články/mes)"}, "included": true},
      {"label": {"sk": "24 kreatív mesačne"}, "included": true},
      {"label": {"sk": "Looker Studio dashboard"}, "included": true},
      {"label": {"sk": "Týždenné call (60 min)"}, "included": true},
      {"label": {"sk": "Dedikovaný account manager"}, "included": true}
    ]'::jsonb,
    '{"sk": "Vybrať Scale", "cs": "Vybrat Scale", "hu": "Scale választása", "en": "Choose Scale", "de": "Scale wählen"}'::jsonb,
    FALSE, 3
  )
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  tagline       = EXCLUDED.tagline,
  price_monthly = EXCLUDED.price_monthly,
  price_setup   = EXCLUDED.price_setup,
  features      = EXCLUDED.features,
  cta_label     = EXCLUDED.cta_label,
  is_popular    = EXCLUDED.is_popular,
  sort_order    = EXCLUDED.sort_order;


-- ============================================================
-- CLIENTS — ticker (zatiaľ len mená, logo URL doplníš v admine)
-- ============================================================
INSERT INTO web_clients (name, industry, sort_order)
VALUES
  ('Zlatka.sk',     '{"sk": "E-commerce / Šperky"}'::jsonb,             1),
  ('Bonsai Lab',    '{"sk": "DTC / Hobby"}'::jsonb,                     2),
  ('Krajčírstvo H.', '{"sk": "Local / B2C služba"}'::jsonb,             3),
  ('NovaShop',      '{"sk": "E-commerce / Fashion"}'::jsonb,            4),
  ('EkoDom',        '{"sk": "B2C / Tepelné čerpadlá"}'::jsonb,          5),
  ('TechPark',      '{"sk": "B2B SaaS / Coworking"}'::jsonb,            6)
ON CONFLICT DO NOTHING;


-- ============================================================
-- NAVIGATION — header + footer
-- ============================================================
INSERT INTO web_navigation (location, label, url, sort_order)
VALUES
  -- Header main
  ('header_main', '{"sk": "Služby", "cs": "Služby", "hu": "Szolgáltatások", "en": "Services", "de": "Dienstleistungen"}'::jsonb, '/sluzby', 1),
  ('header_main', '{"sk": "Cenník", "cs": "Ceník", "hu": "Árak", "en": "Pricing", "de": "Preise"}'::jsonb, '/cennik', 2),
  ('header_main', '{"sk": "Prípadové štúdie", "cs": "Případové studie", "hu": "Esettanulmányok", "en": "Case studies", "de": "Fallstudien"}'::jsonb, '/pripadove-studie', 3),
  ('header_main', '{"sk": "Blog", "cs": "Blog", "hu": "Blog", "en": "Blog", "de": "Blog"}'::jsonb, '/blog', 4),
  ('header_main', '{"sk": "O nás", "cs": "O nás", "hu": "Rólunk", "en": "About", "de": "Über uns"}'::jsonb, '/o-nas', 5),
  ('header_main', '{"sk": "Kontakt", "cs": "Kontakt", "hu": "Kapcsolat", "en": "Contact", "de": "Kontakt"}'::jsonb, '/kontakt', 6),

  -- Footer col 1 — Služby
  ('footer_col_1', '{"sk": "Google Ads", "cs": "Google Ads", "hu": "Google Ads", "en": "Google Ads", "de": "Google Ads"}'::jsonb, '/sluzby/google-ads', 1),
  ('footer_col_1', '{"sk": "Meta Ads", "cs": "Meta Ads", "hu": "Meta Ads", "en": "Meta Ads", "de": "Meta Ads"}'::jsonb, '/sluzby/meta-ads', 2),
  ('footer_col_1', '{"sk": "SEO", "cs": "SEO", "hu": "SEO", "en": "SEO", "de": "SEO"}'::jsonb, '/sluzby/seo', 3),
  ('footer_col_1', '{"sk": "E-mail marketing", "cs": "E-mail marketing", "hu": "E-mail marketing", "en": "Email marketing", "de": "E-Mail-Marketing"}'::jsonb, '/sluzby/email', 4),

  -- Footer col 2 — Spoločnosť
  ('footer_col_2', '{"sk": "O nás", "cs": "O nás", "hu": "Rólunk", "en": "About", "de": "Über uns"}'::jsonb, '/o-nas', 1),
  ('footer_col_2', '{"sk": "Ako to funguje", "cs": "Jak to funguje", "hu": "Hogyan működik", "en": "How it works", "de": "Wie es funktioniert"}'::jsonb, '/ako-to-funguje', 2),
  ('footer_col_2', '{"sk": "Partneri", "cs": "Partneři", "hu": "Partnerek", "en": "Partners", "de": "Partner"}'::jsonb, '/partneri', 3),
  ('footer_col_2', '{"sk": "FAQ", "cs": "FAQ", "hu": "GYIK", "en": "FAQ", "de": "FAQ"}'::jsonb, '/faq', 4),

  -- Footer col 3 — Právne
  ('footer_col_3', '{"sk": "Ochrana osobných údajov", "cs": "Ochrana osobních údajů", "hu": "Adatvédelem", "en": "Privacy policy", "de": "Datenschutz"}'::jsonb, '/ochrana-udajov', 1),
  ('footer_col_3', '{"sk": "Obchodné podmienky", "cs": "Obchodní podmínky", "hu": "Általános feltételek", "en": "Terms of service", "de": "AGB"}'::jsonb, '/obchodne-podmienky', 2),
  ('footer_col_3', '{"sk": "Cookies", "cs": "Cookies", "hu": "Cookies", "en": "Cookies", "de": "Cookies"}'::jsonb, '/cookies', 3)
ON CONFLICT DO NOTHING;


-- ============================================================
-- TRANSLATIONS — bežné UI texty
-- ============================================================
INSERT INTO web_translations (namespace, key, value, description)
VALUES
  ('common', 'submit',         '{"sk": "Odoslať", "cs": "Odeslat", "hu": "Küldés", "en": "Submit", "de": "Absenden"}'::jsonb,                'Submit button label'),
  ('common', 'cancel',         '{"sk": "Zrušiť", "cs": "Zrušit", "hu": "Mégse", "en": "Cancel", "de": "Abbrechen"}'::jsonb,                  'Cancel button'),
  ('common', 'save',           '{"sk": "Uložiť", "cs": "Uložit", "hu": "Mentés", "en": "Save", "de": "Speichern"}'::jsonb,                   'Save button'),
  ('common', 'edit',           '{"sk": "Upraviť", "cs": "Upravit", "hu": "Szerkesztés", "en": "Edit", "de": "Bearbeiten"}'::jsonb,           'Edit button'),
  ('common', 'delete',         '{"sk": "Zmazať", "cs": "Smazat", "hu": "Törlés", "en": "Delete", "de": "Löschen"}'::jsonb,                   'Delete button'),
  ('common', 'loading',        '{"sk": "Načítavam...", "cs": "Načítám...", "hu": "Betöltés...", "en": "Loading...", "de": "Lädt..."}'::jsonb, 'Loading indicator'),
  ('common', 'read_more',      '{"sk": "Čítať viac", "cs": "Číst více", "hu": "Tovább", "en": "Read more", "de": "Mehr lesen"}'::jsonb,      'Read more link'),
  ('common', 'back',           '{"sk": "Späť", "cs": "Zpět", "hu": "Vissza", "en": "Back", "de": "Zurück"}'::jsonb,                          'Back button'),
  ('forms',  'name',           '{"sk": "Meno", "cs": "Jméno", "hu": "Név", "en": "Name", "de": "Name"}'::jsonb,                              'Name field'),
  ('forms',  'email',          '{"sk": "E-mail", "cs": "E-mail", "hu": "E-mail", "en": "Email", "de": "E-Mail"}'::jsonb,                     'Email field'),
  ('forms',  'phone',          '{"sk": "Telefón", "cs": "Telefon", "hu": "Telefon", "en": "Phone", "de": "Telefon"}'::jsonb,                 'Phone field'),
  ('forms',  'message',        '{"sk": "Správa", "cs": "Zpráva", "hu": "Üzenet", "en": "Message", "de": "Nachricht"}'::jsonb,                'Message field'),
  ('forms',  'company',        '{"sk": "Firma", "cs": "Firma", "hu": "Cég", "en": "Company", "de": "Firma"}'::jsonb,                         'Company field'),
  ('errors', 'required',       '{"sk": "Povinné pole", "cs": "Povinné pole", "hu": "Kötelező mező", "en": "Required field", "de": "Pflichtfeld"}'::jsonb, 'Required field error'),
  ('errors', 'invalid_email',  '{"sk": "Neplatný e-mail", "cs": "Neplatný e-mail", "hu": "Érvénytelen e-mail", "en": "Invalid email", "de": "Ungültige E-Mail"}'::jsonb, 'Invalid email error'),
  ('errors', 'submit_failed',  '{"sk": "Nepodarilo sa odoslať. Skúste znova.", "cs": "Nepodařilo se odeslat. Zkuste to znovu.", "hu": "Nem sikerült elküldeni. Próbálja újra.", "en": "Failed to submit. Please try again.", "de": "Senden fehlgeschlagen. Bitte erneut versuchen."}'::jsonb, 'Submit error'),
  ('cta',    'free_consultation', '{"sk": "Bezplatná konzultácia", "cs": "Bezplatná konzultace", "hu": "Ingyenes konzultáció", "en": "Free consultation", "de": "Kostenlose Beratung"}'::jsonb, 'Free consultation CTA'),
  ('cta',    'get_started',    '{"sk": "Začať", "cs": "Začít", "hu": "Kezdés", "en": "Get started", "de": "Loslegen"}'::jsonb,               'Get started CTA'),
  ('cta',    'contact_us',     '{"sk": "Kontaktujte nás", "cs": "Kontaktujte nás", "hu": "Lépjen kapcsolatba", "en": "Contact us", "de": "Kontakt"}'::jsonb, 'Contact us CTA')
ON CONFLICT (namespace, key) DO UPDATE SET
  value       = EXCLUDED.value,
  description = EXCLUDED.description;


-- ============================================================
-- PAGES_CONTENT — homepage hero + manifest
-- ============================================================
INSERT INTO web_pages_content (page_slug, section_key, content, sort_order)
VALUES
  (
    'homepage', 'hero',
    '{
      "eyebrow":  {"sk": "Marketingová agentúra", "cs": "Marketingová agentura", "hu": "Marketingügynökség", "en": "Marketing agency", "de": "Marketingagentur"},
      "title":    {"sk": "Reklama, ktorá konečne", "cs": "Reklama, která konečně", "hu": "A reklám, amely végre", "en": "Advertising that finally", "de": "Werbung, die endlich"},
      "title_accent": {"sk": "predáva.", "cs": "prodává.", "hu": "elad.", "en": "sells.", "de": "verkauft."},
      "lead":     {"sk": "Spravujeme Google a Meta Ads pre e-commerce a B2B firmy v strednej Európe. Bez nezmyselných reportov. S transparentnou cenou.", "cs": "Spravujeme Google a Meta Ads pro e-commerce a B2B firmy ve střední Evropě.", "hu": "Google és Meta hirdetéseket kezelünk e-kereskedelmi és B2B cégeknek Közép-Európában.", "en": "We manage Google and Meta Ads for e-commerce and B2B businesses in Central Europe.", "de": "Wir verwalten Google und Meta Ads für E-Commerce und B2B-Unternehmen in Mitteleuropa."},
      "cta_primary": {"sk": "Bezplatná konzultácia", "cs": "Bezplatná konzultace", "hu": "Ingyenes konzultáció", "en": "Free consultation", "de": "Kostenlose Beratung"},
      "cta_secondary": {"sk": "Pozrieť prípadové štúdie", "cs": "Případové studie", "hu": "Esettanulmányok", "en": "Case studies", "de": "Fallstudien"}
    }'::jsonb,
    1
  ),
  (
    'homepage', 'manifest',
    '{
      "title": {"sk": "Marketingová agentúra na meranie. Bez výhovoriek.", "cs": "Marketingová agentura na míru. Bez výmluv.", "hu": "Mérhető marketingügynökség. Kifogások nélkül.", "en": "A marketing agency built on measurement. No excuses.", "de": "Eine messbasierte Marketingagentur. Keine Ausreden."},
      "lead":  {"sk": "Veríme číslam viac ako pocitom. Každú kampaň meriame, každý € sledujeme. Keď to nefunguje, povieme vám prečo a čo s tým robíme.", "cs": "Věříme číslům víc než pocitům.", "hu": "Jobban hiszünk a számokban, mint az érzésekben.", "en": "We believe numbers more than feelings.", "de": "Wir glauben Zahlen mehr als Gefühlen."}
    }'::jsonb,
    2
  ),
  (
    'about', 'mission',
    '{
      "title": {"sk": "Naša misia", "cs": "Naše mise", "hu": "Küldetésünk", "en": "Our mission", "de": "Unsere Mission"},
      "body":  {"sk": "Pomôcť malým a stredným firmám vyrásť cez férovo nastavený a transparentný online marketing.", "cs": "Pomoci malým a středním firmám vyrůst.", "hu": "Segíteni a kis- és középvállalkozásokat növekedni.", "en": "Help small and medium businesses grow.", "de": "Kleine und mittlere Unternehmen wachsen lassen."}
    }'::jsonb,
    1
  )
ON CONFLICT (page_slug, section_key) DO UPDATE SET
  content    = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;
