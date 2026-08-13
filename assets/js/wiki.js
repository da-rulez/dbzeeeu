/* ----------------------------------------------------------
   DBZee — guide behaviour
   Drawer navigation (with #hash deep links) plus the two
   data-driven sections, which are rendered from _data/wiki.json
   so they never drift from what the game actually ships.
----------------------------------------------------------- */
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.wiki-tab'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('.wiki-section'));
  if (!tabs.length) return;

  function show(id, push) {
    var found = false;
    sections.forEach(function (s) {
      var on = s.id === 'sec-' + id;
      s.classList.toggle('active', on);
      if (on) found = true;
    });
    if (!found) return false;
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.dataset.section === id);
    });
    if (push && history.replaceState) history.replaceState(null, '', '#' + id);
    return true;
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      show(t.dataset.section, true);
      // Only scroll when the panel top is off screen: clicking a tab while
      // already at the top should not jump the page around.
      var body = document.querySelector('.wiki-body');
      if (body && body.getBoundingClientRect().top < 0) {
        body.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  window.addEventListener('hashchange', function () {
    show(location.hash.replace('#', ''), false);
  });

  if (!show(location.hash.replace('#', ''), false)) show(tabs[0].dataset.section, false);

  // ── Data-driven sections ────────────────────────────────────
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // "projectile" -> "Projectile", "teleport_to_target" -> "Teleport"
  var TYPE_LABEL = {
    projectile: 'Projectile', line: 'Line', aoe: 'Area', bomb: 'Lobbed',
    charge: 'Charge', self: 'Self', passive: 'Passive', taunt: 'Taunt',
    transform: 'Transformation', revert: 'Revert', teleport_to_target: 'Teleport',
    instant: 'Instant', buff: 'Buff'
  };

  function secs(n) {
    if (!n) return null;
    return (Math.round(n * 10) / 10) + 's';
  }

  function techCard(s) {
    var bits = [];
    if (s.ki_cost) bits.push('<span>' + esc(Math.round(s.ki_cost)) + ' Ki</span>');
    if (s.cooldown) bits.push('<span>' + esc(secs(s.cooldown)) + ' cd</span>');
    if (s.cast_time) bits.push('<span>' + esc(secs(s.cast_time)) + ' cast</span>');
    var icon = s.icon
      ? '<img class="wiki-card-icon r-' + esc(s.rarity) + '" src="' + esc(s.icon) +
        '" alt="" loading="lazy" width="40" height="40">'
      : '<div class="wiki-card-icon r-' + esc(s.rarity) + '"></div>';
    return '<article class="wiki-card" data-type="' + esc(s.type) + '">' + icon +
      '<div><h4 class="wiki-card-name">' + esc(s.name) + '</h4>' +
      '<p class="wiki-card-meta">' + esc(TYPE_LABEL[s.type] || s.type) +
      (s.passive && s.type !== 'passive' ? ' &middot; passive' : '') +
      ' &middot; ' + esc(s.rarity) + '</p>' +
      '<p class="wiki-card-text">' + esc(s.description) + '</p>' +
      (bits.length ? '<div class="wiki-card-stats">' + bits.join('') + '</div>' : '') +
      '</div></article>';
  }

  function renderTechniques(data) {
    var grid = document.getElementById('tech-grid');
    if (!grid) return;
    grid.innerHTML = data.spells.map(techCard).join('');

    // Filter chips, built from the types actually present.
    var types = [];
    data.spells.forEach(function (s) { if (types.indexOf(s.type) < 0) types.push(s.type); });
    types.sort();
    var bar = document.getElementById('tech-filters');
    if (bar) {
      bar.innerHTML = ['<button class="wiki-chip active" data-type="all">All ' +
        data.spells.length + '</button>'].concat(types.map(function (t) {
        return '<button class="wiki-chip" data-type="' + esc(t) + '">' +
          esc(TYPE_LABEL[t] || t) + '</button>';
      })).join('');
      bar.addEventListener('click', function (e) {
        var btn = e.target.closest('.wiki-chip');
        if (!btn) return;
        Array.prototype.forEach.call(bar.children, function (c) {
          c.classList.toggle('active', c === btn);
        });
        var want = btn.dataset.type;
        Array.prototype.forEach.call(grid.children, function (card) {
          card.style.display = (want === 'all' || card.dataset.type === want) ? '' : 'none';
        });
      });
    }

    var locked = document.getElementById('tech-locked');
    if (locked && data.hidden_spell_count > 0) {
      locked.innerHTML = '<div class="wiki-locked-mark">???</div><div>' +
        '<strong>' + esc(data.hidden_spell_count) + ' more techniques</strong> sit in the ' +
        'Collection Log as question marks. They are not listed here and they are not ' +
        'listed in game either: the log fills the name in the moment you learn one.</div>';
    }
  }

  function renderBestiary(data) {
    var host = document.getElementById('bestiary-list');
    if (!host) return;
    var groups = {};
    data.npcs.forEach(function (n) {
      var k = n.category || 'Unsorted';
      (groups[k] = groups[k] || []).push(n);
    });
    host.innerHTML = Object.keys(groups).sort().map(function (k) {
      return '<h3>' + esc(k) + '</h3><div class="wiki-table-wrap"><table class="wiki-table">' +
        '<thead><tr><th>Name</th><th>What you can tell by looking</th></tr></thead><tbody>' +
        groups[k].map(function (n) {
          return '<tr><td>' + esc(n.name) + (n.boss ? ' <em>(boss)</em>' : '') +
            '</td><td>' + esc(n.lore) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }).join('');
  }

  function renderWeather(data) {
    var host = document.getElementById('weather-list');
    if (!host || !data.weathers.length) return;
    // Most weathers are named well enough to need no gloss; only build the
    // second column when there is actually something to put in it, rather than
    // printing a table of empty cells.
    var described = data.weathers.filter(function (w) { return w.description; });
    if (!described.length) {
      host.innerHTML = '<p class="wiki-card-text">In the world right now: ' +
        data.weathers.map(function (w) { return '<strong>' + esc(w.name) + '</strong>'; })
          .join(', ') + '. More arrives with the seasons.</p>';
      return;
    }
    host.innerHTML = '<div class="wiki-table-wrap"><table class="wiki-table">' +
      '<thead><tr><th>Weather</th><th>What it looks like</th></tr></thead><tbody>' +
      data.weathers.map(function (w) {
        return '<tr><td>' + esc(w.name) + '</td><td>' + esc(w.description) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function renderStats(data) {
    var host = document.getElementById('stat-list');
    if (!host) return;
    host.innerHTML = '<div class="wiki-table-wrap"><table class="wiki-table">' +
      '<thead><tr><th>Stat</th><th>What it does</th></tr></thead><tbody>' +
      data.stats.map(function (s) {
        return '<tr><td>' + esc(s.name) + '</td><td>' + esc(s.text) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function renderRaces(data) {
    var host = document.getElementById('race-list');
    if (!host || !data.races.length) return;
    host.innerHTML = '<div class="wiki-table-wrap"><table class="wiki-table">' +
      '<thead><tr><th>Race</th><th>Notes</th></tr></thead><tbody>' +
      data.races.map(function (r) {
        return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.description) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  fetch('_data/wiki.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) throw new Error('no data');
      renderTechniques(data);
      renderBestiary(data);
      renderWeather(data);
      renderStats(data);
      renderRaces(data);
      var stamp = document.getElementById('wiki-version');
      if (stamp && data.generated_for_version) {
        stamp.textContent = 'Content as of game version ' + data.generated_for_version + '.';
      }
    })
    .catch(function () {
      // No data file (or opened straight off disk): the written guide still
      // reads fine, so just say the lists are missing rather than leaving
      // empty holes.
      ['tech-grid', 'bestiary-list', 'weather-list', 'stat-list', 'race-list'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !el.innerHTML.trim()) {
          el.innerHTML = '<p class="wiki-card-text">This list could not be loaded. ' +
            'Try a refresh.</p>';
        }
      });
    });
})();
