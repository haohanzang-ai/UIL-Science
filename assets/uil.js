/* ============================================================
   UIL Science Team Platform — shared shell + helpers
   Pages set: <body data-page="dashboard" data-title="Dashboard">
   Minimal-chrome pages (study mode): <body data-chrome="minimal">
   ============================================================ */
(function(){
  var AUTH_HASH = '112d2fb99c4ccd8c17ee13074af3a2b662d2131234b55326211b3f866001b6b7';
  var AUTH_COOKIE = 'uil_site_auth';
  var NAV = [
    {id:'home',          href:'study.html',              label:'Study Home',       icon:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'},
    {id:'exam',          href:'study.html?view=exam',    label:'Full UIL Exam',    icon:'<circle cx="12" cy="12" r="9"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/>'},
    {id:'biology',       href:'study.html?view=biology', label:'Biology',          icon:'<path d="M12 3c4 3 6 6 6 10a6 6 0 0 1-12 0c0-4 2-7 6-10z"/>'},
    {id:'chemistry',     href:'study.html?view=chemistry', label:'Chemistry',      icon:'<path d="M10 2v6l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V2"/><path d="M8 2h8M7 15h10"/>'},
    {id:'physics',       href:'study.html?view=physics', label:'Physics',          icon:'<circle cx="12" cy="12" r="2"/><path d="M4 12c2-5 14-5 16 0M4 12c2 5 14 5 16 0M12 4c5 2 5 14 0 16"/>'},
    {id:'weak',          href:'study.html?view=weak',    label:'Weak Topics',      icon:'<path d="M4 19V5"/><path d="M4 19h16"/><circle cx="9" cy="13" r="1.4"/><circle cx="14" cy="9" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'},
    {id:'flashcards',    href:'study.html?view=flashcards', label:'Flashcards',    icon:'<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h14v12"/>'},
    {id:'progress',      href:'study.html?view=progress', label:'My Progress',     icon:'<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10c.7.7 1 1.4 1 2h6c0-.6.3-1.3 1-2a6 6 0 0 0-4-10z"/>'},
    {id:'guide',         href:'study.html?view=guide',   label:'UIL Science Guide', icon:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9.5 12l2 2 3.5-4"/>'},
    {id:'settings',      href:'study.html?view=settings', label:'Settings',         icon:'<circle cx="12" cy="12" r="3"/><path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.6 6.6 8 8M16 16l1.4 1.4M17.4 6.6 16 8M8 16l-1.4 1.4"/>'},
    {id:'troubleshoot',  href:'study.html?view=troubleshoot', label:'Troubleshooting', icon:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/>'}
  ];

  function buildSidebar(active){
    var items = NAV.map(function(n){
      if(n.sep) return '<div class="sep"></div>'+(n.group?'<div class="grouplbl">'+n.group+'</div>':'');
      var cls = n.id===active ? ' class="active"' : '';
      if(n.soon) return '<span class="disabled" aria-disabled="true" title="Coming soon"><svg viewBox="0 0 24 24">'+n.icon+'</svg> '+n.label+'<small>Coming soon</small></span>';
      return '<a href="'+n.href+'"'+cls+'><svg viewBox="0 0 24 24">'+n.icon+'</svg> '+n.label+'</a>';
    }).join('');
    return ''+
      '<div class="logo"><div class="mark">Sci</div><div class="txt">UIL Science<small>Student Study</small></div></div>'+
      '<nav class="nav">'+items+'</nav>'+
      '<div class="side-foot"><span class="badge-lock">Student workspace</span></div>';
  }

  function addAuthStyles(){
    if(document.getElementById('site-auth-styles')) return;
    var style = document.createElement('style');
    style.id = 'site-auth-styles';
    style.textContent =
      'body.auth-locked{overflow:hidden}' +
      'body.auth-locked .app{filter:blur(2px);pointer-events:none;user-select:none}' +
      '.site-auth{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#f6f7f8;color:#182230;padding:20px}' +
      '.site-auth-card{width:min(440px,100%);background:#fff;border:1px solid #d8dee7;border-radius:10px;padding:28px;box-shadow:0 18px 50px rgba(16,24,40,.16)}' +
      '.site-auth-card h1{font-size:26px;margin:0 0 8px;letter-spacing:0}.site-auth-card p{margin:0 0 18px;color:#5d6b7c}' +
      '.site-auth-card label{display:block;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#5d6b7c;margin-bottom:8px}' +
      '.site-auth-card input{width:100%;min-height:46px;border:1px solid #d8dee7;border-radius:8px;padding:10px 12px;font:inherit;color:#182230}' +
      '.site-auth-password-row{position:relative}.site-auth-password-row input{padding-right:52px}' +
      '.site-auth-eye{position:absolute;right:6px;top:6px;width:34px;height:34px;min-height:34px;margin:0!important;padding:0;border:1px solid #d8dee7;border-radius:7px;background:#fff;color:#5d6b7c;font-size:15px;line-height:1;display:grid;place-items:center}' +
      '.site-auth-eye[aria-pressed="true"]{background:#eaf1ff;color:#2454a6;border-color:#bfd0f3}' +
      '.site-auth-submit{width:100%;min-height:46px;margin-top:14px;border:0;border-radius:8px;background:#2454a6;color:#fff;font-weight:800;font:inherit;cursor:pointer}' +
      '.site-auth-error{min-height:22px;margin-top:8px;color:#b42318;font-size:13px;font-weight:700}';
    document.head.appendChild(style);
  }

  function sha256(value){
    if(!window.crypto || !crypto.subtle || !window.TextEncoder) return Promise.reject(new Error('Password check is unavailable in this browser.'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(function(buffer){
      return Array.prototype.map.call(new Uint8Array(buffer), function(b){ return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function readCookie(name){
    return document.cookie.split(';').map(function(part){ return part.trim(); }).reduce(function(found, part){
      if(found) return found;
      return part.indexOf(name + '=') === 0 ? decodeURIComponent(part.slice(name.length + 1)) : '';
    }, '');
  }

  function setSessionCookie(name, value){
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }

  function ensureSiteAuth(){
    if(readCookie(AUTH_COOKIE) === AUTH_HASH) return;
    addAuthStyles();
    document.body.classList.add('auth-locked');
    var overlay = document.createElement('div');
    overlay.className = 'site-auth';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'site-auth-title');
    overlay.innerHTML =
      '<form class="site-auth-card" id="site-auth-form">' +
        '<h1 id="site-auth-title">UIL Science</h1>' +
        '<p>Enter the site password to continue.</p>' +
        '<label for="site-auth-password">Password</label>' +
        '<div class="site-auth-password-row"><input id="site-auth-password" type="password" autocomplete="current-password" required />' +
        '<button class="site-auth-eye" id="site-auth-eye" type="button" aria-label="Show password" aria-pressed="false">◉</button></div>' +
        '<div class="site-auth-error" id="site-auth-error" role="alert"></div>' +
        '<button class="site-auth-submit" type="submit">Unlock site</button>' +
      '</form>';
    document.body.appendChild(overlay);
    var form = document.getElementById('site-auth-form');
    var input = document.getElementById('site-auth-password');
    var error = document.getElementById('site-auth-error');
    var eye = document.getElementById('site-auth-eye');
    eye.addEventListener('click', function(){
      var showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      eye.setAttribute('aria-pressed', showing ? 'false' : 'true');
      eye.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      eye.textContent = showing ? '◉' : '◎';
      input.focus();
    });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      error.textContent = '';
      sha256(String(input.value || '').toLowerCase()).then(function(hash){
        if(hash !== AUTH_HASH) {
          error.textContent = 'Incorrect password.';
          input.select();
          return;
        }
        setSessionCookie(AUTH_COOKIE, AUTH_HASH);
        document.body.classList.remove('auth-locked');
        overlay.remove();
      }).catch(function(err){
        error.textContent = err.message || 'Password check failed.';
      });
    });
    input.focus();
  }

  document.addEventListener('DOMContentLoaded', function(){
    var body = document.body;
    ensureSiteAuth();
    if(body.dataset.chrome === 'minimal') return; // study mode: no shell

    var active = body.dataset.page || '';
    if (active === 'study') {
      try { active = new URLSearchParams(location.search).get('view') || 'home'; }
      catch(e) { active = 'home'; }
    }
    var title  = body.dataset.title || 'UIL Science';

    // sidebar
    var sb = document.getElementById('sidebar');
    if(sb){ sb.className='sidebar'; sb.innerHTML = buildSidebar(active); }

    // mobile top bar + scrim (inject if missing)
    var main = document.querySelector('.main');
    if(main && !document.querySelector('.mtop')){
      var mtop = document.createElement('div');
      mtop.className='mtop';
      mtop.innerHTML = '<div class="mtitle"><span class="mark">Sci</span> '+title+'</div>'+
                       '<button class="hamb" id="hamb" aria-label="Open menu">☰</button>';
      main.insertBefore(mtop, main.firstChild);
    }
    if(!document.getElementById('scrim')){
      var sc=document.createElement('div'); sc.className='scrim'; sc.id='scrim'; document.body.appendChild(sc);
    }

    // drawer
    var scrim=document.getElementById('scrim'), hamb=document.getElementById('hamb');
    function open(){ sb && sb.classList.add('open'); scrim && scrim.classList.add('show'); }
    function close(){ sb && sb.classList.remove('open'); scrim && scrim.classList.remove('show'); }
    hamb && hamb.addEventListener('click', open);
    scrim && scrim.addEventListener('click', close);
    sb && sb.querySelectorAll('.nav a').forEach(function(a){a.addEventListener('click', close);});
  });

  // ---- helpers exposed on window.UIL ----
  window.UIL = {
    toast: function(msg, icon){
      var wrap = document.querySelector('.toast-wrap');
      if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }
      var t=document.createElement('div'); t.className='toast';
      t.innerHTML='<span class="ic">'+(icon||'✓')+'</span>'+msg;
      wrap.appendChild(t);
      requestAnimationFrame(function(){ t.classList.add('show'); });
      setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){t.remove();},300); }, 2600);
    },
    ring: function(el, pct, color){
      if(!el) return;
      el.style.setProperty('--p', Math.max(0,Math.min(100,pct)));
      if(color) el.style.setProperty('--c', color);
    },
    fill: function(el, pct){ if(el) el.style.width = Math.max(0,Math.min(100,pct))+'%'; },
    store: {
      get:function(k,d){ try{return JSON.parse(localStorage.getItem('uil-'+k)) ?? d;}catch(e){return d;} },
      set:function(k,v){ try{localStorage.setItem('uil-'+k, JSON.stringify(v));}catch(e){} }
    }
  };
})();
