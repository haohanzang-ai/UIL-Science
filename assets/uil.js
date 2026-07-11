/* ============================================================
   UIL Science Team Platform — shared shell + helpers
   Pages set: <body data-page="dashboard" data-title="Dashboard">
   Minimal-chrome pages (study mode): <body data-chrome="minimal">
   ============================================================ */
(function(){
  var NAV = [
    {id:'dashboard',     href:'study.html',              label:'Study Home',       icon:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'},
    {id:'exam',          href:'study.html?view=exam',    label:'Full UIL Exam',    icon:'<circle cx="12" cy="12" r="9"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/>'},
    {id:'biology',       href:'study.html?view=biology', label:'Biology',          icon:'<path d="M12 3c4 3 6 6 6 10a6 6 0 0 1-12 0c0-4 2-7 6-10z"/>'},
    {id:'chemistry',     href:'study.html?view=chemistry', label:'Chemistry',      icon:'<path d="M10 2v6l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V2"/><path d="M8 2h8M7 15h10"/>'},
    {id:'physics',       href:'study.html?view=physics', label:'Physics',          icon:'<circle cx="12" cy="12" r="2"/><path d="M4 12c2-5 14-5 16 0M4 12c2 5 14 5 16 0M12 4c5 2 5 14 0 16"/>'},
    {id:'weak',          href:'study.html?view=weak',    label:'Weak Topics',      icon:'<path d="M4 19V5"/><path d="M4 19h16"/><circle cx="9" cy="13" r="1.4"/><circle cx="14" cy="9" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'},
    {id:'flashcards',    href:'study.html?view=flashcards', label:'Flashcards',    icon:'<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h14v12"/>'},
    {id:'insights',      href:'study.html?view=progress', label:'My Progress',     icon:'<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10c.7.7 1 1.4 1 2h6c0-.6.3-1.3 1-2a6 6 0 0 0-4-10z"/>'},
    {id:'guide',         href:'study.html?view=guide',   label:'UIL Science Guide', icon:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9.5 12l2 2 3.5-4"/>'},
    {sep:true, group:'Team'},
    {id:'team',          href:'team.html',             label:'Team Dashboard',   icon:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.2"/><path d="M15.5 14.5c2.5.3 4.5 2 4.5 4.5"/>'},
    {id:'admin',         href:'admin-review.html',     label:'Admin Review',     icon:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M12 8v4M12 15.5v.5"/>'}
  ];

  function buildSidebar(active){
    var items = NAV.map(function(n){
      if(n.sep) return '<div class="sep"></div>'+(n.group?'<div class="grouplbl">'+n.group+'</div>':'');
      var cls = n.id===active ? ' class="active"' : '';
      if(n.soon) return '<span class="disabled" aria-disabled="true" title="Coming soon"><svg viewBox="0 0 24 24">'+n.icon+'</svg> '+n.label+'<small>Coming soon</small></span>';
      return '<a href="'+n.href+'"'+cls+'><svg viewBox="0 0 24 24">'+n.icon+'</svg> '+n.label+'</a>';
    }).join('');
    return ''+
      '<div class="logo"><div class="mark">Sci</div><div class="txt">UIL Science<small>Team Study Platform</small></div></div>'+
      '<nav class="nav">'+items+'</nav>'+
      '<div class="side-foot"><span class="badge-lock">🔒 Private · Team access</span></div>';
  }

  document.addEventListener('DOMContentLoaded', function(){
    var body = document.body;
    if(body.dataset.chrome === 'minimal') return; // study mode: no shell

    var active = body.dataset.page || '';
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
