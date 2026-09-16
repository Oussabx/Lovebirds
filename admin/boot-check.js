/* If the dashboard scripts fail to load, say so instead of showing nothing. */
window.addEventListener('load', function () {
  if (window.__LBADMIN) return;
  var error = document.querySelector('[data-login-error]');
  if (!error) return;
  error.textContent = 'The dashboard files did not load. Try a hard refresh (Ctrl/Cmd + Shift + R); ' +
    'if it keeps happening the deployment may be mid-build.';
  error.hidden = false;
});
