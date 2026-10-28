# Módulo 3 — Roteiro de homologação funcional da interface

Data de preparação: 2026-10-28  
Branch: `feat/modulo3-presencas-indicadores`  
Ambiente: desenvolvimento ou homologação, **nunca produção sem autorização explícita**.

## Pré-requisitos

- Aplicação acessível em ambiente de testes, com migrações locais já aplicadas.
- Usuário administrador, líder de um evento e integrante sem liderança.
- Dois eventos distintos com escalações confirmadas ou reservadas e integrantes ativos.
- Fazer anotações dos eventos, usuários e resultados usados; evitar dados reais de produção.

## Checklist para execução acompanhada

| ID | Perfil | Procedimento | Resultado esperado | Situação |
| --- | --- | --- | --- | --- |
| UI01 | Administrador | Abrir a gestão de presenças de um evento com integrantes escalados | Evento e integrantes aparecem corretamente | Pendente |
| UI02 | Administrador | Registrar presença de um integrante, informando motivo | Presença salva e exibida na tela | Pendente |
| UI03 | Administrador | Registrar ausência justificada com justificativa e motivo | Ausência e justificativa são exibidas | Pendente |
| UI04 | Administrador | Tentar encerrar evento com integrante sem registro | Encerramento bloqueado com mensagem compreensível | Pendente |
| UI05 | Administrador | Completar registros pendentes e encerrar | Encerramento confirmado e refletido na interface | Pendente |
| UI06 | Administrador | Corrigir presença após encerramento, informando motivo | Correção salva; estado atual exibido corretamente | Pendente |
| UI07 | Administrador | Consultar histórico/auditoria pelos meios disponíveis | Registros e autor das mudanças verificáveis | Pendente |
| UI08 | Integrante | Consultar seus indicadores de participação | Indicadores correspondem aos registros válidos | Pendente |
| UI09 | Integrante | Tentar acessar indicadores de outra pessoa | Acesso negado | Pendente |
| UI10 | Líder | Consultar presenças de evento sob sua liderança | Acesso autorizado | Pendente |
| UI11 | Líder | Tentar consultar presenças de outro evento | Acesso negado | Pendente |
| UI12 | Administrador | Conferir uso em tela estreita (celular) e desktop | Sem cortes, sobreposição ou perda de ações | Pendente |

## Critério de aceite

Registrar evidências e resultados para cada item. **Não considerar aprovado por antecipação**. Se uma funcionalidade não estiver exposta na interface, marcar como não disponível e registrar o desvio; não presumir que a API garante a experiência visual.

## Evidência automatizada anterior

Execução GitHub Actions [40733552387](https://github.com/andersondom/vertical-adoracao/actions/runs/40733552387), conclusão `success`: cinco cenários D1 e quatorze verificações HTTP, incluindo isolamento de liderança entre eventos. Esses testes não substituem o checklist visual.

## Restrições

Não fazer deploy, merge, alteração de produção ou migrações remotas sem autorização explícita.
