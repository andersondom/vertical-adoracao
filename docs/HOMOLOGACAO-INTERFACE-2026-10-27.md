# Homologação funcional e visual — staging

Data: 27/10/2026
Ambiente: Worker `ministerio-louvor-staging` / D1 `louvor-staging`
Versão de interface: commit `04a1e6b38974866b6d04d128c38f3178bd961b97`
Origem: resultados fornecidos pelo responsável após testes manuais.

| Nº | Critério | Resultado |
| --- | --- | --- |
| 1 | Sistema abre pelo endereço de homologação | Funcionou |
| 2 | Login funciona e permite acessar o sistema | Não testado |
| 3 | Menu e navegação apresentam a nova interface | Funcionou |
| 4 | Escalas aparecem com boa distribuição dos campos | Funcionou |
| 5 | Consulta e alteração da disponibilidade | Funcionou |
| 6 | Definição de responsável e organização da equipe | Funcionou |
| 7 | Cadastro de integrantes | Funcionou |
| 8 | Cadastro de eventos | Funcionou |
| 9 | Interface funciona no celular | Funcionou |

Observações: nenhuma.

## Avaliação
- 8 aprovados, 0 falhas relatadas, 1 não testado.
- Aprovação visual e dos fluxos exercitados; homologação funcional **parcial**.
- Login não testado: validar autenticação, saída e acesso após encerramento da sessão com usuário de teste, antes da liberação para produção.
- Não inferir aprovação de autenticação a partir do uso de outras telas.

## Controle de mudança
- Não realizar merge do PR #3 nem deploy de produção antes da aprovação explícita.
- Não executar migrações remotas no banco D1.
- Manter staging separado de produção.
