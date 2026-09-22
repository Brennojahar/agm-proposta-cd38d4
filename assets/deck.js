/* ============================================================
   AGM PRODUÇÕES — motor da apresentação
   Canvas fixo 1280×720 escalado + navegação por teclado,
   scroll, toque e índice.
   ============================================================ */
(function () {
  'use strict';

  var LARGURA = 1280, ALTURA = 720;
  var deck    = document.getElementById('deck');
  var stage   = document.getElementById('stage');
  var slides  = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var barra   = document.getElementById('progresso');
  var contAtual = document.getElementById('cont-atual');
  var contTotal = document.getElementById('cont-total');
  var indice  = document.getElementById('indice');
  var grade   = document.getElementById('indice-grade');
  var carga   = document.getElementById('capa-carga');
  var total   = slides.length;
  var atual   = -1;
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- escala ---------- */
  function escalar() {
    var s = Math.min(window.innerWidth / LARGURA, window.innerHeight / ALTURA);
    stage.style.transform = 'scale(' + s + ')';
  }

  /* ---------- índice ---------- */
  function montarIndice() {
    var frag = document.createDocumentFragment();
    slides.forEach(function (sl, i) {
      var b = document.createElement('button');
      b.className = 'indice-item';
      b.type = 'button';
      b.innerHTML = '<span class="n">' + String(i + 1).padStart(2, '0') + '</span><span>' +
                    (sl.getAttribute('data-titulo') || 'Slide ' + (i + 1)) + '</span>';
      b.addEventListener('click', function () { ir(i); fecharIndice(); });
      frag.appendChild(b);
    });
    grade.appendChild(frag);
  }
  function abrirIndice() {
    indice.classList.add('aberto');
    var itens = grade.children;
    for (var i = 0; i < itens.length; i++) itens[i].classList.toggle('atual', i === atual);
  }
  function fecharIndice() { indice.classList.remove('aberto'); }

  /* ---------- contadores numéricos ---------- */
  function animarContadores(slide) {
    var alvos = slide.querySelectorAll('[data-contar]');
    Array.prototype.forEach.call(alvos, function (el) {
      var fim = parseFloat(el.getAttribute('data-contar'));
      var ini = parseFloat(el.getAttribute('data-de') || 0);
      if (reduzido || document.hidden) { el.textContent = fim; return; }
      var dur = 900, t0 = null;
      function passo(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(ini + (fim - ini) * e);
        if (p < 1) requestAnimationFrame(passo);
      }
      el.textContent = ini;
      requestAnimationFrame(passo);
    });
  }

  /* ---------- navegação ---------- */
  function ir(n) {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === atual) return;
    if (atual > -1) {
      slides[atual].classList.remove('is-active');
      slides[atual].classList.add('is-past');
    }
    var sl = slides[n];
    sl.classList.remove('is-past');
    /* força reflow: garante que a transição dispare e que o estado
       final seja escrito mesmo com a aba oculta (sem depender de rAF) */
    void sl.offsetHeight;
    sl.classList.add('is-active');
    atual = n;

    barra.style.width = ((n + 1) / total * 100) + '%';
    contAtual.textContent = String(n + 1).padStart(2, '0');
    document.title = (sl.getAttribute('data-titulo') || 'Proposta Técnica') +
                     ' — AGM Produções | Anglo American 2026';
    if (location.hash !== '#' + (n + 1)) {
      history.replaceState(null, '', '#' + (n + 1));
    }
    animarContadores(sl);
    precarregar(n + 1);
  }
  function proximo() { ir(atual + 1); }
  function anterior() { ir(atual - 1); }

  /* carrega as imagens do próximo slide antes da hora */
  function precarregar(n) {
    if (n >= total) return;
    var imgs = slides[n].querySelectorAll('img[loading="lazy"]');
    Array.prototype.forEach.call(imgs, function (im) { im.loading = 'eager'; });
  }

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
        e.preventDefault(); proximo(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); anterior(); break;
      case 'Home': e.preventDefault(); ir(0); break;
      case 'End':  e.preventDefault(); ir(total - 1); break;
      case 'Escape': fecharIndice(); break;
      case 'i': case 'I':
        indice.classList.contains('aberto') ? fecharIndice() : abrirIndice(); break;
      case 'f': case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        break;
    }
  });

  /* ---------- roda do mouse / trackpad ---------- */
  var travado = false;
  deck.addEventListener('wheel', function (e) {
    if (indice.classList.contains('aberto')) return;
    if (Math.abs(e.deltaY) < 12 || travado) return;
    travado = true;
    e.deltaY > 0 ? proximo() : anterior();
    setTimeout(function () { travado = false; }, 620);
  }, { passive: true });

  /* ---------- toque ---------- */
  var tx = 0, ty = 0;
  deck.addEventListener('touchstart', function (e) {
    tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY;
  }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) < 46 && Math.abs(dy) < 46) return;
    if (Math.abs(dx) > Math.abs(dy)) { dx < 0 ? proximo() : anterior(); }
    else { dy < 0 ? proximo() : anterior(); }
  }, { passive: true });

  /* ---------- controles ---------- */
  document.getElementById('btn-anterior').addEventListener('click', anterior);
  document.getElementById('btn-proximo').addEventListener('click', proximo);
  document.getElementById('btn-indice').addEventListener('click', abrirIndice);
  document.querySelector('.fechar-indice').addEventListener('click', fecharIndice);
  indice.addEventListener('click', function (e) { if (e.target === indice) fecharIndice(); });

  /* ---------- chrome que se recolhe sozinho ---------- */
  var chrome = document.getElementById('chrome'), tOcultar;
  function mostrarChrome() {
    chrome.classList.remove('recolhido');
    clearTimeout(tOcultar);
    tOcultar = setTimeout(function () {
      if (!indice.classList.contains('aberto')) chrome.classList.add('recolhido');
    }, 3200);
  }
  ['mousemove', 'keydown', 'touchstart', 'wheel', 'click'].forEach(function (ev) {
    window.addEventListener(ev, mostrarChrome, { passive: true });
  });

  /* ---------- partida ---------- */
  window.addEventListener('resize', escalar);
  window.addEventListener('orientationchange', escalar);

  /* link direto para um slide (#7) funciona com a página já aberta */
  window.addEventListener('hashchange', function () {
    var n = parseInt((location.hash || '').replace('#', ''), 10);
    if (!isNaN(n)) ir(n - 1);
  });

  contTotal.textContent = String(total).padStart(2, '0');
  montarIndice();
  escalar();

  var inicial = parseInt((location.hash || '').replace('#', ''), 10);
  ir(isNaN(inicial) ? 0 : inicial - 1);

  /* visível por uns segundos na abertura, para que a navegação seja descoberta */
  setTimeout(mostrarChrome, 2600);

  /* some com a capa de carregamento quando fontes e 1ª imagem estiverem prontas */
  function liberar() { carga.classList.add('oculto'); }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(liberar);
    setTimeout(liberar, 2200);          /* rede lenta: não prende o usuário */
  } else {
    setTimeout(liberar, 400);
  }
})();
