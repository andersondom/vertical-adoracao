# ID01 — Pré-verificação do esquema D1 local (somente leitura)

**Estado:** ID00 aprovado pelo responsável; ID01 aguardando verificação do esquema e preparação de fixture fictícia.

## Objetivo

Validar persistência de presença, histórico e auditoria usando o D1 local isolado. Antes de escrever fixtures, conferir as definições reais das tabelas para respeitar chaves estrangeiras, campos obrigatórios e índices.

## Execução segura no PowerShell

Execute na raiz do repositório:

```powershell
$env:VERTICAL_D1_TEST_DIR = Join-Path $env:TEMP 'vertical-adoracao-d1-integracao'
npx.cmd wrangler d1 execute louvor-db --local --persist-to $env:VERTICAL_D1_TEST_DIR --command "SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('users','events','ministry_roles','member_roles','availability','team_assignments','event_attendance','event_attendance_history','audit_log','event_attendance_closures') ORDER BY name;"
```

O comando consulta metadados de esquema e **não altera registros**. Use exatamente o mesmo `--persist-to` empregado em ID00.

## Critérios antes da fixture

- Confirmar existência e colunas obrigatórias das tabelas.
- Definir usuário administrador, líder, integrante e evento **fictícios**, com IDs obtidos após inserção.
- Criar escala ativa e elegibilidade respeitando constraints.
- Executar registro por função da aplicação, evitando inserir diretamente em `event_attendance`, para exercitar histórico e auditoria.
- Conferir três tabelas após a escrita e ausência de alterações fora do evento de teste.
- Registrar a evidência e remover somente os dados identificados como fixture, sem apagar o banco ou registros preexistentes.

**Proibido:** `--remote`, `wrangler deploy`, merge ou uso de dados de produção.
