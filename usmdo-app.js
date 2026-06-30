/* USMDO Master Guide — app logic. localStorage only, no backend. */
(function(){
"use strict";

var STORE_KEY = "usmdo_progress_v1";
var app = document.getElementById("app");

/* ---------------- Store ---------------- */
var Store = {
  load: function(){
    try{
      var raw = localStorage.getItem(STORE_KEY);
      if(!raw) return Store.fresh();
      var d = JSON.parse(raw);
      if(!d.topicProgress) d.topicProgress = {};
      if(!d.mistakeLog) d.mistakeLog = [];
      return d;
    }catch(e){ return Store.fresh(); }
  },
  fresh: function(){ return { examDate: "", topicProgress: {}, mistakeLog: [] }; },
  save: function(d){ localStorage.setItem(STORE_KEY, JSON.stringify(d)); },
  setExamDate: function(dateStr){ var d = Store.load(); d.examDate = dateStr; Store.save(d); },
  recordQuizAttempt: function(topicId, correctCount, total, mistakes){
    var d = Store.load();
    var tp = d.topicProgress[topicId] || { attempts: 0, scores: [], lastReviewed: null };
    tp.attempts += 1;
    var pct = total ? Math.round((correctCount/total)*100) : 0;
    tp.scores.push(pct);
    if(tp.scores.length > 10) tp.scores = tp.scores.slice(-10);
    tp.lastReviewed = new Date().toISOString();
    d.topicProgress[topicId] = tp;
    if(mistakes && mistakes.length){
      mistakes.forEach(function(m){ d.mistakeLog.unshift(m); });
      d.mistakeLog = d.mistakeLog.slice(0, 60);
    }
    Store.save(d);
  },
  topicMastery: function(topicId){
    var d = Store.load();
    var tp = d.topicProgress[topicId];
    if(!tp || !tp.scores.length) return null;
    var sum = tp.scores.reduce(function(a,b){return a+b;},0);
    return Math.round(sum / tp.scores.length);
  },
  topicLastReviewed: function(topicId){
    var d = Store.load();
    var tp = d.topicProgress[topicId];
    return tp ? tp.lastReviewed : null;
  },
  reset: function(){ localStorage.removeItem(STORE_KEY); }
};

/* ---------------- helpers ---------------- */
function esc(s){ return String(s==null?"":s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];}); }
function fmtDate(iso){ if(!iso) return "—"; var d = new Date(iso); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
function masteryColor(pct){ if(pct===null) return "#6f82a6"; if(pct>=80) return "var(--good)"; if(pct>=50) return "var(--warn)"; return "var(--bad)"; }

function allTopicStats(){
  return SYLLABUS.map(function(t){
    var mastery = Store.topicMastery(t.id);
    return {
      id: t.id, title: t.title, section: t.section,
      mastery: mastery, attempted: mastery !== null,
      lastReviewed: Store.topicLastReviewed(t.id)
    };
  });
}

function readiness(){
  var stats = allTopicStats();
  if(!stats.length) return 0;
  var sum = stats.reduce(function(a,s){ return a + (s.mastery||0); },0);
  return Math.round(sum/stats.length);
}

function sectionAccuracy(){
  var out = {};
  Object.keys(SECTIONS).forEach(function(sec){
    var topics = allTopicStats().filter(function(s){ return s.section===sec; });
    var attempted = topics.filter(function(s){ return s.attempted; });
    out[sec] = attempted.length ? Math.round(attempted.reduce(function(a,s){return a+s.mastery;},0)/attempted.length) : null;
  });
  return out;
}

function weakestTopics(n){
  return allTopicStats().filter(function(s){ return s.attempted; })
    .sort(function(a,b){ return a.mastery-b.mastery; }).slice(0,n);
}

function recommendedNext(){
  var weak = allTopicStats().filter(function(s){ return s.attempted && s.mastery < 60; })
    .sort(function(a,b){ return a.mastery-b.mastery; });
  if(weak.length) return { reason: "Lowest mastery — needs review", topic: weak[0] };
  var unattempted = allTopicStats().filter(function(s){ return !s.attempted; });
  if(unattempted.length) return { reason: "Not yet started", topic: unattempted[0] };
  var lowest = allTopicStats().sort(function(a,b){ return (a.mastery||0)-(b.mastery||0); })[0];
  return lowest ? { reason: "Keep sharp — revisit periodically", topic: lowest } : null;
}

function topicHref(id){
  var t = SYLLABUS.find(function(x){ return x.id===id; });
  return t ? "#learn/"+t.section+"/"+id : "#dashboard";
}

/* ---------------- Router ---------------- */
function route(){
  var hash = location.hash.replace(/^#/, "") || "dashboard";
  var parts = hash.split("/");
  highlightTab(hash);
  if(parts[0]==="dashboard") return renderDashboard();
  if(parts[0]==="syllabus") return renderSyllabus();
  if(parts[0]==="atlas" && !parts[1]) return renderAtlasIndex();
  if(parts[0]==="atlas" && parts[1]) return renderAtlasSystem(parts[1]);
  if(parts[0]==="learn" && parts[1] && !parts[2]) return renderLearnSection(parts[1]);
  if(parts[0]==="learn" && parts[1] && parts[2]) return renderTopic(parts[2]);
  renderDashboard();
}
function highlightTab(hash){
  var top = "learn/"+ (hash.split("/")[1]||"");
  var links = document.querySelectorAll("#tabs a");
  links.forEach(function(a){
    var r = a.getAttribute("data-r");
    var active = (hash.indexOf("learn/")===0 && r===top) || (hash.indexOf("learn")!==0 && hash.indexOf(r)===0);
    a.classList.toggle("active", active);
  });
}
window.addEventListener("hashchange", route);

/* ---------------- Dashboard ---------------- */
function renderDashboard(){
  var d = Store.load();
  var ready = readiness();
  var acc = sectionAccuracy();
  var weak = weakestTopics(5);
  var next = recommendedNext();
  var mistakes = d.mistakeLog.slice(0,6);
  var stats = allTopicStats();
  var attemptedCount = stats.filter(function(s){return s.attempted;}).length;

  var days = "";
  if(d.examDate){
    var diff = Math.ceil((new Date(d.examDate+"T00:00:00") - new Date(new Date().toDateString()))/86400000);
    days = diff>=0 ? diff+" day"+(diff===1?"":"s")+" until your exam" : "Exam date passed";
  }

  var html = "";
  html += '<div class="pagehead"><h1>Dashboard</h1><div class="sub">Your USMDO readiness at a glance — tracked locally on this device.</div></div>';

  html += '<div class="grid g3" style="margin-bottom:16px">';
  html += '<div class="card"><div class="cardhead"><h3>⏱ Countdown</h3></div>'+
    '<input class="field-date" type="date" id="examDateInput" value="'+esc(d.examDate||"")+'">'+
    '<div class="muted" style="margin-top:10px;font-size:13.5px" id="countdownText">'+(days||"Set your exam date above")+'</div></div>';

  html += '<div class="card" style="grid-column:span 2"><div class="cardhead"><h3>📈 Overall Readiness</h3>'+
    '<span class="tag neutral">'+attemptedCount+'/'+SYLLABUS.length+' topics started</span></div>'+
    '<div style="display:flex;gap:20px;align-items:center">'+
    '<div class="ring" id="readyRing"><div class="val"><b>'+ready+'%</b><small>readiness</small></div></div>'+
    '<div style="flex:1">'+
    Object.keys(SECTIONS).map(function(sec){
      var a = acc[sec];
      return '<div class="meterline"><span class="tag '+SECTIONS[sec].tag+'">'+SECTIONS[sec].icon+' '+SECTIONS[sec].label+'</span><b>'+(a===null?"—":a+"%")+'</b></div>'+
        '<div class="meter"><i style="width:'+(a||0)+'%;background:linear-gradient(90deg,'+masteryColor(a)+','+masteryColor(a)+')"></i></div>';
    }).join("")+
    '</div></div></div>';
  html += '</div>';

  html += '<div class="grid g3" style="margin-bottom:16px">';

  // weakest topics
  if(weak.length){
    html += '<div class="card"><div class="cardhead"><h3>🎯 Weakest Topics</h3></div>'+
      weak.map(function(w){
        return '<div class="rowline"><a class="t" href="'+topicHref(w.id)+'" style="font-weight:700">'+esc(w.title)+'</a><b style="color:'+masteryColor(w.mastery)+'">'+w.mastery+'%</b></div>';
      }).join("")+'</div>';
  } else {
    html += '<div class="card"><div class="cardhead"><h3>🎯 Weakest Topics</h3></div><div class="empty"><div class="emo">🌱</div><div class="h">No quiz attempts yet</div><div class="d">Take a mini-check on any learn page to see this fill in.</div></div></div>';
  }

  // recent mistakes
  if(mistakes.length){
    html += '<div class="card"><div class="cardhead"><h3>❌ Recent Mistakes</h3></div>'+
      mistakes.map(function(m){
        return '<div class="rowline" style="display:block"><div class="t" style="font-weight:700;margin-bottom:2px">'+esc(m.topicTitle)+'</div>'+
          '<div class="s">'+esc(m.question)+'</div>'+
          '<div class="s" style="margin-top:3px">You: <span style="color:var(--bad)">'+esc(m.chosenText)+'</span> · Correct: <span style="color:var(--good)">'+esc(m.correctText)+'</span></div></div>';
      }).join("")+'</div>';
  } else {
    html += '<div class="card"><div class="cardhead"><h3>❌ Recent Mistakes</h3></div><div class="empty"><div class="emo">✅</div><div class="h">No mistakes logged</div><div class="d">Missed questions from mini-checks will appear here.</div></div></div>';
  }

  // recommended next
  if(next){
    html += '<div class="card"><div class="cardhead"><h3>⚡ Recommended Next</h3></div>'+
      '<div class="tag '+SECTIONS[next.topic.section].tag+'" style="margin-bottom:8px">'+SECTIONS[next.topic.section].label+'</div>'+
      '<div style="font-weight:800;font-size:15px;margin-bottom:4px">'+esc(next.topic.title)+'</div>'+
      '<div class="muted" style="font-size:12.5px;margin-bottom:14px">'+esc(next.reason)+'</div>'+
      '<a class="btn primary block" href="'+topicHref(next.topic.id)+'">Study this topic →</a></div>';
  }
  html += '</div>';

  app.innerHTML = html;
  var ring = document.getElementById("readyRing"); if(ring) ring.style.setProperty("--p", ready);

  document.getElementById("examDateInput").addEventListener("change", function(e){
    Store.setExamDate(e.target.value);
    renderDashboard();
  });
}

/* ---------------- Syllabus Tracker ---------------- */
var trackerFilter = "all";
function renderSyllabus(){
  var stats = allTopicStats();
  var html = '<div class="pagehead"><h1>Official Syllabus Tracker</h1><div class="sub">All major USMDO topics across the three syllabus categories. Mastery updates automatically from your mini-check quiz results.</div></div>';

  html += '<div class="filterbar">';
  html += '<div class="chip'+(trackerFilter==="all"?" on":"")+'" data-f="all">All</div>';
  Object.keys(SECTIONS).forEach(function(sec){
    html += '<div class="chip'+(trackerFilter===sec?" on":"")+'" data-f="'+sec+'">'+SECTIONS[sec].icon+' '+SECTIONS[sec].label+'</div>';
  });
  html += '</div>';

  var rows = stats.filter(function(s){ return trackerFilter==="all" || s.section===trackerFilter; });

  html += '<div class="card"><table class="tracker"><thead><tr>'+
    '<th>Topic</th><th>Section</th><th>Learn Page</th><th>Quiz</th><th>Mastery</th><th>Last Reviewed</th>'+
    '</tr></thead><tbody>';
  rows.forEach(function(r){
    var col = masteryColor(r.mastery);
    html += '<tr>'+
      '<td><b>'+esc(r.title)+'</b></td>'+
      '<td><span class="tag '+SECTIONS[r.section].tag+'">'+SECTIONS[r.section].label+'</span></td>'+
      '<td><a class="btn sm" href="'+topicHref(r.id)+'">Open →</a></td>'+
      '<td><span class="tag neutral">✓ Available</span></td>'+
      '<td><span class="masterybar"><i style="width:'+(r.mastery||0)+'%;background:'+col+'"></i></span><b style="color:'+col+'">'+(r.mastery===null?"—":r.mastery+"%")+'</b></td>'+
      '<td class="faint">'+fmtDate(r.lastReviewed)+'</td>'+
      '</tr>';
  });
  html += '</tbody></table></div>';

  app.innerHTML = html;
  document.querySelectorAll(".filterbar .chip").forEach(function(c){
    c.addEventListener("click", function(){ trackerFilter = c.getAttribute("data-f"); renderSyllabus(); });
  });
}

/* ---------------- Learn: section list ---------------- */
function renderLearnSection(section){
  var meta = SECTIONS[section];
  if(!meta) return renderDashboard();
  var topics = SYLLABUS.filter(function(t){ return t.section===section; });
  var html = '<div class="pagehead"><h1>'+meta.icon+' '+meta.label+'</h1><div class="sub">'+topics.length+' topics. Each page covers a simple explanation, high-yield facts, mechanism, disease connections, common traps, and a mini-check quiz.</div></div>';
  html += '<div class="topiclist">';
  topics.forEach(function(t){
    var m = Store.topicMastery(t.id);
    html += '<a class="topicrow" href="#learn/'+section+'/'+t.id+'">'+
      '<div><div class="tt">'+esc(t.title)+'</div><div class="ts">'+(m===null?"Not started":"Mastery "+m+"%")+'</div></div>'+
      '<span class="masterybar" style="width:60px"><i style="width:'+(m||0)+'%;background:'+masteryColor(m)+'"></i></span>'+
    '</a>';
  });
  html += '</div>';
  app.innerHTML = html;
}

/* ---------------- Learn: topic detail + quiz ---------------- */
function renderTopic(topicId){
  var t = SYLLABUS.find(function(x){ return x.id===topicId; });
  var content = LEARN[topicId];
  if(!t || !content) return renderDashboard();
  var meta = SECTIONS[t.section];

  var html = '<a class="backlink" href="#learn/'+t.section+'">← Back to '+meta.label+'</a>';
  html += '<div class="pagehead"><h1>'+esc(t.title)+'</h1><div class="sub"><span class="tag '+meta.tag+'">'+meta.label+'</span></div></div>';

  html += '<div class="lp-block"><h3>📝 Simple Explanation</h3><p>'+esc(content.simple)+'</p></div>';

  html += '<div class="lp-block"><h3>⭐ High-Yield Facts</h3><ul>'+content.highYield.map(function(f){return '<li>'+esc(f)+'</li>';}).join("")+'</ul></div>';

  html += '<div class="lp-block"><h3>⚙️ Mechanism</h3><p>'+esc(content.mechanism)+'</p></div>';

  html += '<div class="lp-block"><h3>🩺 Disease Connection</h3><ul>'+content.diseaseConnection.map(function(f){return '<li>'+esc(f)+'</li>';}).join("")+'</ul></div>';

  html += '<div class="lp-block"><h3>⚠️ Common Traps</h3><ul>'+content.traps.map(function(f){return '<li>'+esc(f)+'</li>';}).join("")+'</ul></div>';

  html += '<div class="lp-block" id="quizBlock"><h3>✅ Mini Check Questions</h3><div id="quizRoot"></div></div>';

  html += '<div class="lp-block"><h3>📚 References / Source Notes</h3><ul>'+content.refs.map(function(f){return '<li>'+esc(f)+'</li>';}).join("")+'</ul></div>';

  app.innerHTML = html;
  renderQuiz(topicId, content.quiz, t.title);
}

function renderQuiz(topicId, quiz, topicTitle){
  var root = document.getElementById("quizRoot");
  var answers = quiz.map(function(){ return null; });

  function paint(){
    var html = "";
    quiz.forEach(function(q, qi){
      html += '<div class="quizq"><div class="qt">'+ (qi+1) +'. '+esc(q.q)+'</div><div class="quizopts">';
      q.c.forEach(function(opt, oi){
        var cls = "quizopt";
        if(answers[qi]!==null){
          if(oi===q.a) cls += " correct";
          else if(oi===answers[qi]) cls += " wrong";
        } else if(answers[qi]===oi){
          cls += " sel";
        }
        html += '<div class="'+cls+'" data-qi="'+qi+'" data-oi="'+oi+'">'+String.fromCharCode(65+oi)+'. '+esc(opt)+'</div>';
      });
      html += '</div>';
      if(answers[qi]!==null){
        html += '<div class="quizexp show">'+esc(q.ex)+'</div>';
      }
      html += '</div>';
    });
    var answeredAll = answers.every(function(a){ return a!==null; });
    html += '<div class="btnrow" style="margin-top:8px">'+
      '<button class="btn primary" id="quizSubmit"'+(answeredAll?"":" disabled")+'>Submit & Save Mastery</button>'+
      '<button class="btn" id="quizRetry">Retry</button></div>';
    root.innerHTML = html;

    root.querySelectorAll(".quizopt").forEach(function(el){
      el.addEventListener("click", function(){
        var qi = +el.getAttribute("data-qi");
        if(answers[qi]!==null) return;
        answers[qi] = +el.getAttribute("data-oi");
        paint();
      });
    });
    var submitBtn = document.getElementById("quizSubmit");
    if(submitBtn) submitBtn.addEventListener("click", submit);
    document.getElementById("quizRetry").addEventListener("click", function(){
      answers = quiz.map(function(){ return null; });
      paint();
    });
  }

  function submit(){
    var correct = 0;
    var mistakes = [];
    quiz.forEach(function(q, qi){
      if(answers[qi]===q.a) correct++;
      else mistakes.push({
        date: new Date().toISOString(),
        topicId: topicId, topicTitle: topicTitle,
        question: q.q, chosenText: q.c[answers[qi]], correctText: q.c[q.a]
      });
    });
    Store.recordQuizAttempt(topicId, correct, quiz.length, mistakes);
    var pct = Math.round((correct/quiz.length)*100);
    root.insertAdjacentHTML("beforeend", '<div class="note" style="margin-top:12px"><span class="ic">✓</span><div><b>Saved.</b> Scored '+correct+'/'+quiz.length+' ('+pct+'%) — mastery for this topic updated.</div></div>');
    var submitBtn = document.getElementById("quizSubmit");
    if(submitBtn) submitBtn.setAttribute("disabled","disabled");
  }

  paint();
}

/* ---------------- Disease Atlas ---------------- */
function renderAtlasIndex(){
  var html = '<div class="pagehead"><h1>🦠 Disease Atlas</h1><div class="sub">Reference cards organized by body system. Each card covers cause, mechanism, key symptoms, diagnostic clue, treatment concept, and a common test trap.</div></div>';
  html += '<div class="systemgrid">';
  Object.keys(DISEASES).forEach(function(key){
    var s = DISEASES[key];
    html += '<a class="card hover" href="#atlas/'+key+'" style="display:block">'+
      '<div class="cardhead"><h3>'+s.icon+' '+s.label+'</h3><span class="tag neutral">'+s.items.length+' diseases</span></div>'+
      '<div class="muted" style="font-size:13px">'+s.items.map(function(d){return d.name;}).join(" · ")+'</div></a>';
  });
  html += '</div>';
  app.innerHTML = html;
}

function renderAtlasSystem(key){
  var s = DISEASES[key];
  if(!s) return renderAtlasIndex();
  var html = '<a class="backlink" href="#atlas">← Back to Disease Atlas</a>';
  html += '<div class="pagehead"><h1>'+s.icon+' '+s.label+'</h1><div class="sub">'+s.items.length+' high-yield conditions in this system.</div></div>';
  html += '<div class="grid g2">';
  s.items.forEach(function(d){
    html += '<div class="disease-card"><h4>'+esc(d.name)+'</h4><dl>'+
      '<dt>Cause</dt><dd>'+esc(d.cause)+'</dd>'+
      '<dt>Mechanism</dt><dd>'+esc(d.mechanism)+'</dd>'+
      '<dt>Symptoms</dt><dd>'+esc(d.symptoms)+'</dd>'+
      '<dt>Diagnostic</dt><dd>'+esc(d.diagnostic)+'</dd>'+
      '<dt>Treatment</dt><dd>'+esc(d.treatment)+'</dd>'+
      '<dt>Test Trap</dt><dd class="trap">'+esc(d.trap)+'</dd>'+
      '</dl></div>';
  });
  html += '</div>';
  app.innerHTML = html;
}

/* ---------------- Reset ---------------- */
document.getElementById("resetBtn").addEventListener("click", function(){
  if(confirm("Reset all locally saved progress (mastery, mistakes, exam date)? This cannot be undone.")){
    Store.reset();
    route();
  }
});

route();
})();
