/* De Poolse Winkel Igor — demo winkel: filters, mandje (localStorage), boodschappenbriefje, iDEAL-demo. Geen prijzen. */
(function () {
  'use strict';
  var KEY = 'igor-mandje', TEL = 'tel:+31630562199', WA = 'https://wa.me/31630562199';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  var cart = load();
  function count() { return Object.keys(cart).reduce(function (s, k) { return s + cart[k].q; }, 0); }
  function badge() { $$('.cart-count').forEach(function (b) { b.textContent = count(); }); }
  var toast = $('.toast'), dtoast = $('#dtoast');
  // inside the open drawer the message sits under the total; on the page it is a compact bar at the bottom,
  // or at the top when the button that triggered it is in the bottom of the screen (never over that button)
  function say(t, src) {
    if (!toast) return;
    clearTimeout(say.t);
    if (document.body.classList.contains('cart-open') && dtoast) {
      dtoast.textContent = t; dtoast.classList.add('on');
      say.t = setTimeout(function () { dtoast.classList.remove('on'); }, 2600); return;
    }
    var r = src && src.getBoundingClientRect && src.getBoundingClientRect();
    toast.classList.toggle('top', !!(r && r.bottom > innerHeight - 120));
    toast.textContent = t; toast.classList.add('on');
    say.t = setTimeout(function () { toast.classList.remove('on'); }, 2600);
  }

  var grid = $('.pgrid'); if (!grid) return;
  var cards = $$('.pcard', grid), empty = $('.empty-msg', grid);

  /* ---------- filters: categorie × smaak × zoeken ---------- */
  var st = { cat: 'alles', smaak: '', q: '' };
  try { var sp = new URLSearchParams(location.search).get('smaak'); if (/^(zuur|zoet|hartig|vers)$/.test(sp || '')) st.smaak = sp; } catch (e) {}
  function apply() {
    var n = 0;
    cards.forEach(function (c) {
      var ok = (st.cat === 'alles' || c.dataset.cat === st.cat) && (!st.smaak || c.dataset.smaak === st.smaak) &&
        (!st.q || c.dataset.search.indexOf(st.q) > -1);
      c.hidden = !ok; if (ok) n++;
    });
    empty.hidden = n > 0;
    $$('.ftab').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cat === st.cat); });
    $$('.schip').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.smaak === st.smaak); });
    $('#resultaat').textContent = n + (n === 1 ? ' voorbeeldproduct' : ' voorbeeldproducten') + (st.smaak ? ' · smaak: ' + st.smaak : '');
  }
  $$('.ftab').forEach(function (b) { b.addEventListener('click', function () { st.cat = b.dataset.cat; apply(); }); });
  $$('.schip').forEach(function (b) { b.addEventListener('click', function () { st.smaak = st.smaak === b.dataset.smaak ? '' : b.dataset.smaak; apply(); }); });
  $('.search').addEventListener('input', function (e) { st.q = e.target.value.trim().toLowerCase(); apply(); });
  apply();
  if (st.smaak) {
    var go = function () {
      var t = $('#assortiment'); if (!t) return;
      if (window.__lenis) window.__lenis.scrollTo(t, { immediate: true, offset: -70 }); else t.scrollIntoView();
    };
    if (document.readyState === 'complete') setTimeout(go, 50); else addEventListener('load', function () { setTimeout(go, 50); });
  }

  /* ---------- aantal + in mandje ---------- */
  cards.forEach(function (p) {
    var out = $('output', p), q = 1;
    $('.q-', p).addEventListener('click', function () { q = Math.max(1, q - 1); out.textContent = q; });
    $('.qp', p).addEventListener('click', function () { q = Math.min(20, q + 1); out.textContent = q; });
    $('.add', p).addEventListener('click', function () {
      var id = p.dataset.id, img = $('.ph img', p);
      cart[id] = cart[id] || { q: 0, name: $('h3', p).textContent, cat: p.dataset.catname, img: img ? img.getAttribute('src') : '', pl: p.dataset.pl || '' };
      cart[id].q = Math.min(99, cart[id].q + q); save(); fresh = id; render(); fresh = null; badge();
      fly(img || $('.ph', p));
      q = 1; out.textContent = 1;
      say('Toegevoegd aan je mandje.', $('.add', p));
    });
  });
  function fly(el) {
    var target = $('.hd .cart-btn'); if (!target || reduce || !el) return;
    var a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
    var c = el.tagName === 'IMG' ? el.cloneNode() : document.createElement('div');
    c.className = 'flyer'; if (c.tagName === 'DIV') c.style.background = 'var(--accent)';
    c.style.left = a.left + 'px'; c.style.top = a.top + 'px'; c.style.width = a.width + 'px'; c.style.height = a.height + 'px';
    document.body.appendChild(c);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      c.style.transform = 'translate(' + (b.left + b.width / 2 - a.left - a.width / 2) + 'px,' + (b.top + b.height / 2 - a.top - a.height / 2) + 'px) scale(.08)';
      c.style.opacity = '.4';
    }); });
    setTimeout(function () { c.remove(); target.classList.add('pop'); setTimeout(function () { target.classList.remove('pop'); }, 450); }, 760);
  }

  /* ---------- drawer ---------- */
  var drawer = $('#mandje'), scrim = $('.scrim'), lastFocus = null;
  function openD() { lastFocus = document.activeElement; drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('cart-open'); if (toast) toast.classList.remove('on'); $('.x', drawer).focus(); if (window.__lenis) window.__lenis.stop(); }
  function closeD() { drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('cart-open'); if (window.__lenis) window.__lenis.start(); if (lastFocus) lastFocus.focus(); }
  $$('.cart-btn').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openD(); }); });
  $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openD(); }); });
  $('.x', drawer).addEventListener('click', closeD); scrim.addEventListener('click', closeD);
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('open')) closeD(); });
  if (location.hash === '#mandje') setTimeout(openD, 400);

  /* ---------- lijst ---------- */
  var fresh = null, list = $('#cartList'), emptyC = $('#cartEmpty'), totEl = $('#cartTot'), pre = $('#briefje');
  function briefText() {
    var ids = Object.keys(cart); if (!ids.length) return '';
    return 'Boodschappenbriefje — De Poolse Winkel Igor\nMendelssohnstraat 96, Waalwijk\n\n' +
      ids.map(function (id) { return '- ' + cart[id].q + '× ' + cart[id].name; }).join('\n') + '\n\nPrijzen volgen in de winkel.';
  }
  function render() {
    list.innerHTML = '';
    var ids = Object.keys(cart);
    ids.forEach(function (id) {
      var it = cart[id], li = document.createElement('li'); if (id === fresh) li.className = 'new';
      li.innerHTML = (it.img ? '<img class="th" alt="">' : '<span class="th"></span>') + '<span class="n"></span><span class="qq"><button type="button" aria-label="Minder">−</button><b>' + it.q + '</b><button type="button" aria-label="Meer">+</button></span><button type="button" class="rm">Verwijderen</button>';
      if (it.img) li.querySelector('img').src = it.img; else li.querySelector('.th').textContent = (it.name || '?').charAt(0);
      var nm = li.querySelector('.n'); nm.textContent = it.name; var sm = document.createElement('small'); sm.textContent = 'prijs in de winkel'; nm.appendChild(sm);
      var bs = li.querySelectorAll('.qq button');
      bs[0].addEventListener('click', function () { it.q--; if (it.q <= 0) delete cart[id]; save(); render(); badge(); });
      bs[1].addEventListener('click', function () { it.q = Math.min(99, it.q + 1); save(); render(); badge(); });
      li.querySelector('.rm').addEventListener('click', function () { delete cart[id]; save(); render(); badge(); say('Verwijderd uit je mandje.'); });
      list.appendChild(li);
    });
    var n = count();
    emptyC.hidden = n > 0;
    totEl.innerHTML = '<span>' + n + (n === 1 ? ' product' : ' producten') + '</span><span>prijzen volgen in de winkel</span>';
    var t = briefText(); pre.textContent = t || 'Nog leeg — voeg iets toe, dan schrijven we hier je briefje.';
    $('#waBrief').href = WA + (t ? '?text=' + encodeURIComponent(t) : '');
    $$('.needs-items').forEach(function (b) { b.toggleAttribute('disabled', !n); b.setAttribute('aria-disabled', !n); });
  }
  render(); badge();

  /* ---------- briefje ---------- */
  $('#copyBrief').addEventListener('click', function () {
    var t = briefText(); if (!t) { say('Je mandje is nog leeg.'); return; }
    var done = function () { say('Gekopieerd. Neem het mee of lees het voor aan de telefoon.'); };
    var fallback = function () {
      var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { say('Kopiëren lukt niet — selecteer de tekst zelf.'); } ta.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
  });

  /* ---------- afronden (demo) ---------- */
  var form = $('#checkout'), dlg = $('#idealDemo');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!count()) { say('Je mandje is nog leeg.'); return; }
    $$('.fld', form).forEach(function (f) { f.classList.remove('err'); });
    var bad = $$('[required]', form).filter(function (i) { return !i.value.trim(); });
    if (bad.length) { bad.forEach(function (i) { i.closest('.fld').classList.add('err'); }); bad[0].focus(); say('Vul je naam en telefoonnummer in.'); return; }
    if (dlg && dlg.showModal) dlg.showModal(); else alert('Dit is een ontwerpvoorstel. Er wordt niets betaald en niets verstuurd.');
  });
  if (dlg) $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  var clear = $('#clearCart');
  if (clear) clear.addEventListener('click', function () { cart = {}; save(); render(); badge(); if (dlg) dlg.close(); form.reset(); say('Je mandje is leeg.'); });
})();
