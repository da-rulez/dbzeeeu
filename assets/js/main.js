(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
  }
})();

(function () {
  // Populate any #version-pill on the page with the tag name of the
  // latest GitHub Release of the launcher. Hides the pill on failure
  // so a missing/private release doesn't leave a placeholder visible.
  var pill = document.getElementById('version-pill');
  if (!pill) return;
  fetch('https://api.github.com/repos/da-rulez/dbzeeeu/releases/latest', {
    headers: { 'Accept': 'application/vnd.github+json' }
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (data && data.tag_name) {
        pill.textContent = data.tag_name;
        pill.removeAttribute('hidden');
      }
    })
    .catch(function () { /* leave hidden */ });
})();
