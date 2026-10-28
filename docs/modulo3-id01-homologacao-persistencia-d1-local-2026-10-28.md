# Vertical Adoração — Homologação ID01: persistência real no D1 local

**Data de registro:** 2026-10-28  
**Branch:** `feat/modulo3-presencas-indicadores`  
**Situação:** APROVADO por resultado informado pelo responsável (4/4 verificações).  
**Ambiente:** D1 local isolado, persistência em `$env:TEMP/vertical-adoracao-d1-integracao`.

## Evidências e limites

O responsável informou que a fixture ID01 retornou `USERS=2`, `EVENT=1` e `ASSIGNMENT=1`. Em seguida, informou que os quatro checks do executor de persistência real retornaram `true`. A saída bruta do terminal não foi compartilhada; este registro não representa uma inspeção independente de logs ou do banco.

## Resultado declarado

| Verificação | Resultado informado |
| --- | --- |
| `saveAttendance` retornou sucesso sem correção | APROVADO |
| `event_attendance` persistiu presença e ator | APROVADO |
| `event_attendance_history` persistiu transição e ator | APROVADO |
| `audit_log` ganhou um registro `ATTENDANCE_RECORDED` | APROVADO |

## Artefatos

- `scripts/id01-fixture-local.sql`: usuários fictícios, evento e escala.
- `scripts/id01-worker.js`: executor que chama a função real `saveAttendance` e consulta os resultados.
- `scripts/id01.wrangler.jsonc`: configuração separada para o executor local.

## Segurança e escopo

Não houve autorização para deploy, merge, migração remota ou alteração de produção. O teste foi planejado e executado pelo responsável apenas no D1 local isolado, segundo o relato. O executor deve permanecer encerrado após a homologação.

## Próxima etapa

ID02 — testar correção de presença com preservação do status anterior, motivo, ator e auditoria. Antes de executar, preparar executor com fixture isolada e verificação do estado inicial, sem sobrescrever a evidência ID01.
