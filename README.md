# Ministério de Louvor — Cloudflare Workers + D1

Esta versão foi preparada para funcionar sem Supabase.

Arquitetura:

- Cloudflare Worker: aplicação e API
- Cloudflare D1: banco SQL baseado em SQLite
- GitHub: código-fonte
- Wrangler: desenvolvimento e publicação
- Autenticação própria: e-mail + senha, com PBKDF2-SHA256
- Sessões: cookie HttpOnly + Secure

## O que já está implementado

- primeiro acesso cria o administrador inicial;
- login individual por e-mail e senha;
- senha nunca é armazenada em texto;
- administrador cadastra integrantes;
- administrador pode criar outro administrador;
- administrador pode desativar/reativar contas;
- administrador pode redefinir senha;
- integrante altera apenas a própria disponibilidade;
- administrador vê a disponibilidade de todos;
- administrador define o responsável oficial;
- período de disponibilidade pode ser fechado/reaberto;
- criação de novos eventos pela interface;
- escala inicial de setembro de 2026;
- registro básico de auditoria.

## 1. Instalar dependências

No terminal do Codespaces:

```bash
npm install
```

## 2. Fazer login na Cloudflare

```bash
npx wrangler login
```

O navegador abrirá para autorizar a conta.

## 3. Criar o banco D1

```bash
npx wrangler d1 create louvor-db
```

O comando retornará algo semelhante a:

```text
database_name = "louvor-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copie o `database_id`.

Abra `wrangler.jsonc` e substitua:

```text
SUBSTITUA_PELO_ID_DO_D1
```

pelo ID recebido.

## 4. Criar as tabelas

Banco remoto:

```bash
npm run db:remote
```

Para testar localmente:

```bash
npm run db:local
```

## 5. Rodar no Codespaces

```bash
npm run dev
```

Abra a porta indicada pelo Wrangler.

No primeiro acesso aparecerá:

```text
👑 Primeiro acesso
```

Cadastre o administrador inicial com nome, e-mail e senha.

A senha deve ter pelo menos 8 caracteres.

## 6. Publicar gratuitamente

```bash
npm run deploy
```

Ao final, o Wrangler mostrará o endereço público do Worker, semelhante a:

```text
https://ministerio-louvor.SEUSUBDOMINIO.workers.dev
```

Esse é o link que poderá ser compartilhado no WhatsApp.

## Segurança

As senhas são processadas com PBKDF2-SHA256, salt aleatório e 210.000 iterações.

Cada login cria uma sessão aleatória armazenada no D1. O navegador recebe somente o ID da sessão em um cookie:

- HttpOnly
- Secure
- SameSite=Lax

Integrantes não possuem endpoint para consultar as disponibilidades de terceiros.

Somente administradores recebem a lista completa de integrantes e disponibilidades.

## Observação importante sobre custo

O projeto foi desenhado para permanecer dentro da camada gratuita do Cloudflare para um uso pequeno como uma escala de ministério. Antes de colocar dados reais, confira os limites atuais da conta Cloudflare e evite habilitar produtos pagos desnecessários.

## Setembro de 2026

A migração inicial já cria:

- 02 – Q
- 06 – D
- 09 – Q
- 12 – S – Rede Atos
- 13 – D
- 16 – Q
- 19 – S
- 20 – D
- 23 – Q
- 25 – Sx – Festa dos Tabernáculos
- 26 – S – Festa dos Tabernáculos
- 27 – D – Festa dos Tabernáculos
- 30 – Q

Depois do primeiro login, use a área **Integrantes** para cadastrar as demais pessoas e a área **Escala** para selecionar os responsáveis.
