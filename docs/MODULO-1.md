# Módulo 1 — Fundação e segurança

## Escopo e limites

Este PR entrega a primeira etapa da fundação: integração contínua, testes básicos de segurança da API e instruções para homologação isolada. Não altera o esquema D1, os dados remotos nem o ambiente de produção.

## Requisitos associados

- RF-110 a RF-114: evolução modular, testes e correção controlada.
- RF-115 e RF-116: migrações seguras e aprovação para produção; nenhuma migração remota ou publicação ocorre neste PR.
- RF-118 e RF-119: homologação isolada e dados sintéticos; provisionamento e gerador de cenários completos permanecem pendentes.
- RF-120 e RF-121: testes por requisitos e CI; esta entrega estabelece a base, não afirma cobertura integral.
- RF-122 e RF-123: branch, PR e documentação versionada.
- RF-127: segredos nunca devem ser enviados ao repositório.

## Pipeline

O GitHub Actions executa `npm ci`, `npm test` e valida a compilação do Worker com `wrangler deploy --dry-run`. O pipeline não publica o Worker e não executa comandos D1 remotos. Configurar proteção da branch principal e exigir aprovação dos checks antes do merge.

## Homologação isolada — procedimento futuro

1. Criar um banco D1 exclusivo para staging, diferente do banco de produção.
2. Configurar o identificador desse banco em configuração de ambiente separada, sem copiar credenciais de produção.
3. Aplicar migrações somente ao banco de staging, após validar backups e compatibilidade.
4. Gerar usuários e eventos sintéticos, sem dados pessoais reais.
5. Validar fluxos de autenticação, autorização, eventos e disponibilidade; ampliar cobertura progressivamente.
6. Exigir autorização explícita para qualquer publicação em produção.

**Atenção:** o staging ainda não foi provisionado. Não reutilizar o binding de produção para testes remotos.

## Próximas entregas deste módulo

- Testes de integração com D1 local, incluindo permissões e operações de escrita.
- Proteção contra CSRF, limitação de tentativas de login e validação rigorosa de entrada.
- Migrações incrementais, reversibilidade, backups e testes de compatibilidade.
- Ambiente de staging com banco separado e geração reproduzível de dados sintéticos.
- Matriz completa de rastreabilidade e critérios de qualidade antes de iniciar o Módulo 2.

## Comandos locais

```sh
npm ci
npm test
npx wrangler deploy --dry-run
```

O comando `npm run deploy` é reservado a publicação autorizada; `npm run db:remote` não deve ser executado sem identificar e autorizar o banco de destino.

## Etapa 3 — Integração local e controle de tentativas

Foram adicionados testes com D1 local, dados sintéticos e limitação de tentativas de login. A nova migration 0002 deve ser aplicada em staging antes de qualquer implantação; nenhuma operação D1 remota está incluída neste PR. Consulte docs/TESTES-LOCAIS.md.
