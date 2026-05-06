// js/auth.js — Login, logout, session check

window.Auth = {
  user: null,

  async init() {
    // Check existing session
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session?.user) {
      this.user = session.user;
      this.showApp();
    } else {
      this.showLogin();
    }

    // Listen for auth state changes
    window.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.user = session.user;
        this.showApp();
      } else {
        this.user = null;
        this.showLogin();
      }
    });
  },

  showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    this.bindLoginForm();
  },

  showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    Layout.init();
    Router.init();
  },

  bindLoginForm() {
    const form = document.getElementById('login-form');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      const errBox = document.getElementById('login-error');
      const submitBtn = document.getElementById('login-submit');

      errBox.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Prihlasujem…';

      try {
        const { error } = await window.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange handles the redirect
      } catch (err) {
        errBox.textContent = this.translateError(err.message);
        errBox.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Prihlásiť sa';
      }
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
  },

  async logout() {
    if (!confirm('Naozaj sa chcete odhlásiť?')) return;
    await window.supabase.auth.signOut();
  },

  translateError(msg) {
    if (!msg) return 'Neznáma chyba';
    if (msg.includes('Invalid login credentials')) return 'Nesprávny e-mail alebo heslo';
    if (msg.includes('Email not confirmed')) return 'E-mail nie je potvrdený. Pri vytváraní user-a v Supabase zaškrtni Auto Confirm.';
    if (msg.includes('rate limit')) return 'Príliš veľa pokusov. Skúste o chvíľu.';
    return msg;
  },
};
