export async function getData(env, user) {
  const settings = await env.DB.prepare(
    "SELECT month_label,availability_open FROM schedule_settings WHERE id=1"
  ).first();

  const events = await env.DB.prepare(
    `SELECT e.id,e.event_date,e.day_code,e.title,e.icon,
            a.user_id AS assigned_user_id,u.name AS assigned_name
     FROM events e
     LEFT JOIN assignments a ON a.event_id=e.id
     LEFT JOIN users u ON u.id=a.user_id
     ORDER BY e.event_date`
  ).all();

  const ownAvailability = await env.DB.prepare(
    "SELECT event_id,available FROM availability WHERE user_id=?"
  ).bind(user.id).all();

  let members = [];
  let allAvailability = [];

  if (user.role === "admin") {
    members = (await env.DB.prepare(
      "SELECT id,name,email,role,active FROM users ORDER BY name"
    ).all()).results;

    allAvailability = (await env.DB.prepare(
      `SELECT av.event_id,av.user_id,av.available,u.name
       FROM availability av
       JOIN users u ON u.id=av.user_id
       WHERE av.available=1
       ORDER BY u.name`
    ).all()).results;
  }

  const roles = (await env.DB.prepare(
    "SELECT id,code,label,active FROM ministry_roles ORDER BY id"
  ).all()).results;
  const ownRoles = (await env.DB.prepare(
    "SELECT role_id FROM member_roles WHERE user_id=?"
  ).bind(user.id).all()).results;
  let memberRoles = [];
  let requirements = [];
  let teamAssignments = [];
  if (user.role === "admin") {
    memberRoles = (await env.DB.prepare(
      "SELECT mr.user_id,mr.role_id FROM member_roles mr JOIN users u ON u.id=mr.user_id ORDER BY mr.user_id,mr.role_id"
    ).all()).results;
    requirements = (await env.DB.prepare(
      "SELECT event_id,role_id,slots FROM event_role_requirements ORDER BY event_id,role_id"
    ).all()).results;
    teamAssignments = (await env.DB.prepare(
      "SELECT event_id,user_id,role_id,status,is_leader FROM team_assignments ORDER BY event_id,user_id,role_id"
    ).all()).results;
  } else {
    teamAssignments = (await env.DB.prepare(
      "SELECT event_id,user_id,role_id,status,is_leader FROM team_assignments WHERE user_id=? ORDER BY event_id,role_id"
    ).bind(user.id).all()).results;
  }

  return {
    roles,
    ownRoles,
    memberRoles,
    requirements,
    teamAssignments,
    settings,
    events: events.results,
    ownAvailability: ownAvailability.results,
    members,
    allAvailability
  };
}
