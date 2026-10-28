# Relatório de homologação acompanhada — Módulo 3 (primeira entrega)

**Data:** 27/10/2026  
**Ambiente:** Wrangler/D1 local, branch `feat/modulo3-presencas-indicadores`  
**Execução:** usuário operou a interface e informou resultados ao assistente.  
**Resultado:** 14/14 cenários da **sessão acompanhada** aprovados; nenhuma falha relatada.  
**Produção:** não houve deploy nem migração remota autorizada ou executada nesta sessão.

> **Nota de rastreabilidade:** os identificadores H01–H14 abaixo são os da sessão conversacional de homologação. A lista original em `docs/modulo3-homologacao-primeira-entrega.md` usa outra correspondência para alguns códigos (por exemplo, H05/H06/H12). Não marcar automaticamente os itens da lista original como executados; cruzar critérios individualmente. Em particular, a verificação de responsividade em celular e desktop prevista no H12 original **não foi realizada** nesta sessão.

## Preparação de dados

- P01: evento fictício de 15/11/2026 cadastrado — aprovado.
- P02: integrantes fictícios João e Maria cadastrados — aprovado.
- P03: João configurado com Vocal e Teclado; Maria com Vocal — aprovado.
- P04: três vínculos de escala confirmados no primeiro evento — aprovado.
- Eventos adicionais de 22/11 (pendente, depois encerrado), 29/11 (pendente) e 30/11 (vazio) criados exclusivamente no ambiente local.

## Resultados informados

| Código da sessão | Cenário | Resultado |
|---|---|---|
| H01 | Acesso de administrador ao módulo | Aprovado |
| H02 | Listagem de João e Maria, sem duplicar João por função | Aprovado |
| H03 | Presença de João, ausência justificada de Maria e persistência | Aprovado |
| H04 | Bloqueio de ausência justificada sem descrição e preservação anterior | Aprovado |
| H05 | Encerramento com registros completos e bloqueio de alteração na escala | Aprovado |
| H06 | Correção de Maria após fechamento; persistência e estado fechado preservados | Aprovado |
| H07 | Indicadores de João e Maria, funções distintas de compromissos | Aprovado |
| H08 | Login como João, indicadores próprios e isolamento visual dos de Maria | Aprovado |
| H09 | Segundo compromisso pendente; taxa permanece 100% | Aprovado |
| H10 | Ausência não justificada, fechamento e taxa recalculada para 50% | Aprovado |
| H11 | Bloqueio de fechamento com frequência não informada | Aprovado |
| H12 | Três eventos, um pendente; taxa permanece 50% | Aprovado |
| H13 | Bloqueio de fechamento de evento sem integrantes ativos | Aprovado |
| H14 | Bloqueio de adicionar, cancelar e alterar confirmação após fechamento; integridade | Aprovado |

## Limites das evidências

- Os resultados acima são relatos da operação manual, sem capturas anexadas ou inspeção direta do banco local pelo assistente.
- O H08 validou a navegação como integrante; uma verificação independente de autorização da API com requisição forjada ainda é recomendável, embora existam testes automatizados no repositório.
- O H06 confirmou o comportamento da correção na interface, **não** inspecionou diretamente as linhas do histórico de auditoria.
- A responsividade em dispositivos móveis não foi testada nesta rodada.
- Os eventos simulados têm datas futuras e **não** devem ser interpretados como presenças reais.
- A aprovação é da **primeira entrega e dos cenários executados**, não do Módulo 3 completo.

## Próximas etapas propostas

1. Verificar auditoria persistida, autorização de API, responsividade e regressões; guardar evidências.
2. Revisar os critérios restantes da primeira entrega e documentar a correspondência com o checklist original.
3. Implementar as próximas funcionalidades em lotes: permissões delegadas e escopo de líderes; relatórios coletivos, filtros e exportações; notificações, revisão e configurações.
4. Executar testes automatizados/CI e nova homologação isolada para cada lote.
5. Submeter revisão do PR antes de qualquer decisão de merge ou publicação. **Não fazer deploy nem aplicar migrações remotas sem aprovação explícita.**
