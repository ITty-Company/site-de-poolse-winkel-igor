/* De Poolse Winkel Igor — scroll-film (video.currentTime scrub), deeltjes, bubbels-portaal, pekelklok,
   smaakkompas, deksel-overgang. Geen frameworks; Lenis lokaal. */
(function () {
  'use strict';
  var WA_CONFIRMED = false; // zodra de eigenaar WhatsApp bevestigt: true → label «nog te bevestigen» verdwijnt
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var ease = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var portrait = function () { return innerWidth <= 760 && innerHeight > innerWidth; };
  var root = document.documentElement;

  /* ---------- WhatsApp-vlag ---------- */
  if (WA_CONFIRMED) root.classList.add('wa-ok');

  /* ---------- header / menu ---------- */
  var hd = $('.hd'), burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var o = document.body.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o);
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); } });
  }

  /* ---------- mandje-teller op elke pagina ---------- */
  window.IGOR_BADGE = function () {
    var n = 0;
    try { var c = JSON.parse(localStorage.getItem('igor-mandje') || '{}') || {}; Object.keys(c).forEach(function (k) { n += +c[k].q || 0; }); } catch (e) { n = 0; }
    $$('.cart-count').forEach(function (b) { b.textContent = n; b.parentNode.classList.toggle('has', n > 0); });
  };
  window.IGOR_BADGE();

  /* ---------- blob-cache: één download per film, gedeeld door film + pekelklok ---------- */
  var blobs = {};
  function getVideo(src) {
    if (!blobs[src]) blobs[src] = fetch(src).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
      .then(function (b) { return URL.createObjectURL(b); }).catch(function () { return src; });
    return blobs[src];
  }

  /* ---------- deeltjes (canvas) ---------- */
  function Particles(cv, mode) {
    var ctx = cv.getContext('2d'), P = [], self = { mode: mode || 'dust', k: 1, on: true, box: null };
    function size() { cv.width = Math.max(1, cv.clientWidth * dpr); cv.height = Math.max(1, cv.clientHeight * dpr); }
    size(); addEventListener('resize', size);
    function spawn() {
      var W = cv.width, H = cv.height, R = Math.random, m = self.mode, bx = self.box;
      if (bx && (m === 'bubbles' || m === 'glints')) {
        if (m === 'glints') return { x: bx[0] + R() * (bx[2] - bx[0]), y: bx[1] + R() * (bx[3] - bx[1]), vx: 0, vy: 0, r: (2 + R() * 6) * dpr, c: '255,255,240', a: 1, g: 0, life: 1, d: .02, star: 1 };
        return { x: bx[0] + (.08 + R() * .84) * (bx[2] - bx[0]), y: bx[3] - R() * (bx[3] - bx[1]) * .25, vx: (R() - .5) * .2, vy: -(.4 + R() * 1.1), r: (1.2 + R() * 3) * dpr, c: '246,248,234', a: .8, g: -.008, life: 1, d: .004, ring: 1, wob: R() * 6 };
      }
      if (m === 'beam') { var bt = R(); return { x: W * (.55 + bt * .4) + (R() - .5) * W * .12, y: H * (.05 + bt * .55) + (R() - .5) * H * .1, vx: -(.05 + R() * .2), vy: .05 + R() * .15, r: (.7 + R() * 2) * dpr, c: R() < .15 ? '227,155,18' : '255,252,235', a: .95, g: 0, life: 1, d: .004 }; }
      if (m === 'drops') return { x: W * (.25 + R() * .25), y: H * (.3 + R() * .2), vx: (R() - .5) * .3, vy: .5 + R(), r: (1.5 + R() * 2.5) * dpr, c: '246,248,234', a: .9, g: .05, life: 1, d: .008, ring: 1 };
      if (m === 'seeds') return { x: W * (.28 + R() * .2), y: -10, vx: (R() - .5) * .6, vy: 1.2 + R() * 2, r: (1.6 + R() * 1.6) * dpr, c: '227,155,18', a: 1, g: .04, life: 1, d: .004 };
      if (m === 'bubbles' || m === 'rise') return { x: W * (m === 'rise' ? R() : (.27 + R() * .2)), y: H * (m === 'rise' ? 1.02 : (.8 + R() * .1)), vx: (R() - .5) * .3, vy: -(.5 + R() * 1.4), r: (1.5 + R() * 4) * dpr, c: '246,248,234', a: .8, g: -.01, life: 1, d: .004, ring: 1, wob: R() * 6 };
      if (m === 'glints') return { x: W * (.3 + R() * .16), y: H * (.3 + R() * .5), vx: 0, vy: 0, r: (2 + R() * 6) * dpr, c: '255,255,240', a: 1, g: 0, life: 1, d: .02, star: 1 };
      if (m === 'warm') return { x: R() * W, y: R() * H, vx: (R() - .3) * .25, vy: -(.05 + R() * .25), r: (.8 + R() * 2.2) * dpr, c: R() < .3 ? '227,155,18' : '255,236,190', a: .9, g: 0, life: 1, d: .003 };
      return { x: R() * W, y: R() * H, vx: (R() - .3) * .25, vy: (R() - .6) * .2, r: (.6 + R() * 1.8) * dpr, c: R() < .1 ? '227,155,18' : '255,255,245', a: .8, g: 0, life: 1, d: .0025 };
    }
    self.tick = function () {
      var W = cv.width, H = cv.height, m = self.mode;
      ctx.clearRect(0, 0, W, H);
      var rate = m === 'beam' ? (portrait() ? 0 : 1.6) : m === 'glints' ? .15 : m === 'seeds' ? 1.2 : m === 'bubbles' || m === 'rise' ? 1.4 : m === 'drops' ? .5 : .9;
      if (Math.random() < rate * self.k) P.push(spawn());
      if (Math.random() < rate * self.k - 1) P.push(spawn());
      P = P.filter(function (q) {
        q.vy += q.g; q.x += q.vx + (q.wob ? Math.sin(q.life * 20 + q.wob) * .3 : 0); q.y += q.vy; q.life -= q.d;
        if (q.life <= 0 || q.y > H + 20 || q.y < -20) return false;
        var b = self.box; if (b && (q.ring || q.star) && (q.y < b[1] + q.r || q.x < b[0] || q.x > b[2])) return false;
        var a = q.a * Math.min(1, q.life * 3) * (q.star ? Math.sin(q.life * Math.PI) : 1);
        ctx.beginPath();
        if (q.star) {
          ctx.strokeStyle = 'rgba(' + q.c + ',' + a + ')'; ctx.lineWidth = dpr;
          ctx.moveTo(q.x - q.r, q.y); ctx.lineTo(q.x + q.r, q.y); ctx.moveTo(q.x, q.y - q.r); ctx.lineTo(q.x, q.y + q.r); ctx.stroke();
        } else if (q.ring) {
          ctx.strokeStyle = 'rgba(' + q.c + ',' + a + ')'; ctx.lineWidth = Math.max(1, q.r * .28);
          ctx.arc(q.x, q.y, q.r, 0, 7); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,' + a * .5 + ')'; ctx.beginPath(); ctx.arc(q.x - q.r * .35, q.y - q.r * .35, q.r * .25, 0, 7); ctx.fill();
        } else { ctx.fillStyle = 'rgba(' + q.c + ',' + a + ')'; ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); }
        return true;
      });
      if (P.length > 260) P.splice(0, P.length - 260);
    };
    self.clear = function () { P = []; ctx.clearRect(0, 0, cv.width, cv.height); };
    return self;
  }

  /* ---------- scroll-films ---------- */
  var films = $$('.film').map(function (film) {
    var CH = JSON.parse($('script[type="application/json"]', film).textContent), N = CH.length;
    var lead = parseFloat(film.dataset.lead || '0'), tail = parseFloat(film.dataset.tail || '.45'), plen = parseFloat(film.dataset.portal || '0');
    var len = lead + (N - 1) + tail + plen;
    film.style.setProperty('--len', len.toFixed(2));
    if (reduce) { film.classList.add('static'); return null; }
    var stage = $('.stage', film), V = $('video', film), cv = $('canvas.fx', stage);
    var dock = $('.fdock', film), T = $('.ftitle', film), TH = $('.ftitle h2', film), TS = $('.ftitle p', film);
    var hud = $('.hud b', film), bar = $('.fbar i', film), hint = $('.fhint', film), big = $('.bigword', film), hero = $('.fhero', film), wash = $('.wash', film);
    var FC = $('.fcards', film), cards = $$('.fcard', film), cur = -1, vt = 0, want = 0, fx = Particles(cv, CH[0].fx), label = film.dataset.hud || '';
    var mob = film.dataset.srcM && portrait(), pgl = $('canvas.portalgl', film), portalDraw = null, PP = 0;
    if (mob) film.classList.add('mfilm');
    var fade = $$('.hud,.ftag,.fbar', film);
    var src = mob ? film.dataset.srcM : film.dataset.src;
    if (mob && film.dataset.posterM) V.poster = film.dataset.posterM;
    V.muted = true; V.addEventListener('loadedmetadata', function () { V.pause(); });
    getVideo(src).then(function (u) { V.src = u; V.load(); });
    $$('.fcard .more', film).forEach(function (b) {
      b.addEventListener('click', function () { var c = b.closest('.fcard'); var o = c.classList.toggle('open'); b.textContent = o ? 'minder −' : 'lees verder +'; });
    });
    function setTitle(i) {
      var w = 0;
      TH.innerHTML = CH[i].t.split(' ').map(function (x) { return '<span class="w" style="--i:' + (w++) + '">' + x + '</span>'; }).join(' ');
      TH.setAttribute('aria-label', CH[i].t);
      TS.textContent = CH[i].s;
      T.classList.toggle('light', CH[i].tone === 'light'); stage.classList.toggle('tone-light', CH[i].tone === 'light'); T.classList.toggle('tl', CH[i].pos === 'tl'); T.classList.toggle('mr', CH[i].pos === 'mr'); if (FC) FC.classList.toggle('top', CH[i].pos === 'mr');
      if (hud) hud.textContent = label + ' · ' + ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + N).slice(-2);
      if (big) big.textContent = CH[i].big || '';
      if (wash) wash.style.setProperty('--wash', CH[i].wash || 'transparent');
      if (!portrait()) stage.style.setProperty('--ox', (CH[i].ox || 50) + '%');
      fx.mode = CH[i].fx || 'dust';
    }
    // tijd per hoofdstuk: plateau rond elke «at», vloeiende overgang ertussen
    var seg = function (f) { return ease((f - .16) / .68); };
    function render() {
      var r = film.getBoundingClientRect(), total = film.offsetHeight - innerHeight;
      if (r.bottom < -100 || r.top > innerHeight + 100) return false;
      var g = clamp(-r.top / total, 0, 1) * len - lead; // -lead … N-1+tail
      var u = clamp(g, 0, N - 1), i = Math.min(Math.floor(u), N - 2 < 0 ? 0 : N - 2), f = N > 1 ? u - i : 0;
      var t = N > 1 ? CH[i].at + (CH[i + 1].at - CH[i].at) * seg(f) : CH[0].at;
      if (V.duration) want = clamp(t, 0, V.duration - .05);
      var ch = Math.round(u), near = g - ch;
      if (plen && ch === N - 1 && near > 0) near = Math.max(0, near - tail); // laatste hoofdstuk blijft staan tot het portaal begint
      if (ch !== cur) { cur = ch; setTitle(ch); }
      var vis = 1 - ease((Math.abs(near) - .32) / .17);
      if (hero) { vis *= ease((g + .25) / .25); var hv = 1 - ease((g + lead - .05) / (lead * .55)); hero.style.opacity = hv; hero.style.transform = 'translateY(' + (1 - hv) * -30 + 'px)'; hero.style.visibility = hv < .01 ? 'hidden' : 'visible'; }
      $$('.w', TH).forEach(function (sp, k) {
        var d = clamp(vis * 1.6 - k * .09, 0, 1);
        sp.style.opacity = d; sp.style.transform = 'translateY(' + (1 - d) * .4 + 'em)'; sp.style.filter = 'blur(' + (1 - d) * 6 + 'px)';
      });
      TS.style.opacity = vis; T.style.setProperty('--v', vis); if (dock) dock.style.setProperty('--v', portrait() ? ease(vis * 1.4) : 1);
      cards.forEach(function (el, k) {
        var o = k === ch ? ease((vis - .2) / .5) : 0;
        el.style.opacity = o; el.style.transform = 'translateY(' + (1 - o) * 18 + 'px)'; el.classList.toggle('on', o > .5);
        if (o < .05 && el.classList.contains('open')) { el.classList.remove('open'); var m = $('.more', el); if (m) m.textContent = 'lees verder +'; }
      });
      if (dock) dock.style.pointerEvents = vis > .5 ? '' : 'none';
      PP = plen ? clamp((g - (N - 1) - tail) / plen, 0, 1) : 0;
      var keep = 1 - ease(PP * 4);
      fade.forEach(function (el) { el.style.opacity = keep; });
      stage.classList.toggle('gone', plen > 0 && PP >= .99);
      stage.classList.toggle('c0', ch === 0);
      if (big) big.style.opacity = .08 * vis * keep;
      bar.style.width = (clamp((g + lead) / len, 0, 1) * 100) + '%';
      if (hint) hint.style.opacity = g < -lead + .15 ? 1 : 0;
      var z = 1.0 + .03 * (u / Math.max(1, N - 1));
      if (g < 0) z += .012 * (1 + Math.sin(performance.now() / 2600)) * ease(-g / lead); // ademende push-in vóór het scrollen
      V.style.transform = 'scale(' + z + ')';
      fx.k = g < 0 ? .9 : .25 + .75 * vis;
      fx.box = jarBox(CH[ch]);
      return true;
    }
    // binnenkant van de pot (video-pixels) → canvas-pixels, rekening houdend met object-fit:cover en de CSS-schaal
    function jarBox(c) {
      var j = mob ? c.jarm : c.jar; if (!j || !V.videoWidth) return null;
      var vw = V.videoWidth, vh = V.videoHeight, W = V.clientWidth, H = V.clientHeight, s = Math.max(W / vw, H / vh);
      var ox = (W - vw * s) / 2, oy = (H - vh * s) / 2, L = V.offsetLeft, Tp = V.offsetTop;
      var to = getComputedStyle(V).transformOrigin.split(' ').map(parseFloat), z = parseFloat((V.style.transform.match(/scale\(([\d.]+)/) || [0, 1])[1]);
      var oX = L + to[0], oY = Tp + to[1];
      function m(x, y) { var px = L + ox + x * s, py = Tp + oy + y * s; return [(oX + (px - oX) * z) * dpr, (oY + (py - oY) * z) * dpr]; }
      var a = m(j[0], j[1]), b = m(j[2], j[3]); return [a[0], a[1], b[0], b[1]];
    }
    function seek() {
      if (!V.duration) return;
      if (Math.abs(vt - want) > .002) { vt += (want - vt) * .2; if (!V.seeking) { try { V.currentTime = vt; } catch (e) {} } }
    }
    setTitle(0);
    if (pgl) portalDraw = makePortal(pgl);
    function portal(t) { if (portalDraw) portalDraw(PP, t); }
    return { render: render, seek: seek, fx: fx, portal: portal };
  }).filter(Boolean);

  /* ---------- word / reveal ---------- */
  $$('.words').forEach(function (el) {
    var i = 0;
    el.innerHTML = el.innerHTML.trim().split(/\s+/).map(function (w) { return '<span class="w" style="--i:' + (i++) + '">' + w + '</span>'; }).join(' ');
  });
  $$('.fill p').forEach(function (p) { p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span>' + w + '</span>'; }).join(' '); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15 });
  $$('.rv,.words').forEach(function (el) { io.observe(el); });
  // «live»: animaties draaien alleen als de sectie zichtbaar is
  var liveIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('live', e.isIntersecting); });
  }, { rootMargin: '60px 0px' });
  $$('main>section,.marq,footer').forEach(function (el) { liveIO.observe(el); });

  /* glas-gloed achter de cursor */
  if (matchMedia('(hover:hover)').matches) document.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glass'); if (!g) return;
    var r = g.getBoundingClientRect(); g.style.setProperty('--mx', (e.clientX - r.left) + 'px'); g.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  /* ---------- losse stof-canvassen ---------- */
  var dusts = $$('canvas.dust').map(function (cv) { return { el: cv, p: Particles(cv, cv.dataset.fx || 'dust') }; });

  /* ---------- muis-parallax ---------- */
  var mx = 0, my = 0;
  if (!reduce && matchMedia('(hover:hover)').matches) addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  /* ---------- portaal «bubbles» (WebGL) binnen het vastgezette filmbeeld ----------
     Transparant canvas boven het laatste filmframe: bubbels stijgen op, de pekel vult het beeld,
     en vanuit het midden opent K7 (de plank). Geen tweede achtergrond, geen schuivende laag. */
  function makePortal(cv) {
    var gl = null, prog, uP, uT, uR, uI, ready = false;
    try { gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false, alpha: true }); } catch (e) { gl = null; }
    if (!gl) return null;
    var vs = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
    var fs = [
      'precision mediump float;varying vec2 v;uniform sampler2D B;uniform float p,t,iB;uniform vec2 R;',
      'float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}',
      'vec2 cov(vec2 u,float ia){float ra=R.x/R.y;vec2 s=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);return (u-.5)*s+.5;}',
      'void main(){vec2 uv=vec2(v.x,1.-v.y);vec3 L=vec3(.871,.922,.749);vec3 P=vec3(.965,.973,.918);vec3 G=vec3(.89,.608,.07);',
      'vec3 b=texture2D(B,cov(uv,iB)).rgb;float fill=0.;float rim=0.;',
      'for(int i=0;i<3;i++){float fi=float(i);float sc=5.+fi*4.;vec2 g=vec2(v.x*sc*R.x/R.y,v.y*sc);g.y-=t*(.25+.12*fi)+p*(5.+fi*2.);',
      'vec2 id=floor(g);vec2 f=fract(g)-.5;float r0=h(id+fi*7.);f+=(vec2(h(id+3.1),h(id+5.7))-.5)*.4;',
      'float grow=clamp(p*2.4-r0*.9-(1.-v.y)*.5,0.,1.);float rr=(.12+.32*r0)*grow;float d=length(f);',
      'fill=max(fill,smoothstep(rr,rr-.03,d));rim=max(rim,smoothstep(.035,0.,abs(d-rr))*grow);}',
      'float flood=smoothstep(.42,.8,p)*.9;fill=max(fill*.85,flood);',
      'vec3 c=mix(L,P,.35+.3*v.y);float a=fill;float rm=rim*(1.-flood)*.7;c=mix(c,P,rm);a=max(a,rm);',
      'float ra=R.x/R.y;float d=length((uv-.5)*vec2(ra,1.));float RR=smoothstep(.3,.96,p)*(.6+ra*.6);',
      'float rev=smoothstep(RR,RR-.015,d);c=mix(c,b,rev);a=max(a,rev);',
      'float ring=smoothstep(.03,0.,abs(d-RR))*step(.001,RR)*(1.-smoothstep(.9,.97,p));c=mix(c,G,ring*.6);a=max(a,ring*.7);',
      'gl_FragColor=vec4(c,a);}'].join('\n');
    var sh = function (type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
    try {
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw 'link';
      gl.useProgram(prog);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uP = gl.getUniformLocation(prog, 'p'); uT = gl.getUniformLocation(prog, 't'); uR = gl.getUniformLocation(prog, 'R'); uI = gl.getUniformLocation(prog, 'iB');
      gl.uniform1i(gl.getUniformLocation(prog, 'B'), 0);
    } catch (e) { return null; }
    var im = new Image(), tx = gl.createTexture();
    im.onload = function () {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
      gl.uniform1f(uI, im.naturalWidth / im.naturalHeight); ready = true;
    };
    im.src = portrait() && cv.dataset.am ? cv.dataset.am : cv.dataset.a;
    function size() { cv.width = cv.clientWidth * Math.min(dpr, 1.5); cv.height = cv.clientHeight * Math.min(dpr, 1.5); gl.viewport(0, 0, cv.width, cv.height); }
    size(); addEventListener('resize', size);
    var shown = false;
    return function (p, t) {
      if (p <= 0 || !ready) { if (shown) { cv.style.opacity = 0; shown = false; } return; }
      if (!shown) { cv.style.opacity = 1; shown = true; }
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uP, p); gl.uniform1f(uT, t / 1000); gl.uniform2f(uR, cv.width, cv.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
  }

  /* ---------- act 2 / finale / hero: Ken Burns + parallax ---------- */
  var kb = $$('[data-kb]');
  function kenburns() {
    kb.forEach(function (el) {
      var host = el.closest('section'), r = host.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var p = clamp(-r.top / Math.max(1, host.offsetHeight - innerHeight), 0, 1);
      if (el.dataset.kb !== 'pin') p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      var s = 1 + .06 * p;
      var m = el.dataset.kb === 'pin' ? Math.min(1, p * 5) : 1;
      el.style.transform = 'translate3d(' + (mx * -14 * m) + 'px,' + (my * -10 * m + (el.dataset.kb === 'pin' ? 0 : (p - .5) * -30)) + 'px,0) scale(' + (s + .015 * m) + ')';
    });
  }

  /* ---------- pekelklok: schuif scrubt segment 5 (20–25 s) van de hoofdfilm ---------- */
  $$('.klok').forEach(function (k) {
    var V = $('video', k), R = $('input', k), marks = $$('.marks span', k), cv = $('canvas', k), out = $('.kval', k);
    var bub = cv ? Particles(cv, 'rise') : null, t0 = +k.dataset.from || 20, t1 = +k.dataset.to || 25, loaded = false;
    function load() {
      if (loaded) return; loaded = true;
      var src = (k.dataset.srcM && portrait()) ? k.dataset.srcM : k.dataset.src;
      getVideo(src).then(function (u) { V.src = u; V.addEventListener('loadedmetadata', function () { V.pause(); set(); }, { once: true }); V.load(); });
    }
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) load(); }, { rootMargin: '600px 0px' }).observe(k);
    function set() {
      var v = R.value / 100;
      R.style.setProperty('--k', R.value + '%');
      if (V.duration) { try { V.currentTime = Math.min(V.duration - .05, t0 + (t1 - t0) * v); } catch (e) {} }
      var idx = v < .34 ? 0 : v < .75 ? 1 : 2;
      marks.forEach(function (m, i) { m.classList.toggle('on', i === idx); });
      if (out) out.textContent = marks[idx].textContent;
      R.setAttribute('aria-valuetext', marks[idx].textContent);
      if (bub) bub.k = .15 + v * 1.1;
    }
    R.addEventListener('input', set); set();
    if (bub && !reduce) dusts.push({ el: cv, p: bub });
  });

  /* ---------- smaakkompas ---------- */
  $$('.kompas').forEach(function (kp) {
    var out = $('.kout p', kp), link = $('.kout a', kp);
    $$('.lid', kp).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.lid', kp).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        out.classList.add('sw');
        setTimeout(function () { out.innerHTML = '<b>' + b.dataset.k + '</b>' + b.dataset.txt; out.classList.remove('sw'); }, reduce ? 0 : 220);
        link.href = 'winkel.html?smaak=' + b.dataset.k;
      });
    });
  });

  /* ---------- over-ons: lijn tekent mee ---------- */
  var paths = $$('.path');
  function drawPaths() {
    paths.forEach(function (pth) {
      var r = pth.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var k = clamp((innerHeight * .78 - r.top) / (r.height + innerHeight * .3), 0, 1);
      pth.style.setProperty('--k', k.toFixed(3));
      $$('li', pth).forEach(function (li, i, all) { li.classList.toggle('on', k >= i / (all.length - 1) - .02); });
    });
  }

  /* ---------- J2 inkleuren ---------- */
  var fills = $$('.fill');
  function fillText() {
    fills.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var sp = $$('span', el), k = clamp((innerHeight * .8 - r.top) / (r.height + innerHeight * .2), 0, 1) * sp.length;
      sp.forEach(function (s, i) { s.classList.toggle('lit', i < k); });
    });
  }

  /* ---------- contact-loop en andere autoplay-video's alleen als zichtbaar ---------- */
  $$('video[data-loop]').forEach(function (v) {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!v.src) v.src = v.dataset.loop; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause();
    }).observe(v);
  });

  /* ---------- deksel: pagina-overgang ---------- */
  var ORDER = ['index.html', 'winkel.html', 'over-ons.html', 'contact.html'];
  var NAMES = { 'index.html': 'home.', 'winkel.html': 'winkel.', 'over-ons.html': 'over de winkel.', 'contact.html': 'contact.' };
  var dk = $('.deksel'), here = (location.pathname.split('/').pop() || 'index.html');
  function openDeksel() {
    if (!dk) { root.classList.remove('deksel-in'); return; }
    var dir = 1; try { dir = +sessionStorage.getItem('igor-dir') || 1; sessionStorage.removeItem('igor-deksel'); } catch (e) {}
    dk.style.setProperty('--rot', (dir > 0 ? -90 : 90) + 'deg');
    $('.lbl', dk).textContent = NAMES[here] || '';
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      root.classList.remove('deksel-in'); dk.classList.add('open');
      setTimeout(function () { dk.classList.remove('open'); }, 800);
    }); });
  }
  if (root.classList.contains('deksel-in')) openDeksel();
  addEventListener('pageshow', function (e) { if (e.persisted && dk) { dk.classList.remove('close'); root.classList.remove('deksel-in'); } });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || !dk) return;
    var href = a.getAttribute('href');
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || /^(tel:|mailto:|https?:|#)/.test(href)) return;
    var file = href.split(/[?#]/)[0] || here;
    if (file === here || !/\.html$/.test(file)) return;
    e.preventDefault();
    var dir = ORDER.indexOf(file) >= ORDER.indexOf(here) ? 1 : -1;
    try { sessionStorage.setItem('igor-dir', dir); sessionStorage.setItem('igor-deksel', '1'); } catch (er) {}
    dk.style.setProperty('--rot', (dir > 0 ? 90 : -90) + 'deg');
    $('.lbl', dk).textContent = NAMES[file] || '';
    document.body.classList.remove('menu-open');
    dk.classList.add('close');
    setTimeout(function () { location.href = href; }, reduce ? 220 : 620);
    setTimeout(function () { dk.classList.remove('close'); }, 4000); // vangnet
  });

  /* ---------- hoofdlus ---------- */
  var lenis = (window.Lenis && !reduce) ? new Lenis({ lerp: .09 }) : null;
  window.IGOR_LENIS = lenis;
  function vis(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }
  (function raf(t) {
    if (lenis) lenis.raf(t);
    if (hd) hd.classList.toggle('solid', scrollY > 40);
    films.forEach(function (f) { if (f.render()) { f.seek(); f.fx.tick(); f.portal(t); } });
    if (!reduce) {
      kenburns();
      dusts.forEach(function (d) { if (vis(d.el)) d.p.tick(); });
    }
    drawPaths(); fillText();
    requestAnimationFrame(raf);
  })(0);
})();
