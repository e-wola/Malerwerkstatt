/* Malerwerkstatt Alpenweiß – interactions
   Progressive enhancement: the site works without JS (details/summary FAQ, plain links).
   Config is injected by build.py as window.AW. */
(function () {
  'use strict';
  var AW = window.AW || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var num = new Intl.NumberFormat('de-DE');

  /* ------------------------------------------------------------ header / nav */
  var hdr = $('.hdr'), burger = $('.burger'), nav = $('#nav');
  function onScroll() {
    hdr && hdr.classList.toggle('is-stuck', window.scrollY > 8);
    var bar = $('.mbar');
    if (bar) bar.classList.toggle('is-on', window.scrollY > 520);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      ['main', '.ftr', '.mbar'].forEach(function (q) { var e = $(q); if (e) { if (open) e.setAttribute('inert', ''); else e.removeAttribute('inert'); } });
      setTimeout(function () { if (open) { var f = nav.querySelector('a, button'); f && f.focus(); } else { burger.focus(); } }, 60);
    });
  }
  $$('.has-sub > button').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = b.parentNode, o = li.getAttribute('data-open') === 'true';
      $$('.has-sub').forEach(function (x) { x.setAttribute('data-open', 'false'); x.firstElementChild.setAttribute('aria-expanded', 'false'); });
      li.setAttribute('data-open', String(!o)); b.setAttribute('aria-expanded', String(!o));
    });
  });
  document.addEventListener('click', function () { $$('.has-sub').forEach(function (x) { x.setAttribute('data-open', 'false'); x.firstElementChild.setAttribute('aria-expanded', 'false'); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('.has-sub').forEach(function (x) { x.setAttribute('data-open', 'false'); });
    if (burger && burger.getAttribute('aria-expanded') === 'true') burger.click();
  });

  /* ------------------------------------------------------------ GSAP */
  var hasGSAP = !!window.gsap;
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (hasGSAP && window.SplitText) gsap.registerPlugin(SplitText);

  function revealFallback() { $$('[data-reveal]').forEach(function (e) { e.style.opacity = 1; e.style.transform = 'none'; }); $$('.stroke').forEach(function (e) { e.style.setProperty('--p', 1); }); }

  if (!hasGSAP || reduce) {
    revealFallback();
    $$('.journey__fill').forEach(function (f) { f.style.setProperty('--p', 1); });
    $$('.step').forEach(function (s) { s.classList.add('is-on'); });
  } else {
    initMotion();
  }

  function initMotion() {
    var mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      /* 0. home hero: gold stroke paints on, photos rise, cards slide in */
      var hs = $('.hh__stroke');
      if (hs) {
        var htl = gsap.timeline({ delay: .2 });
        htl.fromTo(hs, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power3.inOut' }, 0)
           .from('.hh__main', { y: 36, duration: 1, ease: 'power3.out' }, .25)
           .from('.hh__second', { y: 44, duration: .9, ease: 'power3.out' }, .5)
           .from('.hh__card', { x: 30, opacity: 0, duration: .7, ease: 'power3.out', stagger: .15 }, .9);
      }

      /* 1. headline: masked line reveal (SplitText), then brush stroke paints on */
      $$('[data-split]').forEach(function (el) {
        if (!window.SplitText) { return; }
        var s = SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: .09, delay: el.hasAttribute('data-hero') ? .15 : 0,
            scrollTrigger: el.hasAttribute('data-hero') ? null : { trigger: el, start: 'top 88%', once: true } });
        } });
      });
      $$('.stroke').forEach(function (el) {
        var hero = !!el.closest('.hero, .phero');
        gsap.fromTo(el, { '--p': 0 }, { '--p': 1, duration: 1.1, ease: 'power3.inOut', delay: hero ? .7 : 0,
          scrollTrigger: hero ? null : { trigger: el, start: 'top 90%', once: true } });
      });

      /* 2. generic reveal with batching (no per-element listeners) */
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 90%', once: true,
        onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .09, overwrite: true }); }
      });

      /* 4. process journey: line draws with scroll, steps light up */
      $$('.journey').forEach(function (j) {
        var fill = $('.journey__fill', j);
        gsap.to(fill, { '--p': 1, ease: 'none', scrollTrigger: { trigger: j, start: 'top 70%', end: 'bottom 65%', scrub: .4 } });
        $$('.step', j).forEach(function (s) {
          ScrollTrigger.create({ trigger: s, start: 'top 68%', onEnter: function () { s.classList.add('is-on'); }, onLeaveBack: function () { s.classList.remove('is-on'); } });
        });
      });

      /* 5. gentle parallax on media placeholders / photos */
      $$('[data-parallax]').forEach(function (el) {
        gsap.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      /* 6. service list – lines draw in */
      $$('.svc li').forEach(function (li, i) {
        gsap.from(li, { opacity: 0, y: 24, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 92%', once: true } });
      });
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* ------------------------------------------------------------ before/after slider */
  $$('.ba').forEach(function (ba) {
    var inp = $('input', ba);
    function set() { ba.style.setProperty('--pos', inp.value + '%'); }
    inp.addEventListener('input', set); set();
  });

  /* ------------------------------------------------------------ project filter */
  $$('[data-filter-group]').forEach(function (g) {
    var chips = $$('.chip', g), items = $$('.pitem', g.parentNode);
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); c.setAttribute('aria-pressed', 'true');
        var f = c.getAttribute('data-f');
        items.forEach(function (it) { it.hidden = !(f === 'all' || it.getAttribute('data-cat') === f); });
        if (hasGSAP && !reduce) gsap.fromTo(items.filter(function (i) { return !i.hidden; }), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .5, stagger: .06, ease: 'power2.out' });
      });
    });
  });

  /* ------------------------------------------------------------ Farbwelten visualizer */
  var viz = $('#viz');
  if (viz) {
    var fills = $$('.wallfill', viz), nameEl = $('#viz-name'), codeEl = $('#viz-code');
    var scene = $('#viz-scene');
    $$('.dot', viz).forEach(function (d) {
      d.addEventListener('click', function () {
        $$('.dot', viz).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); d.setAttribute('aria-pressed', 'true');
        fills.forEach(function (f) { f.style.fill = d.dataset.c; });
        nameEl.textContent = d.dataset.n; codeEl.textContent = d.dataset.d;
        var lnk = $('#viz-link'); if (lnk) lnk.href = lnk.dataset.base + '?farbe=' + encodeURIComponent(d.dataset.n);
      });
    });
    $$('input[name=vwall]', viz).forEach(function (r) {
      r.addEventListener('change', function () {
        var which = r.value; $$('.wallfill', viz).forEach(function (f) { f.style.opacity = (which === 'all' || f.dataset.w === which) ? 1 : 0; });
        $$('.wallbase', viz).forEach(function (f) { f.style.opacity = which === 'all' ? 0 : 1; });
      });
    });
    var first = $('.dot', viz); first && first.click();
  }

  /* ------------------------------------------------------------ price calculator */
  var calc = $('#calc');
  if (calc) {
    var R = AW.rates;
    var svcSel = $$('input[name=csvc]', calc);
    function val(n) { var e = $('[name=' + n + ']', calc); return e ? parseFloat(e.value) || 0 : 0; }
    function chosen(n) { var e = $('input[name=' + n + ']:checked', calc); return e ? e.value : null; }
    function showPanels() {
      var s = chosen('csvc');
      $$('.cpanel', calc).forEach(function (p) { p.hidden = p.dataset.p !== s; });
    }
    function compute() {
      var s = chosen('csvc'), lo = 0, hi = 0, rows = [], hint = '';
      var cond = parseFloat(chosen('ccond') || 1);
      if (s === 'innen') {
        var fl = val('cfl'), h = val('ch'); if (fl <= 0) return out(null);
        var area = fl * (2 * (h / 2.5) + 1) * (calc.querySelector('[name=cceil]').checked ? 1 : 0.67); /* walls ≈ 2.0×floor at 2.5 m; ceiling = 1×floor */
        area = Math.round(area);
        lo = area * R.innen[0] * cond; hi = area * R.innen[1] * cond;
        rows = [['Wohnfläche', num.format(fl) + ' m²'], ['Streichfläche (geschätzt)', num.format(area) + ' m²'], ['Zustand-Faktor', '× ' + cond.toFixed(2).replace('.', ',')]];
        hint = 'Die Streichfläche ist aus Wohnfläche und Raumhöhe geschätzt – das genaue Aufmaß erfolgt bei der Besichtigung.';
      } else if (s === 'fassade') {
        var fa = val('cfa'); if (fa <= 0) return out(null);
        lo = fa * R.fassade[0] * cond; hi = fa * R.fassade[1] * cond;
        rows = [['Fassadenfläche', num.format(fa) + ' m²'], ['Zustand-Faktor', '× ' + cond.toFixed(2).replace('.', ',')]];
        if (calc.querySelector('[name=cgerust]').checked) { lo += fa * R.gerust[0]; hi += fa * R.gerust[1]; rows.push(['Gerüst', 'inkl. Schätzung']); }
        hint = 'Gerüst, Putzreparaturen und Dämmung sind nur grob eingerechnet. Das klärt die Besichtigung vor Ort.';
      } else if (s === 'lack') {
        var d = val('cdoor'), w = val('cwin'), hk = val('chk'); if (d + w + hk <= 0) return out(null);
        lo = d * R.tuer[0] + w * R.fenster[0] + hk * R.heizkoerper[0]; hi = d * R.tuer[1] + w * R.fenster[1] + hk * R.heizkoerper[1];
        if (d) rows.push(['Türen', d + ' Stk.']); if (w) rows.push(['Fenster', w + ' Stk.']); if (hk) rows.push(['Heizkörper', hk + ' Stk.']);
        hint = 'Preise je Element, inkl. Vorarbeit und zweimaligem Lackauftrag – Zustand und Farbwechsel beeinflussen den Preis.';
      } else if (s === 'tapete') {
        var wa = val('cwa'); if (wa <= 0) return out(null);
        var alt = calc.querySelector('[name=calt]').checked;
        lo = wa * R.tapete[0] + (alt ? wa * R.tapeteAlt[0] : 0); hi = wa * R.tapete[1] + (alt ? wa * R.tapeteAlt[1] : 0);
        rows = [['Wandfläche', num.format(wa) + ' m²'], ['Alte Tapete entfernen', alt ? 'ja' : 'nein']];
        hint = 'Gilt für Standardtapeten (z. B. Raufaser inkl. Anstrich). Vlies- oder Designtapeten kosten mehr.';
      }
      lo = Math.round(lo / 10) * 10; hi = Math.round(hi / 10) * 10; out({ lo: lo, hi: hi, rows: rows, hint: hint, s: s });
    }
    function out(r) {
      var box = $('#calc-out'), pr = $('#calc-price', box), dl = $('#calc-rows', box), nt = $('#calc-hint', box), cta = $('#calc-cta', box);
      if (!r) { pr.innerHTML = 'Bitte Werte eingeben<small>Richtwert wird automatisch berechnet</small>'; dl.innerHTML = ''; cta.setAttribute('aria-disabled', 'true'); return; }
      pr.innerHTML = eur.format(r.lo) + ' – ' + eur.format(r.hi) + '<small>unverbindlicher Richtwert, inkl. Material & MwSt.</small>';
      dl.innerHTML = r.rows.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
      nt.textContent = r.hint; cta.removeAttribute('aria-disabled');
      var q = '?leistung=' + r.s + '&richtwert=' + encodeURIComponent(eur.format(r.lo) + ' – ' + eur.format(r.hi));
      var m = { innen: ['cfl', 'flaeche'], fassade: ['cfa', 'flaeche'], tapete: ['cwa', 'flaeche'] }[r.s]; if (m) q += '&flaeche=' + val(m[0]);
      cta.href = cta.dataset.base + q;
    }
    calc.addEventListener('input', compute); calc.addEventListener('change', function () { showPanels(); compute(); });
    var ho = $('#ch-out'); var hs = $('[name=ch]', calc); if (hs) hs.addEventListener('input', function () { ho.textContent = parseFloat(hs.value).toFixed(1).replace('.', ',') + ' m'; });
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    showPanels(); compute();
  }

  /* ------------------------------------------------------------ enquiry form (3 steps) */
  var form = $('#anfrage');
  if (form) {
    var steps = $$('.fstep', form), bar = $$('.steps li'), cur = 0, files = [];
    var params = new URLSearchParams(location.search);
    function show(i, init) {
      cur = i; steps.forEach(function (s, k) { s.hidden = k !== i; });
      bar.forEach(function (b, k) { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); });
      if (init) return;
      var top = form.getBoundingClientRect().top + window.scrollY - 110; window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      var h = $('h2', steps[i]); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      if (i === 2) fillSummary();
    }
    function err(el, msg) {
      var f = el.closest('.field') || el.closest('fieldset'); var e = f && f.querySelector('.err');
      if (e) e.textContent = msg || ''; if (el.setAttribute) { if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
    }
    function validate(i) {
      var ok = true;
      if (i === 0) {
        var c = $$('input[name=leistung]:checked', form); var fs = $('#fs-leistung');
        if (!c.length) { fs.querySelector('.err').textContent = 'Bitte wählen Sie mindestens eine Leistung.'; ok = false; } else fs.querySelector('.err').textContent = '';
        var o = $('input[name=objekt]:checked', form); var fo = $('#fs-objekt');
        if (!o) { fo.querySelector('.err').textContent = 'Bitte wählen Sie die Objektart.'; ok = false; } else fo.querySelector('.err').textContent = '';
      }
      if (i === 1) {
        var ort = $('[name=ort]', form);
        if (!/^\s*(\d{5}\s+)?[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß .\-\/]{1,}\s*$|^\s*\d{5}(\s+.+)?$/.test(ort.value)) { err(ort, 'Bitte geben Sie PLZ oder Ort des Objekts an.'); ok = false; } else err(ort);
      }
      if (i === 2) {
        var n = $('[name=name]', form), t = $('[name=telefon]', form), m = $('[name=email]', form), c2 = $('[name=datenschutz]', form);
        if (n.value.trim().length < 2) { err(n, 'Bitte nennen Sie uns Ihren Namen.'); ok = false; } else err(n);
        var hasMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.value.trim()), hasTel = t.value.replace(/[^\d]/g, '').length >= 6;
        if (!hasMail && !hasTel) { err(m, 'Bitte geben Sie eine E-Mail-Adresse oder Telefonnummer an.'); ok = false; } else err(m);
        if (m.value.trim() && !hasMail) { err(m, 'Diese E-Mail-Adresse sieht nicht korrekt aus.'); ok = false; }
        if (t.value.trim() && !hasTel) { err(t, 'Diese Telefonnummer sieht nicht korrekt aus.'); ok = false; } else if (t.value.trim()) err(t);
        if (!c2.checked) { $('#err-consent').textContent = 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.'; ok = false; } else $('#err-consent').textContent = '';
      }
      if (!ok) { var bad = $('[aria-invalid="true"]', steps[i]) || $('.err:not(:empty)', steps[i]); bad && bad.scrollIntoView && bad.scrollIntoView({ block: 'center' }); }
      return ok;
    }
    $$('[data-next]', form).forEach(function (b) { b.addEventListener('click', function () { if (validate(cur)) show(cur + 1); }); });
    $$('[data-prev]', form).forEach(function (b) { b.addEventListener('click', function () { show(cur - 1); }); });

    /* prefill from calculator / visualizer */
    if (params.get('leistung')) { var pv = $('input[name=leistung][value="' + params.get('leistung') + '"]', form); pv && (pv.checked = true); }
    var info = [];
    if (params.get('flaeche')) info.push('Fläche ca. ' + params.get('flaeche') + ' m²');
    if (params.get('richtwert')) info.push('Richtwert aus dem Preisrechner: ' + params.get('richtwert'));
    if (params.get('farbe')) info.push('Wunschfarbe: ' + params.get('farbe'));
    if (info.length) { var nb = $('[name=nachricht]', form); nb.value = info.join('\n'); }

    /* photo upload */
    var fi = $('#fotos'), th = $('#thumbs'), drop = $('.drop', form);
    function addFiles(list) {
      var msg = $('#err-fotos'); msg.textContent = '';
      Array.prototype.forEach.call(list, function (f) {
        if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(f.type) && !/\.(jpe?g|png|webp|heic)$/i.test(f.name)) { msg.textContent = 'Nur Bilddateien (JPG, PNG, WebP, HEIC) sind erlaubt.'; return; }
        if (f.size > 8 * 1024 * 1024) { msg.textContent = '„' + f.name + '" ist größer als 8 MB.'; return; }
        if (files.length >= 5) { msg.textContent = 'Maximal 5 Fotos möglich.'; return; }
        files.push(f);
      });
      renderThumbs();
    }
    function renderThumbs() {
      th.innerHTML = '';
      files.forEach(function (f, i) {
        var d = document.createElement('div'), im = document.createElement('img'), b = document.createElement('button');
        im.alt = f.name; im.src = URL.createObjectURL(f); b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', f.name + ' entfernen');
        b.onclick = function () { files.splice(i, 1); renderThumbs(); }; d.appendChild(im); d.appendChild(b); th.appendChild(d);
      });
    }
    fi.addEventListener('change', function () { addFiles(fi.files); fi.value = ''; });
    ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); if (ev === 'drop') addFiles(e.dataTransfer.files); }); });

    function data() {
      var g = function (n) { var e = $('[name=' + n + ']', form); return e ? e.value.trim() : ''; };
      return {
        leistung: $$('input[name=leistung]:checked', form).map(function (x) { return x.parentNode.querySelector('b').textContent; }).join(', '),
        objekt: ($('input[name=objekt]:checked', form) || {}).value || '', ort: g('ort'), zeitraum: g('zeitraum'), nachricht: g('nachricht'),
        name: g('name'), telefon: g('telefon'), email: g('email'), rueckruf: g('rueckruf')
      };
    }
    function fillSummary() {
      var d = data(), rows = [['Leistung', d.leistung], ['Objekt', d.objekt], ['Ort', d.ort], ['Zeitraum', d.zeitraum || 'flexibel'], ['Fotos', files.length ? files.length + ' angehängt' : 'keine']];
      $('#sum').innerHTML = rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd></dd></div>'; }).join('');
      $$('#sum dd').forEach(function (dd, i) { dd.textContent = rows[i][1]; });
    }
    function plain(d) {
      return 'Anfrage über die Website\n\nLeistung: ' + d.leistung + '\nObjekt: ' + d.objekt + '\nOrt: ' + d.ort + '\nZeitraum: ' + (d.zeitraum || 'flexibel') +
        '\n\nNachricht:\n' + (d.nachricht || '–') + '\n\nName: ' + d.name + '\nTelefon: ' + (d.telefon || '–') + '\nE-Mail: ' + (d.email || '–') + '\nRückruf: ' + (d.rueckruf || '–');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (!validate(2)) return;
      if ($('[name=website]', form).value) return; /* honeypot */
      var btn = $('[type=submit]', form), box = $('#form-msg'); btn.disabled = true; btn.firstChild.textContent = 'Wird gesendet … '; box.innerHTML = '';
      var d = data(), fd = new FormData(); Object.keys(d).forEach(function (k) { fd.append(k, d[k]); }); files.forEach(function (f) { fd.append('fotos[]', f); });
      fetch(AW.endpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'Fehler'); return j; }); })
        .then(function () { location.href = AW.base + 'danke/'; })
        .catch(function () {
          btn.disabled = false; btn.firstChild.textContent = 'Anfrage senden ';
          var html = '<div class="alert alert--err" role="alert"><b>Die Anfrage konnte nicht automatisch gesendet werden.</b><br>Der Versand ist auf dieser Version noch nicht angebunden bzw. der Server hat nicht geantwortet. Ihre Eingaben bleiben erhalten.</div>';
          var t = plain(d);
          html += '<div class="alert alert--info"><b>So geht es trotzdem:</b><div class="factions" style="justify-content:flex-start;margin-top:.8rem">';
          html += '<button type="button" class="btn btn--sm" id="copy-req">Anfrage kopieren</button>';
          if (AW.phone) html += '<a class="btn btn--sm btn--ghost" href="tel:' + AW.phone + '">Anrufen: ' + AW.phoneLabel + '</a>';
          if (AW.email) html += '<a class="btn btn--sm btn--ghost" href="mailto:' + AW.email + '?subject=' + encodeURIComponent('Anfrage über die Website') + '&body=' + encodeURIComponent(t) + '">Per E-Mail senden</a>';
          if (AW.whatsapp) html += '<a class="btn btn--sm btn--ghost" href="https://wa.me/' + AW.whatsapp + '?text=' + encodeURIComponent(t) + '">Per WhatsApp senden</a>';
          html += '</div></div>'; box.innerHTML = html;
          $('#copy-req').onclick = function () { navigator.clipboard && navigator.clipboard.writeText(t).then(function () { $('#copy-req').textContent = 'Kopiert ✓'; }); };
        });
    });
    show(0, true);
  }

  /* ------------------------------------------------------------ quick contact form */
  var quick = $('#quick');
  if (quick) {
    quick.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = function (n) { return $('[name=' + n + ']', quick); }, ok = true;
      $$('.err', quick).forEach(function (x) { x.textContent = ''; });
      var eN = f('name').closest('.field').querySelector('.err'), eM = f('email').closest('.field').querySelector('.err'), eG = f('nachricht').closest('.field').querySelector('.err');
      if (f('name').value.trim().length < 2) { eN.textContent = 'Bitte nennen Sie uns Ihren Namen.'; ok = false; }
      var hasMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f('email').value.trim()), hasTel = f('telefon').value.replace(/[^\d]/g, '').length >= 6;
      if (!hasMail && !hasTel) { eM.textContent = 'Bitte E-Mail oder Telefonnummer angeben.'; ok = false; }
      if (f('nachricht').value.trim().length < 5) { eG.textContent = 'Bitte schreiben Sie uns kurz, worum es geht.'; ok = false; }
      if (!f('datenschutz').checked) { $('#q-consent').textContent = 'Bitte stimmen Sie der Verarbeitung zu.'; ok = false; }
      if (!ok || f('website').value) return;
      var btn = $('[type=submit]', quick), box = $('#q-msgbox'); btn.disabled = true;
      var fd = new FormData(); ['name', 'telefon', 'email', 'nachricht'].forEach(function (k) { fd.append(k, f(k).value.trim()); }); fd.append('leistung', 'Kontaktformular');
      fetch(AW.endpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(); }); })
        .then(function () { location.href = AW.base + 'danke/'; })
        .catch(function () { btn.disabled = false; box.innerHTML = '<div class="alert alert--err" role="alert"><b>Senden nicht möglich.</b> Der Versand ist auf dieser Version noch nicht angebunden. Ihre Eingaben bleiben erhalten.' + (AW.email ? ' Bitte schreiben Sie an <a href="mailto:' + AW.email + '">' + AW.email + '</a>.' : '') + (AW.phone ? ' Oder rufen Sie uns an: <a href="tel:' + AW.phone + '">' + AW.phoneLabel + '</a>.' : '') + '</div>'; });
    });
  }
})();
