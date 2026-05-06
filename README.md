# Adlify Admin

Single-page admin aplikácia pre správu obsahu marketingového webu **adlify.eu**.

## Stack

- HTML + Vanilla JS (žiadny build, žiadny framework)
- Tailwind CSS (CDN)
- Supabase (Auth + Database)
- TipTap WYSIWYG editor (lazy load pre blog/cases — Fáza 3)

## Lokálne vývoj

```bash
# Stačí lokálny statický server, napr.:
python3 -m http.server 8080
# alebo
npx serve .
```

Otvor http://localhost:8080

## Setup

1. Skopíruj `js/config.example.js` → `js/config.js` (alebo uprav existujúci)
2. Vlož tvoje Supabase URL a anon key
3. Otvor `index.html` v prehliadači

## Deploy na Netlify

1. Zaloguj sa do Netlify
2. **Add new site** → **Deploy manually** (drag-drop) ALEBO **Import from Git**
3. Pre Git: **+ New site** → vyber repo `adlify-admin`
4. Build settings: žiadne (publish dir = `.`)

## Custom doména

1. Netlify → Site → **Domain management** → **+ Add custom domain**
2. Zadaj `admin.adlify.eu`
3. V tvojom DNS poskytovateľovi (registrátor adlify.eu) pridaj **CNAME**:
   - Name: `admin`
   - Value: `<tvoj-site>.netlify.app`
4. SSL cert sa vystaví automaticky (~5 min)

## Bezpečnosť

- **Anon key** je verejný — RLS policies v Supabase chránia dáta (iba prihlásení môžu zapisovať)
- **service_role key** SEM NIKDY nedávaj
- `noindex` meta tag + Netlify header zabraňujú indexácii admina
- Login cez Supabase Auth (email + password)

## Štruktúra

```
adlify-admin/
├── index.html              ← single page app shell
├── css/
│   └── app.css             ← custom styles
├── js/
│   ├── config.js           ← Supabase keys (TY VYPLNÍŠ)
│   ├── auth.js             ← login/logout
│   ├── api.js              ← Supabase queries
│   ├── router.js           ← hash router
│   ├── layout.js           ← sidebar, top bar, lang switcher
│   ├── utils.js            ← toast, drawer, confirm helpers
│   └── pages/
│       ├── dashboard.js    ✅ funkčné
│       ├── testimonials.js ✅ funkčné (vzor pre ostatné)
│       ├── cases.js        🚧 placeholder
│       ├── blog.js         🚧 placeholder
│       ├── services.js     🚧 placeholder
│       ├── faq.js          🚧 placeholder
│       ├── pricing.js      🚧 placeholder
│       ├── translations.js 🚧 placeholder
│       ├── pages_content.js 🚧 placeholder
│       ├── navigation.js   🚧 placeholder
│       ├── clients.js      🚧 placeholder
│       └── settings.js     🚧 placeholder
└── netlify.toml            ← Netlify config + redirects
```

## Funkčné teraz (Fáza 2)

- ✅ Login (e-mail + password)
- ✅ Sidebar navigácia
- ✅ Jazykový switcher (SK/CS/HU/EN/DE)
- ✅ Dashboard so štatistikami
- ✅ Testimoniály — pridať/upraviť/zmazať/skryť

## V príprave (Fáza 3)

- 🚧 Prípadové štúdie (s TipTap WYSIWYG)
- 🚧 Blog (s TipTap WYSIWYG)
- 🚧 Služby
- 🚧 FAQ
- 🚧 Cenník (3 plány + tabulka + jednorazové)
- 🚧 UI texty (translations) — bulk edit cez tabuľku key×lang
- 🚧 Sekcie stránok (hero, manifest, calculator, process)
- 🚧 Navigácia (header + footer)
- 🚧 Klienti (ticker)
- 🚧 Nastavenia

## V príprave (Fáza 4)

- 🚧 Edge Function `trigger-web-build` v Supabase
- 🚧 Build proces v adlify-web ktorý fetchne dáta zo Supabase
- 🚧 Generovanie 5 jazykových verzií statického HTML
- 🚧 hreflang meta + sitemap.xml
