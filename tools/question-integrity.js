function questionStructureIssues(q) {
  const issues = [];
  const choices = Array.isArray(q && q.choices) ? q.choices : [];
  const labels = choices.map(choice => typeof choice === 'string' ? '' : choice && choice.label);
  if (choices.length !== 5) issues.push('choice-count-not-five');
  if (labels.some(label => !['A', 'B', 'C', 'D', 'E'].includes(label))) issues.push('invalid-choice-label');
  if (new Set(labels).size !== labels.length) issues.push('duplicate-choice-labels');
  if (!q || !q.officialAnswer || !labels.includes(q.officialAnswer)) issues.push('official-answer-not-in-choices');
  if (!q || !q.stem || String(q.stem).trim().length < 10) issues.push('stem-too-short');
  return issues;
}

module.exports = { questionStructureIssues };
