// Cálculo puro e determinístico dos indicadores de participação.
export function calculateParticipation(rows) {
  const commitments = new Map();
  const events = new Set();
  let functions = 0;

  for (const row of rows) {
    if (!['confirmed', 'reserved'].includes(row.assignment_status)) continue;
    const key = String(row.event_id) + ':' + String(row.user_id);
    events.add(row.event_id);
    functions++;
    const existing = commitments.get(key);
    if (!existing) {
      commitments.set(key, {
        closed: row.closure_status === 'closed',
        status: row.attendance_status || null
      });
    } else if (existing.closed !== (row.closure_status === 'closed') ||
               existing.status !== (row.attendance_status || null)) {
      // Dados conflitantes para um mesmo integrante/evento não são contados como presença.
      commitments.set(key, {closed:false,status:null});
    }
  }

  let presences = 0;
  let justifiedAbsences = 0;
  let unjustifiedAbsences = 0;
  let pending = 0;
  for (const entry of commitments.values()) {
    if (!entry.closed || !entry.status) { pending++; continue; }
    if (entry.status === 'present') presences++;
    else if (entry.status === 'absent_justified') justifiedAbsences++;
    else if (entry.status === 'absent_unjustified') unjustifiedAbsences++;
    else pending++;
  }
  const finalized = presences + justifiedAbsences + unjustifiedAbsences;
  return {
    events: events.size,
    commitments: commitments.size,
    functions,
    presences,
    justifiedAbsences,
    unjustifiedAbsences,
    pending,
    attendanceRate: finalized ? Number((presences * 100 / finalized).toFixed(2)) : null
  };
}
