export function monthInBrazil(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = Number(parts.find(p => p.type === "year").value);
  const month = Number(parts.find(p => p.type === "month").value);
  return { year, month, key: year + "-" + String(month).padStart(2, "0") };
}
export function standardServices({year,month}) {
  const events = [];
  const last = new Date(Date.UTC(year,month,0)).getUTCDate();
  for (let day=1;day<=last;day++) {
    const weekday = new Date(Date.UTC(year,month-1,day)).getUTCDay();
    if (weekday === 0 || weekday === 3) {
      events.push({date: year+"-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0"),code:weekday===0?"D":"Q"});
    }
  }
  return events;
}
