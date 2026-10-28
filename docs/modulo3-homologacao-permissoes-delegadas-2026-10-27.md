# Vertical Adoração — Homologação funcional de permissões delegadas (Módulo 3)

**Data do registro:** 27/10/2026  
**Ambiente:** local (desenvolvimento)  
**Branch:** `feat/modulo3-presencas-indicadores`  
**Escopo:** acesso à gestão de presenças pelo administrador e pelo líder escalado no próprio evento.  
**Fonte dos resultados:** execução manual informada pelo responsável pela homologação, na conversa de acompanhamento do projeto.  
**Resultado:** **8/8 aprovados**, sem observações registradas.

## Matriz de homologação

| Código | Cenário validado | Resultado | Observações |
|---|---|---|---|
| HD01 | Líder visualiza e abre a aba Presenças, sem acesso às funções administrativas | Aprovado | Nenhuma |
| HD02 | Líder visualiza somente eventos sob sua liderança e abre evento autorizado | Aprovado | Nenhuma |
| HD03 | Líder registra presença e o registro permanece após reabertura | Aprovado | Nenhuma |
| HD04 | Líder encerra presenças completas; fechamento persiste | Aprovado | Nenhuma |
| HD05 | Líder corrige registro após encerramento sem reabrir o evento | Aprovado | Nenhuma |
| HD06 | API nega consulta a evento alheio com HTTP 403 | Aprovado | Nenhuma |
| HD07 | Integrante comum não vê a gestão; API retorna HTTP 403; informações próprias acessíveis | Aprovado | Nenhuma |
| HD08 | Administrador mantém navegação e gestão de presenças em todos os eventos | Aprovado | Nenhuma |

## Regras de permissão homologadas

- Administrador: acesso à gestão de presenças dos eventos, independentemente de escala pessoal.
- Líder: acesso restrito aos eventos nos quais está escalado como líder com compromisso `reserved` ou `confirmed`.
- Integrante comum: sem acesso à gestão de presenças; permanece com acesso às próprias informações.
- O controle de autorização é aplicado no servidor, não apenas pela ocultação da interface.

## Evidências e limites

- O responsável informou aprovação individual dos testes HD01 a HD08, sem observações.
- A suíte automatizada foi informada como aprovada após a integração da interface.
- A correção após encerramento foi verificada funcionalmente; a integridade do histórico e da auditoria é coberta pelos testes automatizados, não por inspeção manual direta de tabelas nesta rodada.
- A homologação foi executada em ambiente local; não constitui validação de staging ou produção.
- Não houve autorização para deploy, migração remota de D1, merge ou alteração da produção.

## Encaminhamentos recomendados

1. Registrar evidências reproduzíveis (capturas de tela e/ou logs sem dados sensíveis) quando conveniente.
2. Verificar responsividade em dispositivos móveis e regressão das demais funcionalidades.
3. Revisar controles de autorização das operações de escrita por API e comportamento após revogação de liderança, com testes negativos.
4. Preparar validação em staging isolado, somente após aprovação explícita.
5. Submeter a implantação em produção a uma decisão específica, após revisão de riscos, backup e plano de reversão.

**Situação:** homologação funcional local das permissões delegadas concluída e aprovada; produção preservada.
