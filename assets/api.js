/* ============================================================
   UIL Science — frontend API client
   Talks to the Express backend (same origin). All data is real;
   when the server returns nothing, callers render empty states.
   ============================================================ */
(function(){
  function headers(){
    var h = { 'Content-Type': 'application/json' };
    var sid = localStorage.getItem('uil-student-id'); if (sid) h['x-student-id'] = sid;
    var role = localStorage.getItem('uil-role'); if (role) h['x-role'] = role;
    return h;
  }
  async function req(method, url, body){
    var res = await fetch(url, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
    var data = null;
    try { data = await res.json(); } catch(e){}
    if (!res.ok) throw Object.assign(new Error((data && data.error) || res.statusText), { status: res.status, data });
    return data;
  }

  var API = {
    online: true,
    get:  (u)   => req('GET', u),
    post: (u,b) => req('POST', u, b),
    patch:(u,b) => req('PATCH', u, b),

    // identity
    me:        ()        => req('GET','/api/me'),
    createStudent: (s)   => req('POST','/api/students', s),
    role:      ()        => localStorage.getItem('uil-role') || 'student',
    setRole:   (r)       => localStorage.setItem('uil-role', r),
    studentId: ()        => localStorage.getItem('uil-student-id'),
    setStudent:(id)      => localStorage.setItem('uil-student-id', id),
    isCoach:   ()        => ['coach','admin'].includes(localStorage.getItem('uil-role')),

    // questions / admin
    questions:        (qs='')        => req('GET','/api/questions'+qs),
    queue:            ()             => req('GET','/api/admin/queue'),
    integritySummary: ()             => req('GET','/api/admin/integrity-summary'),
    question:         (id)           => req('GET','/api/questions/'+id),
    editQuestion:     (id,b)         => req('PATCH','/api/questions/'+id, b),
    approve:          (id)           => req('POST','/api/questions/'+id+'/approve'),
    reject:           (id)           => req('POST','/api/questions/'+id+'/reject'),
    flag:             (id,note)      => req('POST','/api/questions/'+id+'/flag',{note}),

    // practice
    practiceQuestions:(qs='')        => req('GET','/api/practice/questions'+qs),
    submit:           (b)            => req('POST','/api/practice/submit', b),
    sessions:         ()             => req('GET','/api/practice/sessions'),

    // analytics
    scoreLoss:        (sid)          => req('GET','/api/analytics/score-loss/'+sid),
    guessing:         (studentId)    => req('GET','/api/analytics/guessing/'+studentId),
    subjects:         (studentId)    => req('GET','/api/analytics/subjects/'+studentId),
    overview:         (studentId)    => req('GET','/api/analytics/overview/'+studentId)
  };

  // Detect "backend not running" so pages can show a clear banner instead of fake data.
  API.health = async function(){
    try { await fetch('/api/me', { headers: headers() }); API.online = true; }
    catch(e){ API.online = false; }
    return API.online;
  };

  // Shared offline banner
  API.offlineBanner = function(){
    if (document.getElementById('api-offline')) return;
    var d = document.createElement('div');
    d.id = 'api-offline';
    d.style.cssText = 'position:sticky;top:0;z-index:90;background:#2a1e10;border-bottom:1px solid #5a4011;color:#f8cd7a;padding:10px 16px;font-size:13px;text-align:center';
    d.innerHTML = '⚠️ Backend not connected — start it with <code>cd server &amp;&amp; npm install &amp;&amp; npm start</code>, then open <b>http://localhost:3000</b>. No data is shown until then.';
    document.body.insertBefore(d, document.body.firstChild);
  };

  window.API = API;
})();
