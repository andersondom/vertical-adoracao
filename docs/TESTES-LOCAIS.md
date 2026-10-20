# Testes locais e dados sintéticos

O pipeline cria D1 **local**, aplica migrations 0001 e 0002, insere dados fictícios e executa testes.

```sh
npm ci
npm run db:local
npm run seed:local
RUN_D1_INTEGRATION=1 npm test
```

As contas de teste possuem hashes deliberadamente inválidos e não podem ser utilizadas para login. Não utilizar `seed-local.sql` em staging/produção.

## Limitação de segurança

O limite de login é por combinação de email e IP (hash SHA-256). É proteção básica, não substitui controles por IP global, WAF, CAPTCHA e monitoramento. A origem de IP só é confiável quando recebida do cabeçalho CF-Connecting-IP inserido pela Cloudflare; não confiar em IP informado pelo cliente.

**Migração remota pendente:** a migration 0002 é necessária para a nova funcionalidade de login. Não integrar nem publicar esta branch em produção até aprovar o plano de migração e executar em staging.
