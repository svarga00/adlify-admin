// js/config.js
// SEM VLOŽ tvoje Supabase keys (z Project Settings → API)
// Tento súbor je v Git-e, ale anon key je verejný (chránený RLS policies)
// service_role key sem NIKDY nedávaj!

window.SUPABASE_URL      = 'https://pjdfdedpprrokblxpnzs.supabase.co';      // napr. 'https://abcdefgh.supabase.co'
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZGZkZWRwcHJyb2tibHhwbnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTU0NjUsImV4cCI6MjA5MzYzMTQ2NX0.oeBSnRlHTG9uE02AReSFkDhF-Wuyw92-sivzrubfsLg'; // dlhý JWT začínajúci eyJhbG...

// Konfigurácia podporovaných jazykov
window.LANGS = ['sk', 'cs', 'hu', 'en', 'de'];
window.LANG_LABELS = {
  sk: 'Slovenčina',
  cs: 'Čeština',
  hu: 'Magyar',
  en: 'English',
  de: 'Deutsch',
};
window.DEFAULT_LANG = 'sk';

// Netlify build hook (vyplníš v Fáze 4 keď budeme prepájať web)
window.NETLIFY_BUILD_HOOK = null;
