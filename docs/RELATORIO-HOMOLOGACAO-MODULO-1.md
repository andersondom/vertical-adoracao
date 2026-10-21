# Vertical Adoração — Relatório de homologação do Módulo 1

**Situação:** homologação funcional encerrada e aprovada no staging, com ressalvas técnicas descritas abaixo.  
**Período de execução:** 20–21/10/2026  
**Ambiente:** Worker `ministerio-louvor-staging` e D1 `louvor-staging` (isolados)  
**Branch:** `feature/modulo-1-fundacao-seguranca`  
**Pull request:** https://github.com/andersondom/vertical-adoracao/pull/1  
**Produção:** não alterada; sem merge na `main` ou deploy de produção.

## Homologação funcional — testes 1 a 20

| Teste | Verificação | Resultado |
|---|---|---|
| 1 | Cadastro inicial do administrador | Aprovado |
| 2 | Login do administrador | Aprovado |
| 3 | Logout e exigência de nova autenticação | Aprovado |
| 4 | Bloqueio após cinco tentativas incorretas | Aprovado |
| 5 | Liberação após quinze minutos | Aprovado |
| 6 | Cadastro e login de integrante comum | Aprovado |
| 7 | Restrições administrativas na interface | Aprovado |
| 8 | Bloqueio de API administrativa para integrante | Aprovado; mensagem «Acesso negado», HTTP não informado |
| 9 | Desativação e bloqueio de novo login | Aprovado |
| 10 | Revogação de sessão ativa após desativação | Aprovado |
| 11 | Autodesativação indisponível na interface | Aprovado; API também coberta por teste automatizado |
| 12 | Cadastro e persistência de evento | Aprovado após correção do botão |
| 13 | Marcação e persistência de disponibilidade; visualização pelo administrador | Aprovado |
| 14 | Escalação oficial persistida e visível ao integrante | Aprovado |
| 15 | Fechamento e reabertura da janela de disponibilidade | Aprovado |
| 16 | Bloqueio de alteração de disponibilidade via API | Aprovado no cenário com evento real ID 13; HTTP 403 e dados preservados; mensagem não capturada |
| 17 | Existência e cobertura observada da auditoria | Aprovado quanto aos nove tipos de ação observados |
| 18 | Exportação e validação preliminar do backup | Aprovado |
| 19 | Restauração isolada do backup em SQLite local | Aprovado; `PRAGMA integrity_check = ok`, nove tabelas |
| 20 | Comparação de contagens de registros nas nove tabelas | Aprovado; nenhuma divergência |

**Origem das evidências:** resultados reportados pelo responsável durante execução manual no staging; testes automatizados e CI indicados adiante. Nenhuma execução em produção foi realizada como parte deste encerramento.

## Auditoria — teste 17

Consulta agregada de `audit_log` fornecida pelo responsável, sem nomes, e-mails ou detalhes pessoais:

| Ação | Quantidade |
|---|---:|
| `BOOTSTRAP_ADMIN` | 1 |
| `LOGIN` | 7 |
| `USER_CREATE` | 1 |
| `USER_STATE` | 4 |
| `PASSWORD_RESET_BY_ADMIN` | 1 |
| `EVENT_CREATE` | 1 |
| `ASSIGNMENT_UPDATE` | 1 |
| `AVAILABILITY_UPDATE` | 2 |
| `AVAILABILITY_WINDOW` | 3 |
| **Total** | **21** |

A cobertura foi observada para nove tipos de ação. Não foi realizada validação detalhada de cada entrada, retenção ou resistência à adulteração.

## Backup e recuperação — testes 18 a 20

- Exportação do banco `louvor-staging` para `backup-staging-modulo1.sql`: sucesso reportado.
- Arquivo não vazio; hash SHA-256 calculado; instruções `CREATE TABLE` e `INSERT INTO` presentes. O valor do hash não foi anexado ao relatório.
- Restauração em `restauracao-teste-modulo1.db`, banco local independente: sucesso reportado.
- Integridade SQLite: `ok`; nove tabelas.
- Contagem de linhas: nove tabelas com quantidades iguais entre SQL exportado reconstruído em memória e banco restaurado.
- A comparação de contagens não constitui comparação campo a campo; o backup não deve ser incluído no repositório por conter dados potencialmente sensíveis.

## Incidentes e correções

1. **Bootstrap/PBKDF2:** no staging, 210.000 iterações excederam o limite observado no runtime; ajuste para 100.000 iterações no commit `b589860`, com teste de regressão e confirmação funcional posterior.
2. **Botão Adicionar evento:** conflito entre `createEvent()` e método nativo do navegador `Document.createEvent`. Função e chamada renomeadas para `createScheduleEvent()`, com teste automatizado de regressão no commit `b8402b2ce958a7ae031c6d691e1787ced1a0acc5`. O responsável confirmou cadastro e persistência do evento após deploy no staging.

## Testes automatizados

- Proteção contra autodesativação: `tests/self-deactivation.test.js`; GitHub Actions https://github.com/andersondom/vertical-adoracao/actions/runs/39471715735 — sucesso.
- Regressão do botão de evento: `tests/event-button.test.js`; GitHub Actions https://github.com/andersondom/vertical-adoracao/actions/runs/39480431726 — sucesso para o commit `b8402b2`.
- A presente atualização documental não implica nova validação de deploy nem execução de testes de produção.

## Ressalvas e critérios de encerramento

A homologação **funcional** está encerrada e aprovada para o escopo exercitado no staging, com os 20 testes reportados. Permanecem fora do alcance dessa aprovação: verificação da expiração natural de sessão, teste amplo de segurança/invasão, prova de que o HTTP 403 do teste 16 decorreu especificamente da janela fechada (corpo da resposta não informado), integridade de cada campo do backup, validação de restauração em D1 remoto e políticas de retenção/imutabilidade de auditoria.

Essas limitações devem ser consideradas em eventual decisão futura de produção. **Não há autorização de merge, deploy ou qualquer alteração em produção.** O PR permanece sujeito a revisão e aprovação específica antes de qualquer promoção.

**Encerramento formal:** 21/10/2026 — homologação funcional do Módulo 1 concluída no staging, com aprovação reportada pelo responsável e ressalvas técnicas expressas.
