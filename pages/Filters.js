// Shared filter bar: Series, Type, Name.
(function () {
  const TYPES = ['Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting', 'Fire', 'Grass', 'Lightning', 'Metal', 'Psychic', 'Water'];

  const style = document.createElement('style');
  style.textContent = `
    .filterbar {
      display: grid; grid-template-columns: 1fr 1fr 2fr auto auto; gap: 12px; align-items: end;
      padding: 16px; margin-bottom: 24px;
      background: var(--panel, #f6f8f4); border: 1px solid var(--line, #d9e0d9); border-radius: 14px;
    }
    .filterbar label {
      display: flex; flex-direction: column; gap: 6px;
      font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted, #7d8a84);
    }
    .filterbar input, .filterbar select {
      width: 100%; height: 40px; padding: 0 12px;
      border: 1px solid var(--line, #d9e0d9); border-radius: 10px; background: #fff;
      font: inherit; font-size: 14px; letter-spacing: normal; text-transform: none; color: var(--ink, #173a34);
    }
    .filterbar input:focus, .filterbar select:focus, .filterbar .clear:focus-visible {
      outline: 2px solid var(--dark, #1f4a43); outline-offset: 2px;
    }
    .filterbar .clear {
      height: 40px; padding: 0 18px; border-radius: 10px; cursor: pointer;
      border: 1px solid var(--line, #d9e0d9); background: #e4ece6; color: var(--ink, #173a34);
      font: inherit; font-size: 13px; font-weight: 500;
    }
    .filterbar .clear:hover { background: #d8e3db; }

    /* the bar reflows to fit the screen */
    @media (max-width: 800px) {
      .filterbar { grid-template-columns: 1fr 1fr; }
      .filterbar .field-name, .filterbar .clear { grid-column: 1 / -1; }
    }
    @media (max-width: 480px) {
      .filterbar { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);

  window.initFilters = function (onChange) {
    const host = document.getElementById('filterbar');
    host.innerHTML = `
      <div class="filterbar" role="search">
        <label>Set
            <input id="fSeries" list="seriesList" placeholder="All sets" autocomplete="off">
            <datalist id="seriesList"></datalist>
        </label>
        <label>Type
          <select id="fType">
            <option value="">All types</option>
            ${TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </label>
        <label class="field-name">Name
          <input id="fName" type="search" placeholder="e.g. Pikachu" autocomplete="off">
        </label>
        <button type="button" class="clear" id="fClear">Clear</button>
        <button type="button" class="clear" id="fSearch">Search</button>
      </div>`;

    const series = host.querySelector('#fSeries');
    const type = host.querySelector('#fType');
    const name = host.querySelector('#fName');
    const clear = host.querySelector('#fClear');
    const search = host.querySelector('#fSearch');
    search.addEventListener('click', () => notify(0));


    function get() {
      return { series: series.value, type: type.value, name: name.value.trim() };
    }

    // wait a moment while typing so we don't fire on every keystroke
    let timer;
    function notify(delay) {
      clearTimeout(timer);
      timer = setTimeout(function () { if (onChange) onChange(get()); }, delay);
    }
    
    series.addEventListener('change', () => notify(0));
    type.addEventListener('change', () => notify(0));
    name.addEventListener('input', () => notify(250));
    clear.addEventListener('click', function () {
      series.value = '';
      type.value = '';
      name.value = '';
      notify(0);
    });

fetch('/api/cards/sets')
  .then(r => r.json())
  .then(sets => {
    const list = host.querySelector('#seriesList');
    for (const s of sets) {
      const opt = document.createElement('option');
      opt.value = s;
      list.appendChild(opt);
    }
  })
  .catch(err => console.error('Failed to load sets', err));

    return { get: get };
  };


})();