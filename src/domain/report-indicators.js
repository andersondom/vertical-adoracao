// Funções puras: compromisso e presença são conceitos distintos.
export function calculateParticipation(rows) {
  const events = new Set();
  const commitments = new Set();
  const presences = new Set();
  const justified = new Set();
  const unjustified = new Set();
  const pending = new Set();
  let functions = 0;
  for (const row of rows) {
    const key = String(row.event_id) + ':' + String(row.user_id);
    events.add(row.event_id);
    // Cada papel conta como função, mas um evento por integrante conta uma única vez.
    if (row.assignment_status === 'confirmed' || row.assignment_status === 'reserved') {
      functions += 1;
      commitments.add(key);
      if (row.closure_status !== 'closed') pending.add(key);
      else if (row.attendance_status === 'present') presences.add(key);
      else if (row.attendance_status === 'absent_justified') justified.add(key);
      else if (row.attendance_status === 'absent_unjustified') unjustified.add(key);
      else pending.add(key);
    }
  }
  const finalized = [...commitments].filter(k => !pending.has(k));
  const attended = finalized.filter(k => presences.has(k)).length;
  return {
    events: events.size,
    commitments: commitments.size,
    functions,
    presences: attended,
    justifiedAbsences: finalized.filter(k => justified.has(k)).length,
    unjustifiedAbsences: finalized.filter(k => unjustified.has(k)).length,
    pending: pending.size,
    attendanceRate: finalized.length ? Number((attended * 100 / finalized.length).toFixed(2)) : null
  };
}
