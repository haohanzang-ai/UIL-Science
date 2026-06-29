/* ============================================================
   UIL scoring + analytics — PURE functions, computed from real
   attempt data only. No hardcoded insights.
   UIL scoring: correct = +6, blank = 0, wrong = -2.
   ============================================================ */
const PTS = { correct: 6, blank: 0, wrong: -2 };

/* Grade a single answer against a question. Returns {is_correct, points}. */
function grade(selected, correctAnswer) {
  const blank = selected === null || selected === undefined || selected === '';
  if (blank) return { is_correct: null, points: PTS.blank, blank: true };
  const is_correct = String(selected).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase();
  return { is_correct: is_correct ? 1 : 0, points: is_correct ? PTS.correct : PTS.wrong, blank: false };
}

function pct(n, d) { return d > 0 ? Math.round((n / d) * 1000) / 10 : null; }

/* Feature 2 — "Why Did I Lose Points?" panel.
   rows: [{selected, confidence, is_correct, points, subject, topic, difficulty, stem}] */
function scoreLoss(rows) {
  const n = rows.length;
  if (!n) return { empty: true };

  const correct = rows.filter(r => r.is_correct === 1);
  const wrong   = rows.filter(r => r.is_correct === 0);
  const blanks  = rows.filter(r => r.selected === null || r.selected === '' || r.selected === undefined);

  const possible    = n * PTS.correct;
  const gained      = correct.length * PTS.correct;
  const lostFromWrong = wrong.length * PTS.wrong;            // negative
  const actual      = gained + lostFromWrong;               // blanks contribute 0

  const riskyGuesses   = rows.filter(r => r.confidence === 'guessed');
  const guessedCorrect = riskyGuesses.filter(r => r.is_correct === 1);
  const wrongConfident = wrong.filter(r => r.confidence === 'confident');
  const wrongGuessed   = wrong.filter(r => r.confidence === 'guessed');

  // group point loss by subject / topic (wrong answers only)
  const lossBy = (key) => {
    const m = {};
    wrong.forEach(r => { const k = r[key] || 'Untagged'; m[k] = (m[k] || 0) + Math.abs(PTS.wrong); });
    const arr = Object.entries(m).map(([k, v]) => ({ key: k, lost: v })).sort((a, b) => b.lost - a.lost);
    return arr;
  };
  const subjectLoss = lossBy('subject');
  const topicLoss   = lossBy('topic');

  const byDiff = (level) => wrong.filter(r => (r.difficulty || '').toLowerCase() === level);
  const missedSorted = wrong.slice().sort((a, b) => diffRank(a.difficulty) - diffRank(b.difficulty));
  const easiestMissed = missedSorted.slice(0, 5);                       // easy first
  const hardestMissed = missedSorted.slice().reverse().slice(0, 5);     // hard first

  const guessedAccuracy = pct(guessedCorrect.length, riskyGuesses.length);

  // ----- insights generated from the real numbers -----
  const insights = [];
  if (wrongGuessed.length) insights.push(`You lost ${wrongGuessed.length * Math.abs(PTS.wrong)} points from wrong guesses.`);
  if (subjectLoss.length && subjectLoss[0].lost > 0) {
    const t = topicLoss[0];
    insights.push(`Most lost points came from ${cap(subjectLoss[0].key)}${t ? ': ' + t.key : ''}.`);
  }
  const mediumBlanks = blanks.filter(r => (r.difficulty || '').toLowerCase() === 'medium');
  if (mediumBlanks.length) insights.push(`You left ${mediumBlanks.length} medium-difficulty question(s) blank — review whether those matched topics you usually answer correctly.`);
  if (riskyGuesses.length && guessedAccuracy !== null) {
    if (guessedAccuracy < 25) insights.push(`Your guessed answers were only ${guessedAccuracy}% correct, so skipping may have been better.`);
    else insights.push(`Your guessed answers were ${guessedAccuracy}% correct — above the 25% break-even, so educated guessing helped.`);
  }
  if (wrongConfident.length) insights.push(`${wrongConfident.length} answer(s) you marked "confident" were wrong — real concept gaps to review.`);

  return {
    empty: false,
    counts: { total: n, correct: correct.length, wrong: wrong.length, blank: blanks.length },
    score: {
      possible, actual, gained,
      lostFromWrong: Math.abs(lostFromWrong),
      blankImpact: 0
    },
    risk: {
      riskyGuesses: riskyGuesses.length,
      guessedCorrect: guessedCorrect.length,
      guessedAccuracy,
      wrongConfident: wrongConfident.length,
      wrongGuessed: wrongGuessed.length
    },
    subjectLoss, topicLoss,
    easiestMissed: easiestMissed.map(slim),
    hardestMissed: hardestMissed.map(slim),
    topSubjectLoss: subjectLoss[0] || null,
    topTopicLoss: topicLoss[0] || null,
    insights
  };
}

/* Feature 3 — Personal Guessing Threshold.
   rows across all of a student's submitted answers. */
function guessingThreshold(rows) {
  const answered = rows.filter(r => r.selected !== null && r.selected !== '' && r.selected !== undefined);
  if (!answered.length && !rows.length) return { empty: true };

  const blanks = rows.filter(r => r.selected === null || r.selected === '' || r.selected === undefined);

  const level = (name) => {
    const set = answered.filter(r => r.confidence === name);
    const corr = set.filter(r => r.is_correct === 1);
    const accuracy = pct(corr.length, set.length);
    const avgPoints = set.length ? Math.round((set.reduce((s, r) => s + (r.points || 0), 0) / set.length) * 100) / 100 : null;
    return { attempts: set.length, correct: corr.length, accuracy, avgPoints };
  };
  const guessed   = level('guessed');
  const somewhat  = level('somewhat');
  const confident = level('confident');

  // advice from EV logic: EV = 8p - 2  → positive when p > 25%
  const advice = [];
  if (guessed.attempts) {
    if (guessed.accuracy < 25) advice.push({ tone: 'warn', text: `Your guesses are ${guessed.accuracy}% accurate — below the 25% break-even. Skip more when you're truly guessing.` });
    else advice.push({ tone: 'good', text: `Your guesses are ${guessed.accuracy}% accurate — above 25%, so your educated guesses are adding points.` });
  }
  if (confident.attempts && confident.accuracy !== null && confident.accuracy < 80) {
    advice.push({ tone: 'warn', text: `You're only ${confident.accuracy}% accurate when "confident" — that's overconfidence. Review those concepts.` });
  }
  if (somewhat.attempts && somewhat.accuracy !== null && somewhat.accuracy >= 50 && blanks.length) {
    advice.push({ tone: 'good', text: `Your "somewhat sure" answers are ${somewhat.accuracy}% accurate (above break-even) — answer more of those instead of leaving blanks.` });
  }
  if (!advice.length) advice.push({ tone: 'info', text: 'Not enough confidence-tagged attempts yet to give a personalized recommendation.' });

  return { empty: false, breakEven: 25, formula: 'EV = 8p − 2 (positive when p > 25%)', levels: { guessed, somewhat, confident }, blanks: blanks.length, advice };
}

function diffRank(d) { return ({ easy: 1, medium: 2, hard: 3 })[(d || '').toLowerCase()] || 2; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function slim(r) { return { question_id: r.question_id, subject: r.subject, topic: r.topic, difficulty: r.difficulty, stem: r.stem }; }

module.exports = { grade, scoreLoss, guessingThreshold, PTS };
