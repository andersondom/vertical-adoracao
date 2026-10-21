# Módulo 1 — checklist de validação

| Item | Estado | Evidência |
|---|---|---|
| CI em push e PR | Implementado | .github/workflows/ci.yml |
| Testes básicos de autenticação/autorização | Implementado | tests/api-security.test.js; tests/permissions.integration.test.js |
| Controle de origem para mutações | Implementado | src/auth/request-security.js |
| Limite básico de login | Implementado | src/auth/login-rate-limit.js |
| Migração versionada | Implementado | migrations/0002_login_attempts.sql |
| Validação das migrações em D1 local | Implementado | tests/migrations-local.integration.test.js |
| Dados fictícios locais | Implementado | scripts/seed-local.sql |
| Configuração de staging separada | Modelo validado | wrangler.staging.example.jsonc; scripts/verify-staging-config.mjs |
| Banco de staging remoto isolado | Pendente | Exige autorização de provisionamento |
| Testes completos de API e regras RF-01 a RF-109 | Pendente | Cobertura incremental nos módulos funcionais |
| Política de proteção da main | Pendente | Requer configuração administrativa |
| Backup/restauração testados | Pendente | Requer ambiente isolado |
| Migração 0002 aplicada em produção | NÃO | Proibida sem aprovação explícita |
| Merge e publicação | NÃO | PR em rascunho |

## Critério de avanço

Antes de qualquer merge ou implantação: CI verde, revisão do PR, migração 0002 validada em staging isolado, avaliação de segurança e autorização explícita do usuário.

**O Módulo 1 não está homologado para produção enquanto existirem pendências acima.**

## Correção de instabilidade CI

Os testes que executam Wrangler D1 local compartilham um banco SQLite. A execução paralela de arquivos de teste pode provocar `SQLITE_BUSY`; por isso, `npm test` executa os arquivos sequencialmente (`--test-concurrency=1`). A correção não modifica o banco remoto.
