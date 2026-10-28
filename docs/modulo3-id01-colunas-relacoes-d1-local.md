# ID01 — Conferência das colunas e relações no D1 isolado

**Estado:** sete tabelas confirmadas pelo responsável; detalhes de colunas e chaves ainda não fornecidos. A gravação real do ID01 **não foi executada**.

## Executar no PowerShell

Na raiz do repositório, após atualizar a branch:

```powershell
$env:VERTICAL_D1_TEST_DIR = Join-Path $env:TEMP 'vertical-adoracao-d1-integracao'
npx.cmd wrangler d1 execute louvor-db --local --persist-to $env:VERTICAL_D1_TEST_DIR --command "SELECT m.name AS tabela, p.cid AS posicao, p.name AS coluna, p.type AS tipo, p.notnull AS obrigatoria, p.dflt_value AS padrao, p.pk AS chave_primaria FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type='table' AND m.name IN ('users','events','team_assignments','event_attendance','event_attendance_history','audit_log','event_attendance_closures') ORDER BY m.name,p.cid;"
```

Em seguida:

```powershell
npx.cmd wrangler d1 execute louvor-db --local --persist-to $env:VERTICAL_D1_TEST_DIR --command "SELECT m.name AS tabela, f.id AS grupo_fk, f.seq AS sequencia, f.\"table\" AS referencia, f.\"from\" AS coluna, f.\"to\" AS coluna_referenciada FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) f WHERE m.type='table' AND m.name IN ('users','events','team_assignments','event_attendance','event_attendance_history','audit_log','event_attendance_closures') ORDER BY m.name,f.id,f.seq;"
```

**Observação:** a segunda consulta usa aspas escapadas para campos com nomes especiais. Se o PowerShell ou Wrangler rejeitar o escape, interromper e compartilhar o erro; não improvisar gravações.

## Segurança

Ambos os comandos são apenas `SELECT`, operam com `--local` e reutilizam o diretório `--persist-to` de ID00. Não fazem deploy, merge, migração remota nem alteração de dados.

## Critério para começar a escrita do ID01

Depois de obter o esquema: criar fixture fictícia isolada, executar `saveAttendance` contra o D1 local por meio do código da aplicação e conferir `event_attendance`, `event_attendance_history` e `audit_log`. A simples existência das tabelas não valida suas constraints nem a persistência.
