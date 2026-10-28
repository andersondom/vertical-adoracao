-- ID01: fixture exclusivamente para D1 local isolado.
-- NUNCA executar com --remote. Não contém registros de presença: estes devem
-- ser produzidos pela função saveAttendance da aplicação.
-- Prefixo exclusivo ID01; inserções idempotentes.
INSERT OR IGNORE INTO users(name,email,password_hash,password_salt,role,active)
VALUES
 ('ID01 Admin Teste','id01-admin@vertical.invalid','NOT_A_LOGIN_HASH','ID01_ONLY','admin',1),
 ('ID01 Integrante Teste','id01-integrante@vertical.invalid','NOT_A_LOGIN_HASH','ID01_ONLY','member',1);

INSERT OR IGNORE INTO events(event_date,day_code,title,icon)
VALUES ('2099-01-11','D','ID01 TESTE LOCAL','T');

-- Só cria escala se já existir papel válido em ministry_roles.
-- A verificação posterior precisa confirmar que uma linha foi criada.
INSERT OR IGNORE INTO team_assignments(event_id,user_id,role_id,status,is_leader)
SELECT e.id,u.id,r.id,'confirmed',0
FROM events e
JOIN users u ON u.email='id01-integrante@vertical.invalid'
JOIN ministry_roles r ON r.id=(SELECT MIN(id) FROM ministry_roles)
WHERE e.event_date='2099-01-11';

SELECT 'USERS' AS item,COUNT(*) AS total FROM users WHERE email IN ('id01-admin@vertical.invalid','id01-integrante@vertical.invalid')
UNION ALL SELECT 'EVENT',COUNT(*) FROM events WHERE event_date='2099-01-11'
UNION ALL SELECT 'ASSIGNMENT',COUNT(*) FROM team_assignments ta JOIN events e ON e.id=ta.event_id JOIN users u ON u.id=ta.user_id WHERE e.event_date='2099-01-11' AND u.email='id01-integrante@vertical.invalid' AND ta.status='confirmed';
