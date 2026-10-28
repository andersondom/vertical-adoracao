# Módulo 3 — Plano de integração com Cloudflare D1 local (ID01–ID05)

**Situação:** preparado; execução e homologação pendentes.  
**Branch:** `feat/modulo3-presencas-indicadores`  
**Restrição:** executar somente com banco D1 **local isolado**; não executar `--remote`, deploy ou merge.

## Preparação segura

1. Atualizar a branch local: `git pull origin feat/modulo3-presencas-indicadores`.
2. Confirmar dependências com `npm.cmd install` (ou `npm.cmd ci` se o lockfile estiver presente).
3. No terminal PowerShell, criar diretório de persistência separado dos dados locais existentes:
   ```powershell
   $env:VERTICAL_D1_TEST_DIR = Join-Path $env:TEMP 'vertical-adoracao-d1-integracao'
   New-Item -ItemType Directory -Force $env:VERTICAL_D1_TEST_DIR | Out-Null
   npx.cmd wrangler d1 migrations apply louvor-db --local --persist-to $env:VERTICAL_D1_TEST_DIR
   ```
4. Conferir que o comando indicou **local**, sem referência a migrações remotas.
5. Não utilizar contas reais nem dados de produção. Criar dados fictícios de teste por interface local ou script de seed adequado. O seed existente possui hashes deliberadamente inválidos e não serve para login.

> Atenção: `--persist-to` separa o estado D1 local de testes. Não reutilize um diretório que contenha dados que devam ser preservados.

## Casos de integração

| Caso | Ação no banco local isolado | Resultado esperado |
|---|---|---|
| ID01 | Registrar presença de integrante com escala ativa | Registro persistido; histórico e auditoria criados |
| ID02 | Alterar presença e ler histórico | Valores anteriores e novos, motivo e autor corretos |
| ID03 | Tentar encerrar evento com integrante ativo sem registro | Rejeição sem criação de encerramento |
| ID04 | Completar registros, encerrar e corrigir posteriormente | Encerramento permanece; correção e histórico persistem |
| ID05 | Revogar liderança em evento aberto e tentar gravar/consultar/encerrar com líder anterior | Operações negadas com HTTP 403; dados inalterados |

## Evidências mínimas

Para cada caso, registrar código, resultado, observações e evidências (saída de teste, prints sem dados pessoais ou consultas locais). Validar a persistência após nova consulta, não apenas após retorno HTTP. Confirmar também ausência de alterações parciais nos casos rejeitados.

## Critério de aprovação

ID01–ID05 aprovados, sem perda de dados, vazamento entre eventos ou auditoria ausente. Falhas bloqueiam staging e produção até correção e nova execução.

## Próximo passo

Implementar um executor automatizado com fixtures e limpeza **exclusivas** desse banco isolado, após conferir a estrutura exata das migrações e os mecanismos de sessão. Este documento não afirma que os testes de integração foram executados.
