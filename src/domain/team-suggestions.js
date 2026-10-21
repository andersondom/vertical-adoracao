/**
 * Pure recommendation engine: no database writes and no automatic publishing.
 * Candidates must already be filtered for active membership and role eligibility.
 */
export function suggestTeam({ requirements, candidates, existing = [] }) {
  if (!Array.isArray(requirements) || !Array.isArray(candidates) || !Array.isArray(existing)) {
    throw new TypeError("Entradas de escala inválidas.");
  }
  const chosen = [...existing];
  const keys = new Set(chosen.map(x => `${x.userId}:${x.roleId}`));
  const scores = new Map();
  for (const person of candidates) {
    if (!Number.isSafeInteger(person.userId) || person.userId <= 0 ||
        !Number.isSafeInteger(person.roleId) || person.roleId <= 0 ||
        typeof person.available !== "boolean" || typeof person.active !== "boolean") {
      throw new TypeError("Candidato inválido.");
    }
    if (!person.active || !person.available) continue;
    const key = `${person.userId}:${person.roleId}`;
    const count = Number(person.recentAssignments ?? 0);
    if (!Number.isSafeInteger(count) || count < 0) throw new TypeError("Histórico inválido.");
    if (!scores.has(key) || count < scores.get(key).recentAssignments) scores.set(key, {...person,recentAssignments:count});
  }
  for (const req of requirements) {
    if (!Number.isSafeInteger(req.roleId) || req.roleId <= 0 ||
        !Number.isSafeInteger(req.slots) || req.slots < 0 || req.slots > 50 ||
        typeof req.isLeader !== "boolean") throw new TypeError("Formação inválida.");
    const occupied = chosen.filter(x => x.roleId === req.roleId && x.status !== "declined").length;
    const remaining = Math.max(0, req.slots - occupied);
    const ranked = [...scores.values()].filter(x => x.roleId === req.roleId && !keys.has(`${x.userId}:${x.roleId}`))
      .sort((a,b) => a.recentAssignments-b.recentAssignments || a.userId-b.userId);
    for (const person of ranked) {
      if (chosen.filter(x => x.roleId === req.roleId && x.status !== "declined").length >= req.slots) break;
      if (req.isLeader && chosen.some(x => x.isLeader && x.status !== "declined")) break;
      const suggestion = {userId:person.userId,roleId:req.roleId,isLeader:req.isLeader,status:"proposed"};
      chosen.push(suggestion);
      keys.add(`${person.userId}:${req.roleId}`);
    }
  }
  return chosen.slice(existing.length);
}
