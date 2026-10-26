# Módulo 2 — Escalas, disponibilidade e formação de equipes

**Estado:** planejamento técnico inicial em branch isolada; nenhuma implementação de regras de negócio homologada neste módulo.

## Ponto de partida

O Módulo 1 foi homologado funcionalmente no staging, integrado à `main` pelo PR #1 e possui relatório em `docs/RELATORIO-HOMOLOGACAO-MODULO-1.md`. A produção não recebeu automaticamente essa integração.

## Decisões funcionais já confirmadas

- Disponibilidade geral de integrantes, com registro individual.
- Um integrante pode exercer múltiplas funções (tocar, cantar e liderar).
- Sugestão automática de escala, priorizando integrantes disponíveis.
- Um líder por evento, com reserva e aprovação.
- Equipe sugerida automaticamente para revisão administrativa.
- Formação da equipe configurável por evento.
- Possibilidade de múltiplas funções por integrante no mesmo evento.
- Confirmação individual da escalação.
- Indisponibilidade posterior e solicitação de substituição.
- Publicação da escala em imagem e PDF.
- Mínimo de intervenções manuais e testes automatizados.

Estas decisões são diretrizes de produto, não declaração de funcionalidades já implementadas.

## Etapas de execução

1. Inventariar o esquema D1 e as rotas atuais para identificar o que já existe e preservar compatibilidade.
2. Definir regras de domínio e migrações incrementais para funções, equipes, sugestões, confirmações e substituições.
3. Implementar API e autorização com testes automatizados por requisito.
4. Implementar interface de administrador e integrante.
5. Exercitar testes locais e CI, sem acesso a bancos remotos.
6. Homologar no staging isolado, com dados fictícios e autorização de publicação nesse ambiente.
7. Registrar resultados e abrir PR para revisão; merge e produção somente com autorização específica.

## Critérios de segurança e qualidade

- Não modificar `wrangler.jsonc` de produção, `louvor-db` ou Worker `ministerio-louvor`.
- Não executar `npm run deploy` ou `npm run db:remote`.
- Migrações reversíveis quando viável, backup antes de qualquer mudança remota autorizada.
- Toda alteração de disponibilidade, escala, liderança, confirmação ou substituição deve respeitar permissões e produzir auditoria apropriada.
- Impedir escalações conflitantes e exigir exatamente um líder por evento publicado, conforme regras de negócio a detalhar.
- Nenhum dado sensível ou backup deve entrar no GitHub.
- Validação automática na branch e homologação manual dirigida apenas quando indispensável.

## Pendências antes de produção

- Acompanhar a CI pós-merge do Módulo 1.
- Planejar aplicação da migração 0002 e implantação de Módulo 1 em produção, com verificação de backup e rollback, **sem executar** antes de autorização explícita.
- Corrigir documentação desatualizada sobre staging e iterações PBKDF2 em alteração documental controlada.
