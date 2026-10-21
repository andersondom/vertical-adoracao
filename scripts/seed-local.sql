-- Dados inteiramente ficticios; executar SOMENTE em D1 local de teste.
INSERT OR IGNORE INTO users(name,email,password_hash,password_salt,role,active)
VALUES
('Teste Integrante','integrante.test@exemplo.invalid','TEST_ONLY_NOT_A_REAL_HASH','TEST_ONLY','member',1),
('Teste Administrador','admin.test@exemplo.invalid','TEST_ONLY_NOT_A_REAL_HASH','TEST_ONLY','admin',1);
INSERT OR IGNORE INTO events(event_date,day_code,title,icon)
VALUES ('2027-01-10','D','Culto de teste','🎶');
INSERT OR IGNORE INTO availability(event_id,user_id,available)
SELECT e.id,u.id,1 FROM events e CROSS JOIN users u
WHERE e.event_date='2027-01-10' AND u.email='integrante.test@exemplo.invalid';
