# Modernização visual — escalas e usabilidade

## Objetivo
Melhorar legibilidade, navegação, distribuição dos campos e experiência em computadores e dispositivos móveis, preservando a API, o banco Cloudflare D1 e os fluxos existentes.

## Alterações implementadas
- Cabeçalho claro, identidade visual consistente, maior contraste e espaçamentos.
- Menu administrativo com destaque da seção selecionada e indicação acessível da página atual.
- Escalas em cartões de duas colunas em telas largas e uma coluna em telas menores.
- Controles de disponibilidade e responsável oficial mais compactos.
- Cadastro de integrantes e de eventos com campos proporcionais, organizados em grade de 12 colunas.
- Foco visível para navegação por teclado, alvos de clique confortáveis e respeito a preferências de movimento reduzido.
- Nenhuma alteração nas rotas, permissões, migrations ou dados persistidos.

## Estratégia de validação sem Docker
1. Revisar o diff do PR e conferir a ausência de alterações de API ou banco.
2. Executar os testes existentes com `npm test` (localmente, sem Docker, ou por GitHub Actions).
3. Validar visualmente em desktop e celular no ambiente de teste Cloudflare ou em execução local do Wrangler, sem Docker.
4. Conferir login, menu, disponibilidade, atribuição de responsável, formação de equipes, cadastro de integrante e evento.
5. Publicar somente após homologação visual explícita.

**Estado:** desenvolvimento na branch `feat/interface-escalas-usabilidade`; não publicado e não integrado à `main`.
