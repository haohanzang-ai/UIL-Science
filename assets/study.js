(function(){
  'use strict';

  var PROFILE_KEY = 'uil-public-profile-v1';
  var PROGRESS_KEY = 'uil-public-progress-v1';
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
    return readJson(PROGRESS_KEY, { schemaVersion:1, attempts:[], bookmarks:[], reviewQueue:[] });
  }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  async function loadCatalog(){
    var q = fetch('data/processed/published-questions.json').then(function(r){ return r.ok ? r.json() : { questions:[] }; }).catch(function(){ return { questions:[] }; });
    var e = fetch('data/processed/published-exams.json').then(function(r){ return r.ok ? r.json() : { exams:[] }; }).catch(function(){ return { exams:[] }; });
    var both = await Promise.all([q,e]);
    catalog.questions = Array.isArray(both[0].questions) ? both[0].questions.filter(function(x){ return x && x.published === true && x.verificationStatus === 'verified'; }) : [];
    catalog.exams = Array.isArray(both[1].exams) ? both[1].exams.filter(function(x){ return x && x.published === true && x.verificationStatus === 'verified'; }) : [];
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
      ['Full UIL Exam','exam','Complete historical exams only appear after all 60 questions, answers, figures, and hashes pass validation.'],
      ['Biology','biology','Study verified Biology questions by unit and topic.'],
      ['Chemistry','chemistry','Study verified Chemistry questions by unit and topic.'],
      ['Physics','physics','Study verified Physics, astronomy, directed reading, and beyond-AP questions without forced AP mapping.'],
      ['Weak Topics','weak','Generated only from your submitted verified attempts.'],
      ['Flashcards','flashcards','Generated only from your missed verified questions and supported explanations.'],
      ['My Progress','progress','Accuracy, mastery, bookmarks, and review schedule from your own attempts.'],
      ['UIL Science Guide','guide','Contest format and rules with missing official sources clearly marked.']
    ].map(function(c){
      var count = c[1] === 'exam' ? catalog.exams.length : catalog.questions.filter(function(q){ return !VIEWS[c[1]] || !VIEWS[c[1]].subject || q.subject === VIEWS[c[1]].subject; }).length;
      var available = count > 0 || c[1] === 'progress' || c[1] === 'guide' || c[1] === 'weak' || c[1] === 'flashcards';
      return '<a class="card hover study-card '+(available?'':'unavailable')+'" href="study.html?view='+c[1]+'">'+
        '<h3>'+escapeHtml(c[0])+'</h3><div class="meta">'+(count ? count+' verified item(s)' : 'No verified content published yet')+'</div>'+
        '<p class="muted" style="font-size:13px;margin:0">'+escapeHtml(c[2])+'</p></a>';
    }).join('');
    root.innerHTML =
      '<div class="grid g4" style="margin-bottom:18px">'+
      statusCard('Verified exams', String(catalog.exams.length), 'Must be complete 60-question historical exams.')+
      statusCard('Published questions', String(catalog.questions.length), 'Only verified records are counted.')+
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
    if (!rows.length) return unavailable(def.title, 'No '+def.title+' questions are published because no repository source has passed the source, transcription, answer, figure, categorization, and explanation gates.');
    root.innerHTML = '<div class="grid g2">'+rows.map(function(q){
      var choices = (q.choices || []).map(function(c){
        return '<li><b>'+escapeHtml(c.label || '')+'.</b> '+escapeHtml(c.text || c)+'</li>';
      }).join('');
      return '<div class="card"><div class="cardhead"><h3>'+escapeHtml(q.sourceQuestionCode || q.questionId)+'</h3><span class="tag neutral">Official source</span></div><p>'+escapeHtml(q.stem)+'</p><ul class="clean">'+choices+'</ul><p class="faint" style="font-size:12px;margin-top:12px">Answer and explanation stay hidden until an attempt/review flow is enabled.</p></div>';
    }).join('')+'</div>';
  }

  function examView(){
    if (!catalog.exams.length) return unavailable('Full UIL Exam', 'No complete historical exam is published. A full exam remains hidden until all 60 questions, official answers, figures, and the exam content hash pass validation.');
    root.innerHTML = '<div class="grid g2">'+catalog.exams.map(function(e){ return '<div class="card"><h3>'+escapeHtml(e.title)+'</h3><p class="muted">'+escapeHtml(e.examId)+'</p></div>'; }).join('')+'</div>';
  }

  function progressView(){
    var p = getProgress();
    root.innerHTML =
      '<div class="grid g4" style="margin-bottom:18px">'+
      statusCard('Attempts', String(p.attempts.length), 'Submitted verified attempts only.')+
      statusCard('Bookmarks', String(p.bookmarks.length), 'Locally saved question IDs.')+
      statusCard('Review queue', String(p.reviewQueue.length), 'Spaced review is local-only for now.')+
      statusCard('Mastered topics', '0', 'Requires 85%+, 10 attempts, and 2 sessions.')+
      '</div><div class="empty"><div class="h">No verified attempts yet</div><div class="d">Progress will populate after verified content is available and submitted.</div></div>';
  }

  function weakOrFlashcards(label){
    unavailable(label, label+' are generated only from verified submitted attempts. No verified attempts exist yet.');
  }

  function guideView(){
    root.innerHTML =
      '<div class="card"><div class="cardhead"><h3>UIL Science Guide</h3><span class="tag neutral">Needs official source review</span></div>'+
      '<div class="note warn" style="margin-bottom:14px"><div>Authoritative UIL rules, calculator/material rules, advancement rules, and current procedures are not stored in the repository. They are recorded in reports/missing-sources.md and are not fabricated here.</div></div>'+
      '<div class="grid g2">'+
      '<div>'+guideBlock('Contest format','UIL Science uses a timed written contest with Biology, Chemistry, and Physics content. Exact current rules require official UIL source verification.')+
      guideBlock('Scoring','Historical UIL Science scoring is commonly +6 correct, -2 incorrect, 0 blank. Current official confirmation is required before publishing as rule guidance.')+'</div>'+
      '<div>'+guideBlock('Study strategy','Start with official released exams once validated. Review missed concepts, keep units and formulas organized, and do timed practice only from verified content.')+
      guideBlock('Directed reading','Directed reading and astronomy topics must remain UIL-specific when they do not map cleanly to AP frameworks.')+'</div>'+
      '</div></div>';
  }

  function guideBlock(h,d){
    return '<section style="margin-bottom:16px"><h4>'+escapeHtml(h)+'</h4><p class="muted" style="font-size:14px">'+escapeHtml(d)+'</p></section>';
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
