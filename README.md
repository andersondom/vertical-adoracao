# 🎶 Vertical Adoração

Sistema web para **gestão de escalas e disponibilidade de integrantes de um Ministério de Louvor**, desenvolvido com arquitetura serverless utilizando **JavaScript, Cloudflare Workers e Cloudflare D1**.

O projeto permite organizar integrantes, disponibilidades e responsáveis por cada evento da escala, com autenticação individual e diferentes níveis de acesso para administradores e membros.

---

## 🎯 Objetivo

O Vertical Adoração foi desenvolvido para substituir processos manuais de organização de escalas por uma aplicação web simples, centralizada e acessível pelo navegador.

Cada integrante pode informar sua própria disponibilidade, enquanto os administradores possuem recursos para gerenciar usuários, eventos, disponibilidades e responsáveis pela escala.

---

## ✨ Funcionalidades

### 👤 Integrantes

- login individual por e-mail e senha;
- visualização da própria disponibilidade;
- alteração da disponibilidade para cada evento;
- acesso restrito às informações permitidas ao integrante.

### 👑 Administradores

- criação do administrador inicial no primeiro acesso;
- cadastro de integrantes;
- criação de outros administradores;
- ativação e desativação de contas;
- redefinição de senhas;
- visualização das disponibilidades dos integrantes;
- definição do responsável oficial por evento;
- abertura e fechamento do período de disponibilidade;
- criação de novos eventos;
- registro de operações administrativas em log de auditoria.

---

## 🏗️ Arquitetura

A aplicação utiliza uma arquitetura serverless.

```text
Navegador
    │
    ▼
Cloudflare Worker
    │
    ├── Interface Web
    │
    ├── API
    │
    ├── Autenticação
    │
    └── Regras de autorização
    │
    ▼
Cloudflare D1
    │
    ├── Usuários
    ├── Sessões
    ├── Eventos
    ├── Disponibilidades
    ├── Escalas
    └── Auditoria
```

O Cloudflare Worker funciona como ponto de entrada da aplicação, atendendo tanto a interface web quanto as requisições da API.

O Cloudflare D1 fornece a persistência SQL da aplicação.

---

## 📂 Organização do código

```text
src/
├── index.js
│
├── api/
│   └── router.js
│
├── auth/
│   ├── authorization.js
│   ├── cookies.js
│   ├── crypto.js
│   └── session.js
│
├── db/
│   ├── audit.js
│   └── schedule.js
│
├── utils/
│   ├── http.js
│   └── validation.js
│
└── web/
    └── app.js

tests/
├── authorization.test.js
├── crypto.test.js
└── validation.test.js

migrations/
└── 0001_initial.sql
```

### Responsabilidades

**`src/index.js`**

Ponto de entrada do Cloudflare Worker.

**`src/api/`**

Rotas HTTP e operações disponibilizadas pela API.

**`src/auth/`**

Autenticação, autorização, cookies, sessões e processamento seguro de senhas.

**`src/db/`**

Consultas e operações relacionadas à persistência e auditoria.

**`src/utils/`**

Funções auxiliares de validação e respostas HTTP.

**`src/web/`**

Interface web entregue pelo Worker.

**`tests/`**

Testes automatizados dos componentes independentes da aplicação.

---

## 🛠️ Tecnologias

- JavaScript
- Node.js
- Cloudflare Workers
- Cloudflare D1
- SQLite
- Wrangler
- HTML5
- CSS3
- Web Crypto API
- Git
- GitHub

---

## 🔐 Segurança

A aplicação utiliza autenticação própria com armazenamento seguro das credenciais.

### Senhas

As senhas não são armazenadas em texto puro.

O processamento utiliza:

- PBKDF2;
- SHA-256;
- salt aleatório;
- 210.000 iterações.

### Sessões

Cada autenticação cria um identificador aleatório de sessão armazenado no banco D1.

O navegador recebe apenas o identificador através de cookie configurado com:

```text
HttpOnly
Secure
SameSite=Lax
```

### Autorização

A aplicação possui controle de acesso baseado em função:

```text
admin
member
```

Operações administrativas são protegidas no backend e não dependem apenas da interface apresentada ao usuário.

### Auditoria

Operações importantes são registradas na tabela de auditoria, permitindo manter histórico das principais ações administrativas.

---

## 🛡️ Validação da API

A API realiza validações antes das operações no banco, incluindo:

- validação de e-mail;
- validação de IDs;
- validação de datas;
- verificação da existência de usuários;
- verificação da existência de eventos;
- bloqueio de operações sobre usuários desativados;
- respostas HTTP adequadas para requisições inválidas ou recursos inexistentes.

---

## 🧪 Testes automatizados

O projeto utiliza o test runner nativo do Node.js.

Os testes atuais cobrem componentes como:

- normalização e validação de e-mail;
- validação de identificadores;
- validação de datas;
- autorização administrativa;
- geração de hash de senha;
- verificação de senha;
- geração de tokens aleatórios.

Para executar:

```bash
npm test
```

---

## 🗄️ Banco de dados

O sistema utiliza **Cloudflare D1**, banco SQL baseado em SQLite.

A estrutura inicial contém:

```text
users
sessions
schedule_settings
events
availability
assignments
audit_log
```

As migrations ficam em:

```text
migrations/
```

---

# 🚀 Executando o projeto

## 1. Instalar dependências

```bash
npm install
```

---

## 2. Autenticar no Cloudflare

```bash
npx wrangler login
```

O navegador será aberto para autorização da conta.

---

## 3. Criar o banco D1

```bash
npx wrangler d1 create louvor-db
```

O comando retornará informações semelhantes a:

```text
database_name = "louvor-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Configure o identificador correspondente em:

```text
wrangler.jsonc
```

---

## 4. Aplicar as migrations

### Banco local

```bash
npm run db:local
```

### Banco remoto

```bash
npm run db:remote
```

---

## 5. Executar localmente

```bash
npm run dev
```

Abra no navegador o endereço apresentado pelo Wrangler.

No primeiro acesso, o sistema solicitará a criação do administrador inicial.

A senha deve possuir pelo menos 8 caracteres.

---

## 6. Publicação

```bash
npm run deploy
```

Após a publicação, o Wrangler apresentará o endereço público do Worker.

---

## 📅 Dados iniciais

A migration inicial inclui uma escala demonstrativa referente a setembro de 2026.

Após o primeiro acesso, o administrador pode utilizar as áreas **Integrantes** e **Escala** para configurar os usuários e responsáveis pelos eventos.

---

## 💰 Infraestrutura

O projeto foi concebido para uma aplicação de pequeno porte utilizando a infraestrutura serverless da Cloudflare.

Os limites e condições da camada gratuita podem mudar, portanto devem ser consultados na documentação oficial da plataforma antes de uma implantação em produção.

---

## 📌 Evolução arquitetural

A aplicação passou por um processo de refatoração para separar responsabilidades que anteriormente estavam concentradas no arquivo principal do Worker.

A estrutura atual divide:

- roteamento da API;
- autenticação;
- autorização;
- sessões;
- criptografia;
- acesso aos dados;
- auditoria;
- validações;
- respostas HTTP;
- interface web.

Essa organização facilita manutenção, testes e evolução futura do sistema.

---

## 👨‍💻 Autor

**Anderson Domingos**

Projeto desenvolvido como aplicação prática de desenvolvimento web, arquitetura serverless e organização de sistemas.

