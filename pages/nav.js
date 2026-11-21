// Top bar on every page: the waffle menu on the left, and the login button (or username) on the right.
// This file also builds the login popup, so no page needs its own login HTML.
(function () {
  // all pages, for the waffle menu: the text shown and the file each one opens
  const pages = [
    { name: 'Home', href: 'Home.html' },
    { name: 'User', href: 'User.html' },
    { name: 'Card Database', href: 'CardCollection.html' },
  ];
  // file name of the page that's open (the last part of the URL), used to highlight its menu link. "/" means Home
  const current = location.pathname.split('/').pop() || 'Home.html';

  // the styles are written here, so every page gets them without its own CSS
  const style = document.createElement('style');
  style.textContent = `
    #topbar { position: sticky; top: 0; z-index: 10; background: var(--bg, #eef2ec); border-bottom: 1px solid var(--line, #d9e0d9); }
    .topbar-inner { max-width: 1100px; margin: 0 auto; padding: 12px 32px; display: flex; align-items: center; gap: 14px; position: relative; }
    .waffle {
      width: 40px; height: 40px; padding: 0; border-radius: 10px; cursor: pointer;
      border: 1px solid var(--line, #d9e0d9); background: var(--panel, #f6f8f4);
      display: grid; grid-template-columns: repeat(3, 5px); grid-template-rows: repeat(3, 5px); gap: 4px; place-content: center;
    }
    .waffle:hover { background: #e4ece6; }
    .waffle:focus-visible { outline: 2px solid var(--dark, #1f4a43); outline-offset: 2px; }
    .waffle span { width: 5px; height: 5px; border-radius: 50%; background: var(--ink, #173a34); }
    .brand { font-size: 15px; font-weight: 600; color: var(--ink, #173a34); }
    .waffle-menu {
      display: none; position: absolute; top: 60px; left: 32px; min-width: 210px; padding: 8px;
      background: var(--panel, #f6f8f4); border: 1px solid var(--line, #d9e0d9); border-radius: 14px;
      box-shadow: 0 8px 24px rgba(23, 58, 52, .12);
    }
    .waffle-menu.open { display: block; }
    .waffle-menu a { display: block; padding: 10px 12px; border-radius: 8px; font-size: 14px; color: var(--ink, #173a34); text-decoration: none; }
    .waffle-menu a:hover { background: #e4ece6; }
    .waffle-menu a[aria-current="page"] { background: var(--dark, #1f4a43); color: #fff; }

    /* login button / username, pushed to the right edge */
    .nav-user { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .nav-name { font-size: 14px; font-weight: 500; color: var(--ink, #173a34); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nav-btn {
      height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer;
      border: 1px solid var(--line, #d9e0d9); background: var(--panel, #f6f8f4); color: var(--ink, #173a34);
      font: inherit; font-size: 13px; font-weight: 500;
    }
    .nav-btn:hover { background: #e4ece6; }
    .nav-btn:focus-visible { outline: 2px solid var(--dark, #1f4a43); outline-offset: 2px; }

    /* login popup (sits above the card popups, which are z-index 100) */
    .auth-overlay { position: fixed; inset: 0; z-index: 200; display: none; align-items: center; justify-content: center; padding: 24px; background: rgba(23, 58, 52, .65); }
    .auth-overlay.open { display: flex; }
    .auth-box { position: relative; width: min(380px, 100%); padding: 24px; background: var(--card, #fbfcf8); border-radius: 18px; box-shadow: 0 20px 50px rgba(0, 0, 0, .35); }
    .auth-close {
      position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; padding: 0; border-radius: 50%; cursor: pointer;
      border: 1px solid var(--line, #d9e0d9); background: #fff; color: var(--ink, #173a34); font: inherit; font-size: 20px; line-height: 1;
    }
    .auth-close:hover { background: #e4ece6; }
    .auth-tabs { display: flex; gap: 6px; margin: 0 40px 16px 0; }
    .auth-tab {
      flex: 1; height: 38px; border-radius: 10px; cursor: pointer; font: inherit; font-size: 13px; font-weight: 500;
      border: 1px solid var(--line, #d9e0d9); background: var(--panel, #f6f8f4); color: var(--ink, #173a34);
    }
    .auth-tab.active { background: var(--dark, #1f4a43); border-color: var(--dark, #1f4a43); color: #fff; }
    .auth-msg { min-height: 1.3em; margin: 0 0 10px; font-size: 13px; color: var(--muted, #7d8a84); }
    .auth-msg.error { color: var(--accent, #d9482b); }
    .auth-box label { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted, #7d8a84); }
    .auth-box [hidden] { display: none !important; }
    .auth-box input {
      height: 40px; padding: 0 12px; border: 1px solid var(--line, #d9e0d9); border-radius: 10px; background: #fff;
      font: inherit; font-size: 14px; letter-spacing: normal; text-transform: none; color: var(--ink, #173a34);
    }
    .auth-box input:focus, .auth-tab:focus-visible, .auth-submit:focus-visible, .auth-close:focus-visible { outline: 2px solid var(--dark, #1f4a43); outline-offset: 2px; }
    .auth-submit {
      width: 100%; height: 44px; border-radius: 10px; cursor: pointer; font: inherit; font-size: 14px; font-weight: 500;
      border: 1px solid var(--accent, #d9482b); background: var(--accent, #d9482b); color: #fff;
    }
    .auth-submit:disabled { opacity: .6; cursor: default; }

    @media (max-width: 600px) {
      .topbar-inner { padding: 12px 16px; }
      .waffle-menu { left: 16px; }
    }
  `;
  document.head.appendChild(style);

  // the bar: the waffle button (9 dots, 3x3), the brand name, the dropdown menu with one link per page
  // (the open page is marked), and an empty spot on the right that the login code below fills in
  const host = document.getElementById('topbar');
  host.innerHTML = `
    <div class="topbar-inner">
      <button class="waffle" id="waffleBtn" aria-label="Open navigation menu" aria-expanded="false" aria-controls="waffleMenu">
        <span></span><span></span><span></span>
        <span></span><span></span><span></span>
        <span></span><span></span><span></span>
      </button>
      <span class="brand">Pokédex</span>
      <nav class="waffle-menu" id="waffleMenu">
        ${pages.map(p =>
    `<a href="${p.href}"${p.href === current ? ' aria-current="page"' : ''}>${p.name}</a>`
  ).join('')}
      </nav>
      <div class="nav-user" id="navUser"></div>
    </div>`;

  // these two elements were just created above, so they can only be looked up now
  const btn = document.getElementById('waffleBtn');
  const menu = document.getElementById('waffleMenu');

  // opens (true) or closes (false) the dropdown menu, and tells screen readers which it is
  function setOpen(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  // the button toggles the menu, a click anywhere else closes it, and Escape closes it and returns focus to the button
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!menu.classList.contains('open'));
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { setOpen(false); btn.focus(); }
  });

  // ===================== login state and the login popup =====================
  let currentUser = null;   // the username when logged in, otherwise null
  let mode = 'login';       // which tab of the popup is showing: 'login' or 'register'
  const navUser = document.getElementById('navUser');

  // the popup, added to the page once
  const overlay = document.createElement('div');
  overlay.className = 'auth-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Log in or create an account');
  overlay.innerHTML = `
    <div class="auth-box" id="authBox">
      <button type="button" class="auth-close" id="authClose" aria-label="Close">&times;</button>
      <div class="auth-tabs">
        <button type="button" class="auth-tab active" data-mode="login">Log in</button>
        <button type="button" class="auth-tab" data-mode="register">Create account</button>
      </div>
      <p class="auth-msg" id="authMsg"></p>
      <form id="authForm" novalidate>
        <label>Username
          <input id="authUser" autocomplete="username" maxlength="24" autocapitalize="none" spellcheck="false">
        </label>
        <label>Password
          <input id="authPass" type="password" autocomplete="current-password" maxlength="200">
        </label>
        <label id="authConfirmRow" hidden>Confirm password
          <input id="authConfirm" type="password" autocomplete="new-password" maxlength="200">
        </label>
        <button type="submit" class="auth-submit" id="authSubmit">Log in</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  const authBox = overlay.querySelector('#authBox');
  const form = overlay.querySelector('#authForm');
  const msg = overlay.querySelector('#authMsg');
  const userInput = overlay.querySelector('#authUser');
  const passInput = overlay.querySelector('#authPass');
  const confirmInput = overlay.querySelector('#authConfirm');
  const confirmRow = overlay.querySelector('#authConfirmRow');
  const submitBtn = overlay.querySelector('#authSubmit');

  // shows a line of text above the form, in red for errors
  function setMsg(text, isError) {
    msg.textContent = text || '';
    msg.classList.toggle('error', !!isError);
  }

  // switches between the Log in and Create account tabs
  function setMode(next) {
    mode = next;
    overlay.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === next));
    confirmRow.hidden = next !== 'register';
    passInput.autocomplete = next === 'register' ? 'new-password' : 'current-password';   // helps password managers
    submitBtn.textContent = next === 'register' ? 'Create account' : 'Log in';
    setMsg('');
  }

  // opens the popup, optionally with a message on top (pages call this through window.requireLogin)
  function openAuth(message, startMode) {
    setMode(startMode || 'login');
    setMsg(message);
    overlay.classList.add('open');
    userInput.focus();
  }

  function closeAuth() {
    overlay.classList.remove('open');
    form.reset();
  }

  // draws the right side of the bar: "Log in" when logged out, or the username and "Log out" when logged in
  function renderNav() {
    navUser.replaceChildren();
    if (currentUser) {
      const name = document.createElement('span');
      name.className = 'nav-name';
      name.textContent = currentUser;
      const logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'nav-btn';
      logout.textContent = 'Log out';
      logout.addEventListener('click', async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (err) { console.error(err); }
        setUser(null);
      });
      navUser.append(name, logout);
    } else {
      const login = document.createElement('button');
      login.type = 'button';
      login.className = 'nav-btn';
      login.textContent = 'Log in';
      login.addEventListener('click', () => openAuth());
      navUser.append(login);
    }
  }

  // changes who is logged in, redraws the bar, and tells the page (the User page reloads its collection)
  function setUser(name) {
    currentUser = name;
    renderNav();
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { username: name } }));
  }

  // tabs, close button, and click on the dark area around the box
  overlay.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => setMode(t.dataset.mode)));
  overlay.querySelector('#authClose').addEventListener('click', closeAuth);
  overlay.addEventListener('click', (e) => { if (!authBox.contains(e.target)) closeAuth(); });

  // Escape closes the login popup. this listener runs first (capture) and stops there, so a card popup
  // underneath stays open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      e.stopPropagation();
      closeAuth();
    }
  }, true);

  // submitting the form (the button or Enter) logs in or creates the account, depending on the tab
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = userInput.value.trim();
    const password = passInput.value;
    if (!username || !password) return setMsg('Enter a username and password.', true);
    if (mode === 'register' && password !== confirmInput.value) return setMsg('The passwords do not match.', true);

    submitBtn.disabled = true;
    setMsg('');
    try {
      const res = await fetch('/api/auth/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      closeAuth();
      setUser(data.username);
    } catch (err) {
      setMsg(err.message, true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // for the pages: window.requireLogin('message') opens the popup, window.getCurrentUser() says who is logged in
  window.requireLogin = openAuth;
  window.getCurrentUser = () => currentUser;

  // ask the server who is logged in (the cookie is sent automatically), then draw the right side of the bar
  fetch('/api/auth/me')
    .then(r => r.json())
    .then(d => { currentUser = d.username ?? null; renderNav(); })
    .catch(() => renderNav());
})();