# Homologação isolada — preparação

**Estado:** modelo de configuração preparado; nenhum recurso Cloudflare criado.

O arquivo `wrangler.staging.example.jsonc` é um **exemplo não executável** até que um banco D1 exclusivo seja criado e seu ID seja preenchido. Nunca utilizar o ID de produção.

## Pré-condições

1. Criar banco `louvor-staging` na Cloudflare, com autorização separada para provisionamento.
2. Copiar o modelo para uma configuração de staging (não substituir `wrangler.jsonc` de produção).
3. Conferir manualmente que os identificadores D1 de staging e produção são diferentes.
4. Aplicar migrações no ambiente local primeiro; somente depois, no staging explicitamente selecionado.
5. Popular staging com dados sintéticos reproduzíveis (gerador ainda pendente).
6. Executar testes funcionais e de permissões; não publicar produção.

## Segurança

- Não colocar tokens nem segredos no Git.
- Nunca importar dados pessoais reais para homologação.
- Não rodar `npm run db:remote` sem validar o destino: o script atual referencia a configuração padrão.
- O pipeline CI realiza apenas compilação seca (`--dry-run`) e testes, sem acesso remoto ao D1.

## Pendências do Módulo 1

Testes D1 local e de integração, dados sintéticos completos, rate limiting no login, controles de segurança adicionais e rastreabilidade de requisitos.
