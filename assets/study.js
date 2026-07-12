(function(){
  'use strict';

  var PROFILE_KEY = 'uil-public-profile-v1';
  var PROGRESS_KEY = 'uil-public-progress-v1';
  var ANSWERS_KEY = 'uil-public-choice-selections-v1';
  var MAX_NAME = 40;
  var LOAD_TIMEOUT_MS = 12000;
  var root = document.getElementById('root');
  var title = document.getElementById('page-title');
  var subtitle = document.getElementById('page-subtitle');
  var switchBtn = document.getElementById('switch-user');
  var params = new URLSearchParams(location.search);
  var view = params.get('view') || 'home';
  var catalog = { questions: [], exams: [], byId: {} };
  var ui = { filters: {}, index: 0, submitted: false, showHint: false, showSolution: false, examId: params.get('exam') || '' };

  var SUBJECTS = {
    biology: { title:'Biology', accent:'bio', description:'Cells, genetics, evolution, ecology, anatomy, physiology, and UIL-specific life science vocabulary.' },
    chemistry: { title:'Chemistry', accent:'chem', description:'Atomic structure, bonding, reactions, stoichiometry, thermodynamics, equilibrium, acids and bases, and laboratory reasoning.' },
    physics: { title:'Physics', accent:'phys', description:'Mechanics, electricity, waves, optics, thermodynamics, modern physics, astronomy, and directed-reading concepts.' }
  };
  var VIEWS = {
    home: { title:'UIL Science' },
    exam: { title:'Full UIL Exam' },
    biology: SUBJECTS.biology,
    chemistry: SUBJECTS.chemistry,
    physics: SUBJECTS.physics,
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
      localStorage.removeItem(key);
      return fallback;
    }
  }

  function saveJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  }

  function getProfile(){
    var p = readJson(PROFILE_KEY, null);
    if (!p || typeof p !== 'object' || !p.uid || !String(p.displayName || '').trim()) {
      localStorage.removeItem(PROFILE_KEY);
      return null;
    }
    p.displayName = String(p.displayName).trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
    return p;
  }

  function setProfile(name){
    var displayName = String(name || '').trim().replace(/\s+/g, ' ');
    if (!displayName) throw new Error('Enter your name to begin.');
    if (displayName.length > MAX_NAME) throw new Error('Name must be '+MAX_NAME+' characters or fewer.');
    var profile = { schemaVersion: 1, uid: uid(), displayName: displayName, createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString() };
    saveJson(PROFILE_KEY, profile);
    return profile;
  }

  function getProgress(){
    var p = readJson(PROGRESS_KEY, { schemaVersion:1, attempts:[], bookmarks:[] });
    p.attempts = Array.isArray(p.attempts) ? p.attempts : [];
    p.bookmarks = Array.isArray(p.bookmarks) ? p.bookmarks : [];
    return p;
  }

  function saveProgress(p){
    p.schemaVersion = 1;
    saveJson(PROGRESS_KEY, p);
  }

  function getSelections(){
    var s = readJson(ANSWERS_KEY, { schemaVersion:1, selections:{} });
    s.selections = s.selections && typeof s.selections === 'object' ? s.selections : {};
    return s;
  }

  function setSelection(questionId, choice){
    var state = getSelections();
    state.selections[questionId] = { choice: choice, selectedAt: new Date().toISOString() };
    saveJson(ANSWERS_KEY, state);
  }

  function recordAttempt(q, choice){
    var p = getProgress();
    p.attempts.push({
      questionId: q.questionId,
      examId: q.examId,
      subject: q.subject,
      unitName: unitName(q),
      topicName: topicName(q),
      choice: choice,
      correct: choice === q.officialAnswer,
      submittedAt: new Date().toISOString()
    });
    saveProgress(p);
  }

  function toggleBookmark(questionId){
    var p = getProgress();
    var i = p.bookmarks.indexOf(questionId);
    if (i >= 0) p.bookmarks.splice(i, 1);
    else p.bookmarks.push(questionId);
    saveProgress(p);
  }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function formatScienceText(s){
    var html = escapeHtml(s || '').replace(/\u2212/g, '-').replace(/\n/g, '<br>');
    html = html.replace(/(?:\u00d7|x)\s*10\s*([+-]?\d+)/gi, '&times; 10<sup>$1</sup>');
    html = html.replace(/\b10\^?([+-]\d+)\b/g, '10<sup>$1</sup>');
    html = html.replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>');
    html = html.replace(/\)(\d+)/g, ')<sub>$1</sub>');
    html = html.replace(/([a-zA-Z])\^([+-]?\d+)/g, '$1<sup>$2</sup>');
    html = html.replace(/\b(deg|degrees?)\s*C\b/gi, '&deg;C');
    return html;
  }

  function fetchJson(url, fallback){
    return fetch(url, { cache:'no-store' }).then(function(r){
      if (!r.ok) throw new Error('The study files could not be reached.');
      return r.json();
    }).catch(function(){ return fallback; });
  }

  function timeout(ms){
    return new Promise(function(_, reject){
      setTimeout(function(){ reject(new Error('The study files took too long to load.')); }, ms);
    });
  }

  async function loadCatalog(){
    var loading = Promise.all([
      fetchJson('data/processed/published-questions.json', { questions:[] }),
      fetchJson('data/processed/published-exams.json', { exams:[] })
    ]);
    var both = await Promise.race([loading, timeout(LOAD_TIMEOUT_MS)]);
    catalog.questions = Array.isArray(both[0].questions) ? both[0].questions.filter(function(x){ return x && x.accessible !== false; }) : [];
    catalog.exams = Array.isArray(both[1].exams) ? both[1].exams.filter(function(x){ return x && x.accessible !== false; }) : [];
    catalog.byId = {};
    catalog.questions.forEach(function(q){ catalog.byId[q.questionId] = q; });
  }

  function countSubject(subject){
    return catalog.questions.filter(function(q){ return q.subject === subject; }).length;
  }

  function unitName(q){
    return (q.categorization && q.categorization.unitName) || 'Uncategorized';
  }

  function topicName(q){
    return (q.categorization && q.categorization.topicName) || (q.categorization && q.categorization.uilSpecificCategory) || 'General';
  }

  function secondaryTopics(q){
    var list = q.categorization && q.categorization.secondaryTopicCodes;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }

  function displaySet(q){
    return [q.year, q.contestLevel, q.set].filter(Boolean).join(' ');
  }

  function subjectClass(subject){
    return subject === 'biology' ? 'bio' : subject === 'chemistry' ? 'chem' : subject === 'physics' ? 'phys' : 'neutral';
  }

  function attemptsFor(questionId){
    return getProgress().attempts.filter(function(a){ return a.questionId === questionId; });
  }

  function latestAttempt(questionId){
    var rows = attemptsFor(questionId);
    return rows.length ? rows[rows.length - 1] : null;
  }

  function isMissed(questionId){
    var a = latestAttempt(questionId);
    return !!(a && a.correct === false);
  }

  function accuracyForQuestions(rows){
    var ids = {};
    rows.forEach(function(q){ ids[q.questionId] = true; });
    var attempts = getProgress().attempts.filter(function(a){ return ids[a.questionId]; });
    if (!attempts.length) return null;
    var correct = attempts.filter(function(a){ return a.correct; }).length;
    return Math.round((correct / attempts.length) * 100);
  }

  function byUnique(rows, getter){
    var seen = {};
    rows.forEach(function(row){
      var val = getter(row);
      if (val) seen[val] = true;
    });
    return Object.keys(seen).sort();
  }

  function optionList(values, selected, placeholder){
    return '<option value="">'+escapeHtml(placeholder)+'</option>'+values.map(function(v){
      return '<option value="'+escapeHtml(v)+'"'+(selected === v ? ' selected' : '')+'>'+escapeHtml(v)+'</option>';
    }).join('');
  }

  function pageUrl(nextView, extra){
    var p = new URLSearchParams();
    if (nextView && nextView !== 'home') p.set('view', nextView);
    Object.keys(extra || {}).forEach(function(k){ if (extra[k]) p.set(k, extra[k]); });
    var qs = p.toString();
    return 'study.html' + (qs ? '?'+qs : '');
  }

  function nameGate(){
    document.body.classList.add('name-mode');
    title.textContent = 'Welcome to UIL Science';
    subtitle.textContent = 'Build a focused study workspace for released UIL Science questions.';
    switchBtn.hidden = true;
    root.innerHTML =
      '<section class="name-card" aria-labelledby="name-title">'+
        '<div class="name-mark">UIL Science</div>'+
        '<h2 id="name-title">Welcome to UIL Science</h2>'+
        '<p>Practice Biology, Chemistry, Physics, and full exam sets in a clean study interface.</p>'+
        '<form id="name-form" novalidate>'+
          '<div class="field"><label for="display-name">Student name</label><input id="display-name" autocomplete="name" maxlength="'+MAX_NAME+'" aria-describedby="name-note name-error"></div>'+
          '<div class="field-error" id="name-error" role="alert"></div>'+
          '<button class="btn primary lg" id="start" type="submit">Start studying</button>'+
          '<p class="privacy-note" id="name-note">Your progress stays in this browser on this device.</p>'+
        '</form>'+
      '</section>';
    var form = document.getElementById('name-form');
    var input = document.getElementById('display-name');
    var error = document.getElementById('name-error');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      try {
        setProfile(input.value);
        document.body.classList.remove('name-mode');
        render();
      } catch(err) {
        error.textContent = err.message;
        input.setAttribute('aria-invalid', 'true');
      }
    });
    input.focus();
  }

  function shell(profile){
    document.body.classList.remove('name-mode');
    switchBtn.hidden = false;
    switchBtn.onclick = function(){
      localStorage.removeItem(PROFILE_KEY);
      nameGate();
    };
    var def = VIEWS[view] || VIEWS.home;
    title.textContent = def.title;
    subtitle.textContent = profile.displayName ? 'Studying as '+profile.displayName : 'Focused UIL Science study';
  }

  function stateCard(label, value, detail){
    return '<div class="stat-card"><span>'+escapeHtml(label)+'</span><strong>'+escapeHtml(value)+'</strong><small>'+escapeHtml(detail)+'</small></div>';
  }

  function emptyState(heading, detail, action){
    return '<div class="empty refined"><div class="h">'+escapeHtml(heading)+'</div><div class="d">'+escapeHtml(detail)+'</div>'+(action || '')+'</div>';
  }

  function home(profile){
    var progress = getProgress();
    var selections = getSelections().selections || {};
    var selectedIds = Object.keys(selections);
    var resumeId = selectedIds.reverse().find(function(id){ return catalog.byId[id]; });
    var subjectCards = ['biology','chemistry','physics'].map(function(s){
      var rows = catalog.questions.filter(function(q){ return q.subject === s; });
      var acc = accuracyForQuestions(rows);
      return '<a class="subject-card '+SUBJECTS[s].accent+'" href="'+pageUrl(s)+'">'+
        '<div><span class="tag '+SUBJECTS[s].accent+'">'+escapeHtml(SUBJECTS[s].title)+'</span><h2>'+escapeHtml(SUBJECTS[s].title)+'</h2><p>'+escapeHtml(SUBJECTS[s].description)+'</p></div>'+
        '<div class="subject-foot"><strong>'+rows.length+'</strong><span>questions</span>'+(acc == null ? '<small>No submitted answers yet</small>' : '<small>'+acc+'% accuracy</small>')+'</div>'+
      '</a>';
    }).join('');
    var support = [
      ['Weak Topics','weak','Review areas based on submitted answers.'],
      ['Flashcards','flashcards','Study missed-question prompts when available.'],
      ['My Progress','progress','Review attempts, subject summaries, and bookmarks.'],
      ['UIL Science Guide','guide','Read contest format and study priorities.']
    ].map(function(c){
      return '<a class="tool-link" href="'+pageUrl(c[1])+'"><strong>'+escapeHtml(c[0])+'</strong><span>'+escapeHtml(c[2])+'</span></a>';
    }).join('');
    root.innerHTML =
      '<section class="hero-study">'+
        '<div><p class="overline">Study home</p><h2>Welcome back, '+escapeHtml(profile.displayName)+'</h2><p>Choose a subject, continue a saved selection, or start from a historical UIL exam set.</p></div>'+
        '<div class="hero-actions">'+(resumeId ? '<a class="btn primary" href="'+pageUrl(catalog.byId[resumeId].subject, { q: resumeId })+'">Continue studying</a>' : '<a class="btn primary" href="'+pageUrl('biology')+'">Start with Biology</a>')+'</div>'+
      '</section>'+
      '<section class="subject-grid">'+subjectCards+'</section>'+
      '<section class="exam-band">'+
        '<div><p class="overline">Full UIL Exam</p><h2>60 questions, 20 per subject, 120 minutes</h2><p>Select a historical exam set with available question records. Incomplete imported sets are shown honestly.</p></div>'+
        '<a class="btn secondary" href="'+pageUrl('exam')+'">Choose an exam</a>'+
      '</section>'+
      '<section class="support-grid">'+support+'</section>'+
      '<section class="stats-row">'+
        stateCard('Available questions', String(catalog.questions.length), 'From current study files')+
        stateCard('Exam groups', String(catalog.exams.length), 'Historical sets')+
        stateCard('Submitted answers', String(progress.attempts.length), 'Used for progress')+
        stateCard('Bookmarks', String(progress.bookmarks.length), 'Saved for review')+
      '</section>';
  }

  function filteredSubjectRows(subject){
    var rows = catalog.questions.filter(function(q){ return q.subject === subject; });
    var f = ui.filters[subject] || {};
    var selections = getSelections().selections || {};
    var bookmarks = getProgress().bookmarks;
    rows = rows.filter(function(q){
      if (f.unit && unitName(q) !== f.unit) return false;
      if (f.topic && topicName(q) !== f.topic) return false;
      if (f.secondary && secondaryTopics(q).indexOf(f.secondary) < 0) return false;
      if (f.year && String(q.year || '') !== f.year) return false;
      if (f.level && String(q.contestLevel || '') !== f.level) return false;
      if (f.unanswered && selections[q.questionId]) return false;
      if (f.missed && !isMissed(q.questionId)) return false;
      if (f.bookmarked && bookmarks.indexOf(q.questionId) < 0) return false;
      if (f.due && !isMissed(q.questionId)) return false;
      return true;
    });
    return rows;
  }

  function renderFilters(subject, allRows, rows){
    var f = ui.filters[subject] || {};
    var secondaries = {};
    allRows.forEach(function(q){ secondaryTopics(q).forEach(function(t){ secondaries[t] = true; }); });
    return '<form class="filter-panel" id="filter-form">'+
      '<div class="filter-head"><strong>'+rows.length+' result'+(rows.length === 1 ? '' : 's')+'</strong><button class="btn sm ghost" type="button" id="reset-filters">Reset</button></div>'+
      '<label>Unit<select name="unit">'+optionList(byUnique(allRows, unitName), f.unit, 'All units')+'</select></label>'+
      '<label>Primary topic<select name="topic">'+optionList(byUnique(allRows, topicName), f.topic, 'All topics')+'</select></label>'+
      '<label>Secondary topic<select name="secondary">'+optionList(Object.keys(secondaries).sort(), f.secondary, 'All secondary topics')+'</select></label>'+
      '<label>Year<select name="year">'+optionList(byUnique(allRows, function(q){ return q.year ? String(q.year) : ''; }), f.year, 'All years')+'</select></label>'+
      '<label>Contest level<select name="level">'+optionList(byUnique(allRows, function(q){ return q.contestLevel || ''; }), f.level, 'All levels')+'</select></label>'+
      '<div class="filter-checks">'+check('unanswered','Unanswered',f.unanswered)+check('missed','Missed',f.missed)+check('bookmarked','Bookmarked',f.bookmarked)+check('due','Due for review',f.due)+'</div>'+
    '</form>';
  }

  function check(name, label, on){
    return '<label class="check-row"><input type="checkbox" name="'+name+'" '+(on ? 'checked' : '')+'> <span>'+escapeHtml(label)+'</span></label>';
  }

  function unitOverview(subject, rows){
    var groups = {};
    rows.forEach(function(q){
      var key = unitName(q);
      groups[key] = groups[key] || [];
      groups[key].push(q);
    });
    var keys = Object.keys(groups).sort();
    if (!keys.length) return '';
    return '<section class="unit-list" aria-label="Units">'+keys.slice(0, 8).map(function(key){
      var acc = accuracyForQuestions(groups[key]);
      return '<button class="unit-row" type="button" data-unit="'+escapeHtml(key)+'"><span><strong>'+escapeHtml(key)+'</strong><small>'+(acc == null ? 'Not attempted' : acc+'% accuracy')+'</small></span><b>'+groups[key].length+'</b></button>';
    }).join('')+'</section>';
  }

  function questionCard(q, rows, index, mode){
    var selections = getSelections().selections || {};
    var selected = selections[q.questionId] && selections[q.questionId].choice;
    var submitted = ui.submitted || !!latestAttempt(q.questionId);
    var latest = latestAttempt(q.questionId);
    var progress = getProgress();
    var bookmarked = progress.bookmarks.indexOf(q.questionId) >= 0;
    var choices = (q.choices || []).map(function(c){
      var label = c.label || '';
      var isSelected = selected === label;
      var isCorrect = submitted && label === q.officialAnswer;
      var isWrong = submitted && isSelected && label !== q.officialAnswer;
      var status = isCorrect ? '<span class="choice-status">Correct answer</span>' : isWrong ? '<span class="choice-status">Your answer</span>' : '';
      return '<button class="choice pick '+(isSelected ? 'sel ' : '')+(isCorrect ? 'correct ' : '')+(isWrong ? 'incorrect ' : '')+'" type="button" data-choice="'+escapeHtml(label)+'" aria-pressed="'+(isSelected ? 'true' : 'false')+'"><b>'+escapeHtml(label)+'</b><span>'+formatScienceText(c.text || c)+'</span>'+status+'</button>';
    }).join('');
    return '<article class="focus-card" data-question-id="'+escapeHtml(q.questionId)+'">'+
      '<div class="question-meta"><span class="tag '+subjectClass(q.subject)+'">'+escapeHtml((SUBJECTS[q.subject] && SUBJECTS[q.subject].title) || q.subject)+'</span><span>'+escapeHtml(unitName(q))+'</span><span>'+escapeHtml(topicName(q))+'</span><span>'+escapeHtml(displaySet(q))+'</span></div>'+
      '<div class="question-top"><div><p class="overline">Question '+(index + 1)+' of '+rows.length+'</p><h2>'+escapeHtml(q.sourceQuestionCode || ('Question '+(q.questionNumber || index + 1)))+'</h2></div><button class="btn sm ghost" id="bookmark" type="button" aria-pressed="'+(bookmarked ? 'true' : 'false')+'">'+(bookmarked ? 'Bookmarked' : 'Bookmark')+'</button></div>'+
      '<div class="qstem">'+formatScienceText(q.stem || 'Question text unavailable.')+'</div>'+
      '<div class="figure-fallback" hidden>Figure unavailable</div>'+
      '<div class="choices" role="group" aria-label="Answer choices">'+choices+'</div>'+
      (submitted ? resultPanel(q, selected, latest) : '')+
      '<div class="question-actions">'+
        '<button class="btn primary" id="submit-answer" type="button" '+(!selected || submitted ? 'disabled' : '')+'>Submit Answer</button>'+
        '<button class="btn" id="prev-question" type="button" '+(index <= 0 ? 'disabled' : '')+'>Previous</button>'+
        '<button class="btn" id="next-question" type="button" '+(index >= rows.length - 1 ? 'disabled' : '')+'>Next Question</button>'+
        '<button class="btn ghost" id="hint-button" type="button">Hint</button>'+
        (submitted ? '<button class="btn ghost" id="solution-button" type="button">View Solution</button><button class="btn ghost" id="learn-button" type="button">Learn This Topic</button>' : '')+
      '</div>'+
      (ui.showHint ? hintPanel(q) : '')+
      (ui.showSolution ? solutionPanel(q) : '')+
      (mode === 'exam' ? palette(rows, index) : '')+
    '</article>';
  }

  function resultPanel(q, selected, latest){
    var correct = selected === q.officialAnswer;
    var text = correct ? 'Correct. Your selected answer matches the answer key.' : 'Not correct. The answer key lists '+escapeHtml(q.officialAnswer || 'an unavailable answer')+'.';
    if (latest && latest.correct === false && selected === q.officialAnswer) text = 'Correct. Your latest submitted answer matches the answer key.';
    return '<div class="result-panel '+(correct ? 'good' : 'bad')+'"><strong>'+(correct ? 'Correct' : 'Check this one')+'</strong><span>'+text+'</span></div>';
  }

  function hintPanel(q){
    var hint = q.hint || '';
    return '<aside class="study-panel"><h3>Hint</h3><p>'+(hint ? formatScienceText(hint) : 'A hint is not available for this question.')+'</p></aside>';
  }

  function solutionPanel(q){
    var refs = Array.isArray(q.citations) && q.citations.length ? q.citations : [];
    return '<aside class="study-panel"><h3>Solution</h3>'+
      '<p class="trust-label">'+escapeHtml(q.explanationStatus === 'not-imported' ? 'Explanation unavailable' : 'Official explanation')+'</p>'+
      '<p>'+(q.explanation ? formatScienceText(q.explanation) : 'A worked explanation has not been imported for this question. Use the answer key and source packet when troubleshooting.')+'</p>'+
      '<details><summary>References</summary>'+(refs.length ? '<ul>'+refs.map(function(r){ return '<li>'+escapeHtml([r.sourceId, r.page ? 'page '+r.page : ''].filter(Boolean).join(', '))+'</li>'; }).join('')+'</ul>' : '<p>No reference details are available for this question.</p>')+'</details>'+
      '</aside>';
  }

  function palette(rows, index){
    var selections = getSelections().selections || {};
    return '<nav class="question-palette" aria-label="Exam question palette">'+rows.map(function(q, i){
      return '<button type="button" class="'+(i === index ? 'on ' : '')+(selections[q.questionId] ? 'answered' : '')+'" data-go="'+i+'">'+(i + 1)+'</button>';
    }).join('')+'</nav>';
  }

  function subjectView(subject){
    var def = SUBJECTS[subject];
    var allRows = catalog.questions.filter(function(q){ return q.subject === subject; });
    if (!allRows.length) return unavailable(def.title, 'No '+def.title+' questions are available in the current study files.');
    if (params.get('q')) {
      var paramIndex = allRows.findIndex(function(q){ return q.questionId === params.get('q'); });
      if (paramIndex >= 0) ui.index = paramIndex;
    }
    var rows = filteredSubjectRows(subject);
    if (ui.index >= rows.length) ui.index = Math.max(0, rows.length - 1);
    root.innerHTML =
      '<section class="subject-hero '+def.accent+'"><div><span class="tag '+def.accent+'">'+escapeHtml(def.title)+'</span><h2>'+escapeHtml(def.title)+'</h2><p>'+escapeHtml(def.description)+'</p></div>'+
      '<div class="subject-summary">'+stateCard('Questions', String(allRows.length), 'Available now')+stateCard('Progress', progressSummary(allRows), 'Submitted answers')+'</div></section>'+
      unitOverview(subject, allRows)+
      renderFilters(subject, allRows, rows)+
      (rows.length ? questionCard(rows[ui.index], rows, ui.index, 'subject') : emptyState('No matching questions', 'Adjust or reset the filters to see questions again.', '<button class="btn primary" id="empty-reset" type="button">Reset filters</button>'));
    bindSubject(subject, rows);
  }

  function progressSummary(rows){
    var acc = accuracyForQuestions(rows);
    return acc == null ? 'Not started' : acc+'%';
  }

  function bindSubject(subject, rows){
    var form = document.getElementById('filter-form');
    if (form) {
      form.addEventListener('change', function(){
        var data = new FormData(form);
        ui.filters[subject] = {
          unit: data.get('unit') || '',
          topic: data.get('topic') || '',
          secondary: data.get('secondary') || '',
          year: data.get('year') || '',
          level: data.get('level') || '',
          unanswered: data.get('unanswered') === 'on',
          missed: data.get('missed') === 'on',
          bookmarked: data.get('bookmarked') === 'on',
          due: data.get('due') === 'on'
        };
        ui.index = 0; ui.submitted = false; ui.showHint = false; ui.showSolution = false;
        subjectView(subject);
      });
    }
    var reset = document.getElementById('reset-filters') || document.getElementById('empty-reset');
    if (reset) reset.addEventListener('click', function(){ ui.filters[subject] = {}; ui.index = 0; subjectView(subject); });
    root.querySelectorAll('.unit-row').forEach(function(btn){
      btn.addEventListener('click', function(){
        ui.filters[subject] = ui.filters[subject] || {};
        ui.filters[subject].unit = btn.getAttribute('data-unit');
        ui.index = 0;
        subjectView(subject);
      });
    });
    bindQuestion(rows, function(){ subjectView(subject); });
  }

  function bindQuestion(rows, rerender){
    var card = root.querySelector('.focus-card');
    if (!card || !rows.length) return;
    var q = rows[ui.index];
    root.querySelectorAll('.choice.pick').forEach(function(btn){
      btn.addEventListener('click', function(){
        setSelection(q.questionId, btn.getAttribute('data-choice'));
        ui.submitted = false;
        rerender();
      });
    });
    var submit = document.getElementById('submit-answer');
    if (submit) submit.addEventListener('click', function(){
      var selected = getSelections().selections[q.questionId] && getSelections().selections[q.questionId].choice;
      if (!selected) return;
      recordAttempt(q, selected);
      ui.submitted = true;
      rerender();
    });
    var prev = document.getElementById('prev-question');
    if (prev) prev.addEventListener('click', function(){ ui.index = Math.max(0, ui.index - 1); ui.submitted = false; ui.showHint = false; ui.showSolution = false; rerender(); });
    var next = document.getElementById('next-question');
    if (next) next.addEventListener('click', function(){ ui.index = Math.min(rows.length - 1, ui.index + 1); ui.submitted = false; ui.showHint = false; ui.showSolution = false; rerender(); });
    var hint = document.getElementById('hint-button');
    if (hint) hint.addEventListener('click', function(){ ui.showHint = !ui.showHint; rerender(); });
    var solution = document.getElementById('solution-button');
    if (solution) solution.addEventListener('click', function(){ ui.showSolution = !ui.showSolution; rerender(); });
    var learn = document.getElementById('learn-button');
    if (learn) learn.addEventListener('click', function(){ ui.showSolution = true; rerender(); });
    var bookmark = document.getElementById('bookmark');
    if (bookmark) bookmark.addEventListener('click', function(){ toggleBookmark(q.questionId); rerender(); });
    root.querySelectorAll('.question-palette button').forEach(function(btn){
      btn.addEventListener('click', function(){ ui.index = Number(btn.getAttribute('data-go')) || 0; ui.submitted = false; ui.showHint = false; ui.showSolution = false; rerender(); });
    });
  }

  function examView(){
    if (ui.examId) return activeExam(ui.examId);
    if (!catalog.exams.length) return unavailable('Full UIL Exam', 'No exam group is available in the current study files.');
    root.innerHTML =
      '<section class="exam-intro"><div><p class="overline">Full UIL Exam</p><h2>Choose a historical exam set</h2><p>Each card shows only the imported availability already present in the study files.</p></div><div class="exam-facts"><span>60 questions</span><span>20 per subject</span><span>120 minutes</span></div></section>'+
      '<section class="exam-grid">'+catalog.exams.map(function(e){
        var complete = Number(e.accessibleQuestionCount || 0) >= 50;
        return '<article class="exam-card '+(complete ? '' : 'incomplete')+'"><div><h3>'+escapeHtml(e.title)+'</h3><p>'+escapeHtml([e.year, e.contestLevel, e.set].filter(Boolean).join(' '))+'</p></div><strong>'+escapeHtml(String(e.accessibleQuestionCount || 0))+' questions</strong>'+(complete ? '<a class="btn primary" href="'+pageUrl('exam', { exam:e.examId })+'">Start exam</a>' : '<button class="btn" type="button" disabled>Incomplete</button>')+'</article>';
      }).join('')+'</section>';
  }

  function activeExam(examId){
    var exam = catalog.exams.find(function(e){ return e.examId === examId; });
    if (!exam) return unavailable('Exam unavailable', 'This exam set is not available in the current study files.');
    var rows = (exam.questionIds || []).map(function(id){ return catalog.byId[id]; }).filter(Boolean);
    if (!rows.length) return unavailable('Exam unavailable', 'This exam set does not have available questions.');
    if (ui.index >= rows.length) ui.index = rows.length - 1;
    var selections = getSelections().selections || {};
    var answered = rows.filter(function(q){ return selections[q.questionId]; }).length;
    root.innerHTML =
      '<section class="exam-active-head"><div><p class="overline">Active exam</p><h2>'+escapeHtml(exam.title)+'</h2><p>Answer selections are saved automatically in this browser.</p></div><div class="exam-timer"><strong>120:00</strong><span>minutes</span></div><div class="exam-progress"><strong>'+answered+'/'+rows.length+'</strong><span>answered</span></div></section>'+
      questionCard(rows[ui.index], rows, ui.index, 'exam')+
      '<div class="submit-exam-row"><button class="btn primary" id="submit-exam" type="button">Submit exam</button></div>';
    bindQuestion(rows, function(){ activeExam(examId); });
    var submitExam = document.getElementById('submit-exam');
    if (submitExam) submitExam.addEventListener('click', function(){
      var missing = rows.length - answered;
      if (missing && !confirm('You still have '+missing+' unanswered question'+(missing === 1 ? '' : 's')+'. Submit anyway?')) return;
      ui.submitted = true;
      activeExam(examId);
    });
  }

  function progressView(){
    var p = getProgress();
    var subjectRows = ['biology','chemistry','physics'].map(function(s){
      var rows = catalog.questions.filter(function(q){ return q.subject === s; });
      var acc = accuracyForQuestions(rows);
      return '<div class="progress-line"><span>'+escapeHtml(SUBJECTS[s].title)+'</span><div class="meter '+SUBJECTS[s].accent+'"><i style="width:'+(acc || 0)+'%"></i></div><strong>'+(acc == null ? 'Not started' : acc+'%')+'</strong></div>';
    }).join('');
    var bookmarks = p.bookmarks.map(function(id){ return catalog.byId[id]; }).filter(Boolean).slice(0, 8);
    root.innerHTML =
      '<section class="stats-row">'+stateCard('Submitted answers', String(p.attempts.length), 'All subjects')+stateCard('Bookmarks', String(p.bookmarks.length), 'Saved questions')+stateCard('Accuracy', overallAccuracy(), 'Submitted answers')+stateCard('Recent exams', '0', 'No exam scores submitted')+'</section>'+
      '<section class="card refined-card"><h2>Subject summaries</h2>'+subjectRows+'</section>'+
      '<section class="two-col"><div class="card refined-card"><h2>Developing or weak units</h2>'+weakList()+'</div><div class="card refined-card"><h2>Bookmarks</h2>'+(bookmarks.length ? bookmarks.map(function(q){ return '<a class="bookmark-row" href="'+pageUrl(q.subject, { q:q.questionId })+'"><span>'+escapeHtml(displaySet(q))+'</span><strong>'+escapeHtml(q.sourceQuestionCode || q.questionId)+'</strong></a>'; }).join('') : '<p class="muted">No bookmarks yet.</p>')+'</div></section>';
  }

  function overallAccuracy(){
    var a = getProgress().attempts;
    if (!a.length) return 'Not started';
    return Math.round(a.filter(function(x){ return x.correct; }).length / a.length * 100)+'%';
  }

  function weakList(){
    var p = getProgress();
    var misses = {};
    p.attempts.forEach(function(a){ if (a.correct === false) misses[(a.subject || '')+'|'+(a.unitName || 'Uncategorized')] = (misses[(a.subject || '')+'|'+(a.unitName || 'Uncategorized')] || 0) + 1; });
    var rows = Object.keys(misses).sort(function(a,b){ return misses[b] - misses[a]; }).slice(0, 8);
    if (!rows.length) return '<p class="muted">Weak areas appear after submitted missed answers.</p>';
    return rows.map(function(key){
      var parts = key.split('|');
      return '<a class="bookmark-row" href="'+pageUrl(parts[0] || 'biology')+'"><span>'+escapeHtml((SUBJECTS[parts[0]] && SUBJECTS[parts[0]].title) || parts[0])+'</span><strong>'+escapeHtml(parts[1])+'</strong><small>'+misses[key]+' missed attempt'+(misses[key] === 1 ? '' : 's')+'</small></a>';
    }).join('');
  }

  function weakView(){
    root.innerHTML = '<section class="card refined-card"><h2>Weak Topics</h2>'+weakList()+'</section>';
  }

  function flashcardsView(){
    var missed = getProgress().attempts.filter(function(a){ return a.correct === false; }).map(function(a){ return catalog.byId[a.questionId]; }).filter(Boolean);
    var seen = {};
    missed = missed.filter(function(q){ if (seen[q.questionId]) return false; seen[q.questionId] = true; return true; });
    if (!missed.length) {
      root.innerHTML = emptyState('No flashcards yet', 'Flashcards appear after you submit missed answers with available question text.');
      return;
    }
    if (ui.index >= missed.length) ui.index = missed.length - 1;
    var q = missed[ui.index];
    root.innerHTML =
      '<section class="flashcard"><p class="overline">Flashcard '+(ui.index + 1)+' of '+missed.length+'</p><h2>'+formatScienceText(q.stem)+'</h2>'+(ui.showSolution ? '<div class="flash-answer">Answer: '+escapeHtml(q.officialAnswer || 'Unavailable')+'</div>' : '')+
      '<div class="question-actions"><button class="btn" id="prev-question" '+(ui.index <= 0 ? 'disabled' : '')+'>Previous</button><button class="btn primary" id="solution-button">Reveal</button><button class="btn" id="next-question" '+(ui.index >= missed.length - 1 ? 'disabled' : '')+'>Next</button></div></section>';
    var prev = document.getElementById('prev-question');
    var next = document.getElementById('next-question');
    var reveal = document.getElementById('solution-button');
    if (prev) prev.addEventListener('click', function(){ ui.index = Math.max(0, ui.index - 1); ui.showSolution = false; flashcardsView(); });
    if (next) next.addEventListener('click', function(){ ui.index = Math.min(missed.length - 1, ui.index + 1); ui.showSolution = false; flashcardsView(); });
    if (reveal) reveal.addEventListener('click', function(){ ui.showSolution = !ui.showSolution; flashcardsView(); });
  }

  function guideView(){
    root.innerHTML =
      '<nav class="toc" aria-label="Guide sections"><a href="#format">Format</a><a href="#scoring">Scoring</a><a href="#subjects">Subjects</a><a href="#workflow">Study workflow</a></nav>'+
      '<section class="guide-page">'+
        guideSection('format','Contest Format',['UIL Science is a timed written contest.','Questions are organized across Biology, Chemistry, and Physics.','Historical exam selection depends on the available imported exam records.'])+
        guideSection('scoring','Scoring',['Use the official scoring rules provided for your competition when available.','A common released-format pattern is positive credit for correct answers, a penalty for incorrect answers, and no penalty for blanks.','Practice blanking only when the risk of the penalty outweighs your confidence.'])+
        guideSection('subjects','Subject Priorities',['Biology: cells, genetics, evolution, ecology, anatomy, physiology, and vocabulary.','Chemistry: stoichiometry, atomic structure, bonding, equilibrium, acids and bases, and periodic trends.','Physics: mechanics, electricity, waves, optics, thermodynamics, modern physics, astronomy, and directed reading.'])+
        guideSection('workflow','Study Workflow',['Start with one subject and answer one question at a time.','Use missed answers to identify weak units.','Bookmark questions that need another pass.','Use full exam sets for timing and section-switching practice.'])+
        '<details class="collapse"><summary>Official references</summary><div class="body"><p>Use the official UIL materials and source packets already included with this site when checking contest rules or source wording.</p></div></details>'+
      '</section>';
  }

  function guideSection(id, heading, items){
    return '<section id="'+id+'" class="guide-section"><h2>'+escapeHtml(heading)+'</h2><ul>'+items.map(function(item){ return '<li>'+escapeHtml(item)+'</li>'; }).join('')+'</ul></section>';
  }

  function unavailable(kind, detail){
    root.innerHTML = emptyState(kind+' unavailable', detail, '<a class="btn primary" href="study.html">Back to study home</a>');
  }

  function errorState(message){
    root.innerHTML = '<div class="errorbox refined-error"><div><b>Study page could not load.</b><p>'+escapeHtml(message)+'</p><button class="btn primary" id="retry-load" type="button">Retry</button></div></div>';
    var retry = document.getElementById('retry-load');
    if (retry) retry.addEventListener('click', function(){ root.innerHTML = '<div class="loading-panel" role="status"><div class="skeleton-line wide"></div><div class="skeleton-line"></div><div class="skeleton-grid"><div></div><div></div><div></div></div></div>'; start(); });
  }

  function render(){
    var profile = getProfile();
    if (!profile) return nameGate();
    profile.lastActiveAt = new Date().toISOString();
    saveJson(PROFILE_KEY, profile);
    shell(profile);
    if (view === 'home') return home(profile);
    if (view === 'exam') return examView();
    if (SUBJECTS[view]) return subjectView(view);
    if (view === 'weak') return weakView();
    if (view === 'flashcards') return flashcardsView();
    if (view === 'progress') return progressView();
    if (view === 'guide') return guideView();
    view = 'home';
    return home(profile);
  }

  function start(){
    if (!navigator.onLine) {
      errorState('This page needs the local study files. Check your connection or reload the page.');
      return;
    }
    loadCatalog().then(render).catch(function(e){ errorState(e.message || 'The study files could not be loaded.'); });
  }

  window.addEventListener('online', function(){ if (!catalog.questions.length) start(); });
  start();
})();
