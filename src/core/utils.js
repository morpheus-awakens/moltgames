function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix = 'g') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = {
  nowIso,
  generateId
};
