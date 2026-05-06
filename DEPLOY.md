# DEPLOY — admin.adlify.eu

Krok-za-krokom postup ako dostať admin app live na `admin.adlify.eu`.

---

## KROK 1 — Doplň Supabase keys (1 min)

1. Otvor `js/config.js`
2. Nahraď placeholdery:
   - `PASTE_YOUR_SUPABASE_URL_HERE` → `https://xxxxx.supabase.co`
   - `PASTE_YOUR_SUPABASE_ANON_KEY_HERE` → `eyJhbGc...`
3. Ulož

---

## KROK 2 — Vytvor GitHub repo (3 min)

### Cesta A — cez GitHub web UI
1. Otvor https://github.com/new
2. Repository name: `adlify-admin`
3. **Public** (povolený, anon key v config.js je OK)
4. Bez README (máš svoj)
5. **Create repository**
6. Skopíruj URL (napr. `https://github.com/stefanXXX/adlify-admin.git`)

### Cesta B — cez GitHub Desktop
1. File → New repository → meno: `adlify-admin`
2. Choose existing folder s admin súbormi
3. Initial commit → **Create repository**
4. Publish repository → Public

### Push obsah do repa (cez terminál)

```bash
cd /cesta/k/adlify-admin
git init
git add .
git commit -m "Initial admin app"
git branch -M main
git remote add origin https://github.com/TVOJ_USER/adlify-admin.git
git push -u origin main
```

---

## KROK 3 — Deploy na Netlify (3 min)

1. Otvor https://app.netlify.com/
2. Klikni **Add new site** → **Import an existing project**
3. **Deploy with GitHub** → autorizuj (ak nie si)
4. Vyber repo `adlify-admin`
5. **Deploy settings**:
   - Branch: `main`
   - Base directory: (prázdne)
   - Build command: (prázdne)
   - Publish directory: `.`
6. **Deploy site**
7. Počkaj 30 sekúnd → uvidíš auto-vygenerovanú URL ako `https://random-name-12345.netlify.app`

### Premenuj site (voliteľné)

1. Site overview → **Site information** → **Change site name**
2. Zadaj `adlify-admin` → uloz
3. URL bude `https://adlify-admin.netlify.app`

---

## KROK 4 — Nastav custom doménu admin.adlify.eu (5 min)

### V Netlify

1. Site → **Domain management** → **Add a domain you already own**
2. Zadaj `admin.adlify.eu` → **Verify**
3. Netlify ti ukáže DNS pokyny → poznač si CNAME hodnotu (napr. `adlify-admin.netlify.app`)

### V doménovom registri (kde máš adlify.eu)

**Postup závisí od poskytovateľa** (Webglobe, Websupport, Forpsi, Cloudflare...):

1. Otvor **DNS management** pre doménu `adlify.eu`
2. Pridaj nový **CNAME** záznam:
   - Type: `CNAME`
   - Name/Host: `admin`  ← iba `admin`, nie `admin.adlify.eu`!
   - Value/Points to: `adlify-admin.netlify.app` (alebo to čo ti ukázal Netlify)
   - TTL: `Auto` alebo `3600`
3. Uloz

### Počkaj na propagáciu

- Trvá to **5 minút až 24 hodín** (väčšinou ~15 min)
- Skontroluj na https://www.whatsmydns.net/?d=admin.adlify.eu (vyber CNAME)
- Keď DNS prepoja, Netlify automaticky vystaví **SSL certifikát** (Let's Encrypt)

### V Netlify (po DNS propagácii)

1. Site → **Domain management** → `admin.adlify.eu` by malo zmeniť stav na ✅ Netlify DNS
2. **HTTPS** → klikni **Renew certificate** alebo počkaj kým sa vystaví automaticky

---

## KROK 5 — Test (1 min)

1. Otvor https://admin.adlify.eu/
2. Mal by sa zobraziť login screen
3. Prihlás sa (e-mail + heslo z Supabase Authentication → Users)
4. Mal by si vidieť Dashboard
5. Klikni **Testimoniály** → mal by si vidieť 4 seedované

---

## Bežné problémy

### "Chyba pri načítaní" v Dashboard / Testimoniály

→ Otvor browser console (F12). Najčastejšie:
- `Invalid API key` → zlé skopírovaný anon key v `config.js`
- `Project URL` → zlé URL
- `RLS error` → migrácia 002 neprebehla v Supabase

### Login zlyhá s "Email not confirmed"

→ Zaškrtni **Auto Confirm User** keď vytváraš user-a v Supabase

### admin.adlify.eu nepripojuje

→ DNS ešte nepropagovala. Počkaj 15-30 min. Medzi tým môžeš používať `adlify-admin.netlify.app`.

### Po push do GitHub sa Netlify nedeployuje

→ V Netlify Site → **Build & deploy** → **Continuous Deployment** → **Edit settings** → over že je nastavený correct branch `main`

---

## Po deploye

1. **Otestuj všetky funkcie** v Dashboard a Testimoniáloch
2. Ak je všetko OK, ozvi sa mi cez chat — pokračujeme **Fázou 3** (zvyšné editory)
3. Keď budú všetky editory hotové, pôjdeme na **Fázu 4** — pripojenie webu cez build proces
