# Cloudflare — homologação isolada

## Recursos confirmados pelo responsável
- Account ID: `6ccd7d1ad5bacea7eefe1d2a4e82eccc`
- Worker: `ministerio-louvor-staging`
- Banco D1: `louvor-staging`
- Database ID: `a5a48f44-69dd-4040-ba03-25b36197a07b`
- Produção permanece no Worker `ministerio-louvor` e no D1 `louvor-db`.

## Configuração segura
O arquivo `wrangler.staging.jsonc` permanece ignorado pelo Git. O script
`node scripts/prepare-staging-config.mjs` gera esse arquivo a partir do
modelo versionado, verificando que os nomes e o ID D1 diferem da produção.

O CI executa testes e `wrangler deploy --config wrangler.staging.jsonc --dry-run`.
Não existe publicação remota automática neste fluxo.

## Próximas verificações antes de qualquer publicação
1. Confirmar no painel Cloudflare que o binding `DB` do Worker de homologação aponta para `louvor-staging`.
2. Conferir quais variáveis e secrets o Worker de homologação exige e se estão presentes, sem copiá-los para o Git.
3. Preparar backup do D1 de homologação antes de migrações remotas.
4. Confirmar domínio/URL do Worker de homologação e testar login com conta de testes.
5. Solicitar aprovação explícita antes de executar deploy ou migrações remotas.

Nunca apontar `wrangler.staging.jsonc` para o ID do banco de produção.
