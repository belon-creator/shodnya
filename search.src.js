(function () {
  var q = (new URLSearchParams(location.search).get('q') || '').trim();
  var box = document.getElementById('results');
  var title = document.getElementById('sq');
  var inp = document.querySelector('.search input');
  if (inp) inp.value = q;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var words = q.toLowerCase().split(/\s+/).filter(Boolean).map(function (w) { return w.length <= 4 ? w : w.slice(0, Math.max(4, w.length - 4)); });
  if (!words.length) { box.innerHTML = '<p class="empty">Введіть запит у поле пошуку вгорі сторінки.</p>'; return; }
  title.textContent = 'Результати за запитом «' + q + '»';
  var res = [];
  (window.SEARCH || []).forEach(function (a) {
    var t = a.t.toLowerCase(), l = a.l.toLowerCase(), score = 0;
    words.forEach(function (w) {
      var hit = 0;
      if (t.indexOf(w) > -1) hit += 5;
      if (l.indexOf(w) > -1) hit += 2;
      if (a.x.indexOf(w) > -1) hit += 1;
      score += hit;
    });
    if (score > 0) res.push({ a: a, s: score });
  });
  res.sort(function (p, c) { return c.s - p.s; });
  res = res.slice(0, 30);
  if (!res.length) { box.innerHTML = '<p class="empty">Нічого не знайдено. Спробуйте інші слова або перегляньте <a href="archive.html">архів</a>.</p>'; return; }
  box.innerHTML = res.map(function (r) {
    var a = r.a;
    return '<div class="item ' + esc(a.k) + '"><div><div class="meta"><a href="' + esc(a.k) + '/">' + esc(a.n) + '</a> · ' + esc(a.d) + '</div>' +
      '<h2><a href="' + esc(a.u) + '">' + esc(a.t) + '</a></h2><p>' + esc(a.l) + '</p></div></div>';
  }).join('');
})();
