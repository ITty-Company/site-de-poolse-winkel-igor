/* De Poolse Winkel Igor — demo-winkel: filters, mandje (localStorage), afronden, iDEAL-demo, boodschappenbriefje.
   Geen prijzen: alles «prijs in de winkel». */
(function () {
  'use strict';
  var KEY = 'igor-mandje', TEL = 'tel:+31630562199', WA = 'https://wa.me/31630562199';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load() { try { var c = JSON.parse(localStorage.getItem(KEY) || '{}'); return c && typeof c === 'object' ? c : {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} if (window.IGOR_BADGE) window.IGOR_BADGE(); else badge(); }
  function badge() { var n = count(); $$('.cart-count').forEach(function (b) { b.textContent = n; b.parentNode.classList.toggle('has', n > 0); }); }
  function count() { return Object.keys(cart).reduce(function (s, k) { return s + (+cart[k].q || 0); }, 0); }
  var cart = load();
  var grid = $('.pgrid'); if (!grid) return;
  var toast = $('.toast');
  function say(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('on'); }, 2600); }

  /* ---------- filters: categorie + smaak + zoeken ---------- */
  var cat = 'alles', smaak = '', q = '';
  var params = new URLSearchParams(location.search);
  var ps = (params.get('smaak') || '').toLowerCase();
  if (['zuur', 'zoet', 'hartig', 'vers'].indexOf(ps) > -1) smaak = ps;
  function apply() {
    var shown = 0;
    $$('.pcard', grid).forEach(function (p) {
      var ok = (cat === 'alles' || p.dataset.cat === cat) && (!smaak || p.dataset.smaak === smaak) &&
        (!q || p.textContent.toLowerCase().indexOf(q) > -1);
      p.hidden = !ok; if (ok) { shown++; p.classList.add('in'); }
    });
    $('.empty-grid').hidden = shown > 0;
    $$('.tab').forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.cat === cat); });
    $$('.smk').forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.smaak === smaak); });
  }
  $$('.tab').forEach(function (t) { t.addEventListener('click', function () { cat = t.dataset.cat; apply(); }); });
  $$('.smk').forEach(function (t) { t.addEventListener('click', function () { smaak = smaak === t.dataset.smaak ? '' : t.dataset.smaak; apply(); }); });
  $('.search').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); apply(); });
  $('.reset').addEventListener('click', function () { cat = 'alles'; smaak = ''; q = ''; $('.search').value = ''; apply(); });
  apply();
  if (smaak) setTimeout(function () { var c = $('#catalogus'); if (c) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }, 400);

  /* ---------- kaart: aantal + in mandje ---------- */
  $$('.pcard', grid).forEach(function (p) {
    var out = $('output', p), n = 1;
    $('.q-', p).addEventListener('click', function () { n = Math.max(1, n - 1); out.textContent = n; });
    $('.qp', p).addEventListener('click', function () { n = Math.min(20, n + 1); out.textContent = n; });
    $('.add', p).addEventListener('click', function () {
      var id = p.dataset.id;
      cart[id] = cart[id] || { q: 0, name: $('h3', p).textContent, cat: p.dataset.catname, img: $('img', p).getAttribute('src') };
      cart[id].q = Math.min(99, cart[id].q + n); fresh = id; save(); render(); fresh = null;
      fly($('img', p)); n = 1; out.textContent = 1;
      say('Toegevoegd aan je mandje.');
    });
  });
  function fly(img) {
    var target = $('.hd .cartbtn'); if (!target || reduce) return;
    var a = img.getBoundingClientRect(), b = target.getBoundingClientRect(), s = Math.min(a.width, a.height) * .6;
    var c = document.createElement('img'); c.src = img.src; c.alt = ''; c.className = 'flyer';
    c.style.cssText = 'left:' + (a.left + a.width / 2 - s / 2) + 'px;top:' + (a.top + a.height / 2 - s / 2) + 'px;width:' + s + 'px;height:' + s + 'px';
    document.body.appendChild(c);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      c.style.transform = 'translate(' + (b.left + b.width / 2 - a.left - a.width / 2) + 'px,' + (b.top + b.height / 2 - a.top - a.height / 2) + 'px) scale(.12)';
      c.style.opacity = '.4';
    }); });
    setTimeout(function () { c.remove(); target.classList.add('pop'); setTimeout(function () { target.classList.remove('pop'); }, 450); }, 780);
  }

  /* ---------- lade ---------- */
  var body = document.body, drawer = $('#mandje'), lastFocus = null;
  function openDrawer() { lastFocus = document.activeElement; body.classList.add('drawer-open'); drawer.setAttribute('aria-hidden', 'false'); if (window.IGOR_LENIS) window.IGOR_LENIS.stop(); setTimeout(function () { $('.x', drawer).focus(); }, 60); }
  function closeDrawer() { body.classList.remove('drawer-open'); drawer.setAttribute('aria-hidden', 'true'); if (window.IGOR_LENIS) window.IGOR_LENIS.start(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $$('.cartbtn,.mbtn,[data-open-cart]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openDrawer(); }); });
  $('.x', drawer).addEventListener('click', closeDrawer);
  $('.scrim').addEventListener('click', closeDrawer);
  addEventListener('keydown', function (e) { if (e.key === 'Escape') { if ($('.modal.on')) closeModal(); else if (body.classList.contains('drawer-open')) closeDrawer(); } });
  if (location.hash === '#mandje') setTimeout(openDrawer, 500);

  /* ---------- mandje-lijst ---------- */
  var fresh = null, list = $('#cartList'), empty = $('#cartEmpty'), form = $('#checkout'), totline = $('#totLine'), brief = $('#brief');
  function render() {
    list.innerHTML = '';
    Object.keys(cart).forEach(function (id) {
      var it = cart[id]; if (!it || !(it.q > 0)) { delete cart[id]; return; }
      var li = document.createElement('li'); if (id === fresh) li.className = 'new';
      li.innerHTML = '<img alt=""><span class="n"><span></span><small>prijs in de winkel</small></span><span class="rt"><span class="qty"><button type="button" aria-label="Eén minder">−</button><b></b><button type="button" aria-label="Eén meer">+</button></span><button type="button" class="rm">Verwijder</button></span>';
      $('img', li).src = it.img; $('.n span', li).textContent = it.name; $('b', li).textContent = it.q;
      var bs = $$('.qty button', li);
      bs[0].addEventListener('click', function () { it.q--; if (it.q <= 0) delete cart[id]; save(); render(); });
      bs[1].addEventListener('click', function () { it.q = Math.min(99, it.q + 1); save(); render(); });
      $('.rm', li).addEventListener('click', function () { delete cart[id]; save(); render(); say('Verwijderd uit je mandje.'); });
      list.appendChild(li);
    });
    var n = count();
    empty.hidden = n > 0; form.hidden = n === 0;
    totline.innerHTML = '<b>' + n + ' product' + (n === 1 ? '' : 'en') + ' · prijzen volgen in de winkel</b>Totaal: prijzen volgen in de winkel';
    if (!brief.hidden) makeBrief();
    $$('.mbtn .cart-count').forEach(function (b) { b.textContent = n; });
    mbtnCheck();
  }
  function mbtnCheck() {
    var m = $('.mbtn'), c = $('#catalogus'); if (!m || !c) return;
    var r = c.getBoundingClientRect();
    m.classList.toggle('show', count() > 0 && r.top < innerHeight * .6 && r.bottom > innerHeight * .5);
  }
  addEventListener('scroll', function () { mbtnCheck(); }, { passive: true });
  render();

  /* ---------- afronden (demo) ---------- */
  var modal = $('.modal');
  function closeModal() { modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true'); $('.pay').focus(); }
  $('.modal .close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  function check() {
    $$('.fld', form).forEach(function (f) { f.classList.remove('err'); });
    var bad = $$('[required]', form).filter(function (i) { return !i.value.trim(); });
    bad.forEach(function (i) { i.closest('.fld').classList.add('err'); });
    if (bad.length) { bad[0].focus(); say('Vul je naam en telefoonnummer in.'); return false; }
    return true;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!count()) { say('Nog niets in je mandje. Kijk rustig rond.'); return; }
    if (!check()) return;
    modal.classList.add('on'); modal.setAttribute('aria-hidden', 'false'); setTimeout(function () { $('.modal .close').focus(); }, 50);
  });

  /* ---------- boodschappenbriefje ---------- */
  function briefText() {
    var lines = ['Boodschappenbriefje — De Poolse Winkel Igor', 'Mendelssohnstraat 96, Waalwijk', ''];
    Object.keys(cart).forEach(function (id) { lines.push('- ' + cart[id].q + ' × ' + cart[id].name); });
    var naam = form.naam.value.trim(), wanneer = form.wanneer.value.trim(), opm = form.opmerking.value.trim();
    lines.push('');
    lines.push('Afhalen in de winkel');
    if (naam) lines.push('Naam: ' + naam);
    if (wanneer) lines.push('Wanneer: ' + wanneer);
    if (opm) lines.push('Opmerking: ' + opm);
    lines.push('Prijzen hoor ik graag in de winkel.');
    return lines.join('\n');
  }
  function makeBrief() {
    var t = briefText();
    $('pre', brief).textContent = t;
    $('#waLink').href = WA + '?text=' + encodeURIComponent(t);
  }
  $('#mkBrief').addEventListener('click', function () {
    if (!count()) { say('Nog niets in je mandje. Kijk rustig rond.'); return; }
    brief.hidden = false; makeBrief(); brief.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  });
  form.addEventListener('input', function () { if (!brief.hidden) makeBrief(); });
  $('#copyBrief').addEventListener('click', function () {
    var t = briefText(), done = function () { say('Gekopieerd. Neem het mee of lees het voor aan de telefoon.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { say('Kopiëren lukt niet — selecteer de tekst zelf.'); } ta.remove();
    }
  });
})();
