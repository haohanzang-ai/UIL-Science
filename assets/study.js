(function(){
  'use strict';

  var PROFILE_KEY = 'uil-public-profile-v1';
  var PROGRESS_KEY = 'uil-public-progress-v1';
  var ANSWERS_KEY = 'uil-public-choice-selections-v1';
  var MAX_NAME = 40;
  var root = document.getElementById('root');
  var title = document.getElementById('page-title');
  var subtitle = document.getElementById('page-subtitle');
  var switchBtn = document.getElementById('switch-user');
  var params = new URLSearchParams(location.search);
  var view = params.get('view') || 'home';
  var catalog = { questions: [], exams: [] };

  var VIEWS = {
    exam: { title:'Full UIL Exam', subject:null },
    biology: { title:'Biology', subject:'biology' },
    chemistry: { title:'Chemistry', subject:'chemistry' },
    physics: { title:'Physics', subject:'physics' },
    weak: { title:'Weak Topics' },
    flashcards: { title:'Flashcards' },
    progress: { title:'My Progress' },
    guide: { title:'UIL Science Guide' }
  };

  function uid(){
    var bytes = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (var i=0;i<bytes.length;i++) bytes[i] = Math.floor(Math.random()*256);
    return Array.prototype.map.call(bytes, function(b){ return b.toString(16).padStart(2,'0'); }).join('');
  }

  function readJson(key, fallback){
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch(e) {
      return fallback;
    }
  }

  function saveJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getProfile(){
    var p = readJson(PROFILE_KEY, null);
    if (!p || !p.uid || !p.displayName) return null;
    return p;
  }

  function setProfile(name){
    var displayName = String(name || '').trim().replace(/\s+/g, ' ');
    if (displayName.length < 1) throw new Error('Enter a display name.');
    if (displayName.length > MAX_NAME) throw new Error('Display name must be '+MAX_NAME+' characters or fewer.');
    var profile = {
      schemaVersion: 1,
      uid: uid(),
      displayName: displayName,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      storageMode: 'local-only'
    };
    saveJson(PROFILE_KEY, profile);
    return profile;
  }

  function getProgress(){
    return readJson(PROGRESS_KEY, { schemaVersion:1, attempts:[], bookmarks:[] });
  }

  function getSelections(){
    return readJson(ANSWERS_KEY, { schemaVersion:1, selections:{} });
  }

  function setSelection(questionId, choice){
    var state = getSelections();
    state.selections = state.selections && typeof state.selections === 'object' ? state.selections : {};
    state.selections[questionId] = { choice: choice, selectedAt: new Date().toISOString() };
    saveJson(ANSWERS_KEY, state);
  }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function escapeCssValue(s){
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/["\\]/g, '\\$&');
  }

  function formatScienceText(s){
    var html = escapeHtml(s).replace(/\u2212/g, '-');
    html = html.replace(/(?:\u00d7|x)\s*10\s*([+-]?\d+)/gi, '&times; 10<sup>$1</sup>');
    html = html.replace(/\b10([+-]\d+)\b/g, '10<sup>$1</sup>');
    html = html.replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>');
    html = html.replace(/\)(\d+)/g, ')<sub>$1</sub>');
    html = html.replace(/([a-zA-Z])\^([+-]?\d+)/g, '$1<sup>$2</sup>');
    html = html.replace(/\b(deg|degrees?)\s*C\b/gi, '&deg;C');
    return html;
  }

  async function loadCatalog(){
    var q = fetch('data/processed/published-questions.json').then(function(r){ return r.ok ? r.json() : { questions:[] }; }).catch(function(){ return { questions:[] }; });
    var e = fetch('data/processed/published-exams.json').then(function(r){ return r.ok ? r.json() : { exams:[] }; }).catch(function(){ return { exams:[] }; });
    var both = await Promise.all([q,e]);
    catalog.questions = Array.isArray(both[0].questions) ? both[0].questions.filter(function(x){ return x && x.accessible !== false; }) : [];
    catalog.exams = Array.isArray(both[1].exams) ? both[1].exams.filter(function(x){ return x && x.accessible !== false; }) : [];
  }

  function nameGate(){
    title.textContent = 'UIL Science';
    subtitle.textContent = 'Enter only a display name. No email, phone, student ID, or location is collected.';
    switchBtn.style.display = 'none';
    root.innerHTML =
      '<div class="gate" style="max-width:480px;margin:40px auto"><div class="card">'+
      '<h2 style="font-size:22px;margin-bottom:8px">Start studying</h2>'+
      '<p class="muted" style="font-size:14px;margin-top:0">Progress is stored locally in this browser until Firebase is configured.</p>'+
      '<div class="field"><label for="display-name">Display name</label><input id="display-name" autocomplete="name" maxlength="'+MAX_NAME+'" placeholder="Your name"></div>'+
      '<div class="errorbox" id="name-error" style="display:none;margin-top:12px"><span class="ic">!</span><div></div></div>'+
      '<button class="btn primary block" id="start" type="button" style="margin-top:14px">Continue</button>'+
      '</div></div>';
    var input = document.getElementById('display-name');
    var error = document.getElementById('name-error');
    var start = document.getElementById('start');
    function submit(){
      try {
        setProfile(input.value);
        render();
      } catch(e) {
        error.style.display = 'flex';
        error.querySelector('div').textContent = e.message;
      }
    }
    start.addEventListener('click', submit);
    input.addEventListener('keydown', function(e){ if(e.key === 'Enter') submit(); });
    input.focus();
  }

  function shell(profile){
    switchBtn.style.display = '';
    switchBtn.onclick = function(){
      localStorage.removeItem(PROFILE_KEY);
      nameGate();
    };
    title.textContent = VIEWS[view] ? VIEWS[view].title : 'UIL Science';
    subtitle.textContent = 'Signed in locally as '+profile.displayName+'. Firebase sync is not configured yet.';
  }

  function statusCard(label, value, detail){
    return '<div class="card"><div class="cardhead"><h3>'+escapeHtml(label)+'</h3></div><div class="kpi">'+escapeHtml(value)+'</div><p class="muted" style="font-size:13px;margin:4px 0 0">'+escapeHtml(detail)+'</p></div>';
  }

  function home(profile){
    var progress = getProgress();
    var cards = [
      ['Full UIL Exam','exam','Browse uploaded exam groups with imported questions.'],
      ['Biology','biology','Study imported Biology questions from uploaded sources.'],
      ['Chemistry','chemistry','Study imported Chemistry questions from uploaded sources.'],
      ['Physics','physics','Study imported Physics, astronomy, directed reading, and beyond-AP questions from uploaded sources.'],
      ['Weak Topics','weak','Generated from your submitted attempts.'],
      ['Flashcards','flashcards','Generated from your missed questions and supported explanations.'],
      ['My Progress','progress','Accuracy, mastery, and bookmarks from your own attempts.'],
      ['UIL Science Guide','guide','Contest format, scoring, and study priorities.']
    ].map(function(c){
      var count = c[1] === 'exam' ? catalog.exams.length : catalog.questions.filter(function(q){ return !VIEWS[c[1]] || !VIEWS[c[1]].subject || q.subject === VIEWS[c[1]].subject; }).length;
      var available = count > 0 || c[1] === 'progress' || c[1] === 'guide' || c[1] === 'weak' || c[1] === 'flashcards';
      return '<a class="card hover study-card '+(available?'':'unavailable')+'" href="study.html?view='+c[1]+'">'+
        '<h3>'+escapeHtml(c[0])+'</h3><div class="meta">'+(count ? count+' item(s)' : 'No imported content yet')+'</div>'+
        '<p class="muted" style="font-size:13px;margin:0">'+escapeHtml(c[2])+'</p></a>';
    }).join('');
    root.innerHTML =
      '<div class="grid g4" style="margin-bottom:18px">'+
      statusCard('Uploaded exams', String(catalog.exams.length), 'Exam groups with parseable imported questions.')+
      statusCard('Accessible questions', String(catalog.questions.length), 'All parseable uploaded records are counted.')+
      statusCard('Attempts', String(progress.attempts.length), 'Local-only until Firebase is configured.')+
      statusCard('Storage', 'Local', 'No centralized sync or dashboard access yet.')+
      '</div><div class="grid g4">'+cards+'</div>';
  }

  function unavailable(kind, detail){
    root.innerHTML =
      '<div class="empty"><div class="emo">!</div><div class="h">'+escapeHtml(kind)+' unavailable</div>'+
      '<div class="d">'+escapeHtml(detail)+'</div>'+
      '<a class="btn primary" href="study.html">Back to study home</a></div>';
  }

  function subjectView(def){
    var rows = catalog.questions.filter(function(q){ return q.subject === def.subject; });
    if (!rows.length) return unavailable(def.title, 'No '+def.title+' questions are currently parseable from the uploaded source files.');
    var selections = getSelections().selections || {};
    root.innerHTML = '<div class="grid g2">'+rows.map(function(q){
      var choices = (q.choices || []).map(function(c){
        var label = c.label || '';
        var selected = selections[q.questionId] && selections[q.questionId].choice === label;
        return '<button class="choice pick '+(selected ? 'sel' : '')+'" type="button" data-question-id="'+escapeHtml(q.questionId)+'" data-choice="'+escapeHtml(label)+'" aria-pressed="'+(selected ? 'true' : 'false')+'"><b>'+escapeHtml(label)+'.</b><span>'+formatScienceText(c.text || c)+'</span></button>';
      }).join('');
      return '<div class="card question-card"><div class="cardhead"><h3>'+escapeHtml(q.examId+' '+(q.sourceQuestionCode || ''))+'</h3><span class="tag neutral">Uploaded</span></div><p class="qstem">'+formatScienceText(q.stem)+'</p><div class="choices">'+choices+'</div><p class="faint" style="font-size:12px;margin-top:12px">Selection is saved locally in this browser.</p></div>';
    }).join('')+'</div>';
    root.querySelectorAll('.choice.pick').forEach(function(btn){
      btn.addEventListener('click', function(){
        var questionId = btn.getAttribute('data-question-id');
        var choice = btn.getAttribute('data-choice');
        setSelection(questionId, choice);
        root.querySelectorAll('.choice.pick[data-question-id="'+escapeCssValue(questionId)+'"]').forEach(function(peer){
          var selected = peer === btn;
          peer.classList.toggle('sel', selected);
          peer.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
      });
    });
  }

  function examView(){
    if (!catalog.exams.length) return unavailable('Full UIL Exam', 'No uploaded exam group has parseable imported questions yet.');
    root.innerHTML = '<div class="grid g2">'+catalog.exams.map(function(e){
      return '<div class="card"><div class="cardhead"><h3>'+escapeHtml(e.title)+'</h3><span class="tag neutral">Uploaded</span></div><p class="muted">'+escapeHtml(e.examId)+'</p><p class="faint" style="font-size:12px;margin:8px 0 0">'+escapeHtml(String(e.accessibleQuestionCount || 0))+' question(s)</p></div>';
    }).join('')+'</div>';
  }

  function progressView(){
    var p = getProgress();
    root.innerHTML =
      '<div class="grid g4" style="margin-bottom:18px">'+
      statusCard('Attempts', String(p.attempts.length), 'Submitted attempts only.')+
      statusCard('Bookmarks', String(p.bookmarks.length), 'Locally saved question IDs.')+
      statusCard('Questions', String(catalog.questions.length), 'Accessible imported questions.')+
      statusCard('Mastered topics', '0', 'Requires repeated correct attempts over time.')+
      '</div><div class="empty"><div class="h">No attempts yet</div><div class="d">Progress will populate after you submit answers.</div></div>';
  }

  function weakOrFlashcards(label){
    unavailable(label, label+' are generated from submitted attempts. No attempts exist yet.');
  }

  function guideView(){
    root.innerHTML =
      '<div class="guide-hero"><div><span class="eyebrow">Study guide</span><h2>UIL Science at a glance</h2><p>Use the accessible uploaded question bank for practice, then troubleshoot any odd imported wording directly against the source packet if needed.</p></div><span class="tag neutral">Uploaded</span></div>'+
      '<div class="grid g2 guide-grid">'+
      guidePanel('Contest Format', ['Timed written science contest', 'Biology, Chemistry, and Physics sections', 'Questions are best practiced from released UIL-style exams', 'Figures, tables, and graph-heavy items can be checked against the source packet when needed'])+
      guidePanel('Scoring', ['Common historical scoring: +6 correct, -2 incorrect, 0 blank', 'Skip only when the penalty risk is higher than the educated-guess value', 'Track accuracy by subject, not just total score', 'Recheck official UIL rules before competition day'])+
      guidePanel('Study Flow', ['Start with one subject page and select an answer for every question', 'Mark missed ideas in a notebook by concept, formula, or vocabulary term', 'Redo missed questions after a delay instead of immediately memorizing letters', 'Mix subjects during final review so switching costs feel normal'])+
      guidePanel('Content Priorities', ['Biology: cell processes, genetics, evolution, ecology, and anatomy vocabulary', 'Chemistry: stoichiometry, gases, equilibrium, acids/bases, bonding, and periodic trends', 'Physics: mechanics, electricity, waves, optics, thermodynamics, and modern physics', 'Directed reading and astronomy should stay UIL-specific when they do not map cleanly to AP units'])+
      '</div>';
  }

  function guidePanel(h, items){
    return '<section class="guide-panel"><h3>'+escapeHtml(h)+'</h3><ul>'+items.map(function(item){ return '<li>'+escapeHtml(item)+'</li>'; }).join('')+'</ul></section>';
  }

  function render(){
    var profile = getProfile();
    if (!profile) return nameGate();
    profile.lastActiveAt = new Date().toISOString();
    saveJson(PROFILE_KEY, profile);
    shell(profile);
    if (view === 'home') return home(profile);
    if (view === 'exam') return examView();
    if (view === 'biology' || view === 'chemistry' || view === 'physics') return subjectView(VIEWS[view]);
    if (view === 'weak') return weakOrFlashcards('Weak Topics');
    if (view === 'flashcards') return weakOrFlashcards('Flashcards');
    if (view === 'progress') return progressView();
    if (view === 'guide') return guideView();
    view = 'home';
    return home(profile);
  }

  loadCatalog().then(render).catch(function(e){
    root.innerHTML = '<div class="errorbox"><span class="ic">!</span><div><b>Could not load study app.</b> '+escapeHtml(e.message || e)+'</div></div>';
  });
})();
