# Provisionamento autorizado — Cloudflare staging

**Autorização:** criação de Worker staging e banco D1 exclusivos; nenhuma alteração na produção, nenhum merge.

**Estado:** pendente de execução por operador autenticado na conta Cloudflare. Não há conexão Cloudflare disponível neste ambiente de execução. Nenhum recurso remoto foi criado.

## 1. Preparação local

```sh
npm ci
npm run db:local
npm run seed:local
npm test
npx wrangler whoami
```

O comando `whoami` deve confirmar a conta Cloudflare correta. Não cole tokens, senhas ou chaves no chat.

## 2. Criar banco de homologação

```sh
npx wrangler d1 create louvor-staging
```

Copie `wrangler.staging.example.jsonc` para `wrangler.staging.jsonc` (arquivo de trabalho local). Preencha **somente** o ID retornado para `louvor-staging`. Nunca copie o ID do banco de produção. Não altere `wrangler.jsonc`.

```sh
node scripts/verify-staging-target.mjs wrangler.staging.jsonc
```

**Interrompa o procedimento se a verificação falhar.** Faça uma segunda conferência visual do ID no painel Cloudflare.

## 3. Migrações exclusivas de staging

Somente após a verificação anterior:

```sh
npx wrangler d1 migrations apply louvor-staging --remote --config wrangler.staging.jsonc
```

O argumento `--remote` atua no D1 indicado pela configuração **staging**, e não na configuração padrão. Não execute `npm run db:remote`.

## 4. Dados fictícios exclusivos

```sh
npx wrangler d1 execute louvor-staging --remote --config wrangler.staging.jsonc --file scripts/seed-local.sql
```

O seed usa usuários de domínio `exemplo.invalid` e hashes de senha intencionalmente inválidos; eles não permitem login. Para testar autenticação, cadastre contas fictícias no staging pela interface de bootstrap e admin, sem reutilizar credenciais reais.

## 5. Publicação exclusivamente staging

```sh
node scripts/verify-staging-target.mjs wrangler.staging.jsonc
npx wrangler deploy --config wrangler.staging.jsonc
```

Antes do deploy, confira no terminal que o nome do Worker é `ministerio-louvor-staging` e o D1 é `louvor-staging`. Nunca execute `npm run deploy` neste procedimento.

## 6. Roteiro de homologação

1. Confirmar que `/api/bootstrap-status` retorna o estado esperado.
2. Criar administrador fictício **apenas se a base de staging estiver vazia**. Se o seed já foi aplicado, o bootstrap estará indisponível: nesse caso, recrie um D1 staging limpo com autorização específica ou prepare um seed de contas com hash válido, sem tocar produção.
3. Validar login correto e incorreto, limite de tentativas, logout e expiração.
4. Validar bloqueio de rotas administrativas para integrante comum e proteção de origem.
5. Validar criação de evento, disponibilidade, administração e logs de auditoria.
6. Verificar integridade de migrações `0001` e `0002`, registrar resultados.
7. Fazer backup/exportação do banco staging, testar restauração **somente em outro banco de teste**, nunca em produção.

## 7. Critério de aprovação

Registrar data, commit, URL staging, ID do D1 staging (não é segredo, mas não precisa publicar), resultados dos testes, evidências de backup/restauração e responsáveis. Não realizar merge ou publicar produção sem nova autorização.

**Atenção:** o seed local não é compatível com teste de bootstrap em banco vazio. Escolha a ordem de testes antes de popular a base.
