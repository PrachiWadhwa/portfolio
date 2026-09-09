(function(){
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme toggle ---------- */
  (function(){
    var root = document.documentElement;
    var toggleBtns = [document.getElementById('themeToggle'), document.getElementById('themeToggleMobile')].filter(Boolean);
    var labels = [document.getElementById('themeLabel'), document.getElementById('themeLabelMobile')].filter(Boolean);
    var dots = document.querySelectorAll('.tt-dot');
    var themeColorMeta = document.querySelector('meta[name="theme-color"]');
    var deployConsole = document.getElementById('deployConsole');
    var deployLog = document.getElementById('deployLog');
    var deployTimer, hideTimer;

    function currentTheme(){ return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

    function syncLabels(theme){
      labels.forEach(function(l){ l.textContent = theme === 'dark' ? 'Dark' : 'Light'; });
      dots.forEach(function(d){ d.textContent = theme === 'dark' ? '☾' : '☀'; });
      if (themeColorMeta) themeColorMeta.setAttribute('content', theme === 'dark' ? '#100e1f' : '#f5f4fd');
    }
    function persist(theme){ try { localStorage.setItem('pw-theme', theme); } catch(e) {} }

    function runDeployLog(theme){
      clearTimeout(deployTimer); clearTimeout(hideTimer);
      var lines = [
        {t:'$ ./deploy.sh --theme=' + theme, cls:''},
        {t:'==> Building UI assets…', cls:'dc-run'},
        {t:'==> Running visual checks… ok', cls:'dc-ok'},
        {t:'==> Switching theme to ' + theme.toUpperCase(), cls:'dc-run'},
        {t:'✔ Deployed in 0.4s', cls:'dc-ok'}
      ];
      deployLog.innerHTML = '';
      deployConsole.classList.add('show');
      deployConsole.setAttribute('aria-hidden','false');
      if (reduceMotion) {
        deployLog.innerHTML = lines.map(function(l){ return '<div class="'+l.cls+'">'+l.t+'</div>'; }).join('');
        hideTimer = setTimeout(function(){ deployConsole.classList.remove('show'); deployConsole.setAttribute('aria-hidden','true'); }, 1400);
        return;
      }
      var i = 0;
      function nextLine(){
        if (i >= lines.length) {
          hideTimer = setTimeout(function(){ deployConsole.classList.remove('show'); deployConsole.setAttribute('aria-hidden','true'); }, 900);
          return;
        }
        var div = document.createElement('div');
        div.className = lines[i].cls;
        deployLog.appendChild(div);
        var text = lines[i].t, ci = 0;
        (function type(){
          div.textContent = text.slice(0, ci);
          ci++;
          if (ci <= text.length) { deployTimer = setTimeout(type, 14); }
          else { i++; deployTimer = setTimeout(nextLine, 160); }
        })();
      }
      nextLine();
    }

    function applyTheme(theme){ root.setAttribute('data-theme', theme); syncLabels(theme); persist(theme); }

    function handleToggle(e){
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      var x = (e && e.clientX) || window.innerWidth / 2;
      var y = (e && e.clientY) || 60;
      runDeployLog(next);
      if (!reduceMotion && document.startViewTransition) {
        var transition = document.startViewTransition(function(){ applyTheme(next); });
        transition.ready.then(function(){
          var endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
          document.documentElement.animate(
            { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
          );
        }).catch(function(){});
      } else {
        applyTheme(next);
      }
    }
    syncLabels(currentTheme());
    toggleBtns.forEach(function(btn){ btn.addEventListener('click', handleToggle); });
  })();

  /* ---------- scroll progress bar ---------- */
  var progressBar = document.getElementById('progressBar');
  function updateProgress(){
    var h = document.documentElement;
    var scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    progressBar.style.width = (scrolled || 0) + '%';
  }
  document.addEventListener('scroll', updateProgress, {passive:true});
  updateProgress();

  /* ---------- back to top ---------- */
  var backToTop = document.getElementById('backToTop');
  function toggleBackToTop(){ if (window.scrollY > 600) backToTop.classList.add('show'); else backToTop.classList.remove('show'); }
  document.addEventListener('scroll', toggleBackToTop, {passive:true});
  backToTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'}); });
  toggleBackToTop();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burgerBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  function closeMenu(){ burger.classList.remove('open'); mobileMenu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
  burger.addEventListener('click', function(){
    var isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });

  /* ---------- scrollspy ---------- */
  var sections = ['about','skills','projects','experience','contact'].map(function(id){ return document.getElementById(id); }).filter(Boolean);
  var navLinks = document.querySelectorAll('.nav-links a');
  function setActive(id){ navLinks.forEach(function(l){ l.classList.toggle('active', l.getAttribute('href') === '#' + id); }); }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){ if (entry.isIntersecting) setActive(entry.target.id); });
    }, {rootMargin:'-45% 0px -50% 0px', threshold:0});
    sections.forEach(function(s){ spy.observe(s); });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function(entries){
      entries.forEach(function(entry, idx){
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = Math.min(idx * 0.04, 0.24) + 's';
          entry.target.classList.add('visible');
          ro.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    revealEls.forEach(function(el){ ro.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }

  /* ---------- spotlight cursor tracking ---------- */
  document.querySelectorAll('.skill-card, .exp-card, .cert-card').forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });

  /* ---------- hero cycling role text ---------- */
  var heroCycleEl = document.getElementById('heroCycle');
  var phrases = ['AWS • Kubernetes • CI/CD', 'DevOps Engineer', 'AWS Certified SAA'];
  function typeCycle(){
    if (reduceMotion) { heroCycleEl.textContent = phrases[0]; return; }
    var pi = 0, ci = 0, deleting = false;
    function tick(){
      var current = phrases[pi];
      if (!deleting) {
        ci++;
        if (ci > current.length) { deleting = true; setTimeout(tick, 1500); return; }
      } else {
        ci--;
        if (ci < 0) { deleting = false; pi = (pi + 1) % phrases.length; ci = 0; }
      }
      heroCycleEl.innerHTML = current.slice(0, ci) + '<span class="cyc-cursor"></span>';
      setTimeout(tick, deleting ? 30 : 60);
    }
    tick();
  }
  typeCycle();

  /* ---------- projects carousel ---------- */
  (function(){
    var track = document.getElementById('carouselSlides');
    var slides = track.querySelectorAll('.proj-slide');
    var dotsWrap = document.getElementById('carDots');
    var prevBtn = document.getElementById('carPrev');
    var nextBtn = document.getElementById('carNext');
    var carousel = document.getElementById('carousel');
    var idx = 0, autoTimer;

    slides.forEach(function(_, i){
      var d = document.createElement('button');
      d.className = 'car-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Go to project ' + (i+1));
      d.addEventListener('click', function(){ goTo(i); resetAuto(); });
      dotsWrap.appendChild(d);
    });
    var dots = dotsWrap.querySelectorAll('.car-dot');

    function goTo(i){
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      dots.forEach(function(d, di){ d.classList.toggle('active', di === idx); });
    }
    function next(){ goTo(idx + 1); }
    function prev(){ goTo(idx - 1); }
    function startAuto(){ if (reduceMotion) return; autoTimer = setInterval(next, 4500); }
    function resetAuto(){ clearInterval(autoTimer); startAuto(); }

    nextBtn.addEventListener('click', function(){ next(); resetAuto(); });
    prevBtn.addEventListener('click', function(){ prev(); resetAuto(); });
    carousel.addEventListener('mouseenter', function(){ clearInterval(autoTimer); });
    carousel.addEventListener('mouseleave', startAuto);
    startAuto();
  })();

  /* ---------- copy email toast ---------- */
  var toast = document.getElementById('copyToast');
  var toastTimer;
  document.querySelectorAll('a[href^="mailto:"]').forEach(function(a){
    a.addEventListener('click', function(){
      var email = a.getAttribute('href').replace('mailto:','');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(function(){
          toast.classList.add('show');
          clearTimeout(toastTimer);
          toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2200);
        }).catch(function(){});
      }
    });
  });
})();