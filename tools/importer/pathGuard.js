const fs = require('fs');
const path = require('path');

const REPO_ROOT = fs.realpathSync(path.resolve(__dirname, '..', '..'));

function normalizeInsideRepo(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('Path is required.');
  }
  if (inputPath.includes('..')) {
    throw new Error(`Path traversal is forbidden: ${inputPath}`);
  }
  const resolved = path.resolve(REPO_ROOT, inputPath);
  const parent = fs.existsSync(resolved) ? resolved : path.dirname(resolved);
  const realParent = fs.realpathSync(parent);
  if (realParent !== REPO_ROOT && !realParent.startsWith(REPO_ROOT + path.sep)) {
    throw new Error(`Path escapes repository: ${inputPath}`);
  }
  return resolved;
}

function repoRelative(absPath) {
  const resolved = path.resolve(absPath);
  if (resolved !== REPO_ROOT && !resolved.startsWith(REPO_ROOT + path.sep)) {
    throw new Error(`Path escapes repository: ${absPath}`);
  }
  return path.relative(REPO_ROOT, resolved).replace(/\\/g, '/');
}

module.exports = { REPO_ROOT, normalizeInsideRepo, repoRelative };
