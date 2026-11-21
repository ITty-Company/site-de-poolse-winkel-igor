/* De Poolse Winkel Igor — scroll film, bubble portal, pekelklok, smaakkompas, «deksel» page transition. No frameworks. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = matchMedia('(max-width:760px)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var ease = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var pad = function (n) { return ('0' + n).slice(-2); };
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var WA_CONFIRMED = false; // zodra de winkel WhatsApp bevestigt: true → label «nog te bevestigen» verdwijnt
  if (WA_CONFIRMED) $$('.wa-note').forEach(function (n) { n.remove(); });

  /* ---------- page transition «deksel» ---------- */
  var ORDER = ['index.html', 'winkel.html', 'over-ons.html', 'contact.html'];
  var LBL = { 'index.html': 'home.', 'winkel.html': 'winkel.', 'over-ons.html': 'over de winkel.', 'contact.html': 'contact.', '404.html': 'oeps.' };
  var dk = $('#deksel'), root = document.documentElement;
  function fileOf(u) { var f = u.pathname.split('/').pop(); return f || 'index.html'; }
  if (dk) {
    var lblEl = $('.lbl', dk);
    if (window.__dk) lblEl.textContent = window.__dk;
    var open = function () {
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        root.classList.remove('dk-noanim'); root.classList.remove('dk-closed');
        setTimeout(function () { root.classList.remove('dk-ccw'); }, 700);
      }); });
    };
    if (root.classList.contains('dk-closed')) open();
    addEventListener('pageshow', function (e) { if (e.persisted) { root.classList.remove('dk-closed', 'dk-noanim', 'dk-ccw'); } });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || a.target) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/\.html$|\/$/.test(u.pathname)) return;
      var to = fileOf(u), from = fileOf(location);
      if (to === from && u.hash) return;
      if (to === from && u.search === location.search) return;
      e.preventDefault();
      var ccw = ORDER.indexOf(to) < ORDER.indexOf(from);
      var lbl = LBL[to] || '…';
      lblEl.textContent = lbl;
      try { sessionStorage.setItem('dk', JSON.stringify({ l: lbl, c: ccw })); } catch (er) {}
      root.classList.toggle('dk-ccw', ccw);
      root.classList.add('dk-noanim');
      requestAnimationFrame(function () {
        root.classList.remove('dk-noanim');
        requestAnimationFrame(function () { root.classList.add('dk-closed'); });
      });
      setTimeout(function () { location.href = u.href; }, reduce ? 220 : 680);
    });
  }

  /* ---------- header ---------- */
  var hd = $('.hd'), burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var o = document.body.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o);
    });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { document.body.classList.remove('menu-open'); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') document.body.classList.remove('menu-open'); });
  }
  try {
    var c = JSON.parse(localStorage.getItem('igor-mandje')) || {}, n = 0;
    Object.keys(c).forEach(function (k) { n += c[k].q || 0; });
    $$('.cart-count').forEach(function (b) { b.textContent = n; });
  } catch (e) {}

  /* autoplay loops (contact hero): mobile crop on phones, poster only with reduced motion */
  $$('video[data-auto]').forEach(function (v) {
    if (mobile && v.dataset.posterM) v.poster = v.dataset.posterM;
    if (reduce) return;
    v.src = mobile ? v.dataset.srcM : v.dataset.src; v.muted = true;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  });

  /* ---------- scroll films ---------- */
  function loadBlob(url, onProgress) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      var total = +r.headers.get('content-length') || 0;
      if (!r.body || !total || !window.ReadableStream) return r.blob();
      var rd = r.body.getReader(), got = 0, parts = [];
      return (function pump() {
        return rd.read().then(function (x) {
          if (x.done) return new Blob(parts, { type: 'video/mp4' });
          parts.push(x.value); got += x.value.length; onProgress && onProgress(got / total);
          return pump();
        });
      })();
    }).then(function (b) { return URL.createObjectURL(b); });
  }

  var films = $$('.film').map(function (film) {
    if (reduce) { film.classList.add('still'); return null; }
    var CH = JSON.parse($('script[type="application/json"]', film).textContent);
    var N = CH.length, hero = $('.fhero', film);
    var rests = (hero ? [{ at: 0, ch: -1 }] : []).concat(CH.map(function (c, i) { return { at: c.at, ch: i }; }));
    var M = rests.length, HOLD = .7; // extra scroll after the last chapter so it can be read
    var stage = $('.stage', film), V = $('video', film), cv = $('canvas.fx', film), ctx = cv.getContext('2d');
    var T = $('.ftitle', film), H2 = $('h2', T), S = $('p', T), cards = $$('.fcard', film);
    var hud = $('.hud', film), hudT = $('.hud span', film), dots = $$('.hud i b', film), load = $('.hud .load s', film);
    var bar = $('.fbar i', film), hint = $('.fhint', film), fade = $('.fade', film);
    var big = $('.bigword', film), bigS = big && $('span', big);
    var jar = JSON.parse(film.dataset.jar || 'null');
    var JR = jar ? (mobile ? jar.m : jar.d) : null;
    var VW = mobile ? 432 : 1280, VH = mobile ? 768 : 726;
    var label = film.dataset.hud || '', push = film.hasAttribute('data-push');
    var cur = -2, vt = 0, want = 0, pS = 0, letters = [], jarPx = null, ready = false;
    var FX = { mode: 'dust', k: 1, parts: [] };

    var src = mobile ? film.dataset.srcM : film.dataset.src;
    if (mobile && film.dataset.posterM) V.poster = film.dataset.posterM;
    V.muted = true;
    V.addEventListener('loadedmetadata', function () { V.pause(); ready = true; VW = V.videoWidth || VW; VH = V.videoHeight || VH; V.currentTime = vt = want; });
    var started = false;
    function start() {
      if (started) return; started = true;
      loadBlob(src, function (k) { if (load) load.style.width = (k * 100) + '%'; })
        .then(function (u) { V.src = u; if (load) load.parentNode.style.opacity = 0; })
        .catch(function () { V.src = src; });
    }
    if (film.getBoundingClientRect().top < innerHeight * 2.5) start();

    cards.forEach(function (cd) {
      var m = $('.more', cd);
      if (m) m.addEventListener('click', function () { var x = cd.classList.toggle('x'); m.textContent = x ? 'minder −' : 'lees verder +'; m.setAttribute('aria-expanded', x); });
    });

    function setTitle(i) {
      if (i < 0) { H2.innerHTML = ''; S.textContent = ''; letters = []; }
      else {
        var k = 0;
        H2.innerHTML = CH[i].t.split(' ').map(function (w) {
          return '<span class="w">' + w.split('').map(function (ch) { return '<span style="--k:' + (k++) + '">' + ch + '</span>'; }).join('') + '</span>';
        }).join(' ');
        H2.setAttribute('aria-label', CH[i].t);
        S.textContent = CH[i].s;
        letters = $$('.w span', H2);
        T.classList.toggle('low', CH[i].pos === 'low');
      }
      var j = Math.max(i, 0);
      if (hudT) hudT.textContent = label + ' · ' + pad(j + 1) + ' / ' + pad(N);
      dots.forEach(function (d, k) { d.classList.toggle('on', k === j); });
      if (bigS && CH[j].w && bigS.textContent !== CH[j].w) {
        bigS.classList.add('off');
        clearTimeout(setTitle.t);
        setTitle.t = setTimeout(function () { bigS.textContent = CH[j].w; bigS.classList.remove('off'); }, 320);
      }
    }
    var seg = function (f) { return ease((f - .18) / .64); };
    function size() { cv.width = stage.clientWidth * dpr; cv.height = stage.clientHeight * dpr; }
    size(); addEventListener('resize', size);

    /* camera: the video is scaled about origin (ox, oy) and moved by ty px (screen space) */
    var cam = { S: 1, ox: 0, oy: 0, ty: 0 };
    function cover() {
      var W = stage.clientWidth, Hh = stage.clientHeight, s0 = Math.max(W / VW, Hh / VH);
      var dw = VW * s0, dh = VH * s0;
      return { W: W, H: Hh, dw: dw, dh: dh, ox: (W - dw) / 2, oy: (Hh - dh) / 2 };
    }
    function jarRect() {
      if (!JR) return null;
      var c = cover();
      var tx = function (fx) { return cam.ox + (c.ox + fx * c.dw - cam.ox) * cam.S; };
      var ty = function (fy) { return cam.oy + (c.oy + fy * c.dh - cam.oy) * cam.S + cam.ty; };
      return { x0: tx(JR[0]), x1: tx(JR[1]), y0: ty(JR[2]), y1: ty(JR[3]) };
    }
    function camera(heroO) {
      var c = cover();
      if (push) {
        // one continuous scroll-linked push-in across the whole film (1.00 -> 1.12, drifting down into the jar),
        // with a small pull-back at the very end before the portal
        var k = ease(pS / .93), back = ease((pS - .93) / .07);
        cam.S = 1 + .12 * k - .02 * back;
        cam.ox = JR ? c.ox + (JR[0] + JR[1]) / 2 * c.dw : c.W / 2;
        cam.oy = c.H * .45;
        cam.ty = -c.H * (.03 * k - .005 * back) - (mobile ? c.H * .1 * heroO : 0);
      } else {
        cam.S = 1.03 + .05 * Math.sin(Math.PI * pS); cam.ox = c.W / 2; cam.oy = c.H * (mobile ? .5 : .45); cam.ty = 0;
      }
      V.style.transformOrigin = cam.ox.toFixed(1) + 'px ' + cam.oy.toFixed(1) + 'px';
      V.style.transform = 'translate3d(0,' + cam.ty.toFixed(2) + 'px,0) scale(' + cam.S.toFixed(4) + ')';
      if (push && pS > .999) window.__filmEnd = { S: cam.S, ox: cam.ox / c.W, oy: cam.oy / c.H, ty: cam.ty / c.H };
    }

    function render() {
      var r = film.getBoundingClientRect(), total = film.offsetHeight - innerHeight;
      if (r.bottom < -200 || r.top > innerHeight + 200) { if (r.top < innerHeight * 2.5) start(); return false; }
      start();
      var raw = clamp(-r.top / total, 0, 1);
      pS += (raw - pS) * .2; if (Math.abs(raw - pS) < .0002) pS = raw;
      var u = Math.min(pS * (M - 1 + HOLD), M - 1), i = Math.min(Math.floor(u), M - 2), f = u - i;
      want = rests[i].at + (rests[i + 1].at - rests[i].at) * seg(f);
      var near = f < .5 ? f : f - 1, nr = f < .5 ? i : i + 1, ch = rests[nr].ch;
      var vis = 1 - ease((Math.abs(near) - .1) / .22);
      if (ch !== cur) { cur = ch; setTitle(ch); }
      var heroO = hero ? 1 - ease(u / .42) : 0;
      camera(heroO);
      if (hero) {
        hero.style.opacity = heroO; hero.style.translate = '0 ' + (-(1 - heroO) * 50) + 'px';
        hero.style.pointerEvents = heroO > .4 ? 'auto' : 'none'; hero.style.visibility = heroO < .01 ? 'hidden' : 'visible';
      }
      var endF = push ? 1 - ease((pS - .94) / .055) : 1; // overlays leave before the portal takes over the frame
      var tv = (ch < 0 ? 0 : vis) * endF;
      if (push) [hud, bar && bar.parentNode, $('.ftag', film)].forEach(function (el) { if (el) el.style.opacity = endF; });
      letters.forEach(function (sp, k) {
        var d = clamp((tv - k / Math.max(1, letters.length - 1) * .35) / .6, 0, 1);
        sp.style.opacity = d; sp.style.transform = 'translateY(' + ((1 - d) * .45).toFixed(3) + 'em)'; sp.style.filter = d > .99 ? 'none' : 'blur(' + ((1 - d) * 8).toFixed(1) + 'px)';
      });
      S.style.opacity = tv; T.style.setProperty('--sh', tv);
      cards.forEach(function (el, k) {
        var o = k === ch ? ease((tv - .25) / .5) : 0;
        el.style.opacity = o; el.style.transform = 'translateY(' + ((1 - o) * 24) + 'px)'; el.classList.toggle('on', o > .6);
      });
      if (bar) bar.style.width = (pS * 100) + '%';
      if (hint) hint.style.opacity = pS < .015 ? 1 : 0;
      if (fade) fade.style.opacity = ease((pS - .88) / .12);
      jarPx = jarRect();
      if (big && jarPx) {
        var w = jarPx.x1 - jarPx.x0, h = jarPx.y1 - jarPx.y0;
        big.style.setProperty('--hx', jarPx.x0 + 'px'); big.style.setProperty('--hy', jarPx.y0 + 'px');
        big.style.setProperty('--hw', w + 'px'); big.style.setProperty('--hh', h + 'px');
        big.style.setProperty('--bx', (jarPx.x0 + w / 2) + 'px'); big.style.setProperty('--by', (jarPx.y0 + h * .56) + 'px');
        big.style.opacity = (1 - heroO) * (.45 + .55 * vis) * endF;
      }
      FX.mode = CH[Math.max(ch, 0)].fx; FX.k = .25 + .75 * (ch < 0 ? .6 : vis);
      return true;
    }

    /* particles live around the jar */
    function spawn() {
      var W = cv.width, Hh = cv.height, R = Math.random, m = FX.mode, J = jarPx || { x0: W * .3 / dpr, x1: W * .45 / dpr, y0: Hh * .3 / dpr, y1: Hh * .85 / dpr };
      var jx0 = J.x0 * dpr, jx1 = J.x1 * dpr, jy0 = J.y0 * dpr, jy1 = J.y1 * dpr, jw = jx1 - jx0;
      if (m === 'drops') return { x: jx0 + R() * jw, y: jy0 - 40 * dpr - R() * Hh * .2, vx: 0, vy: 1.5 + R() * 2, r: (1.5 + R() * 2.2) * dpr, c: '246,248,234', a: .85, g: .05, life: 1, dec: .008, floor: jy1 };
      if (m === 'seeds') return { x: jx0 + jw * .2 + R() * jw * .6, y: -10, vx: (R() - .5) * .5, vy: 1.6 + R() * 2.4, r: (1.4 + R() * 1.6) * dpr, c: '227,155,18', a: 1, g: .05, life: 1, dec: .004, floor: jy0 + (jy1 - jy0) * .25 };
      if (m === 'bubbles' || m === 'warm' && R() < .55) return { x: jx0 + jw * .12 + R() * jw * .76, y: jy1 - (jy1 - jy0) * .08, vx: (R() - .5) * .25, vy: -(.5 + R() * 1.2), r: (1 + R() * 2.6) * dpr, c: '246,248,234', a: .8, g: -.01, life: 1, dec: .006, ring: 1, ceil: jy0 + (jy1 - jy0) * (m === 'warm' ? .1 : .45) };
      if (m === 'glints') return { x: jx0 + R() * jw, y: jy0 + R() * (jy1 - jy0) * .6, vx: 0, vy: 0, r: (2 + R() * 5) * dpr, c: '255,255,255', a: 1, g: 0, life: 1, dec: .02, star: 1 };
      var warm = m === 'warm';
      return { x: R() * W, y: R() * Hh * .8, vx: (R() - .3) * .25, vy: (R() - .5) * .2, r: (.8 + R() * 2) * dpr, c: warm ? '255,206,110' : '255,255,245', a: .8, g: 0, life: 0, dec: -.004, fadeIn: 1, soft: 1 };
    }
    function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      var nn = FX.mode === 'glints' ? .25 : FX.mode === 'dust' || FX.mode === 'warm' ? 1 : 2;
      for (var k = 0; k < Math.ceil(nn); k++) if (Math.random() < FX.k * Math.min(nn, 1)) FX.parts.push(spawn());
      FX.parts = FX.parts.filter(function (q) {
        q.vy += q.g; q.x += q.vx; q.y += q.vy;
        if (q.fadeIn) { q.life -= q.dec; if (q.life >= 1) { q.fadeIn = 0; q.dec = .003; } }
        else q.life -= q.dec;
        if (q.floor && q.y > q.floor) { q.y = q.floor; q.life -= .08; }
        if (q.ceil && q.y < q.ceil) q.life -= .1;
        if (q.life <= 0 && !q.fadeIn || q.y > cv.height + 20 || q.y < -60) return false;
        var al = clamp(q.life, 0, 1) * q.a;
        if (q.star) {
          var s = q.r * Math.sin(q.life * Math.PI);
          ctx.strokeStyle = 'rgba(255,255,255,' + al + ')'; ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(q.x - s, q.y); ctx.lineTo(q.x + s, q.y); ctx.moveTo(q.x, q.y - s); ctx.lineTo(q.x, q.y + s); ctx.stroke();
          return true;
        }
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283);
        if (q.ring) { ctx.strokeStyle = 'rgba(' + q.c + ',' + al + ')'; ctx.lineWidth = dpr; ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(' + q.c + ',' + al + ')'; ctx.fill(); }
        return true;
      });
      if (FX.parts.length > 420) FX.parts.splice(0, FX.parts.length - 420);
    }
    function seek() {
      if (!ready || !V.duration) return;
      var tgt = Math.min(want, V.duration - .05);
      if (Math.abs(vt - tgt) > .002) { vt += (tgt - vt) * .3; if (Math.abs(vt - tgt) < .01) vt = tgt; if (!V.seeking) V.currentTime = vt; }
    }
    function endCam() { var keep = pS; pS = 1; camera(0); pS = keep; }
    if (push) { endCam(); addEventListener('resize', endCam); }
    setTitle(hero ? -1 : 0);
    return { render: render, tick: tick, seek: seek };
  }).filter(Boolean);

  /* ---------- portal: bubbles of brine → shelf ---------- */
  var portals = $$('.portal').map(function (sec) {
    if (reduce) { sec.classList.add('still'); return null; }
    var stage = $('.pstage', sec), cv = $('canvas', sec), txt = $('.ptext', sec), note = $('.pnote', sec), tag = $('.ptag', sec), dark = $('.pdark', sec);
    var A = mobile ? sec.dataset.aM : sec.dataset.a, B = mobile ? sec.dataset.bM : sec.dataset.b;
    var fbA = $('.pfb.a', sec), fbB = $('.pfb.b', sec);
    var gl = null, prog, U = {}, texs = [], sizes = [[1, 1], [1, 1]], loaded = 0, mx = 0, my = 0, smx = 0, smy = 0, t0 = performance.now();
    try { gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; }
    if (fbA) fbA.src = A; if (fbB) fbB.src = B;
    if (gl) {
      var vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
      var fs = [
        'precision highp float;varying vec2 uv;uniform sampler2D A,B;uniform vec2 R,SA,SB,MO,O,TT;uniform float P,T,Z,KB;',
        'vec2 cov(vec2 u,vec2 s,float z,vec2 o){float ra=R.x/R.y,ia=s.x/s.y;vec2 sc=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);return (u-o)*sc/z+o;}',
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'void main(){float asp=R.x/R.y;vec2 us=vec2(uv.x,1.-uv.y);vec2 qs=O+(us-TT-O)/Z;vec2 qa=vec2(qs.x,1.-qs.y);float rA=R.x/R.y,iA=SA.x/SA.y;vec2 scA=rA>iA?vec2(1.,iA/rA):vec2(rA/iA,1.);vec2 ua=(qa-.5)*scA+.5;',
        'float m=0.,rim=0.;vec2 rf=vec2(0.);',
        'for(int l=0;l<3;l++){float fl=float(l);float s=4.+fl*3.5;vec2 q=vec2(uv.x*asp,uv.y)*s;q.y-=T*(.18+.1*fl)+P*(5.+fl*2.5);',
        'vec2 c=floor(q);vec2 f=fract(q)-.5;float r1=h(c+fl*7.1),r2=h(c+3.3+fl*1.7);vec2 o=(vec2(r1,r2)-.5)*.4;',
        'float g=smoothstep(r1*.45,r1*.45+.28,P*2.6-uv.y*.9);float rad=.44*g*(.45+.55*r2);float d=length(f-o);',
        'float b=smoothstep(rad,rad-.03,d)*step(.001,rad);float rr=smoothstep(rad-.09,rad-.015,d)*b;m=max(m,b);rim=max(rim,rr);rf+=(f-o)*b*.06;}',
        'vec3 L=vec3(.871,.922,.749),PA=vec3(.965,.973,.918),AC=vec3(.89,.608,.07);',
        'vec3 a=texture2D(A,ua).rgb;vec3 ins=mix(texture2D(A,ua+rf).rgb,PA,.5);',
        'vec3 col=mix(a,ins,m);col=mix(col,PA,rim*.75);col+=AC*rim*.12*(1.-P);',
        'col=mix(col,L,smoothstep(.3,.5,P));',
        'vec2 d2=(uv-.5)*vec2(asp,1.);float an=atan(d2.y,d2.x);float dist=length(d2)+.018*sin(an*9.+T*1.4)+.012*sin(an*15.-T*.9);',
        'float Rr=mix(-.05,length(vec2(asp,1.))*.5+.08,smoothstep(.44,.96,P));float mb=smoothstep(Rr,Rr-.035,dist);',
        'vec3 bb=texture2D(B,cov(uv,SB,KB,vec2(.5))+MO*.01).rgb;float e=smoothstep(Rr-.06,Rr-.012,dist)*mb*(1.-smoothstep(.95,1.,P));',
        'col=mix(col,bb,mb);col=mix(col,PA,e*.7);gl_FragColor=vec4(col,1.);}'
      ].join('\n');
      var sh = function (t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      try {
        prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); gl.useProgram(prog);
        var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var lp = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
        ['A', 'B', 'R', 'SA', 'SB', 'MO', 'O', 'TT', 'P', 'T', 'Z', 'KB'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
        [A, B].forEach(function (url, i) {
          var tx = gl.createTexture(); texs[i] = tx;
          gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([222, 235, 191, 255]));
          ['TEXTURE_WRAP_S', 'TEXTURE_WRAP_T'].forEach(function (w) { gl.texParameteri(gl.TEXTURE_2D, gl[w], gl.CLAMP_TO_EDGE); });
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          var im = new Image(); im.onload = function () {
            gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); sizes[i] = [im.naturalWidth, im.naturalHeight]; loaded++;
          }; im.src = url;
        });
        gl.uniform1i(U.A, 0); gl.uniform1i(U.B, 1);
        sec.classList.add('gl');
      } catch (e) { gl = null; }
    }
    function size() { var k = Math.min(dpr, 1.5); cv.width = stage.clientWidth * k; cv.height = stage.clientHeight * k; if (gl) gl.viewport(0, 0, cv.width, cv.height); }
    size(); addEventListener('resize', size);
    if (fine) addEventListener('mousemove', function (e) { mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1); });
    var sm = 0;
    return function () {
      var r = sec.getBoundingClientRect(), total = sec.offsetHeight - innerHeight;
      sec.classList.toggle('live', r.top <= 1);
      if (r.bottom < 0 || r.top > 1) return;
      var raw = clamp(-r.top / total, 0, 1); sm += (raw - sm) * .2;
      var P = clamp(sm / .34, 0, 1), q = sm;
      var kb = 1 + .07 * ease((q - .34) / .66);
      smx += (mx - smx) * .05; smy += (my - smy) * .05;
      if (gl) {
        gl.uniform2f(U.R, cv.width, cv.height); gl.uniform2f(U.SA, sizes[0][0], sizes[0][1]); gl.uniform2f(U.SB, sizes[1][0], sizes[1][1]);
        gl.uniform2f(U.MO, smx, smy); gl.uniform1f(U.P, P); gl.uniform1f(U.T, (performance.now() - t0) / 1000); var fe = window.__filmEnd || { S: 1.03, ox: .5, oy: .45, ty: 0 }; gl.uniform1f(U.Z, fe.S); gl.uniform2f(U.O, fe.ox, fe.oy); gl.uniform2f(U.TT, 0, fe.ty); gl.uniform1f(U.KB, kb);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else if (fbB) {
        fbB.style.setProperty('--r', (ease((P - .3) / .7) * 75) + '%');
        fbB.style.transform = 'scale(' + kb + ')';
      }
      var o = ease((q - .4) / .1) * (1 - ease((q - .88) / .08));
      if (note) note.style.opacity = ease((P - .3) / .12) * (1 - ease((P - .5) / .1));
      txt.style.opacity = o; txt.style.transform = 'translateY(' + ((1 - o) * 40) + 'px)'; txt.style.pointerEvents = o > .5 ? 'auto' : 'none';
      var dk2 = ease((q - .86) / .14);
      if (tag) tag.style.opacity = ease((P - .9) / .1) * (1 - ease((q - .8) / .06));
      if (dark) dark.style.opacity = dk2;
    };
  }).filter(Boolean);

  /* ---------- reveals ---------- */
  $$('.words').forEach(function (el) {
    var i = 0;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wd" style="--i:' + (i++) + '">' + w + '</span>'; }).join(' ');
  });
  $$('.fill p').forEach(function (p) {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wd">' + w + '</span>'; }).join(' ');
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15 });
  $$('.rv,.words').forEach(function (el) { io.observe(el); });

  /* glow under cursor on glass */
  if (fine) $$('.glow-follow').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- smaakkompas ---------- */
  $$('.kompas').forEach(function (k) {
    var out = $('.kompas-out', k), txt = $('p', out), link = $('a', out);
    $$('.lid', k).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.lid', k).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        out.classList.add('sw');
        setTimeout(function () { txt.textContent = b.dataset.txt; link.href = 'winkel.html?smaak=' + b.dataset.k; link.querySelector('span').textContent = 'Kijk in de winkel — ' + b.dataset.k; out.classList.remove('sw'); }, 220);
      });
    });
  });

  /* ---------- pekelklok: slider scrubs the light of one day ---------- */
  var klokken = $$('.klok').map(function (k) {
    var V = $('video', k), rg = $('input', k), lb = $$('.lbls span', k), day = $('.day', k);
    var target = 0, vt = 0, touched = false, demo = null, loaded = false;
    var names = ['vers', 'licht zuur', 'kiszone'];
    function set(v) {
      rg.style.setProperty('--v', (v / 10) + '%');
      var idx = v < 333 ? 0 : v < 666 ? 1 : 2;
      lb.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
      day.textContent = names[idx];
      target = v / 1000;
    }
    rg.addEventListener('input', function () { touched = true; set(+rg.value); });
    set(+rg.value);
    var ob = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (!loaded) { loaded = true; loadBlob(V.dataset.src).then(function (u) { V.src = u; }).catch(function () { V.src = V.dataset.src; }); }
        if (!touched && !demo && !reduce) {
          var t0 = performance.now();
          demo = function (t) { if (touched) return; var x = ease((t - t0) / 4200) * 1000; rg.value = x; set(x); if (x < 1000) requestAnimationFrame(demo); };
          setTimeout(function () { requestAnimationFrame(demo); }, 600);
        }
      });
    }, { threshold: .45 });
    ob.observe(k);
    V.addEventListener('loadedmetadata', function () { V.pause(); });
    return function () {
      if (!V.duration) return;
      var tg = target * (V.duration - .05);
      if (Math.abs(vt - tg) > .002) { vt += (tg - vt) * .25; if (!V.seeking) V.currentTime = vt; }
    };
  });

  /* ---------- ambient canvases: rising bubbles (dark band), dust in sunbeam (finale) ---------- */
  var ambient = $$('canvas.bub, canvas.dust').map(function (cv) {
    var ctx = cv.getContext('2d'), parts = [], bub = cv.classList.contains('bub');
    function size() { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; }
    size(); addEventListener('resize', size);
    return function () {
      var r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var W = cv.width, H = cv.height, R = Math.random;
      if (R() < (bub ? .35 : .6)) parts.push(bub
        ? { x: R() * W, y: H + 10, vx: 0, vy: -(.4 + R() * .9), r: (2 + R() * 7) * dpr, life: 1, w: R() * 6 }
        : { x: W * (.25 + R() * .7), y: R() * H, vx: -(.05 + R() * .2), vy: (R() - .6) * .25, r: (.8 + R() * 2.2) * dpr, life: 0, up: 1, gold: R() < .25 });
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter(function (q) {
        q.x += q.vx + (bub ? Math.sin((q.y + q.w * 100) / 60) * .3 : 0); q.y += q.vy;
        if (q.up) { q.life += .006; if (q.life >= 1) q.up = 0; } else q.life -= bub ? .0015 : .004;
        if (q.life <= 0 && !q.up || q.y < -20) return false;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283);
        if (bub) { ctx.strokeStyle = 'rgba(246,248,234,' + (.22 * q.life) + ')'; ctx.lineWidth = dpr; ctx.stroke(); }
        else { ctx.fillStyle = q.gold ? 'rgba(255,200,90,' + (.8 * q.life) + ')' : 'rgba(255,255,248,' + (.9 * q.life) + ')'; ctx.fill(); }
        return true;
      });
      if (parts.length > 260) parts.splice(0, parts.length - 260);
    };
  });

  /* ---------- customer path (over-ons): line draws with scroll ---------- */
  var paths = $$('.path').map(function (el) {
    var pth = $('path.draw', el), dot = $('circle.dot', el), steps = $$('.steps li', el), L = pth.getTotalLength();
    pth.style.strokeDasharray = L; pth.style.strokeDashoffset = L;
    return function () {
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var k = reduce ? 1 : clamp((innerHeight * .85 - r.top) / (innerHeight * .6), 0, 1);
      pth.style.strokeDashoffset = L * (1 - k);
      var pt = pth.getPointAtLength(L * k); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      steps.forEach(function (s, i) { s.classList.toggle('on', k >= i / (steps.length - 1) - .02); });
      el.style.setProperty('--k', k.toFixed(3));
    };
  });

  /* ---------- scroll-linked extras ---------- */
  var par = $$('[data-par]'), marq = $$('.marq div'), fills = $$('.fill'), kb = $$('[data-kb]');
  var lmx = 0, lmy = 0;
  if (fine) addEventListener('mousemove', function (e) { lmx = e.clientX / innerWidth - .5; lmy = e.clientY / innerHeight - .5; });
  function extras() {
    var vh = innerHeight;
    if (hd) hd.classList.toggle('solid', scrollY > 40);
    if (reduce) return;
    par.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var k = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (k * -(+el.dataset.par || 50)) + 'px,0) scale(1.1)';
    });
    kb.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var k = clamp(1 - r.bottom / (vh + r.height), 0, 1);
      el.style.transform = 'translate3d(' + (lmx * -18) + 'px,' + (lmy * -12 + (k - .5) * -40) + 'px,0) scale(' + (1.04 + k * .06) + ')';
    });
    marq.forEach(function (el, i) { el.style.transform = 'translate3d(' + (-(scrollY * .3) % (el.scrollWidth / 2)) * (i % 2 ? -1 : 1) + 'px,0,0)'; });
    fills.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var sp = $$('.wd', el), k = clamp((vh * .82 - r.top) / (r.height + vh * .2), 0, 1) * sp.length;
      sp.forEach(function (s, i) { s.classList.toggle('lit', i < k); });
    });
  }
  if (reduce) $$('.fill .wd').forEach(function (s) { s.classList.add('lit'); });

  /* ---------- loop ---------- */
  var lenis = (window.Lenis && !reduce) ? new Lenis({ lerp: .09 }) : null;
  window.__lenis = lenis;
  (function raf(t) {
    if (lenis) lenis.raf(t);
    films.forEach(function (f) { if (f.render()) { f.seek(); f.tick(); } });
    portals.forEach(function (p) { p(); });
    klokken.forEach(function (k) { k(); });
    if (!reduce) ambient.forEach(function (a) { a(); });
    paths.forEach(function (p) { p(); });
    extras();
    requestAnimationFrame(raf);
  })(0);
})();
