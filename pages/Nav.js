// Shared top bar with the waffle menu. Add this to every page:
//   <div id="topbar"></div>
//   <script src="nav.js"></script>
// To add or rename a tab, edit the `pages` list below.
(function () {
  const pages = [
    { name: 'Home', href: 'Home.html' },
    { name: 'User', href: 'User.html' },
    { name: 'Card Database', href: 'CardCollection.html' },
  ];
  const current = location.pathname.split('/').pop() || 'index.html';

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
    @media (max-width: 600px) {
      .topbar-inner { padding: 12px 16px; }
      .waffle-menu { left: 16px; }
    }
  `;
  document.head.appendChild(style);

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
    </div>`;

  const btn = document.getElementById('waffleBtn');
  const menu = document.getElementById('waffleMenu');

  function setOpen(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

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
})();