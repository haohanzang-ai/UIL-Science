/* ============================================================
   UIL Science frontend API client
   Talks to the Express backend. All data is real;
   when the server returns nothing, callers render empty states.
   ============================================================ */
(function(){
  var DEFAULT_REMOTE_API = 'https://uil-science.onrender.com';
  var HEALTH_TIMEOUT_MS = 6000;

  function trimSlash(s){ return String(s || '').replace(/\/+$/, ''); }
  function configuredBase(){
    if (typeof window.UIL_API_BASE === 'string') return trimSlash(window.UIL_API_BASE);
    var meta = document.querySelector('meta[name="uil-api-base"]');
    if (meta && meta.content) return trimSlash(meta.content);
    if (location.hostname === 'haohanzang-ai.github.io') return DEFAULT_REMOTE_API;
    return '';
  }
  var API_BASE = configuredBase();
  function apiUrl(path){
    if (/^https?:\/\//i.test(path)) return path;
    return API_BASE + path;
  }
  function withTimeout(ms){
    var ctrl = new AbortController();
    var timer = setTimeout(function(){ ctrl.abort(); }, ms || HEALTH_TIMEOUT_MS);
    return { signal: ctrl.signal, done: function(){ clearTimeout(timer); } };
  }
  function headers(){
    var h = { 'Content-Type': 'application/json' };
    var sid = localStorage.getItem('uil-student-id'); if (sid) h['x-student-id'] = sid;
    var role = localStorage.getItem('uil-role'); if (role) h['x-role'] = role;
    return h;
  }
  async function readJson(res){
    try { return await res.json(); } catch(e){ return null; }
  }
  async function req(method, url, body){
    var t = withTimeout(15000);
    var res, data;
    try {
      res = await fetch(apiUrl(url), { method, headers: headers(), body: body ? JSON.stringify(body) : undefined, signal: t.signal });
      data = await readJson(res);
    } catch(e) {
      var network = e.name === 'AbortError' ? 'Request timed out.' : 'Could not reach the backend.';
      throw Object.assign(new Error(network), { status: 0, kind: e.name === 'AbortError' ? 'timeout' : 'network' });
    } finally {
      t.done();
    }
    if (!res.ok) throw Object.assign(new Error((data && data.error) || res.statusText || ('HTTP '+res.status)), { status: res.status, data });
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
    clearStudent:()      => localStorage.removeItem('uil-student-id'),
    isCoach:   ()        => ['coach','admin'].includes(localStorage.getItem('uil-role')),
    baseUrl:   ()        => API_BASE,

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
    overview:         (studentId)    => req('GET','/api/analytics/overview/'+studentId),

    // team
    teamSummary:      ()             => req('GET','/api/team/summary'),
    teamLeaderboard:  (subject='overall') => req('GET','/api/team/leaderboard?subject='+encodeURIComponent(subject)),
    teamSubjects:     ()             => req('GET','/api/team/subjects')
  };

  // Detect "backend not running" so pages can show a clear notice instead of fake data.
  API.health = async function(){
    var t = withTimeout(HEALTH_TIMEOUT_MS);
    try {
      var res = await fetch(apiUrl('/api/health'), { headers: headers(), signal: t.signal });
      var data = await readJson(res);
      API.healthDetail = { ok: !!(res.ok && data && data.ok === true), status: res.status, data: data, baseUrl: API_BASE };
      API.online = API.healthDetail.ok;
    } catch(e) {
      API.healthDetail = { ok: false, status: 0, kind: e.name === 'AbortError' ? 'timeout' : 'network', baseUrl: API_BASE };
      API.online = false;
    } finally {
      t.done();
    }
    return API.online;
  };

  // Shared offline notice. It is fixed, dismissible, and does not alter page layout.
  API.offlineBanner = function(){
    if (document.getElementById('api-offline')) return;
    var d = document.createElement('div');
    d.id = 'api-offline';
    d.setAttribute('role', 'status');
    d.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:80',
      'max-width:min(420px, calc(100vw - 32px))',
      'background:#2a1e10',
      'border:1px solid #5a4011',
      'border-radius:12px',
      'box-shadow:0 16px 40px rgba(0,0,0,.28)',
      'color:#f8cd7a',
      'padding:12px 42px 12px 14px',
      'font-size:13px',
      'line-height:1.45',
      'text-align:left'
    ].join(';');
    d.innerHTML = ''+
      '<button type="button" aria-label="Dismiss backend notice" '+
        'style="position:absolute;right:8px;top:8px;width:26px;height:26px;border:1px solid #5a4011;border-radius:8px;background:transparent;color:#f8cd7a;cursor:pointer;font-size:16px;line-height:1">x</button>'+
      '<b>Backend not connected.</b> API base: <code>'+(API_BASE || 'same origin')+'</code>. Start the backend or update <code>DEFAULT_REMOTE_API</code> in <code>assets/api.js</code>.';
    d.querySelector('button').addEventListener('click', function(){ d.remove(); });
    document.body.appendChild(d);
  };

  window.API = API;
})();
