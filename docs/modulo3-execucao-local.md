# Execução local para homologação — Módulo 3

Este procedimento **não publica** o sistema e **não acessa o D1 remoto**.

## Preparação no VS Code (PowerShell)

Abra o terminal na pasta do repositório e execute:

```powershell
git fetch origin
git switch feat/modulo3-presencas-indicadores
git pull --ff-only origin feat/modulo3-presencas-indicadores
npm ci
npm run db:local
npm test
npm run dev
```

Abra a URL local exibida pelo Wrangler, normalmente `http://127.0.0.1:8787`. Mantenha o terminal aberto durante os testes.

**Atenção ao banco local:** `npm run db:local` aplica as migrações ao D1 local configurado pelo Wrangler. Não exclua a pasta `.wrangler/state` se quiser preservar dados locais já existentes. Para testes totalmente isolados, utilize um checkout separado do repositório e seu próprio diretório de estado local.

## Primeiro acesso

Se o banco local estiver vazio, a aplicação apresenta o cadastro do administrador inicial. Defina nome, e-mail válido e senha de pelo menos 8 caracteres; depois entre normalmente.

**Não execute `npm run seed:local` antes do primeiro cadastro.** O script `scripts/seed-local.sql` insere usuários fictícios com hashes de senha não utilizáveis. Além de impedir o cadastro inicial por deixar a tabela de usuários não vazia, esses usuários não podem fazer login com senha real. O seed é útil apenas em cenários específicos de teste automatizado.

Se o banco local já tiver usuários, use uma conta administrativa de desenvolvimento existente. Não reutilize credenciais reais de produção em um ambiente de teste.

## Homologação

Siga `docs/modulo3-homologacao-primeira-entrega.md` e registre os resultados H01–H14. Prepare eventos e integrantes fictícios pela interface administrativa, conforme as funcionalidades disponíveis.

Para parar o servidor, pressione `Ctrl+C` no terminal.

## Restrições

- **Não executar:** `npm run db:remote`, `npm run deploy` ou `wrangler deploy` sem `--dry-run`.
- Não mesclar o PR #15 na `main` antes da homologação.
- O sucesso do GitHub Actions não substitui os testes funcionais no navegador.
