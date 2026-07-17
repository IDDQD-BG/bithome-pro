const BitHome = (() => {
  const AUTH_KEY = 'bithome_token';
  const USER_KEY = 'bithome_user';

  const API = (function(){
    const custom = localStorage.getItem('bithome_api_url');
    if (custom) return custom;
    if (location.origin.includes('localhost') || location.origin.includes('127.0.0.1')) return 'http://localhost:5000';
    return 'https://bithome-api.vercel.app';
  })();

  let MODULE_MAP = {};

  const state = {
    authenticated: false,
    user: null,
    currentModule: null,
    moduleHistory: [],
    projects: [],
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

  async function loadProjects() {
    try {
      const res = await fetch('projects.json');
      const data = await res.json();
      state.projects = data.sections || [];
      // Build MODULE_MAP
      MODULE_MAP = {};
      for (const section of state.projects) {
        for (const p of section.projects || []) {
          MODULE_MAP[p.id] = p;
        }
      }
      renderProjects();
    } catch(e) {
      log('Failed to load projects:', e);
      document.getElementById('projectsContainer').innerHTML =
        '<div class="section"><p style="color:var(--red)">Failed to load projects.</p></div>';
    }
  }

  function renderProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    let html = '';
    for (const section of state.projects) {
      if (!section.projects || section.projects.length === 0) continue;
      html += '<div class="section">';
      html += '<h2 class="section-title">' + section.title + '</h2>';
      html += '<div class="modules-grid">';
      for (const p of section.projects) {
        const tagsHtml = (p.tags || []).map(t => {
          const cls = t === 'Interactive' || t === '3D' || t === 'Nostr' ? 'blue'
            : t === 'AI/ML' || t === 'Mining' || t === 'Canvas' ? 'green'
            : t === 'Math' || t === 'Astronomy' || t === 'Academic' || t === 'SaaS' || t === 'Theory' || t === 'Quantum' || t === 'Democracy' ? 'gold'
            : '';
          return '<span class="tag ' + cls + '">' + t + '</span>';
        }).join('');
        html += '<a href="#" data-module="' + p.id + '" class="module-card">';
        html += '<div class="module-icon">' + (p.icon || '📄') + '</div>';
        html += '<div class="module-title">' + p.title + '</div>';
        html += '<div class="module-desc">' + (p.desc || '') + '</div>';
        html += '<div class="module-meta">' + tagsHtml + '</div>';
        html += '</a>';
      }
      html += '</div></div>';
    }
    container.innerHTML = html;
    // Re-bind click handlers
    container.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        const moduleKey = this.dataset.module;
        if (moduleKey) openModule(moduleKey);
      });
    });
  }

  function openModule(moduleKey) {
    const entry = MODULE_MAP[moduleKey];
    if (!entry) { log('Unknown module:', moduleKey); return; }
    const url = entry.url;
    if (!url) { log('No URL for module:', moduleKey); return; }

    const modal = getModal();
    const frame = getFrame();
    if (!modal || !frame) return;

    state.currentModule = moduleKey;
    state.moduleHistory.push(moduleKey);

    const base = frame.getAttribute('data-base') || '';
    const isExternal = entry.type === 'external' || url.startsWith('http');
    frame.src = isExternal ? url : base + url;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateActiveNav(moduleKey);
    log('Opened module:', moduleKey, url);
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
        setToken(null); setStoredUser(null);
        state.authenticated = false; state.user = null;
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
        badge.textContent = 'PRO'; badge.className = 'auth-badge pro';
      } else {
        badge.textContent = 'FREE'; badge.className = 'auth-badge free';
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
      setToken(data.token); setStoredUser(data.user);
      state.authenticated = true; state.user = data.user;
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
      setToken(data.token); setStoredUser(data.user);
      state.authenticated = true; state.user = data.user;
      updateAuthUI(data.user);
      showToast('Registration successful', 'success');
    } catch(err) { showError('authRegisterError', 'Connection error: ' + err.message); }
    if (btn) btn.disabled = false;
  }

  function doLogout() {
    setToken(null); setStoredUser(null);
    state.authenticated = false; state.user = null;
    state.moduleHistory = [];
    closeModule();
    updateAuthUI(null);
    showToast('Logged out', 'info');
  }

  function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector('.auth-tab[data-tab="' + tab + '"]').classList.add('active');
    document.getElementById('auth' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    hideError('authLoginError'); hideError('authRegisterError');
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
      state.authenticated = true; state.user = user;
      setStoredUser(user); updateAuthUI(user);
      showToast('Welcome, ' + user.username, 'success');
    } else {
      state.authenticated = false; state.user = null;
      updateAuthUI(null);
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
    initNavigation();
    initKeyboardShortcuts();
    initModalBackgroundClick();
    if (state.authenticated) updateAuthUI(state.user);
    loadProjects();
    log('BitHome Portal initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  return {
    open: openModule,
    close: closeModule,
    back: navigateBack,
    auth: {
      show: showAuth, hide: hideAuth,
      doLogin, doRegister, doLogout,
      switchTab, check: isAuthenticated,
      onAuthChange, getUser: () => state.user,
    },
    toast: showToast,
    getState: () => ({ ...state }),
    modules: () => MODULE_MAP,
  };
})();
