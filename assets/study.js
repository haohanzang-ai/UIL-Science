(function(){
  'use strict';

  var PROFILE_KEY = 'uil-public-profile-v1';
  var PROGRESS_KEY = 'uil-public-progress-v1';
  var ANSWERS_KEY = 'uil-public-choice-selections-v1';
  var STUDY_STATE_KEY = 'uil-public-study-state-v1';
  var EXAM_ATTEMPTS_KEY = 'uil-public-exam-attempts-v1';
  var ISSUE_REPORTS_KEY = 'uil-public-issue-reports-v1';
  var WELCOME_GUIDE_KEY = 'uil-welcome-guide-hidden-v1';
  var WELCOME_SESSION_KEY = 'uil-welcome-guide-dismissed-session-v1';
  var MAX_NAME = 40;
  var LOAD_TIMEOUT_MS = 12000;
  var root = document.getElementById('root');
  var title = document.getElementById('page-title');
  var subtitle = document.getElementById('page-subtitle');
  var switchBtn = document.getElementById('switch-user');
  var examTimerHandle = null;
  var params = new URLSearchParams(location.search);
  var view = params.get('view') || 'home';
  var catalog = { questions: [], exams: [], byId: {} };
  var ui = { filters: {}, index: 0, submitted: false, showHint: false, showSolution: false, showLesson: false, examId: params.get('exam') || '', examAttemptId: params.get('attempt') || '', examMode: params.get('mode') || '' };

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
    guide: { title:'UIL Science Guide' },
    settings: { title:'Settings' },
    troubleshoot: { title:'Troubleshooting' }
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

  function scopedKey(base){
    var p = getProfile();
    return p && p.uid ? base + ':' + p.uid : base;
  }

  function readScopedJson(base, fallback){
    var key = scopedKey(base);
    var value = readJson(key, null);
    if (value) return value;
    var legacy = readJson(base, null);
    if (legacy && getProfile()) {
      saveJson(key, legacy);
      try { localStorage.removeItem(base); } catch(e) {}
      return legacy;
    }
    return fallback;
  }

  function saveScopedJson(base, value){
    saveJson(scopedKey(base), value);
  }

  function restoreStudyState(){
    var saved = readScopedJson(STUDY_STATE_KEY, {});
    ui.filters = saved.filters && typeof saved.filters === 'object' ? saved.filters : {};
    if (!params.get('exam') && saved.examId && view === 'exam') ui.examId = saved.examId;
    if (!params.get('q') && saved.last && saved.last.view === view && Number.isFinite(saved.last.index)) ui.index = saved.last.index;
  }

  function saveStudyState(extra){
    var saved = readScopedJson(STUDY_STATE_KEY, {});
    saved.filters = ui.filters;
    saved.examId = ui.examId || saved.examId || '';
    saved.last = {
      view: view,
      index: ui.index,
      questionId: extra && extra.questionId || '',
      updatedAt: new Date().toISOString()
    };
    saveScopedJson(STUDY_STATE_KEY, saved);
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

  function updateProfileName(name){
    var profile = getProfile();
    if (!profile) return setProfile(name);
    var displayName = String(name || '').trim().replace(/\s+/g, ' ');
    if (!displayName) throw new Error('Enter your name to begin.');
    if (displayName.length > MAX_NAME) throw new Error('Name must be '+MAX_NAME+' characters or fewer.');
    profile.displayName = displayName;
    profile.updatedAt = new Date().toISOString();
    saveJson(PROFILE_KEY, profile);
    return profile;
  }

  function getProgress(){
    var p = readScopedJson(PROGRESS_KEY, { schemaVersion:1, attempts:[], bookmarks:[] });
    p.attempts = Array.isArray(p.attempts) ? p.attempts : [];
    p.bookmarks = Array.isArray(p.bookmarks) ? p.bookmarks : [];
    return p;
  }

  function saveProgress(p){
    p.schemaVersion = 1;
    saveScopedJson(PROGRESS_KEY, p);
  }

  function getSelections(){
    var s = readScopedJson(ANSWERS_KEY, { schemaVersion:1, selections:{} });
    s.selections = s.selections && typeof s.selections === 'object' ? s.selections : {};
    return s;
  }

  function setSelection(questionId, choice){
    var state = getSelections();
    state.selections[questionId] = { choice: choice, selectedAt: new Date().toISOString() };
    saveScopedJson(ANSWERS_KEY, state);
  }

  function recordAttempt(q, choice){
    var p = getProgress();
    var eventId = q.questionId + ':' + choice + ':' + new Date().toISOString().slice(0, 19);
    p.attempts.push({
      eventId: eventId,
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
    catalog.questions = Array.isArray(both[0].questions) ? both[0].questions.filter(function(x){ return x && x.published === true && x.accessible !== false && questionHasValidAnswer(x); }) : [];
    catalog.exams = Array.isArray(both[1].exams) ? both[1].exams.filter(function(x){ return x && x.accessible !== false; }) : [];
    catalog.byId = {};
    catalog.questions.forEach(function(q){ catalog.byId[q.questionId] = q; });
  }

  function questionHasValidAnswer(q){
    if (!q || !q.officialAnswer || !Array.isArray(q.choices)) return false;
    var labels = q.choices.map(function(c){ return typeof c === 'string' ? '' : c && c.label; });
    if (labels.length !== 5) return false;
    if (labels.some(function(label){ return ['A','B','C','D','E'].indexOf(label) < 0; })) return false;
    if (labels.some(function(label, index){ return labels.indexOf(label) !== index; })) return false;
    return labels.indexOf(q.officialAnswer) >= 0;
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

  function correctChoice(q) {
    var label = q.officialAnswer || '';
    var choices = Array.isArray(q.choices) ? q.choices : [];
    var found = choices.find(function(c){ return (c.label || '') === label; });
    return { label: label, text: found ? (found.text || '') : '' };
  }

  function examRows(exam){
    return (exam && Array.isArray(exam.questionIds) ? exam.questionIds : []).map(function(id){ return catalog.byId[id]; }).filter(Boolean);
  }

  function examStats(exam){
    var rows = examRows(exam);
    var counts = { biology:0, chemistry:0, physics:0 };
    var nums = {};
    var pdfs = {};
    rows.forEach(function(q){ counts[q.subject] = (counts[q.subject] || 0) + 1; nums[q.questionNumber || 0] = true; if (q.sourceRefs && q.sourceRefs.testPdf) pdfs[q.sourceRefs.testPdf] = true; });
    var missing = [];
    for (var i = 1; i <= 60; i++) if (!nums[i]) missing.push(i);
    var samePdf = Object.keys(pdfs).length <= 1;
    var complete = rows.length === 60 && counts.biology === 20 && counts.chemistry === 20 && counts.physics === 20 && !missing.length && samePdf;
    var partial = !complete && rows.length >= 55 && rows.length <= 59;
    partial = partial && samePdf;
    return { rows: rows, counts: counts, missing: missing, complete: complete, partial: partial, blocked: !complete && !partial, samePdf: samePdf, status: complete ? 'Complete' : partial ? 'Usable partial' : 'Unavailable' };
  }

  function examVersion(exam){
    return [exam.examId, exam.contentHash || '', (exam.questionIds || []).join('|')].join(':');
  }

  function getExamStore(){
    var store = readScopedJson(EXAM_ATTEMPTS_KEY, { schemaVersion:1, attempts:[] });
    store.attempts = Array.isArray(store.attempts) ? store.attempts : [];
    return store;
  }

  function saveExamStore(store){
    store.schemaVersion = 1;
    saveScopedJson(EXAM_ATTEMPTS_KEY, store);
  }

  function findExamAttempt(id){
    return getExamStore().attempts.find(function(a){ return a.attemptId === id; }) || null;
  }

  function activeAttemptForExam(examId){
    return getExamStore().attempts.filter(function(a){ return a.examId === examId && a.status === 'active'; }).sort(function(a,b){ return String(b.startedAt).localeCompare(String(a.startedAt)); })[0] || null;
  }

  function submittedAttemptsForExam(examId){
    return getExamStore().attempts.filter(function(a){ return a.examId === examId && a.status === 'submitted'; });
  }

  function putExamAttempt(attempt){
    var store = getExamStore();
    var index = store.attempts.findIndex(function(a){ return a.attemptId === attempt.attemptId; });
    attempt.updatedAt = new Date().toISOString();
    if (index >= 0) store.attempts[index] = attempt;
    else store.attempts.push(attempt);
    saveExamStore(store);
  }

  function newExamAttempt(exam, minutes){
    var now = Date.now();
    var duration = Math.max(5, Math.min(120, Number(minutes) || 120));
    var attempt = {
      attemptId: 'exam-' + uid(),
      examId: exam.examId,
      examVersion: examVersion(exam),
      durationMinutes: duration,
      startedAt: new Date(now).toISOString(),
      deadlineAt: new Date(now + duration * 60000).toISOString(),
      status: 'active',
      currentIndex: 0,
      answers: {},
      flagged: {},
      submittedAt: '',
      autoSubmitted: false
    };
    putExamAttempt(attempt);
    return attempt;
  }

  function submitExamAttempt(attempt, auto){
    if (!attempt || attempt.status === 'submitted') return attempt;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date().toISOString();
    attempt.autoSubmitted = !!auto;
    putExamAttempt(attempt);
    return attempt;
  }

  function formatTime(ms){
    var total = Math.max(0, Math.ceil(ms / 1000));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return (h ? h + ':' + String(m).padStart(2,'0') : String(m)) + ':' + String(s).padStart(2,'0');
  }

  function topicPills(q) {
    var topics = q.categorization && Array.isArray(q.categorization.topics) ? q.categorization.topics : [];
    if (!topics.length) return '<div class="topic-pills"><span>Topic needs source review</span></div>';
    return '<div class="topic-pills" aria-label="Mapped topics">'+topics.map(function(t){
      return '<span class="'+(t.role === 'primary' ? 'primary' : '')+'">'+escapeHtml(t.role === 'primary' ? 'Primary: '+t.unitName+' - '+t.topicName : t.unitName+' - '+t.topicName)+'</span>';
    }).join('')+'</div>';
  }

  function figureMarkup(q) {
    var src = q.figureUrl || q.figure || q.imageUrl || q.diagramUrl || '';
    if (!src) return '';
    return '<figure class="question-figure"><button type="button" class="figure-zoom" data-figure-src="'+escapeHtml(src)+'" aria-label="Open figure larger"><img src="'+escapeHtml(src)+'" alt="Question figure" loading="lazy" /></button><figcaption>Question figure</figcaption><div class="figure-missing">Figure unavailable.</div></figure>';
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

  function uniqueStats(rows){
    var ids = {};
    rows.forEach(function(q){ ids[q.questionId] = true; });
    var latest = {};
    getProgress().attempts.forEach(function(a){ if (ids[a.questionId]) latest[a.questionId] = a; });
    var keys = Object.keys(latest);
    var correct = keys.filter(function(id){ return latest[id].correct; }).length;
    return { attempted: keys.length, correct: correct, accuracy: keys.length ? Math.round(correct / keys.length * 100) : null };
  }

  function masteryStatus(rows){
    var stats = uniqueStats(rows);
    var sessions = {};
    getProgress().attempts.forEach(function(a){ if (rows.some(function(q){ return q.questionId === a.questionId; })) sessions[String(a.submittedAt || '').slice(0,10)] = true; });
    if (!stats.attempted) return 'Not Started';
    if (stats.attempted >= 10 && stats.accuracy >= 85 && Object.keys(sessions).length >= 2) return 'Mastered';
    return 'Developing';
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
    if (switchBtn) switchBtn.hidden = true;
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
    if (switchBtn) switchBtn.hidden = true;
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

  function shouldShowWelcomeGuide(){
    try {
      if (localStorage.getItem(WELCOME_GUIDE_KEY) === 'true') return false;
      if (sessionStorage.getItem(WELCOME_SESSION_KEY) === 'true') return false;
    } catch(e) {}
    return true;
  }

  function welcomeGuidePanel(force){
    if (!force && !shouldShowWelcomeGuide()) return '';
    return '<section class="welcome-guide" id="welcome-guide" aria-labelledby="welcome-guide-title" tabindex="-1">'+
      '<div class="welcome-guide-head"><div><p class="overline">First-time guide</p><h2 id="welcome-guide-title">Welcome to UIL Science</h2></div><button class="btn sm ghost" id="welcome-close" type="button">Close</button></div>'+
      '<p>This website helps you prepare with real questions from previous UIL Science competitions. Study Biology, Chemistry, or Physics, review topics you have missed, use flashcards, or take a complete timed exam.</p>'+
      '<p>There is no required order. Start wherever you feel comfortable, and the website will help you identify what to review next.</p>'+
      '<ol class="welcome-steps">'+
        '<li><strong>Choose how to study.</strong><span>Open a subject, review weak topics, use flashcards, or take a full exam.</span></li>'+
        '<li><strong>Try questions and use verified help when needed.</strong><span>Hints and explanations appear during regular study when verified content exists.</span></li>'+
        '<li><strong>Review your progress and weak topics.</strong><span>My Progress shows accuracy, mastered units, and areas to revisit.</span></li>'+
      '</ol>'+
      '<div class="welcome-actions"><button class="btn primary" id="welcome-got-it" type="button">Got it</button><button class="btn" id="welcome-never" type="button">Never show this again</button><a class="btn ghost" href="'+pageUrl('guide')+'#how-site-works">Open UIL Science Guide</a></div>'+
    '</section>';
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
      ['UIL Science Guide','guide','Read contest format and study priorities.'],
      ['Troubleshooting','troubleshoot','Report website or question issues.']
    ].map(function(c){
      return '<a class="tool-link" href="'+pageUrl(c[1])+'"><strong>'+escapeHtml(c[0])+'</strong><span>'+escapeHtml(c[2])+'</span></a>';
    }).join('');
    root.innerHTML =
      '<section class="hero-study">'+
        '<div><p class="overline">Study home</p><h2>Welcome back, '+escapeHtml(profile.displayName)+'</h2><p>Choose a subject, continue a saved selection, or start from a historical UIL exam set.</p></div>'+
        '<div class="hero-actions">'+(resumeId ? '<a class="btn primary" href="'+pageUrl(catalog.byId[resumeId].subject, { q: resumeId })+'">Continue studying</a>' : '<a class="btn primary" href="'+pageUrl('biology')+'">Start with Biology</a>')+'<button class="btn ghost" id="open-welcome-guide" type="button">How this website works</button></div>'+
      '</section>'+
      '<div id="welcome-guide-slot">'+welcomeGuidePanel(false)+'</div>'+
      '<section class="subject-grid">'+subjectCards+'</section>'+
      '<section class="exam-band">'+
        '<div><p class="overline">Full UIL Exam</p><h2>Practice with timed historical exams</h2><p>Choose a complete exam or a clearly labeled partial set when only part of the source import is currently verified.</p></div>'+
        '<a class="btn secondary" href="'+pageUrl('exam')+'">Choose an exam</a>'+
      '</section>'+
      '<section class="support-grid">'+support+'</section>'+
      '<section class="stats-row">'+
        stateCard('Study questions', String(catalog.questions.length), 'Ready to practice')+
        stateCard('Exam sets', String(catalog.exams.filter(function(e){ return !examStats(e).blocked; }).length), 'Complete or partial')+
        stateCard('Practice answers', String(progress.attempts.length), 'Submitted locally')+
        stateCard('Bookmarks', String(progress.bookmarks.length), 'Saved for review')+
      '</section>';
    bindWelcomeGuide();
  }

  function bindWelcomeGuide(){
    var slot = document.getElementById('welcome-guide-slot');
    var opener = document.getElementById('open-welcome-guide');
    var lastOpener = null;
    function wire(){
      var panel = document.getElementById('welcome-guide');
      if (!panel) return;
      var close = function(mode){
        try {
          if (mode === 'never') localStorage.setItem(WELCOME_GUIDE_KEY, 'true');
          else sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
        } catch(e) {}
        panel.remove();
        if (lastOpener) lastOpener.focus();
      };
      var closeBtn = document.getElementById('welcome-close');
      var gotIt = document.getElementById('welcome-got-it');
      var never = document.getElementById('welcome-never');
      if (closeBtn) closeBtn.addEventListener('click', function(){ close('session'); });
      if (gotIt) gotIt.addEventListener('click', function(){ close('session'); });
      if (never) never.addEventListener('click', function(){ close('never'); });
      panel.addEventListener('keydown', function(e){ if (e.key === 'Escape') close('session'); });
    }
    if (opener && slot) {
      opener.addEventListener('click', function(){
        lastOpener = opener;
        slot.innerHTML = welcomeGuidePanel(true);
        wire();
        var panel = document.getElementById('welcome-guide');
        if (panel) panel.focus();
      });
    }
    wire();
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
    return '<details class="filter-shell"><summary>Focus <span>'+rows.length+' result'+(rows.length === 1 ? '' : 's')+'</span></summary><form class="filter-panel" id="filter-form">'+
      '<div class="filter-head"><strong>'+rows.length+' result'+(rows.length === 1 ? '' : 's')+'</strong><button class="btn sm ghost" type="button" id="reset-filters">Reset</button></div>'+
      '<label>Unit<select name="unit">'+optionList(byUnique(allRows, unitName), f.unit, 'All units')+'</select></label>'+
      '<label>Primary topic<select name="topic">'+optionList(byUnique(allRows, topicName), f.topic, 'All topics')+'</select></label>'+
      '<label>Secondary topic<select name="secondary">'+optionList(Object.keys(secondaries).sort(), f.secondary, 'All secondary topics')+'</select></label>'+
      '<label>Year<select name="year">'+optionList(byUnique(allRows, function(q){ return q.year ? String(q.year) : ''; }), f.year, 'All years')+'</select></label>'+
      '<label>Contest level<select name="level">'+optionList(byUnique(allRows, function(q){ return q.contestLevel || ''; }), f.level, 'All levels')+'</select></label>'+
      '<div class="filter-checks">'+check('unanswered','Unanswered',f.unanswered)+check('missed','Missed',f.missed)+check('bookmarked','Bookmarked',f.bookmarked)+check('due','Due for review',f.due)+'</div>'+
    '</form>'+activeFilterChips(subject)+'</details>';
  }

  function activeFilterChips(subject){
    var f = ui.filters[subject] || {};
    var labels = { unit:'Unit', topic:'Topic', secondary:'Secondary', year:'Year', level:'Level', unanswered:'Unanswered', missed:'Missed', bookmarked:'Bookmarked', due:'Due for review' };
    var chips = Object.keys(labels).filter(function(k){ return !!f[k]; }).map(function(k){
      return '<button class="filter-chip" type="button" data-filter-key="'+k+'">'+escapeHtml(labels[k]+(f[k] === true ? '' : ': '+f[k]))+' <span aria-hidden="true">x</span></button>';
    }).join('');
    return chips ? '<div class="active-filters" aria-label="Active filters">'+chips+'</div>' : '';
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

  function trustedSources(subject){
    if (subject === 'biology') return ['Campbell Biology', 'College Board AP Biology / AP Classroom', 'Official UIL test and answer key'];
    if (subject === 'chemistry') return ['College Board AP Chemistry / AP Classroom', 'Princeton Review AP Chemistry when approved; otherwise OpenStax Chemistry 2e', 'Official UIL test and answer key'];
    if (subject === 'physics') return ['College Board AP Physics / AP Classroom', 'OpenStax College Physics 2e when needed', 'Official UIL test and answer key'];
    return ['Official UIL test and answer key'];
  }

  function reliabilityPanel(subject, q){
    var sources = trustedSources(subject);
    var status = q && q.categorization && q.categorization.sourceReviewStatus === 'needs-authoritative-source-review' ? 'Needs source review' : 'Source policy attached';
    return '<aside class="reliability-panel" aria-label="Reliable source policy">'+
      '<p class="overline">Verified Sources</p>'+
      '<h2>Answers stay source-grounded</h2>'+
      '<p>Generated help is hidden unless it is supported by approved references. Current status: <strong>'+escapeHtml(status)+'</strong>.</p>'+
      '<ul>'+sources.map(function(s){ return '<li>'+escapeHtml(s)+'</li>'; }).join('')+'</ul>'+
    '</aside>';
  }

  function nextBestRows(subject, rows){
    var progress = getProgress();
    var selections = getSelections().selections || {};
    var missed = rows.filter(function(q){ return isMissed(q.questionId); }).slice(0, 3);
    var newRows = rows.filter(function(q){ return !selections[q.questionId]; }).slice(0, 3);
    var bookmarked = rows.filter(function(q){ return progress.bookmarks.indexOf(q.questionId) >= 0; }).slice(0, 3);
    var pool = missed.length ? missed : newRows.length ? newRows : bookmarked;
    if (!pool.length) pool = rows.slice(0, 3);
    return '<section class="next-best-panel"><p class="overline">Next best</p><h2>Adaptive queue</h2>'+
      pool.map(function(q){ return '<button class="next-best-row" type="button" data-question-id="'+escapeHtml(q.questionId)+'"><strong>'+escapeHtml(q.sourceQuestionCode || q.questionId)+'</strong><span>'+escapeHtml(unitName(q))+'</span></button>'; }).join('')+
      '<p class="muted">Prioritizes missed, unanswered, and bookmarked questions from your local attempts.</p></section>';
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
      figureMarkup(q)+
      '<div class="choices" role="group" aria-label="Answer choices">'+choices+'</div>'+
      (submitted ? resultPanel(q, selected, latest) : '')+
      '<div class="question-actions sticky-actions">'+
        '<button class="btn primary" id="submit-answer" type="button" '+(!selected || submitted ? 'disabled' : '')+'>Submit Answer</button>'+
        '<button class="btn" id="prev-question" type="button" '+(index <= 0 ? 'disabled' : '')+'>Previous</button>'+
        '<button class="btn" id="next-question" type="button" '+(index >= rows.length - 1 ? 'disabled' : '')+'>Next Question</button>'+
        '<button class="btn ghost" id="hint-button" type="button">Hint</button>'+
        (submitted ? '<button class="btn ghost" id="solution-button" type="button">View Solution</button><button class="btn ghost" id="learn-button" type="button">Learn This Topic</button>' : '')+
      '</div>'+
      (ui.showHint ? hintPanel(q) : '')+
      (ui.showSolution ? solutionPanel(q) : '')+
      (ui.showLesson ? lessonPanel(q) : '')+
      palette(rows, index, mode)+
    '</article>';
  }

  function resultPanel(q, selected, latest){
    var correct = selected === q.officialAnswer;
    var text = correct ? 'Correct. Your selected answer matches the answer key.' : 'Not correct. The answer key lists '+escapeHtml(q.officialAnswer || 'an unavailable answer')+'.';
    if (latest && latest.correct === false && selected === q.officialAnswer) text = 'Correct. Your latest submitted answer matches the answer key.';
    return '<div class="result-panel '+(correct ? 'good' : 'bad')+'"><strong>'+(correct ? 'Correct' : 'Check this one')+'</strong><span>'+text+'</span></div>';
  }

  function hintPanel(q){
    var trusted = instructionalContentIsVerified(q, 'hint');
    return '<aside class="study-panel"><h3>Hint</h3><p class="trust-label">'+(trusted ? 'Verified source-backed hint' : 'Verified hint unavailable')+'</p><p>'+(trusted ? formatScienceText(q.hint) : 'A source-verified hint is not available for this question.')+'</p></aside>';
  }

  var approvedInstructionalSources = {
    biologyTextbook: ['Campbell Biology, latest available edition', 'Campbell Biology latest edition'],
    biologyFramework: ['College Board AP Biology Course and Exam Description'],
    chemistryFramework: ['College Board AP Chemistry Course and Exam Description'],
    chemistryFallback: ['Princeton Review AP Chemistry', 'OpenStax Chemistry 2e', 'OpenStax Chemistry 2e fallback'],
    physicsFramework: ['College Board AP Physics Course and Exam Descriptions'],
    physicsFallback: ['OpenStax College Physics 2e', 'OpenStax College Physics 2e fallback']
  };

  function normalizedSourceName(value){
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }

  function sourceListIncludesApprovedName(list, approvedNames){
    var supplied = (list || []).map(normalizedSourceName);
    return approvedNames.some(function(name){ return supplied.indexOf(normalizedSourceName(name)) >= 0; });
  }

  function subjectSourceNamesSatisfied(subject, names){
    if (subject === 'biology') return sourceListIncludesApprovedName(names, approvedInstructionalSources.biologyTextbook) && sourceListIncludesApprovedName(names, approvedInstructionalSources.biologyFramework);
    if (subject === 'chemistry') return sourceListIncludesApprovedName(names, approvedInstructionalSources.chemistryFramework) && sourceListIncludesApprovedName(names, approvedInstructionalSources.chemistryFallback);
    if (subject === 'physics') return sourceListIncludesApprovedName(names, approvedInstructionalSources.physicsFramework) && sourceListIncludesApprovedName(names, approvedInstructionalSources.physicsFallback);
    return false;
  }

  function verifiedEvidenceSupportsSubject(subject, verification){
    var evidence = verification && verification.sourceEvidence;
    var verifiedEvidenceStatuses = ['verified', 'source-verified', 'claim-level-verified'];
    if (!Array.isArray(evidence) || !evidence.length) return false;
    if (evidence.some(function(item){
      return !item || verifiedEvidenceStatuses.indexOf(item.verificationStatus) < 0 || item.supportType !== 'direct' ||
        !String(item.sourceName || '').trim() || !String(item.locator || '').trim() || !String(item.supportingExcerpt || '').trim();
    })) return false;
    return subjectSourceNamesSatisfied(subject, evidence.map(function(item){ return item.sourceName; }));
  }

  function sourceRequirementsSatisfied(subject, verification){
    var verifiedSourceStatuses = ['claim-level-verified', 'official-source-verified', 'verified'];
    if (!verification || verifiedSourceStatuses.indexOf(verification.status) < 0) return false;
    var required = verification.requiredSources || [];
    return subjectSourceNamesSatisfied(subject, required) && verifiedEvidenceSupportsSubject(subject, verification);
  }

  function explanationIsVerified(q){
    var trustedStatuses = ['official', 'official-key-solution-imported', 'verified', 'captain-reviewed'];
    return Boolean(q && q.explanation && trustedStatuses.indexOf(q.explanationStatus) >= 0 && sourceRequirementsSatisfied(q.subject, q.explanationVerification));
  }

  function instructionalContentIsVerified(q, field){
    if (!q || !q[field]) return false;
    if (field === 'lesson' && q.lesson.verified !== true) return false;
    return sourceRequirementsSatisfied(q.subject, q[field+'Verification']);
  }

  function solutionPanel(q){
    var refs = Array.isArray(q.citations) && q.citations.length ? q.citations : [];
    var trusted = explanationIsVerified(q);
    var label = trusted ? (q.explanationStatus === 'official' ? 'Official UIL explanation' : q.explanationStatus === 'official-key-solution-imported' ? 'Official key solution verified' : q.explanationStatus === 'verified' ? 'Verified textbook-based explanation' : 'Captain-reviewed explanation') : (q.explanation ? 'Explanation pending source verification' : 'Explanation unavailable');
    return '<aside class="study-panel"><h3>Solution</h3>'+
      '<p class="trust-label">'+escapeHtml(label)+'</p>'+
      '<p>'+(q.explanation && trusted ? formatScienceText(q.explanation) : 'A worked explanation has not been imported and verified for this question. Use the answer key and source packet when troubleshooting.')+'</p>'+
      '<details open><summary>References</summary>'+(refs.length ? '<ul>'+refs.map(function(r){ return '<li>'+escapeHtml([r.title || r.sourceId, r.organization || r.author, r.edition, r.section, r.page ? 'page '+r.page : '', r.sourceLink || ''].filter(Boolean).join(', '))+'</li>'; }).join('')+'</ul>' : '<p>No reference details are available for this question.</p>')+'</details>'+
      '</aside>';
  }

  function lessonPanel(q){
    if (!instructionalContentIsVerified(q, 'lesson')) {
      return '<aside class="study-panel"><h3>Learn This Topic</h3><p class="trust-label">Verified lesson unavailable</p><p>A separate mini-lesson has not been verified for this question yet. Use the answer key, explanation label, and references that are already attached to the question.</p></aside>';
    }
    return '<aside class="study-panel"><h3>Learn This Topic</h3>'+
      '<p><strong>Essential background:</strong> '+formatScienceText(q.lesson.background || '')+'</p>'+
      '<p><strong>Core concept:</strong> '+formatScienceText(q.lesson.concept || '')+'</p>'+
      '<p><strong>Reasoning:</strong> '+formatScienceText(q.lesson.reasoning || '')+'</p>'+
      '<p><strong>Common mistake:</strong> '+formatScienceText(q.lesson.commonMistake || '')+'</p>'+
      '</aside>';
  }

  function palette(rows, index, mode){
    var selections = getSelections().selections || {};
    return '<nav class="question-palette '+(mode === 'exam' ? 'exam-palette' : 'subject-palette')+'" aria-label="'+(mode === 'exam' ? 'Exam' : 'Subject')+' question palette">'+rows.map(function(q, i){
      return '<button type="button" class="'+(i === index ? 'on ' : '')+(selections[q.questionId] ? 'answered' : '')+'" data-go="'+i+'">'+(i + 1)+'</button>';
    }).join('')+'</nav>';
  }

  function figureDialog(src) {
    var existing = document.getElementById('figure-dialog');
    if (existing) existing.remove();
    var dialog = document.createElement('div');
    dialog.id = 'figure-dialog';
    dialog.className = 'figure-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Question figure');
    dialog.innerHTML = '<div class="figure-dialog-panel"><button class="btn" id="close-figure" type="button">Close</button><img src="'+escapeHtml(src)+'" alt="Question figure enlarged"></div>';
    document.body.appendChild(dialog);
    var close = function(){ dialog.remove(); };
    document.getElementById('close-figure').addEventListener('click', close);
    dialog.addEventListener('click', function(e){ if (e.target === dialog) close(); });
    document.getElementById('close-figure').focus();
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
    saveStudyState({ questionId: rows[ui.index] && rows[ui.index].questionId });
    var current = rows[ui.index];
    root.innerHTML =
      '<section class="subject-cockpit '+def.accent+'"><div><span class="tag '+def.accent+'">'+escapeHtml(def.title)+'</span><h2>'+escapeHtml(def.title)+'</h2><p>'+escapeHtml(def.description)+'</p></div>'+
      '<div class="subject-summary">'+stateCard('Questions', String(allRows.length), 'Available now')+stateCard('Progress', progressSummary(allRows), 'Submitted answers')+'</div></section>'+
      '<section class="study-workspace">'+
        '<div class="study-main">'+(rows.length ? questionCard(current, rows, ui.index, 'subject') : emptyState('No matching questions', 'Adjust or reset the filters to see questions again.', '<button class="btn primary" id="empty-reset" type="button">Reset filters</button>'))+'</div>'+
        '<aside class="study-side">'+
          renderFilters(subject, allRows, rows)+
          '<details class="unit-drawer"><summary>Units</summary>'+unitOverview(subject, allRows)+'</details>'+
          (current ? reliabilityPanel(subject, current) : '')+
          (rows.length ? nextBestRows(subject, rows) : '')+
          (current ? '<section class="topic-panel"><p class="overline">Topic Map</p>'+topicPills(current)+'</section>' : '')+
        '</aside>'+
      '</section>';
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
        ui.index = 0; ui.submitted = false; ui.showHint = false; ui.showSolution = false; ui.showLesson = false;
        saveStudyState();
        subjectView(subject);
      });
    }
    var reset = document.getElementById('reset-filters') || document.getElementById('empty-reset');
    if (reset) reset.addEventListener('click', function(){ ui.filters[subject] = {}; ui.index = 0; saveStudyState(); subjectView(subject); });
    root.querySelectorAll('.filter-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        var key = chip.getAttribute('data-filter-key');
        ui.filters[subject] = ui.filters[subject] || {};
        delete ui.filters[subject][key];
        ui.index = 0;
        saveStudyState();
        subjectView(subject);
      });
    });
    root.querySelectorAll('.unit-row').forEach(function(btn){
      btn.addEventListener('click', function(){
        ui.filters[subject] = ui.filters[subject] || {};
        ui.filters[subject].unit = btn.getAttribute('data-unit');
        ui.index = 0;
        saveStudyState();
        subjectView(subject);
      });
    });
    root.querySelectorAll('.next-best-row').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-question-id');
        var next = rows.findIndex(function(q){ return q.questionId === id; });
        if (next >= 0) {
          ui.index = next; ui.submitted = false; ui.showHint = false; ui.showSolution = false; ui.showLesson = false;
          saveStudyState({ questionId: id });
          subjectView(subject);
        }
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
      setTimeout(function(){
        var feedback = root.querySelector('.result-panel');
        if (feedback) feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    });
    var prev = document.getElementById('prev-question');
    if (prev) prev.addEventListener('click', function(){ ui.index = Math.max(0, ui.index - 1); ui.submitted = false; ui.showHint = false; ui.showSolution = false; ui.showLesson = false; saveStudyState({ questionId: rows[ui.index] && rows[ui.index].questionId }); rerender(); });
    var next = document.getElementById('next-question');
    if (next) next.addEventListener('click', function(){ ui.index = Math.min(rows.length - 1, ui.index + 1); ui.submitted = false; ui.showHint = false; ui.showSolution = false; ui.showLesson = false; saveStudyState({ questionId: rows[ui.index] && rows[ui.index].questionId }); rerender(); });
    var hint = document.getElementById('hint-button');
    if (hint) hint.addEventListener('click', function(){ ui.showHint = !ui.showHint; rerender(); });
    var solution = document.getElementById('solution-button');
    if (solution) solution.addEventListener('click', function(){ ui.showSolution = !ui.showSolution; rerender(); });
    var learn = document.getElementById('learn-button');
    if (learn) learn.addEventListener('click', function(){ ui.showLesson = !ui.showLesson; rerender(); });
    var bookmark = document.getElementById('bookmark');
    if (bookmark) bookmark.addEventListener('click', function(){ toggleBookmark(q.questionId); rerender(); });
    root.querySelectorAll('.question-palette button').forEach(function(btn){
      btn.addEventListener('click', function(){ ui.index = Number(btn.getAttribute('data-go')) || 0; ui.submitted = false; ui.showHint = false; ui.showSolution = false; ui.showLesson = false; saveStudyState({ questionId: rows[ui.index] && rows[ui.index].questionId }); rerender(); });
    });
    root.querySelectorAll('.figure-zoom').forEach(function(btn){
      btn.addEventListener('click', function(){ figureDialog(btn.getAttribute('data-figure-src')); });
    });
    root.querySelectorAll('.question-figure img').forEach(function(img){
      img.addEventListener('error', function(){ var fig = img.closest('.question-figure'); if (fig) fig.classList.add('missing'); });
    });
  }

  function examView(){
    if (ui.examAttemptId) return activeExamAttempt(ui.examAttemptId);
    if (ui.examId) return examSetup(ui.examId);
    if (!catalog.exams.length) return unavailable('Full UIL Exam', 'No exam group is available in the current study files.');
    var available = catalog.exams.map(function(e){ return { exam:e, stats:examStats(e) }; }).filter(function(x){ return !x.stats.blocked; });
    root.innerHTML =
      '<section class="exam-intro"><div><p class="overline">Full UIL Exam</p><h2>Choose a historical exam set</h2><p>Complete exams have 60 verified questions. Usable partial exams have 55 to 59 verified questions and show exactly what is missing.</p></div><div class="exam-facts"><span>'+available.length+' available</span><span>Official scoring: +6 / -2 / 0</span><span>120 minutes</span></div></section>'+
      '<section class="exam-grid">'+available.map(function(x){
        var e = x.exam, stats = x.stats, submitted = submittedAttemptsForExam(e.examId).length, active = activeAttemptForExam(e.examId);
        return '<article class="exam-card '+(stats.partial ? 'partial' : '')+'"><div><span class="tag '+(stats.complete ? 'bio' : 'warn')+'">'+stats.status+'</span><h3>'+escapeHtml(e.title)+'</h3><p>'+escapeHtml([e.year, e.contestLevel, e.set].filter(Boolean).join(' '))+'</p></div>'+
          '<div class="exam-card-data"><strong>'+stats.rows.length+'/60 questions</strong><span>Bio '+stats.counts.biology+' | Chem '+stats.counts.chemistry+' | Physics '+stats.counts.physics+'</span>'+(stats.missing.length ? '<small>Missing: '+stats.missing.join(', ')+'</small>' : '<small>All questions available</small>')+'<small>'+(submitted ? 'Retake available' : 'First attempt')+(active ? ' | unfinished attempt' : '')+'</small></div>'+
          '<a class="btn primary" href="'+pageUrl('exam', { exam:e.examId })+'">Configure Exam</a></article>';
      }).join('')+'</section>';
  }

  function examSetup(examId){
    var exam = catalog.exams.find(function(e){ return e.examId === examId; });
    if (!exam) return unavailable('Exam unavailable', 'This exam set is not available in the current study files.');
    var stats = examStats(exam);
    if (stats.blocked) return unavailable('Exam unavailable', 'This exam has fewer than 55 verified questions in the current repository import.');
    var active = activeAttemptForExam(examId);
    var remaining = active ? new Date(active.deadlineAt).getTime() - Date.now() : 0;
    root.innerHTML =
      '<section class="exam-setup"><div><p class="overline">Exam setup</p><h2>'+escapeHtml(exam.title)+'</h2><p>'+escapeHtml(stats.status)+'. '+(stats.partial ? stats.rows.length+' of 60 questions are currently available. Missing: '+stats.missing.join(', ')+'.' : 'All 60 questions are available.')+'</p></div>'+
      '<div class="exam-setup-grid">'+stateCard('Questions', stats.rows.length+'/60', 'Available')+stateCard('Biology', String(stats.counts.biology), 'Questions')+stateCard('Chemistry', String(stats.counts.chemistry), 'Questions')+stateCard('Physics', String(stats.counts.physics), 'Questions')+'</div>'+
      '<form id="exam-setup-form" class="exam-setup-form"><fieldset><legend>Time</legend><label><input type="radio" name="duration" value="120" checked> 120 minutes - Official UIL timing</label><label><input type="radio" name="duration" value="90"> 90 minutes - Custom timed session</label><label><input type="radio" name="duration" value="60"> 60 minutes - Custom timed session</label><label><input type="radio" name="duration" value="45"> 45 minutes - Custom timed session</label><label><input type="radio" name="duration" value="30"> 30 minutes - Custom timed session</label><label class="field">Custom minutes<input id="custom-duration" name="customDuration" type="number" min="5" max="120" step="1" placeholder="5-120"></label></fieldset>'+
      '<p class="muted">Official scoring: correct +6, incorrect -2, blank 0. Explanations stay hidden until final submission.</p>'+
      (active ? '<div class="note"><div><strong>Unfinished attempt</strong><p>Started '+escapeHtml(new Date(active.startedAt).toLocaleString())+'. Remaining time: '+formatTime(remaining)+'.</p><a class="btn primary" href="'+pageUrl('exam', { exam:examId, attempt:active.attemptId })+'">Resume Exam</a><button class="btn" id="restart-exam" type="button">Restart Exam</button></div></div>' : '<button class="btn primary" id="start-exam" type="submit">Start Exam</button>')+
      '</form></section>';
    var form = document.getElementById('exam-setup-form');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var custom = Number(document.getElementById('custom-duration').value);
      var selected = form.querySelector('input[name="duration"]:checked');
      var minutes = custom || Number(selected && selected.value) || 120;
      var attempt = newExamAttempt(exam, minutes);
      location.href = pageUrl('exam', { exam:examId, attempt:attempt.attemptId });
    });
    var restart = document.getElementById('restart-exam');
    if (restart) restart.addEventListener('click', function(){
      if (!confirm('Restart this exam? The unfinished local attempt will be replaced by a clean attempt.')) return;
      if (active) { active.status = 'abandoned'; putExamAttempt(active); }
      var attempt = newExamAttempt(exam, 120);
      location.href = pageUrl('exam', { exam:examId, attempt:attempt.attemptId });
    });
  }

  function activeExamAttempt(attemptId){
    var attempt = findExamAttempt(attemptId);
    if (!attempt) return unavailable('Exam attempt unavailable', 'This local exam attempt could not be found.');
    var exam = catalog.exams.find(function(e){ return e.examId === attempt.examId; });
    if (!exam) return unavailable('Exam unavailable', 'This exam set is not available in the current study files.');
    var stats = examStats(exam), rows = stats.rows;
    if (attempt.status === 'active' && new Date(attempt.deadlineAt).getTime() <= Date.now()) submitExamAttempt(attempt, true);
    if (attempt.status === 'submitted') return examResults(exam, attempt);
    if (attempt.currentIndex >= rows.length) attempt.currentIndex = rows.length - 1;
    ui.index = attempt.currentIndex || 0;
    var answered = Object.keys(attempt.answers || {}).length;
    root.innerHTML =
      '<section class="exam-active-head"><div><p class="overline">Active exam</p><h2>'+escapeHtml(exam.title)+'</h2><p>Answers autosave. Hints and explanations are hidden until submission.</p></div><div class="exam-timer"><strong id="exam-time">'+formatTime(new Date(attempt.deadlineAt).getTime() - Date.now())+'</strong><span>remaining</span></div><div class="exam-progress"><strong>'+answered+'/'+rows.length+'</strong><span>answered</span></div><div class="autosave-status" id="autosave-status">Saved</div></section>'+
      examQuestionCard(rows[ui.index], rows, ui.index, attempt)+
      '<div class="submit-exam-row"><button class="btn primary" id="submit-exam" type="button">Submit Exam</button></div>';
    bindExamQuestion(rows, attempt);
    startExamTimer(attempt.attemptId);
  }

  function examQuestionCard(q, rows, index, attempt){
    var selected = attempt.answers && attempt.answers[q.questionId];
    var flagged = attempt.flagged && attempt.flagged[q.questionId];
    var choices = (q.choices || []).map(function(c){
      var label = c.label || '';
      return '<button class="choice pick '+(selected === label ? 'sel ' : '')+'" type="button" data-choice="'+escapeHtml(label)+'" aria-pressed="'+(selected === label ? 'true' : 'false')+'"><b>'+escapeHtml(label)+'</b><span>'+formatScienceText(c.text || c)+'</span><span class="choice-status">'+(selected === label ? 'Selected' : '')+'</span></button>';
    }).join('');
    return '<article class="focus-card exam-question" data-question-id="'+escapeHtml(q.questionId)+'">'+
      '<div class="question-meta"><span class="tag '+subjectClass(q.subject)+'">'+escapeHtml((SUBJECTS[q.subject] && SUBJECTS[q.subject].title) || q.subject)+'</span><span>Original #'+escapeHtml(q.questionNumber || index + 1)+'</span><span>'+escapeHtml(unitName(q))+'</span><span>'+escapeHtml(displaySet(q))+'</span></div>'+
      '<div class="question-top"><div><p class="overline">Question '+(index + 1)+' of '+rows.length+'</p><h2>'+escapeHtml(q.sourceQuestionCode || ('Question '+(q.questionNumber || index + 1)))+'</h2></div><button class="btn sm ghost" id="flag-question" type="button" aria-pressed="'+(flagged ? 'true' : 'false')+'">'+(flagged ? 'Flagged' : 'Flag for review')+'</button></div>'+
      '<div class="qstem">'+formatScienceText(q.stem || 'Question text unavailable.')+'</div>'+figureMarkup(q)+
      '<div class="choices" role="group" aria-label="Answer choices">'+choices+'</div>'+
      '<div class="question-actions sticky-actions"><button class="btn" id="prev-question" type="button" '+(index <= 0 ? 'disabled' : '')+'>Previous</button><button class="btn" id="next-question" type="button" '+(index >= rows.length - 1 ? 'disabled' : '')+'>Next Question</button></div>'+
      examPalette(rows, index, attempt)+'</article>';
  }

  function examPalette(rows, index, attempt){
    return '<nav class="question-palette exam-palette" aria-label="Exam question palette">'+rows.map(function(q, i){
      var answered = attempt.answers && attempt.answers[q.questionId];
      var flagged = attempt.flagged && attempt.flagged[q.questionId];
      return '<button type="button" class="'+(i === index ? 'on ' : '')+(answered ? 'answered ' : '')+(flagged ? 'flagged ' : '')+'" data-go="'+i+'" aria-label="Question '+(i + 1)+(answered ? ', answered' : ', blank')+(flagged ? ', flagged' : '')+'">'+(i + 1)+(flagged ? '*' : '')+'</button>';
    }).join('')+'</nav>';
  }

  function bindExamQuestion(rows, attempt){
    var q = rows[ui.index];
    root.querySelectorAll('.choice.pick').forEach(function(btn){
      btn.addEventListener('click', function(){
        attempt.answers = attempt.answers || {};
        attempt.answers[q.questionId] = btn.getAttribute('data-choice');
        putExamAttempt(attempt);
        activeExamAttempt(attempt.attemptId);
      });
    });
    var prev = document.getElementById('prev-question');
    var next = document.getElementById('next-question');
    if (prev) prev.addEventListener('click', function(){ attempt.currentIndex = Math.max(0, ui.index - 1); putExamAttempt(attempt); activeExamAttempt(attempt.attemptId); });
    if (next) next.addEventListener('click', function(){ attempt.currentIndex = Math.min(rows.length - 1, ui.index + 1); putExamAttempt(attempt); activeExamAttempt(attempt.attemptId); });
    var flag = document.getElementById('flag-question');
    if (flag) flag.addEventListener('click', function(){ attempt.flagged = attempt.flagged || {}; attempt.flagged[q.questionId] = !attempt.flagged[q.questionId]; putExamAttempt(attempt); activeExamAttempt(attempt.attemptId); });
    root.querySelectorAll('.question-palette button').forEach(function(btn){ btn.addEventListener('click', function(){ attempt.currentIndex = Number(btn.getAttribute('data-go')) || 0; putExamAttempt(attempt); activeExamAttempt(attempt.attemptId); }); });
    root.querySelectorAll('.figure-zoom').forEach(function(btn){ btn.addEventListener('click', function(){ figureDialog(btn.getAttribute('data-figure-src')); }); });
    var submit = document.getElementById('submit-exam');
    if (submit) submit.addEventListener('click', function(){
      var blanks = rows.length - Object.keys(attempt.answers || {}).length;
      if (!confirm('Submit this exam? Answered: '+(rows.length - blanks)+'. Blank: '+blanks+'.'+(blanks ? ' Blank answers score 0.' : ''))) return;
      submitExamAttempt(attempt, false);
      activeExamAttempt(attempt.attemptId);
    });
  }

  function startExamTimer(attemptId){
    var timer = document.getElementById('exam-time');
    if (!timer) return;
    if (examTimerHandle) clearTimeout(examTimerHandle);
    var tick = function(){
      var a = findExamAttempt(attemptId);
      if (!a || a.status !== 'active') return;
      var remaining = new Date(a.deadlineAt).getTime() - Date.now();
      timer.textContent = formatTime(remaining);
      if (remaining <= 0) {
        submitExamAttempt(a, true);
        activeExamAttempt(attemptId);
        return;
      }
      examTimerHandle = setTimeout(tick, 1000);
    };
    examTimerHandle = setTimeout(tick, 1000);
  }

  function examResults(exam, attempt){
    var stats = examStats(exam), rows = stats.rows, answers = attempt.answers || {};
    var correct = 0, incorrect = 0, blank = 0, bySubject = { biology:{correct:0, incorrect:0, blank:0}, chemistry:{correct:0, incorrect:0, blank:0}, physics:{correct:0, incorrect:0, blank:0} };
    rows.forEach(function(q){
      var choice = answers[q.questionId];
      var bucket = bySubject[q.subject] || { correct:0, incorrect:0, blank:0 };
      if (!choice) { blank++; bucket.blank++; }
      else if (choice === q.officialAnswer) { correct++; bucket.correct++; }
      else { incorrect++; bucket.incorrect++; }
    });
    var score = correct * 6 - incorrect * 2;
    root.innerHTML =
      '<section class="exam-summary" tabindex="-1"><p class="overline">Results and review</p><h2>'+escapeHtml(exam.title)+'</h2><p>'+escapeHtml(stats.status)+(attempt.autoSubmitted ? ' - automatically submitted when time expired.' : '')+'</p>'+
      '<div class="stats-row">'+stateCard('Raw score', String(score), '+6 / -2 / 0')+stateCard('Correct', String(correct), 'Answered right')+stateCard('Incorrect', String(incorrect), 'Answered wrong')+stateCard('Blank', String(blank), 'No answer')+'</div>'+
      '<div class="exam-review-subjects">'+Object.keys(bySubject).map(function(s){ var b = bySubject[s]; return '<div><strong>'+escapeHtml(SUBJECTS[s].title)+'</strong><span>'+b.correct+' correct, '+b.incorrect+' incorrect, '+b.blank+' blank</span></div>'; }).join('')+'</div>'+
      (stats.partial ? '<p class="note warn"><strong>Partial exam:</strong> This score is not scaled to 60 questions.</p>' : '')+'</section>'+
      '<section class="exam-review-list">'+rows.map(function(q, i){ var chosen = answers[q.questionId] || ''; var answer = correctChoice(q); return '<article class="review-row"><h3>'+(i + 1)+'. '+escapeHtml(q.sourceQuestionCode || ('Question '+(q.questionNumber || i + 1)))+'</h3><p>'+formatScienceText(q.stem || '')+'</p><p><strong>Your answer:</strong> '+escapeHtml(chosen || 'Blank')+' <strong>Answer key:</strong> '+escapeHtml(answer.label)+(answer.text ? ' - '+formatScienceText(answer.text) : '')+'</p>'+solutionPanel(q)+'</article>'; }).join('')+'</section>';
  }

  function progressView(){
    var p = getProgress();
    var subjectRows = ['biology','chemistry','physics'].map(function(s){
      var rows = catalog.questions.filter(function(q){ return q.subject === s; });
      var stats = uniqueStats(rows);
      return '<div class="progress-line"><span>'+escapeHtml(SUBJECTS[s].title)+'</span><div class="meter '+SUBJECTS[s].accent+'"><i style="width:'+(stats.accuracy || 0)+'%"></i></div><strong>'+(stats.accuracy == null ? 'Not started' : stats.accuracy+'%')+'</strong><small>'+masteryStatus(rows)+' | '+stats.attempted+' unique</small></div>';
    }).join('');
    var bookmarks = p.bookmarks.map(function(id){ return catalog.byId[id]; }).filter(Boolean).slice(0, 8);
    var examScores = getExamStore().attempts.filter(function(a){ return a.status === 'submitted'; }).length;
    root.innerHTML =
      '<section class="stats-row">'+stateCard('Practice attempts', String(p.attempts.length), 'Total submissions')+stateCard('Bookmarks', String(p.bookmarks.length), 'Saved questions')+stateCard('Unique accuracy', overallAccuracy(), 'Latest per question')+stateCard('Full-exam scores', String(examScores), 'Submitted attempts')+'</section>'+
      '<section class="card refined-card"><h2>Subject summaries</h2>'+subjectRows+'</section>'+
      '<section class="two-col"><div class="card refined-card"><h2>Developing or weak units</h2>'+weakList()+'</div><div class="card refined-card"><h2>Bookmarks</h2>'+(bookmarks.length ? bookmarks.map(function(q){ return '<a class="bookmark-row" href="'+pageUrl(q.subject, { q:q.questionId })+'"><span>'+escapeHtml(displaySet(q))+'</span><strong>'+escapeHtml(q.sourceQuestionCode || q.questionId)+'</strong></a>'; }).join('') : '<p class="muted">No bookmarks yet.</p>')+'</div></section>';
  }

  function overallAccuracy(){
    var stats = uniqueStats(catalog.questions);
    return stats.accuracy == null ? 'Not started' : stats.accuracy+'%';
  }

  function weakList(){
    var groups = {};
    getProgress().attempts.forEach(function(a){
      var key = (a.subject || '')+'|'+(a.unitName || 'Uncategorized');
      groups[key] = groups[key] || { total:0, correct:0, unique:{}, recent:[] };
      groups[key].total++;
      if (a.correct) groups[key].correct++;
      groups[key].unique[a.questionId] = a.correct;
      groups[key].recent.push(a.correct);
    });
    var rows = Object.keys(groups).map(function(key){
      var g = groups[key], uniqueIds = Object.keys(g.unique), uniqueCorrect = uniqueIds.filter(function(id){ return g.unique[id]; }).length;
      var acc = uniqueIds.length ? Math.round(uniqueCorrect / uniqueIds.length * 100) : 100;
      var recent = g.recent.slice(-5), recentMisses = recent.filter(function(x){ return !x; }).length;
      return { key:key, score:(100 - acc) + recentMisses * 6 + Math.min(20, uniqueIds.length), acc:acc, unique:uniqueIds.length, recentMisses:recentMisses };
    }).filter(function(x){ return x.unique >= 2 && x.acc < 85; }).sort(function(a,b){ return b.score - a.score; }).slice(0, 8);
    if (!rows.length) return '<p class="muted">Weak areas appear after submitted missed answers.</p>';
    return rows.map(function(row){
      var parts = row.key.split('|');
      return '<a class="bookmark-row" href="'+pageUrl(parts[0] || 'biology')+'"><span>'+escapeHtml((SUBJECTS[parts[0]] && SUBJECTS[parts[0]].title) || parts[0])+'</span><strong>'+escapeHtml(parts[1])+'</strong><small>'+row.acc+'% latest unique accuracy across '+row.unique+' questions; '+row.recentMisses+' recent miss'+(row.recentMisses === 1 ? '' : 'es')+'.</small></a>';
    }).join('');
  }

  function weakView(){
    root.innerHTML = '<section class="two-col"><div class="card refined-card"><h2>Weak Topics</h2>'+weakList()+'</div><div class="card refined-card"><h2>Due for Review</h2>'+dueForReviewList()+'</div></section>';
  }

  function dueForReviewList(){
    var byQuestion = {};
    getProgress().attempts.forEach(function(a){ (byQuestion[a.questionId] = byQuestion[a.questionId] || []).push(a); });
    var now = Date.now();
    var rows = Object.keys(byQuestion).map(function(id){
      var attempts = byQuestion[id].sort(function(a,b){ return String(a.submittedAt).localeCompare(String(b.submittedAt)); });
      var last = attempts[attempts.length - 1];
      var streak = 0;
      for (var i = attempts.length - 1; i >= 0; i--) {
        if (attempts[i].correct) streak++;
        else break;
      }
      var interval = last.correct ? (streak >= 3 ? 21 : streak === 2 ? 14 : 7) : (attempts.length >= 2 ? 3 : 1);
      var dueAt = new Date(new Date(last.submittedAt).getTime() + interval * 86400000);
      return { question: catalog.byId[id], dueAt: dueAt, last:last, interval:interval };
    }).filter(function(x){ return x.question && x.dueAt.getTime() <= now; }).sort(function(a,b){ return a.dueAt - b.dueAt; }).slice(0, 8);
    if (!rows.length) return '<p class="muted">No questions are due today. Incorrect answers are scheduled sooner; repeated correct answers are spaced farther apart.</p>';
    return rows.map(function(x){
      return '<a class="bookmark-row" href="'+pageUrl(x.question.subject, { q:x.question.questionId })+'"><span>'+escapeHtml(displaySet(x.question))+'</span><strong>'+escapeHtml(x.question.sourceQuestionCode || x.question.questionId)+'</strong><small>Due '+x.dueAt.toLocaleDateString()+'. Last result: '+(x.last.correct ? 'correct' : 'incorrect')+'.</small></a>';
    }).join('');
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
    var answer = correctChoice(q);
    root.innerHTML =
      '<section class="flashcard-wrap"><p class="overline">Flashcard '+(ui.index + 1)+' of '+missed.length+'</p>'+
      '<button class="flashcard-flip '+(ui.showSolution ? 'flipped' : '')+'" id="flashcard-card" type="button" aria-pressed="'+(ui.showSolution ? 'true' : 'false')+'" aria-label="'+(ui.showSolution ? 'Show question side' : 'Reveal answer side')+'">'+
        '<span class="flashcard-face flashcard-front"><span class="flash-label">Question</span><strong>'+formatScienceText(q.stem)+'</strong><small>Click to reveal the answer.</small></span>'+
        '<span class="flashcard-face flashcard-back"><span class="flash-label">Answer</span><strong>'+escapeHtml(answer.label || 'Unavailable')+(answer.text ? '. '+formatScienceText(answer.text) : '')+'</strong><small>Click to return to the question.</small></span>'+
      '</button>'+
      '<div class="question-actions"><button class="btn" id="prev-question" '+(ui.index <= 0 ? 'disabled' : '')+'>Previous</button><button class="btn primary" id="solution-button">'+(ui.showSolution ? 'Show Question' : 'Reveal Answer')+'</button><button class="btn" id="next-question" '+(ui.index >= missed.length - 1 ? 'disabled' : '')+'>Next</button></div></section>';
    var prev = document.getElementById('prev-question');
    var next = document.getElementById('next-question');
    var reveal = document.getElementById('solution-button');
    var card = document.getElementById('flashcard-card');
    if (prev) prev.addEventListener('click', function(){ ui.index = Math.max(0, ui.index - 1); ui.showSolution = false; flashcardsView(); });
    if (next) next.addEventListener('click', function(){ ui.index = Math.min(missed.length - 1, ui.index + 1); ui.showSolution = false; flashcardsView(); });
    if (reveal) reveal.addEventListener('click', function(){ ui.showSolution = !ui.showSolution; flashcardsView(); });
    if (card) card.addEventListener('click', function(){ ui.showSolution = !ui.showSolution; flashcardsView(); });
  }

  function guideView(){
    root.innerHTML =
      '<nav class="toc" aria-label="Guide sections"><a href="#how-site-works">How this website works</a><a href="#format">Contest format</a><a href="#scoring">Scoring</a><a href="#materials">Rules and materials</a><a href="#workflow">Study advice</a><a href="#references">References</a></nav>'+
      '<section class="guide-page">'+
        '<section id="how-site-works" class="guide-section"><h2>How this website works</h2><ul>'+
          '<li><strong>Biology, Chemistry, and Physics:</strong> Study archived questions by subject and topic.</li>'+
          '<li><strong>Full UIL Exam:</strong> Take a historical exam in its original order. UIL Science exams use a 120-minute contest format.</li>'+
          '<li><strong>Weak Topics:</strong> Review concepts where previous answers show more work is needed.</li>'+
          '<li><strong>Flashcards:</strong> Review important terms, formulas, and concepts already available in the website.</li>'+
          '<li><strong>My Progress:</strong> View real accuracy, completed questions, mastered units, and weak areas.</li>'+
          '<li><strong>Hints and solutions:</strong> Available during normal study when verified content exists, but hidden during active full exams.</li>'+
          '<li><strong>Saving progress:</strong> Progress is stored automatically on the current school laptop and browser.</li>'+
          '<li><strong>Editable profile name:</strong> Use Settings to update your display name without losing progress.</li>'+
        '</ul></section>'+
        '<section class="guide-divider" aria-label="About the UIL Science contest"><h2>About the UIL Science contest</h2></section>'+
        guideSection('format','Contest Format',['Timed written science contest.','The platform source guide lists a 2-hour time limit.','Questions are organized across Biology, Chemistry, and Physics.','Historical exam selection depends on the available imported exam records.'])+
        guideSection('subjects','Biology, Chemistry, and Physics Distribution',['The study interface presents Biology, Chemistry, and Physics separately.','Full exam sets preserve the imported historical order.','Use subject pages to focus on one area, then use full exams for timing and section switching.'])+
        guideSection('scoring','Scoring and Team Scoring',['The existing competitor guide records the common UIL Science scoring pattern as +6 correct, 0 blank, and -2 wrong.','The existing guide also notes that results can matter for individual, subject specialist, and team outcomes.','Use official meet instructions when scoring rules are announced by contest officials.'])+
        guideSection('advancement','Advancement',['The existing competitor guide says there are multiple ways to matter in UIL Science: individual, subject specialist, and team.','Follow the current UIL handbook and contest director instructions for advancement details.'])+
        guideSection('materials','Calculator and Material Rules',['The existing competitor guide says to bring an approved scientific calculator only.','It also notes up to two approved calculators, spare batteries, and a silent timing device with no audible signal.','Verify your exact calculator model against the current UIL-approved Science calculator list each season.'])+
        guideSection('testday','Test-Day Procedures',['Bring the correct calculator to every practice and meet.','Know the contest start time and location.','Follow the contest director instructions at the meet.'])+
        guideSection('workflow','Study Advice',['Start with one subject and answer one question at a time.','Use missed answers to identify weak units.','Bookmark questions that need another pass.','Use full exam sets for timing and section-switching practice.'])+
        guideSection('reading','Directed Reading',['Physics includes astronomy and directed-reading concepts when they appear in the existing question data.','Treat directed-reading items as UIL-specific when they do not map cleanly to AP units.'])+
        '<details id="references" class="collapse"><summary>Official UIL references and last verified date</summary><div class="body"><p>Use the official UIL Science contest page, the UIL Science Handbook, and Section 952 of the Constitution and Contest Rules when checking current rules.</p><p>Existing repository guide note: last reviewed June 2026.</p></div></details>'+
      '</section>';
  }

  function guideSection(id, heading, items){
    return '<section id="'+id+'" class="guide-section"><h2>'+escapeHtml(heading)+'</h2><ul>'+items.map(function(item){ return '<li>'+escapeHtml(item)+'</li>'; }).join('')+'</ul></section>';
  }

  function settingsView(){
    var profile = getProfile();
    root.innerHTML =
      '<section class="settings-page">'+
        '<section class="card refined-card"><p class="overline">Profile</p><h2>Student settings</h2><p class="muted">Your progress is attached to this browser profile ID, not to your display name.</p>'+
          '<form id="settings-name-form" class="settings-form" novalidate>'+
            '<div class="field"><label for="settings-display-name">Display name</label><input id="settings-display-name" maxlength="'+MAX_NAME+'" value="'+escapeHtml(profile.displayName)+'" /></div>'+
            '<div class="field-error" id="settings-name-error" role="alert"></div>'+
            '<button class="btn primary" type="submit">Save name</button>'+
          '</form>'+
        '</section>'+
        '<section class="card refined-card danger-zone"><p class="overline">Local browser data</p><h2>Reset Local Profile</h2><p class="muted">This removes the local profile, local practice progress, answer selections, study filters, and exam attempts stored in this browser. It does not delete any centralized account data.</p>'+
          '<button class="btn ghost danger" id="reset-local-profile" type="button">Reset Local Profile</button>'+
          '<div id="reset-confirm" class="reset-confirm" hidden><p><strong>Confirm reset?</strong> This cannot be undone on this browser.</p><button class="btn danger" id="confirm-reset-local-profile" type="button">Yes, reset local profile</button><button class="btn" id="cancel-reset-local-profile" type="button">Cancel</button></div>'+
        '</section>'+
      '</section>';
    var form = document.getElementById('settings-name-form');
    var input = document.getElementById('settings-display-name');
    var error = document.getElementById('settings-name-error');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      try {
        updateProfileName(input.value);
        shell(getProfile());
        error.textContent = 'Saved.';
      } catch(err) {
        error.textContent = err.message;
        input.setAttribute('aria-invalid', 'true');
      }
    });
    var startReset = document.getElementById('reset-local-profile');
    var confirm = document.getElementById('reset-confirm');
    var cancel = document.getElementById('cancel-reset-local-profile');
    var yes = document.getElementById('confirm-reset-local-profile');
    startReset.addEventListener('click', function(){ confirm.hidden = false; yes.focus(); });
    cancel.addEventListener('click', function(){ confirm.hidden = true; startReset.focus(); });
    yes.addEventListener('click', function(){
      var p = getProfile();
      var keys = [PROFILE_KEY, scopedKey(PROGRESS_KEY), scopedKey(ANSWERS_KEY), scopedKey(STUDY_STATE_KEY), scopedKey(EXAM_ATTEMPTS_KEY), WELCOME_SESSION_KEY];
      keys.forEach(function(k){ try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch(e) {} });
      if (p && p.uid) {
        [PROGRESS_KEY, ANSWERS_KEY, STUDY_STATE_KEY, EXAM_ATTEMPTS_KEY].forEach(function(base){ try { localStorage.removeItem(base + ':' + p.uid); } catch(e) {} });
      }
      nameGate();
    });
  }

  function getIssueReports(){
    var state = readScopedJson(ISSUE_REPORTS_KEY, { schemaVersion:1, reports:[] });
    state.reports = Array.isArray(state.reports) ? state.reports : [];
    return state;
  }

  function saveIssueReport(report){
    var state = getIssueReports();
    state.reports.unshift(report);
    state.reports = state.reports.slice(0, 20);
    saveScopedJson(ISSUE_REPORTS_KEY, state);
  }

  function reportContext(){
    var profile = getProfile();
    return {
      pageUrl: location.href,
      view: view,
      examId: params.get('exam') || ui.examId || '',
      attemptId: params.get('attempt') || ui.examAttemptId || '',
      questionId: params.get('q') || '',
      profileId: profile && profile.uid ? profile.uid : '',
      browser: navigator.userAgent,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      online: navigator.onLine,
      createdAt: new Date().toISOString()
    };
  }

  function buildIssueReport(form){
    var category = form.elements.category.value;
    var severity = form.elements.severity.value;
    var description = form.elements.description.value.trim();
    var expected = form.elements.expected.value.trim();
    var steps = form.elements.steps.value.trim();
    if (!description) throw new Error('Describe what went wrong before creating a report.');
    return {
      reportId: 'issue-' + uid(),
      category: category,
      severity: severity,
      description: description,
      expected: expected,
      steps: steps,
      context: reportContext()
    };
  }

  function issueReportText(report){
    return [
      'UIL Science Issue Report',
      'Report ID: ' + report.reportId,
      'Created: ' + report.context.createdAt,
      'Category: ' + report.category,
      'Severity: ' + report.severity,
      '',
      'What went wrong:',
      report.description,
      '',
      'What should have happened:',
      report.expected || 'Not provided',
      '',
      'Steps to reproduce:',
      report.steps || 'Not provided',
      '',
      'Page/context:',
      'URL: ' + report.context.pageUrl,
      'View: ' + report.context.view,
      'Exam: ' + (report.context.examId || 'none'),
      'Attempt: ' + (report.context.attemptId || 'none'),
      'Question: ' + (report.context.questionId || 'none'),
      'Viewport: ' + report.context.viewport,
      'Online: ' + report.context.online,
      'Browser: ' + report.context.browser
    ].join('\n');
  }

  function troubleshootingView(){
    var saved = getIssueReports().reports.slice(0, 5);
    root.innerHTML =
      '<section class="settings-page troubleshoot-page">'+
        '<section class="card refined-card"><p class="overline">Troubleshooting</p><h2>Report a website issue</h2><p class="muted">Use this when something on the website looks wrong, a question seems broken, an answer choice will not save, a figure is missing, or an exam does not behave correctly.</p>'+
          '<form id="issue-form" class="issue-form" novalidate>'+
            '<label>Issue type<select name="category"><option>Website bug</option><option>Question issue</option><option>Answer choice issue</option><option>Missing figure</option><option>Exam/timer issue</option><option>Progress issue</option><option>Other</option></select></label>'+
            '<label>How serious is it?<select name="severity"><option>Normal</option><option>Blocks studying</option><option>Incorrect science/content</option><option>Urgent</option></select></label>'+
            '<label>What went wrong?<textarea name="description" rows="5" maxlength="1200" required placeholder="Describe the problem clearly."></textarea></label>'+
            '<label>What should have happened?<textarea name="expected" rows="3" maxlength="800" placeholder="Optional"></textarea></label>'+
            '<label>Steps to reproduce<textarea name="steps" rows="4" maxlength="1000" placeholder="Optional: list what you clicked or typed."></textarea></label>'+
            '<div class="field-error" id="issue-error" role="alert"></div>'+
            '<div class="question-actions"><button class="btn primary" type="submit">Create report</button><button class="btn" id="copy-report" type="button" disabled>Copy report</button><button class="btn" id="download-report" type="button" disabled>Download report</button></div>'+
          '</form>'+
        '</section>'+
        '<section class="card refined-card"><h2>Report preview</h2><pre class="issue-preview" id="issue-preview">Create a report to see the details that will be copied or downloaded.</pre><p class="muted">Reports stay in this browser until copied or downloaded. Nothing is sent automatically.</p></section>'+
        '<section class="card refined-card"><h2>Recent local reports</h2>'+(saved.length ? saved.map(function(r){ return '<div class="bookmark-row"><span>'+escapeHtml(r.context.createdAt)+'</span><strong>'+escapeHtml(r.category)+' - '+escapeHtml(r.severity)+'</strong><small>'+escapeHtml(r.description).slice(0,140)+'</small></div>'; }).join('') : '<p class="muted">No reports created in this browser yet.</p>')+'</section>'+
      '</section>';
    var latest = null;
    var form = document.getElementById('issue-form');
    var error = document.getElementById('issue-error');
    var preview = document.getElementById('issue-preview');
    var copy = document.getElementById('copy-report');
    var download = document.getElementById('download-report');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      try {
        latest = buildIssueReport(form);
        saveIssueReport(latest);
        preview.textContent = issueReportText(latest);
        copy.disabled = false;
        download.disabled = false;
        error.textContent = 'Report created. Copy or download it to share.';
      } catch(err) {
        error.textContent = err.message;
      }
    });
    copy.addEventListener('click', function(){
      if (!latest) return;
      var text = issueReportText(latest);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function(){ error.textContent = 'Report copied.'; }).catch(function(){ error.textContent = 'Copy failed. Use the preview text instead.'; });
      } else {
        error.textContent = 'Clipboard is unavailable. Use the preview text instead.';
      }
    });
    download.addEventListener('click', function(){
      if (!latest) return;
      var blob = new Blob([issueReportText(latest)], { type:'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = latest.reportId + '.txt';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });
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
    if (view === 'settings') return settingsView();
    if (view === 'troubleshoot') return troubleshootingView();
    view = 'home';
    return home(profile);
  }

  function bindKeyboardShortcuts(){
    document.addEventListener('keydown', function(e){
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      var key = e.key.toLowerCase();
      var map = { a:'A', b:'B', c:'C', d:'D', e:'E' };
      if (map[key]) {
        var choice = root.querySelector('.choice.pick[data-choice="'+map[key]+'"]');
        if (choice) { e.preventDefault(); choice.click(); }
        return;
      }
      if (key === 'enter') {
        var submit = document.getElementById('submit-answer');
        if (submit && !submit.disabled) { e.preventDefault(); submit.click(); }
      } else if (key === 'arrowleft') {
        var prev = document.getElementById('prev-question');
        if (prev && !prev.disabled) { e.preventDefault(); prev.click(); }
      } else if (key === 'arrowright') {
        var next = document.getElementById('next-question');
        if (next && !next.disabled) { e.preventDefault(); next.click(); }
      } else if (key === 'h') {
        var hint = document.getElementById('hint-button');
        if (hint) { e.preventDefault(); hint.click(); }
      } else if (key === 'b') {
        var bookmark = document.getElementById('bookmark');
        if (bookmark) { e.preventDefault(); bookmark.click(); }
      }
    });
  }

  function start(){
    if (!navigator.onLine) {
      errorState('This page needs the local study files. Check your connection or reload the page.');
      return;
    }
    loadCatalog().then(render).catch(function(e){ errorState(e.message || 'The study files could not be loaded.'); });
  }

  restoreStudyState();
  bindKeyboardShortcuts();
  window.addEventListener('online', function(){ if (!catalog.questions.length) start(); });
  start();
})();
