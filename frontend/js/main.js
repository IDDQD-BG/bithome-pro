const BitHome = (() => {
  const AUTH_KEY = 'bithome_token';
  const USER_KEY = 'bithome_user';

  const API = (function(){
    const custom = localStorage.getItem('bithome_api_url');
    if (custom) return custom;
    if (location.origin.includes('localhost') || location.origin.includes('127.0.0.1')) return 'http://localhost:5000';
    return 'https://bithome-api.vercel.app';
  })();

  const MODULE_MAP = {
    'explorer': 'bitcoin-hash-explorer.html',
    'learn': 'https://iddqd-bg.github.io/learn/',
    'geometry': 'Абсолютната Геометрия — Станков.html',
    'geometry-rings': 'Геометричните Пръстени — Станков.html',
    'calendar': 'calendar.html',
    'ai': 'ai-genesis-core.html',
    'research': 'index.html',
    '3d': 'genesis_3d_duality_257.html',
    'born-ai': 'bitcoin-born-ai.html',
    'fermat': 'fermat-matrix.html',
    'quantum': 'BITHOME.PRO · Quantum Blockchain Laboratory.html',
    'szh': 'szh-quantum-engine.html',
    'riemann': 'riemann-bridge.html',
    'spacetime': 'spacetime-evolution-engine.html',
    'merkle': 'BITHOME.PRO · Live Merkle Tree Laboratory.html',
    'mesh': 'stankov_mesh_integrated.html',
    'live-lab': 'LIVE_LABORATORIUM.html',
    'watermark': 'stankov-watermark-visual.html',
    'pro': 'pro.html',
    'coliseum': 'Political Legitimator – Standalone Coliseum.html',
    'the-discovery': 'the-discovery.html',
    'master-key': 'the-master-key.html',
    'stankov-arch': 'stankov-bitcoin-architecture.html',
    'calendar-duality': 'stankov_calendar_duality.html',
    'lucas-convergence': 'lucas-satoshi-convergence.html',
    'riemann-bridge-satoshi': 'riemann-satoshi-bridge.html',
    'tape-model': 'genesis-tape-model.html',
    'tape-360': 'genesis-tape-360.html',
    'nano-miner': 'nano-miner.html',
    'radial-merkle': 'radial-merkle-lab.html',
    'time-anomalies': 'time-anomalies.html',
    'decode-block0': 'decode-block-0.html',
    'integrated-forge': 'integrated-forge.html',
    'arch-satoshi': 'astronomical-architecture-satoshi.html',
    'subscriptions': 'subscriptions.html',
    'stankov-stat': 'stankov-stat-test.html',
    'ai-bridge-results': 'stankov-ai-bridge-results.html',
    'stankov-arch-v9': 'stankov-bitcoin-architecture-v9.html',
    'spirals': 'unified-3d-spirals.html',
    'mesh-en5425': 'mesh-en5425-demo.html',
    'stankov-calendar-duality': 'stankov-calendar-duality.html',
    'angle-21': 'angle-decomposition-21.html',
    'teorema-geometria': 'teorema-geometria.html',
    'updates': 'updates.html',
  };

  const state = {
    authenticated: false,
    user: null,
    currentModule: null,
    moduleHistory: [],
  };

  function log(...args) { console.log('[BitHome]', ...args); }

  function getToken() { return localStorage.getItem(AUTH_KEY); }
  function setToken(t) { if (t) localStorage.setItem(AUTH_KEY, t); else localStorage.removeItem(AUTH_KEY); }
  function getStoredUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; } }
  function setStoredUser(u) { if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY); }

  function loadState() {
    const token = getToken();
    const user = getStoredUser();
    if (token && user) {
      state.authenticated = true;
      state.user = user;
    }
  }

  function getModal() { return document.getElementById('moduleModal'); }
  function getFrame() { return document.getElementById('moduleFrame'); }
  function getAuthOverlay() { return document.getElementById('authOverlay'); }

  function openModule(moduleKey) {
    const url = MODULE_MAP[moduleKey];
    if (!url) { log('Unknown module:', moduleKey); return; }
    const modal = getModal();
    const frame = getFrame();
    if (!modal || !frame) return;
    state.currentModule = moduleKey;
    state.moduleHistory.push(moduleKey);
    const base = frame.getAttribute('data-base') || '';
    frame.src = url.startsWith('http') ? url : base + url;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateActiveNav(moduleKey);
    log('Opened module:', moduleKey);
  }

  function closeModule() {
    const modal = getModal();
    const frame = getFrame();
    if (!modal || !frame) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    frame.src = '';
    state.currentModule = null;
    log('Closed module');
  }

  function navigateBack() {
    if (state.moduleHistory.length > 1) {
      state.moduleHistory.pop();
      const prev = state.moduleHistory[state.moduleHistory.length - 1];
      openModule(prev);
    } else { closeModule(); }
  }

  function updateActiveNav(moduleKey) {
    document.querySelectorAll('.nav a').forEach(link => {
      link.classList.toggle('active', link.dataset.module === moduleKey);
    });
  }

  function showAuth() {
    const overlay = getAuthOverlay();
    if (overlay) {
      const token = getToken();
      if (token) { tryFetchUser(); }
      overlay.classList.add('active');
    }
  }

  function hideAuth() {
    const overlay = getAuthOverlay();
    if (overlay) overlay.classList.remove('active');
  }

  async function tryFetchUser() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(API + '/api/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        state.user = data.user;
        state.authenticated = true;
        setStoredUser(data.user);
        updateAuthUI(data.user);
      } else {
        setToken(null);
        setStoredUser(null);
        state.authenticated = false;
        state.user = null;
      }
    } catch(e) { log('Auth fetch failed:', e); }
  }

  function updateAuthUI(user) {
    const loginForm = document.getElementById('authLogin');
    const registerForm = document.getElementById('authRegister');
    const loggedIn = document.getElementById('authLoggedIn');
    const tabs = document.querySelector('.auth-tabs');
    const title = document.getElementById('authTitle');
    if (!loggedIn) return;

    if (user) {
      if (loginForm) loginForm.classList.remove('active');
      if (registerForm) registerForm.classList.remove('active');
      if (tabs) tabs.style.display = 'none';
      if (title) title.textContent = 'AUTHORIZED';
      loggedIn.classList.add('active');
      document.getElementById('authDisplayName').textContent = user.username || user.email;
      const badge = document.getElementById('authDisplayBadge');
      if (user.is_pro) {
        badge.textContent = 'PRO';
        badge.className = 'auth-badge pro';
      } else {
        badge.textContent = 'FREE';
        badge.className = 'auth-badge free';
      }
    } else {
      if (loggedIn) loggedIn.classList.remove('active');
      if (tabs) tabs.style.display = 'flex';
      if (title) title.textContent = 'AUTHORIZE';
      if (loginForm) loginForm.classList.add('active');
    }
  }

  function showError(formId, msg) {
    const el = document.getElementById(formId);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function hideError(formId) {
    const el = document.getElementById(formId);
    if (el) el.style.display = 'none';
  }

  async function doLogin() {
    const email = document.getElementById('authLoginEmail');
    const pass = document.getElementById('authLoginPass');
    const btn = document.getElementById('authLoginBtn');
    if (!email || !pass) return;
    const e = email.value.trim(), p = pass.value;
    if (!e || !p) { showError('authLoginError', 'Fill in all fields'); return; }
    hideError('authLoginError');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(API + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p })
      });
      const data = await res.json();
      if (!res.ok) { showError('authLoginError', data.error); if (btn) btn.disabled = false; return; }
      setToken(data.token);
      setStoredUser(data.user);
      state.authenticated = true;
      state.user = data.user;
      updateAuthUI(data.user);
      showToast('Login successful', 'success');
    } catch(err) { showError('authLoginError', 'Connection error: ' + err.message); }
    if (btn) btn.disabled = false;
  }

  async function doRegister() {
    const email = document.getElementById('authRegEmail');
    const user = document.getElementById('authRegUser');
    const pass = document.getElementById('authRegPass');
    const confirm = document.getElementById('authRegConfirm');
    const btn = document.getElementById('authRegisterBtn');
    if (!email || !user || !pass || !confirm) return;
    const e = email.value.trim(), u = user.value.trim(), p = pass.value, c = confirm.value;
    if (!e || !u || !p || !c) { showError('authRegisterError', 'Fill in all fields'); return; }
    if (p !== c) { showError('authRegisterError', 'Passwords do not match'); return; }
    if (p.length < 6) { showError('authRegisterError', 'Password must be at least 6 characters'); return; }
    hideError('authRegisterError');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(API + '/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, username: u, password: p })
      });
      const data = await res.json();
      if (!res.ok) { showError('authRegisterError', data.error); if (btn) btn.disabled = false; return; }
      setToken(data.token);
      setStoredUser(data.user);
      state.authenticated = true;
      state.user = data.user;
      updateAuthUI(data.user);
      showToast('Registration successful', 'success');
    } catch(err) { showError('authRegisterError', 'Connection error: ' + err.message); }
    if (btn) btn.disabled = false;
  }

  function doLogout() {
    setToken(null);
    setStoredUser(null);
    state.authenticated = false;
    state.user = null;
    state.moduleHistory = [];
    closeModule();
    updateAuthUI(null);
    showToast('Logged out', 'info');
    log('Logged out');
  }

  function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('auth' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    hideError('authLoginError');
    hideError('authRegisterError');
  }

  function isAuthenticated() { return state.authenticated; }

  function requireAuth(moduleKey) {
    if (!state.authenticated) { showAuth(); return false; }
    return true;
  }

  function showToast(message, type) {
    const existing = document.querySelector('.bithome-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'bithome-toast ' + (type || 'info');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function onAuthChange(user) {
    if (user) {
      state.authenticated = true;
      state.user = user;
      setStoredUser(user);
      updateAuthUI(user);
      showToast('Welcome, ' + user.username, 'success');
    } else {
      state.authenticated = false;
      state.user = null;
      updateAuthUI(null);
    }
  }

  function initModuleCards() {
    document.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        const moduleKey = this.dataset.module;
        if (moduleKey) openModule(moduleKey);
      });
    });
  }

  function initAuthForm() {
    const form = document.getElementById('authForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const input = this.querySelector('input');
        if (input) authenticate(input.value);
      });
    }
  }

  function initNavigation() {
    document.querySelectorAll('.nav a').forEach(link => {
      link.addEventListener('click', function(e) {
        const moduleKey = this.dataset.module;
        if (moduleKey) { e.preventDefault(); openModule(moduleKey); }
      });
    });
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = getModal();
        if (modal && modal.classList.contains('active')) { closeModule(); return; }
        const auth = getAuthOverlay();
        if (auth && auth.classList.contains('active')) { hideAuth(); }
      }
      if (e.key === 'Backspace' && state.currentModule) {
        e.preventDefault(); navigateBack();
      }
    });
  }

  function initModalBackgroundClick() {
    const modal = getModal();
    if (modal) {
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModule(); });
    }
  }

  function init() {
    loadState();
    initModuleCards();
    initNavigation();
    initKeyboardShortcuts();
    initModalBackgroundClick();
    if (state.authenticated) updateAuthUI(state.user);
    log('BitHome Portal initialized');
    log('Authenticated:', state.authenticated, state.user);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  return {
    open: openModule,
    close: closeModule,
    back: navigateBack,
    auth: {
      show: showAuth,
      hide: hideAuth,
      doLogin,
      doRegister,
      doLogout,
      switchTab,
      check: isAuthenticated,
      onAuthChange,
      getUser: () => state.user,
    },
    toast: showToast,
    getState: () => ({ ...state }),
    modules: MODULE_MAP,
  };
})();
